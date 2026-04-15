/**
 * useDriveSync — v2.11.0 響應式同步引擎 (穩健版)
 *
 * 設計原則：
 * 1. 響應式觸發：透過 useCardStore 訂閱偵測未同步卡片，自動入隊。
 * 2. 讀先寫後 (Read-first)：每次寫入前必定先讀取 Drive 最新狀態並合併，確保資料不因併發而遺失。
 * 3. 單一鎖定：busyRef 防止並行寫入競爭。
 * 4. 最小權限：完美支援 drive.file 權限範疇。
 */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCardStore } from "@/store/useCardStore";
import {
  getOrCreateDriveFile,
  readDriveDB,
  writeDriveDB,
  cleanupTrash,
  migrateOldVisibleFile,
  DriveCard,
} from "@/lib/driveFile";

const MAX_BACKOFF_MS = 60_000;
const SAFETY_NET_INTERVAL_MS = 60_000;

export function useDriveSync() {
  const { user, setSyncStatus, setSyncError } = useAuthStore();
  const {
    cards: storeCards,
    setCards,
    markCardSynced,
    isInitialized,
    finishInitialization,
    addCustomMerchant,
  } = useCardStore();

  // ─── 內部狀態 refs（用於佇列與鎖定）─────────────────────────────────
  const fileIdRef      = useRef<string | null>(null);
  const busyRef        = useRef(false);
  const queueRef       = useRef<DriveCard[]>([]);
  const retryCountRef  = useRef(0);
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 保持對 doSync 的引用，供非同步回調使用
  const doSyncRef = useRef<() => Promise<void>>(async () => {});

  // ─── 核心同步流程 ─────────────────────────────────────
  const doSync = useCallback(async () => {
    if (busyRef.current || queueRef.current.length === 0) return;
    if (!fileIdRef.current || !user?.driveToken || !user?.uid) return;

    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    busyRef.current = true;
    const batch = [...queueRef.current];
    queueRef.current = [];
    setSyncStatus(true, useAuthStore.getState().lastSync);

    try {
      // 步驟 1：讀取雲端最新資料 (Read)
      const { db } = await readDriveDB(user.driveToken, fileIdRef.current, user.uid);

      // 步驟 2：合併本地變量 (Merge)
      for (const card of batch) {
        const { isSynced: _, ...cardData } = card as any;
        const idx = db.cards.findIndex((c) => c.id === cardData.id);
        if (idx !== -1) db.cards[idx] = cardData;
        else db.cards.push(cardData);
      }
      db.lastModified = Date.now();

      // 步驟 3：寫回雲端 (Write)
      await writeDriveDB(user.driveToken, fileIdRef.current, db, user.uid);

      // 步驟 4：標記本地同步成功
      for (const card of batch) markCardSynced(card.id, true);
      setSyncStatus(false, Date.now());
      setSyncError(false);
      retryCountRef.current = 0;
      console.log(`[Sync] ✅ 已成功同步 ${batch.length} 張卡片至雲端。`);

    } catch (e: any) {
      console.error("[Sync] 同步失敗:", e.message || e);
      // 失敗時將卡片放回佇列最前頭
      queueRef.current = [...batch, ...queueRef.current];
      setSyncStatus(false, useAuthStore.getState().lastSync);
      setSyncError(true);

      // 指數退避重試
      const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), MAX_BACKOFF_MS);
      retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
      
      retryTimerRef.current = setTimeout(() => {
        setSyncError(false);
        doSyncRef.current();
      }, delay);
    } finally {
      busyRef.current = false;
      if (queueRef.current.length > 0) {
        setTimeout(() => doSyncRef.current(), 100);
      }
    }
  }, [user?.driveToken, user?.uid, markCardSynced, setSyncStatus, setSyncError]);

  useEffect(() => {
    doSyncRef.current = doSync;
  }, [doSync]);

  // ─── 初始化：遷移、載入與對齊 ───────────────────────────────
  useEffect(() => {
    if (!user?.driveToken) {
      fileIdRef.current = null;
      queueRef.current = [];
      return;
    }

    const init = async () => {
      setSyncStatus(true, null);
      try {
        await (useCardStore.persist as any).rehydrate();
        await migrateOldVisibleFile(user.driveToken!);

        const fileId = await getOrCreateDriveFile(user.driveToken!, user.uid);
        fileIdRef.current = fileId;

        const { db } = await readDriveDB(user.driveToken!, fileId, user.uid);
        const { db: cleanedDb, changed } = cleanupTrash(db);

        const { cards: localCards } = useCardStore.getState();
        const cardMap = new Map<string, any>();
        cleanedDb.cards.forEach((c) => cardMap.set(c.id, { ...c, isSynced: true }));
        localCards.filter((c) => !c.isSynced).forEach((c) => cardMap.set(c.id, c));
        
        setCards(Array.from(cardMap.values()));
        if (cleanedDb.customMerchants) {
          cleanedDb.customMerchants.forEach((m) => addCustomMerchant(m));
        }

        if (changed) {
          await writeDriveDB(user.driveToken!, fileId, cleanedDb, user.uid);
        }

        setSyncStatus(false, Date.now());
        console.log("[Sync] 🏁 初始化完成。");
      } catch (err: any) {
        console.error("[Sync] ⚠️ 初始化失敗:", err.message || err);
        setSyncStatus(false, null);
        setSyncError(true);
      } finally {
        finishInitialization();
      }
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.driveToken]);

  // ─── 響應式觸發同步 ──────────────────────────
  useEffect(() => {
    if (!isInitialized || !fileIdRef.current || !user?.driveToken) return;

    const unsynced = storeCards.filter((c) => !c.isSynced) as DriveCard[];
    if (unsynced.length === 0) return;

    const newToQueue = unsynced.filter(
      (c) => !queueRef.current.some((q) => q.id === c.id)
    );
    if (newToQueue.length > 0) {
      queueRef.current = [...queueRef.current, ...newToQueue];
      doSync();
    }
  }, [storeCards, isInitialized, user?.driveToken, doSync]);

  // ─── 每分鐘自動安全檢查 ─────────────────
  useEffect(() => {
    if (!isInitialized || !user?.driveToken) return;

    const check = () => {
      const all = useCardStore.getState().cards.filter((c) => !c.isSynced) as DriveCard[];
      const newToQueue = all.filter((c) => !queueRef.current.some((q) => q.id === c.id));
      if (newToQueue.length > 0) {
        queueRef.current = [...queueRef.current, ...newToQueue];
        doSyncRef.current();
      }
    };

    const timer = setInterval(check, SAFETY_NET_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isInitialized, user?.driveToken]);
}
