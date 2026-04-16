/**
 * useDriveSync — v2.22.0 帳號修復版 (Identity Healing)
 *
 * 設計原則：
 * 1. 自動金鑰修復：若 Email 救援成功，自動用穩定 ID 覆寫雲端，達成永久對齊。
 * 2. 靜默對齊：主打「登入即同步」，無需使用者介入。
 */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCardStore } from "@/store/useCardStore";
import {
  getOrCreateDriveFile,
  readDriveDB,
  writeDriveDB,
  cleanupTrash,
} from "@/lib/driveFile";
import { getKeyHash } from "@/lib/crypto";

const MAX_BACKOFF_MS = 60_000;

export function useDriveSync() {
  const { user, setSyncStatus, setSyncError, syncOverrideUid } = useAuthStore();
  const {
    cards: storeCards,
    setCards,
    markCardSynced,
    isInitialized,
    finishInitialization,
    addCustomMerchant,
    syncQueue,
    isGlobalSyncing,
    setGlobalSyncing,
    removeFromQueue,
    setCloudFileIds,
    addSyncLog,
  } = useCardStore();

  const hiddenIdRef    = useRef<string | null>(null);
  const visibleIdRef   = useRef<string | null>(null);
  const retryCountRef  = useRef(0);
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workerBusyRef  = useRef(false);

  // 優先順序：手動 > 核心 UID
  const effectiveUid = syncOverrideUid || user?.uid;
  const fallbackUid = user?.email || undefined;

  // 雙發寫入 (Double-Write)
  const processQueue = useCallback(async () => {
    if (workerBusyRef.current || syncQueue.length === 0) return;
    if (!hiddenIdRef.current || !user?.driveToken || !effectiveUid) return;

    workerBusyRef.current = true;
    setGlobalSyncing(true);
    setSyncStatus(true, useAuthStore.getState().lastSync);

    const batchIds = [...syncQueue];
    
    try {
      const currentDB = {
        version: 1,
        lastModified: Date.now(),
        cards: storeCards.map(({ isSynced: _, ...c }) => c) as any,
        customMerchants: useCardStore.getState().customMerchants,
      };

      await writeDriveDB(user.driveToken, hiddenIdRef.current, currentDB, effectiveUid, addSyncLog);
      
      if (visibleIdRef.current) {
        writeDriveDB(user.driveToken, visibleIdRef.current, currentDB, effectiveUid).catch(() => {});
      }

      removeFromQueue(batchIds);
      batchIds.forEach(id => markCardSynced(id, true));
      
      setSyncStatus(false, Date.now());
      setSyncError(false);
      retryCountRef.current = 0;
      addSyncLog(`✅ 同步成功。`);

    } catch (e: any) {
      addSyncLog(`❌ 寫入失敗: ${e.message || e}`);
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
  }, [user?.driveToken, effectiveUid, syncQueue, storeCards, setGlobalSyncing, removeFromQueue, markCardSynced, setSyncStatus, setSyncError, addSyncLog]);

  // ─── 初始化邏輯 (金鑰修復版) ──────────────────────────
  useEffect(() => {
    if (!user?.driveToken || !effectiveUid) return;

    const init = async () => {
      setSyncStatus(true, null);
      
      const kh = await getKeyHash(effectiveUid);
      addSyncLog(`🛡️ 帳號已鎖定: [${kh}]`);

      try {
        await (useCardStore.persist as any).rehydrate();
        
        const [hid, vid] = await Promise.all([
          getOrCreateDriveFile(user.driveToken!, effectiveUid, 'appDataFolder', (m) => addSyncLog(m)),
          getOrCreateDriveFile(user.driveToken!, effectiveUid, 'drive', (m) => addSyncLog(m))
        ]);
        
        hiddenIdRef.current = hid;
        visibleIdRef.current = vid;
        setCloudFileIds({ visible: vid, hidden: hid });

        // v2.22.0: 讀取並偵測是否使用了救援金鑰
        const { db: cloudDb, usedFallback } = await readDriveDB(user.driveToken!, hid, effectiveUid, (m) => addSyncLog(m), fallbackUid);
        let primarySourceDb = cloudDb;

        // 偵測到救援成功 -> 執行金鑰修復 (Healing)
        if (usedFallback) {
          addSyncLog(`🩹 偵測到金鑰對齊異常，正在為您自動修復與校正...`);
          await writeDriveDB(user.driveToken!, hid, primarySourceDb, effectiveUid, (m) => addSyncLog(m));
          addSyncLog(`✅ 金鑰修復完成，下次登入將自動鎖定您的 Google ID。`);
        }
        
        // 遷移邏輯
        if (primarySourceDb.cards.length === 0) {
          try {
            const { db: legacyDb, usedFallback: legacyFallback } = await readDriveDB(user.driveToken!, vid, effectiveUid, (m) => addSyncLog(m), fallbackUid);
            if (legacyDb.cards.length > 0) {
              addSyncLog(`🔄 發現舊資料，執行自動對齊。`);
              primarySourceDb = legacyDb;
              await writeDriveDB(user.driveToken!, hid, primarySourceDb, effectiveUid, (m) => addSyncLog(m));
            }
          } catch (e) {
            addSyncLog(`⚠️ 雲端暫無舊資料可對齊。`);
          }
        }

        const { db: cleanedDb, changed } = cleanupTrash(primarySourceDb);

        const localCards = useCardStore.getState().cards;
        const cardMap = new Map<string, any>();
        cleanedDb.cards.forEach((c) => cardMap.set(c.id, { ...c, isSynced: true }));
        localCards.filter((c) => !c.isSynced).forEach((c) => cardMap.set(c.id, c));
        
        setCards(Array.from(cardMap.values()));
        if (cleanedDb.customMerchants) {
          cleanedDb.customMerchants.forEach((m) => addCustomMerchant(m));
        }

        if (changed) {
          await writeDriveDB(user.driveToken!, hid, cleanedDb, effectiveUid);
        }

        setSyncStatus(false, Date.now());
        addSyncLog(`🏁 帳號同步已就緒。`);
      } catch (err: any) {
        addSyncLog(`🔥 初始化失敗: ${err.message || err}`);
        setSyncStatus(false, null);
        setSyncError(true);
      } finally {
        finishInitialization();
      }
    };

    init();
  }, [user?.driveToken, effectiveUid, syncOverrideUid, fallbackUid]);

  useEffect(() => {
    if (isInitialized && hiddenIdRef.current && syncQueue.length > 0) {
      processQueue();
    }
  }, [syncQueue, isInitialized, processQueue]);
}
