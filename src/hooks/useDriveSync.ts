import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCardStore } from "@/store/useCardStore";
import {
  getOrCreateDriveFile,
  readDriveDB,
  writeDriveDB,
  cleanupTrash,
  DriveCard,
} from "@/lib/driveFile";

export function useDriveSync() {
  const { user, setSyncStatus, setSyncError } = useAuthStore();
  const { setCards, markCardSynced, isInitialized, finishInitialization, addCustomMerchant } = useCardStore();
  
  const fileIdRef = useRef<string | null>(null);
  const etagRef = useRef<string | null>(null);

  // 寫入鎖：防止並發寫入造成資料競爭
  const writeInProgress = useRef(false);
  // 等待寫入的卡片隊列
  const pendingCards = useRef<DriveCard[]>([]);

  // ─── 核心寫入器（序列化，防競爭）────────────────────────────────
  const flushPending = useCallback(async () => {
    if (writeInProgress.current || pendingCards.current.length === 0) return;
    if (!user?.driveToken || !fileIdRef.current) return;

    writeInProgress.current = true;
    const cardsToSync = [...pendingCards.current];
    pendingCards.current = [];

    try {
      setSyncStatus(true, useAuthStore.getState().lastSync);
      
      // 1. 同步讀取最新版本
      const { db, etag } = await readDriveDB(user.driveToken, fileIdRef.current, user.uid);
      etagRef.current = etag;

      // 2. 注入新卡片
      for (const card of cardsToSync) {
        const { isSynced: _, ...cardData } = card as any;
        const idx = db.cards.findIndex(c => c.id === cardData.id);
        if (idx !== -1) {
          db.cards[idx] = cardData;
        } else {
          db.cards.push(cardData);
        }
      }

      // 3. 寫入雲端
      const newEtag = await writeDriveDB(user.driveToken, fileIdRef.current, db, user.uid, etagRef.current || undefined);
      etagRef.current = newEtag;

      // 標記這批卡片已同步
      for (const card of cardsToSync) {
        markCardSynced(card.id, true);
      }

      setSyncStatus(false, Date.now());
    } catch (e: any) {
      console.error("[Drive Sync] Flush failed:", e);
      
      if (e.message === "SYNC_CONFLICT") {
        console.warn("[Drive Sync] Detect conflict, rescheduling retry...");
        pendingCards.current = [...cardsToSync, ...pendingCards.current];
        setTimeout(() => {
          if (!writeInProgress.current) flushPending();
        }, 500);
        return;
      }

      pendingCards.current = [...cardsToSync, ...pendingCards.current];
      for (const card of cardsToSync) {
        markCardSynced(card.id, false);
      }
      setSyncError(true);
    } finally {
      writeInProgress.current = false;
      setTimeout(() => {
        if (!writeInProgress.current && pendingCards.current.length > 0) {
          flushPending();
        }
      }, 300);
    }
  }, [user?.driveToken, markCardSynced, setSyncStatus, setSyncError]);

  // ─── 1. 初始化：極速載入流程 ────────────────────────────
  useEffect(() => {
    if (!user?.driveToken) return;

    const initDrive = async () => {
      try {
        setSyncStatus(true, null);
        setSyncError(false);

        await (useCardStore.persist as any).rehydrate();

        // A. 尋找根目錄檔案
        const fileId = await getOrCreateDriveFile(user.driveToken!, user.uid);
        fileIdRef.current = fileId;

        // B. 讀取資料
        const { db, etag } = await readDriveDB(user.driveToken!, fileId, user.uid);
        etagRef.current = etag;

        // C. 垃圾桶大掃除
        const { db: cleanedDb, changed } = cleanupTrash(db);

        // D. 合併本地變動
        const { cards: localCards } = useCardStore.getState();
        const localUnsynced = localCards.filter(c => !c.isSynced);
        const cardMap = new Map();

        cleanedDb.cards.forEach(c => {
          cardMap.set(c.id, {
            ...c,
            name: c.merchant === "7-11" ? "7-11 商品卡" : `${c.merchant} 禮物卡`,
            isSynced: true,
          });
        });

        localUnsynced.forEach(c => {
          cardMap.set(c.id, c);
        });

        setCards(Array.from(cardMap.values()) as any);

        if (cleanedDb.customMerchants?.length > 0) {
          for (const m of cleanedDb.customMerchants) {
            addCustomMerchant(m);
          }
        }

        // 若清理了垃圾，回寫一次
        if (changed) {
          const newEtag = await writeDriveDB(user.driveToken!, fileId, cleanedDb, user.uid, etagRef.current || undefined);
          etagRef.current = newEtag;
        }

        setSyncStatus(false, Date.now());
      } catch (error: any) {
        console.error("[Drive Init] Error:", error);
        setSyncStatus(false, null);
        if (error.message?.includes("401")) setSyncError(true);
      } finally {
        finishInitialization();
      }
    };

    initDrive();
  }, [user?.driveToken, setCards, setSyncStatus, setSyncError, finishInitialization]);

  // ─── 2. 背景補傳 ──────────────────────────────────────
  useEffect(() => {
    if (!user?.driveToken || !isInitialized) return;

    const processQueue = () => {
      const { cards } = useCardStore.getState();
      const unsyncedCards = cards.filter(c => !c.isSynced) as DriveCard[];
      if (unsyncedCards.length === 0) return;

      pendingCards.current.push(...unsyncedCards);
      flushPending();
    };

    const timer = setInterval(processQueue, 30000); // 恢復為 30 秒掃描
    processQueue();
    return () => clearInterval(timer);
  }, [user?.driveToken, isInitialized, flushPending]);

  // ─── 3. 即時同步 ──────────────────────────────────────
  const syncImmediately = useCallback(async (card: any) => {
    if (!user?.driveToken || !fileIdRef.current) return;
    
    pendingCards.current.push(card);
    flushPending();
  }, [user?.driveToken, flushPending]);

  return { syncImmediately };
}
