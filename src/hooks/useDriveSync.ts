/**
 * useDriveSync — v2.13.0 雙軌閃電保險版 (Lightning Dual-Insurance)
 *
 * 設計原則：
 * 1. 雙軸備援：資料同時存在於「根目錄 (Visible)」與「隱藏空間 (Hidden)」。
 * 2. 毫秒反應：優先完成根目錄寫入並轉為綠燈，備援寫入由背景非阻塞完成。
 * 3. 自動自癒：啟動時對齊雙方資料，確保資料庫永遠是最新狀態。
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
  findDriveFile,
} from "@/lib/driveFile";

const MAX_BACKOFF_MS = 60_000;

export function useDriveSync() {
  const { user, setSyncStatus, setSyncError } = useAuthStore();
  const {
    cards: storeCards,
    setCards,
    markCardSynced,
    isInitialized,
    finishInitialization,
    addCustomMerchant,
    syncQueue,
    setGlobalSyncing,
    removeFromQueue,
  } = useCardStore();

  const visibleFileIdRef = useRef<string | null>(null);
  const hiddenFileIdRef  = useRef<string | null>(null);
  const workerBusyRef    = useRef(false);
  const retryCountRef    = useRef(0);
  const retryTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── 雙軌閃電發射器 ─────────────────────────────────────
  const processQueue = useCallback(async () => {
    if (workerBusyRef.current || syncQueue.length === 0) return;
    if (!visibleFileIdRef.current || !user?.driveToken || !user?.uid) return;

    workerBusyRef.current = true;
    setGlobalSyncing(true);
    setSyncStatus(true, useAuthStore.getState().lastSync);

    const batchIds = [...syncQueue];
    const currentCards = useCardStore.getState().cards;
    const dbToSync = {
      version: 1,
      lastModified: Date.now(),
      cards: currentCards.map(({ isSynced: _, ...c }) => c) as any,
      customMerchants: useCardStore.getState().customMerchants,
    };

    try {
      // ⚡ 第一軌：顯性發射 (Visible) - 追求速度
      await writeDriveDB(user.driveToken, visibleFileIdRef.current, dbToSync, user.uid);
      
      // 🎉 前景收工：立即更新 UI 指示燈 (轉為綠燈)
      removeFromQueue(batchIds);
      batchIds.forEach(id => markCardSynced(id, true));
      setSyncStatus(false, Date.now());
      setSyncError(false);
      retryCountRef.current = 0;

      // 🛡️ 第二軌：背景備援 (Hidden) - 悄悄進行
      if (hiddenFileIdRef.current) {
        writeDriveDB(user.driveToken, hiddenFileIdRef.current, dbToSync, user.uid)
          .catch(e => console.warn("[Sync] 背景備援失敗 (不影響主流程):", e));
      }

      console.log(`[Sync] 🛡️ 雙軌同步完成 (${batchIds.length} 張)`);

    } catch (e: any) {
      console.error("[Sync] ❌ 寫入失敗:", e.message || e);
      setSyncStatus(false, useAuthStore.getState().lastSync);
      setSyncError(true);

      const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), MAX_BACKOFF_MS);
      retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
      
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        workerBusyRef.current = false;
        processQueue();
      }, delay);
    } finally {
      workerBusyRef.current = false;
      setGlobalSyncing(false);
      if (useCardStore.getState().syncQueue.length > 0) {
        setTimeout(() => processQueue(), 100);
      }
    }
  }, [user?.driveToken, user?.uid, syncQueue, setGlobalSyncing, removeFromQueue, markCardSynced, setSyncStatus, setSyncError]);

  // ─── 雙軌初始化與資料自癒 ───────────────────────────────
  useEffect(() => {
    if (!user?.driveToken) return;

    const init = async () => {
      setSyncStatus(true, null);
      try {
        await (useCardStore.persist as any).rehydrate();
        await migrateOldVisibleFile(user.driveToken!);

        // 同時取得兩方的檔案 ID
        const [vId, hId] = await Promise.all([
          getOrCreateDriveFile(user.driveToken!, user.uid, "drive"),
          getOrCreateDriveFile(user.driveToken!, user.uid, "appDataFolder"),
        ]);
        visibleFileIdRef.current = vId;
        hiddenFileIdRef.current  = hId;

        // 讀取兩方的資料庫並進行校對
        const [vRes, hRes] = await Promise.allSettled([
          readDriveDB(user.driveToken!, vId, user.uid),
          readDriveDB(user.driveToken!, hId, user.uid),
        ]);

        let finalDb = null;
        const vDb = vRes.status === "fulfilled" ? vRes.value.db : null;
        const hDb = hRes.status === "fulfilled" ? hRes.value.db : null;

        if (vDb && hDb) {
           finalDb = vDb.lastModified >= hDb.lastModified ? vDb : hDb;
        } else {
           finalDb = vDb || hDb;
        }

        if (!finalDb) throw new Error("兩方資料庫皆無法讀取");

        // 垃圾桶清理與還原
        const { db: cleanedDb, changed } = cleanupTrash(finalDb);
        const { cards: localCards } = useCardStore.getState();
        const cardMap = new Map<string, any>();
        cleanedDb.cards.forEach((c) => cardMap.set(c.id, { ...c, isSynced: true }));
        localCards.filter((c) => !c.isSynced).forEach((c) => cardMap.set(c.id, c));
        
        setCards(Array.from(cardMap.values()));
        if (cleanedDb.customMerchants) {
          cleanedDb.customMerchants.forEach((m) => addCustomMerchant(m));
        }

        // 🔄 自癒：如果有一方資料較舊或缺失，自動同步雙方
        const needHeal = changed || !vDb || !hDb || (vDb.lastModified !== hDb.lastModified);
        if (needHeal) {
          console.log("[Sync] 正在執行雙軌資料自癒...");
          const healPromises = [];
          if (vId) healPromises.push(writeDriveDB(user.driveToken!, vId, cleanedDb, user.uid));
          if (hId) healPromises.push(writeDriveDB(user.driveToken!, hId, cleanedDb, user.uid));
          await Promise.all(healPromises);
        }

        setSyncStatus(false, Date.now());
        console.log("[Sync] 🏁 雙軌初始化完成。");
      } catch (err: any) {
        console.error("[Sync] ⚠️ 雙軌初始化失敗:", err.message || err);
        setSyncStatus(false, null);
        setSyncError(true);
      } finally {
        finishInitialization();
      }
    };

    init();
  }, [user?.driveToken]);

  // ─── 監聽佇列變動自動啟動 ──────────────────────────
  useEffect(() => {
    if (isInitialized && visibleFileIdRef.current && syncQueue.length > 0) {
      processQueue();
    }
  }, [syncQueue, isInitialized, processQueue]);
}
