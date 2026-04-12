import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCardStore } from "@/store/useCardStore";
import { 
  getOrCreateDatabaseSheet, 
  fetchCardsFromSheet, 
  syncCardToSheet, 
  cleanupTrashInSheet 
} from "@/lib/sheets";

export function useDriveSync() {
  const { user, setSyncStatus, setSyncError } = useAuthStore();
  const { cards, customMerchants, setCards, markCardSynced, isInitialized, finishInitialization } = useCardStore();
  const sheetIdRef = useRef<string | null>(null);
  const isSyncSuccessRef = useRef(false);
  const lastProcessedCardsRef = useRef<string>("");

  // 1. 初始化與掃描大掃除
  useEffect(() => {
    if (!user?.driveToken) return;

    const initSheets = async () => {
      try {
        setSyncStatus(true, null);
        setSyncError(false);
        
        // 取得或建立試算表 ID
        const spreadsheetId = await getOrCreateDatabaseSheet(user.driveToken!);
        sheetIdRef.current = spreadsheetId;
        
        // 執行 15 天垃圾桶大掃除
        const cleanedCards = await cleanupTrashInSheet(user.driveToken!, spreadsheetId);
        
        // 抓取全量卡片
        const remoteCards = cleanedCards || await fetchCardsFromSheet(user.driveToken!, spreadsheetId);
        
        const localCards = useCardStore.getState().cards;

        // 資料整合與同步狀態初始化
        if (remoteCards.length === 0 && localCards.length > 0) {
           // 本地遷移
        } else if (remoteCards.length > 0) {
           // 標記雲端抓下來的都已同步
           const syncedRemote = remoteCards.map(c => ({ ...c, isSynced: true }));
           setCards(syncedRemote as any);
        }
        
        isSyncSuccessRef.current = true;
        setSyncStatus(false, Date.now());
        finishInitialization();
      } catch (error: any) {
        console.error("Sheets Init Error:", error);
        setSyncStatus(false, null);
        if (error.message?.includes("401")) setSyncError(true);
      }
    };

    initSheets();
  }, [user?.driveToken, setCards, setSyncStatus, setSyncError, finishInitialization]);

  // 2. v1.11.0: 背景補傳隊列 (Background Retry Queue)
  useEffect(() => {
    if (!user?.driveToken || !isInitialized || !sheetIdRef.current) return;

    const processQueue = async () => {
      const unsyncedCards = cards.filter(c => !c.isSynced);
      if (unsyncedCards.length === 0) return;

      console.log(`[Sync] Found ${unsyncedCards.length} unsynced cards. Retrying...`);
      
      for (const card of unsyncedCards) {
        try {
          await syncCardToSheet(user.driveToken!, sheetIdRef.current!, card as any);
          markCardSynced(card.id, true);
        } catch (e) {
          console.error(`[Sync] Failed to sync card ${card.id}`, e);
          setSyncError(true);
        }
      }
    };

    const timer = setInterval(processQueue, 30000); // 每 30 秒自動檢查一次
    return () => clearInterval(timer);
  }, [cards, user?.driveToken, isInitialized, sheetIdRef.current, markCardSynced, setSyncError]);

  return {
    syncImmediately: async (card: any) => {
      if (!user?.driveToken || !sheetIdRef.current) return;
      try {
        setSyncStatus(true, useAuthStore.getState().lastSync);
        await syncCardToSheet(user.driveToken, sheetIdRef.current, card);
        markCardSynced(card.id, true);
        setSyncStatus(false, Date.now());
      } catch (e) {
        setSyncError(true);
        markCardSynced(card.id, false);
      }
    }
  };
}
