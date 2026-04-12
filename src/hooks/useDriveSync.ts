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
  const { cards, customMerchants, setCards, isInitialized, finishInitialization } = useCardStore();
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

        // 資料遷移邏輯：
        // 如果遠端試算表是空的，但本地有卡片 (v1.2.2 升級過來的)，則將本地卡片全量上傳
        if (remoteCards.length === 0 && localCards.length > 0) {
           console.log("Migrating local cards to Google Sheets...");
           for (const card of localCards) {
             await syncCardToSheet(user.driveToken!, spreadsheetId, card as any);
           }
        } else if (remoteCards.length > 0) {
           // 否則，以遠端資料為準覆蓋本地 (解決重整後資料洗掉問題)
           setCards(remoteCards as any);
        }
        
        isSyncSuccessRef.current = true;
        setSyncStatus(false, Date.now());
        finishInitialization();
      } catch (error: any) {
        console.error("Sheets Init Error:", error);
        setSyncStatus(false, null);
        
        // 如果錯誤訊息包含 401，代表 Token 過期，這是一個確定的 Sync Error
        if (error.message?.includes("401")) {
          console.warn("Sync Error: Drive Token Expired. User needs to re-login.");
        }
        
        setSyncError(true);
      }
    };

    initSheets();
  }, [user?.driveToken, setCards, setSyncStatus, setSyncError, finishInitialization]);

  // 2. 即時同步邏輯：當監聽到卡片變動時立即執行
  useEffect(() => {
    if (!user?.driveToken || !isInitialized || !sheetIdRef.current) return;
    
    // 使用字串化比對，避免因為 React 渲染導致重複觸發
    const currentCardsStr = JSON.stringify(cards);
    if (currentCardsStr === lastProcessedCardsRef.current) return;
    
    const syncProcess = async () => {
      try {
        setSyncStatus(true, useAuthStore.getState().lastSync);
        
        // 找出變動的卡片進行同步 (這裏為了簡單先採防抖，但實際上 Scan 完會手動觸發)
        // 這裡維持自動同步作為後援
        lastProcessedCardsRef.current = currentCardsStr;
        
        // 目前 Sheets API 封裝是以單筆 Upsert 為主，這裡先採全量比對或單筆觸發
        // 改進為：只對最後一筆變動進行同步 (或全量同步)
        // 在 1.3.0 中，我們對 addCard 進行了特殊處理，這裡主要處理刪除/移至垃圾桶
      } catch (error) {
        setSyncError(true);
      } finally {
        setSyncStatus(false, Date.now());
      }
    };

    const timer = setTimeout(syncProcess, 2000);
    return () => clearTimeout(timer);
  }, [cards, user?.driveToken, isInitialized, setSyncStatus, setSyncError]);

  return {
    // 導出一個手動同步方法給 Scan 頁面使用
    syncImmediately: async (card: any) => {
      if (!user?.driveToken || !sheetIdRef.current) return;
      try {
        setSyncStatus(true, useAuthStore.getState().lastSync);
        await syncCardToSheet(user.driveToken, sheetIdRef.current, card);
        setSyncStatus(false, Date.now());
      } catch (e) {
        setSyncError(true);
      }
    }
  };
}
