import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCardStore } from "@/store/useCardStore";
import {
  getOrCreateDriveFiles,
  readDualDB,
  writeDualDB,
  cleanupTrash,
  DriveCard,
  DriveFileIds,
  createDriveFile,
} from "@/lib/driveFile";

export function useDriveSync() {
  const { user, setSyncStatus, setSyncError } = useAuthStore();
  const { setCards, markCardSynced, isInitialized, finishInitialization, addCustomMerchant } = useCardStore();
  
  // 雙重保險資訊儲存
  const idsRef = useRef<DriveFileIds>({ hiddenId: null, visibleId: null });
  const etagsRef = useRef<{ hidden?: string; visible?: string }>({});

  // 寫入鎖：防止並發寫入造成資料競爭
  const writeInProgress = useRef(false);
  // 等待寫入的卡片隊列
  const pendingCards = useRef<DriveCard[]>([]);

  // ─── 核心寫入器（序列化，防競爭）────────────────────────────────
  const flushPending = useCallback(async () => {
    if (writeInProgress.current || pendingCards.current.length === 0) return;
    const { hiddenId, visibleId } = idsRef.current;
    if (!user?.driveToken || (!hiddenId && !visibleId)) return;

    writeInProgress.current = true;
    const cardsToSync = [...pendingCards.current];
    pendingCards.current = [];

    try {
      setSyncStatus(true, useAuthStore.getState().lastSync);
      
      // 1. 同步讀取兩份資料，取得最新版本與最新 ETags
      const { db, hiddenEtag, visibleEtag } = await readDualDB(user.driveToken, user.uid, idsRef.current);
      etagsRef.current = { hidden: hiddenEtag, visible: visibleEtag };

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

      // 3. 並行寫入雙方
      const newEtags = await writeDualDB(user.driveToken, user.uid, idsRef.current, db, etagsRef.current);
      etagsRef.current = newEtags;

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

  // ─── 1. 初始化：雙重保險對齊流程 ────────────────────────────
  useEffect(() => {
    if (!user?.driveToken) return;

    const initDrive = async () => {
      try {
        setSyncStatus(true, null);
        setSyncError(false);

        await (useCardStore.persist as any).rehydrate();

        // A. 尋找雙端 ID
        const ids = await getOrCreateDriveFiles(user.driveToken!);
        idsRef.current = ids;

        // B. 雙端讀取與對齊
        const { db, hiddenEtag, visibleEtag, needsRepair } = await readDualDB(user.driveToken!, user.uid, ids);
        etagsRef.current = { hidden: hiddenEtag, visible: visibleEtag };

        // C. 如果需要修補（一方缺失、或是全新使用者）
        if (needsRepair || (!ids.hiddenId && !ids.visibleId)) {
          console.log("[Drive Insurance] 偵測到檔案缺失或全新用戶，啟動修復/建立流程...");
          
          let targetHiddenId = ids.hiddenId;
          let targetVisibleId = ids.visibleId;

          // 建立缺失的隱藏檔案
          if (!targetHiddenId) {
            targetHiddenId = await createDriveFile(user.driveToken!, user.uid, db, "appDataFolder", "sgcm-data.json");
          }
          // 建立缺失的顯性檔案
          if (!targetVisibleId) {
            targetVisibleId = await createDriveFile(user.driveToken!, user.uid, db, "drive", "zc-card 請勿刪除·此為禮物卡檔案.json");
          }

          idsRef.current = { hiddenId: targetHiddenId, visibleId: targetVisibleId };
          
          // 修補完後重新寫入一次以同步 ETags
          const newEtags = await writeDualDB(user.driveToken!, user.uid, idsRef.current, db, {});
          etagsRef.current = newEtags;
        }

        // D. 垃圾桶大掃除
        const { db: cleanedDb, changed } = cleanupTrash(db);

        // E. 合併本地變動
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

        if (changed) {
          const newEtags = await writeDualDB(user.driveToken!, user.uid, idsRef.current, cleanedDb, etagsRef.current);
          etagsRef.current = newEtags;
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

    const timer = setInterval(processQueue, 45000); // 延長至 45 秒以減輕雙寫負擔
    processQueue();
    return () => clearInterval(timer);
  }, [user?.driveToken, isInitialized, flushPending]);

  // ─── 3. 即時同步 ──────────────────────────────────────
  const syncImmediately = useCallback(async (card: any) => {
    const { hiddenId, visibleId } = idsRef.current;
    if (!user?.driveToken || (!hiddenId && !visibleId)) return;
    
    pendingCards.current.push(card);
    flushPending();
  }, [user?.driveToken, flushPending]);

  return { syncImmediately };
}
