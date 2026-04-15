import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { encryptText, decryptText } from "@/lib/crypto";
import { useAuthStore } from "./useAuthStore";

export interface Card {
  id: string;
  merchant: string;
  name: string;
  barcode: string; // 第一組條碼
  secondaryBarcode: string | null; // 第二組條碼 (密碼)
  amount: number;
  createdAt: number;
  deletedAt: number | null;
  isSynced?: boolean;
}

interface CardStore {
  cards: Card[];
  isPro: boolean;
  isInitialized: boolean;
  customMerchants: string[];
  addCard: (newCard: Card) => boolean;
  setCards: (cards: Card[]) => void;
  setProStatus: (isPro: boolean) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  deletePermanently: (id: string) => void;
  addCustomMerchant: (merchant: string) => void;
  markCardSynced: (id: string, isSynced: boolean) => void;
  finishInitialization: () => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set, get) => ({
      cards: [],
      isPro: false,
      isInitialized: false,
      customMerchants: [],

      finishInitialization: () => set({ isInitialized: true }),

      addCard: (newCard) => {
        const { cards, isPro } = get();

        const isDuplicate = cards.some(c => c.barcode === newCard.barcode);
        if (isDuplicate) {
          alert("⚠️ 此卡片早已被掃描存檔，請更換下一張！");
          return false;
        }

        const activeCardsCount = cards.filter(c => c.deletedAt === null).length;
        if (!isPro && activeCardsCount >= 25) {
          alert("已達免費版上限 (25張)，請升級 PRO 解鎖無限存取！");
          return false;
        }

        set((state) => ({ cards: [...state.cards, newCard] }));
        return true;
      },

      moveToTrash: (id) => {
        set((state) => ({
          cards: state.cards.map(c => c.id === id ? { ...c, deletedAt: Date.now(), isSynced: false } : c)
        }));
      },

      restoreFromTrash: (id) => {
        set((state) => ({
          cards: state.cards.map(c => c.id === id ? { ...c, deletedAt: null, isSynced: false } : c)
        }));
      },

      deletePermanently: (id) => {
        set((state) => ({
          cards: state.cards.filter(c => c.id !== id)
        }));
      },

      addCustomMerchant: (merchant) => {
        set((state) => {
          if (state.customMerchants.includes(merchant)) return state;
          return { customMerchants: [...state.customMerchants, merchant] };
        });
      },

      markCardSynced: (id, isSynced) => {
        set((state) => ({
          cards: state.cards.map(c => c.id === id ? { ...c, isSynced } : c)
        }));
      },

      setCards: (cards) => set({ cards }),
      setProStatus: (isPro) => set({ isPro }),
    }),
    {
      name: "sgcm-cards-v1",
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const value = localStorage.getItem(name);
          if (!value) return null;
          
          // 如果內容不含點號，代表是舊版的明文 JSON
          if (!value.includes(".")) return value;

          // 嘗試取得目前的 UID 進行解密
          const uid = useAuthStore.getState().user?.uid;
          if (!uid) {
            console.warn("[Storage] 未登入，暫時無法解密本地資料。");
            return null; // 回傳 null 讓 Zustand 保持初始狀態 (隱藏卡片)
          }

          try {
            return await decryptText(value, uid);
          } catch (e) {
            console.error("[Storage] 本地解密失敗:", e);
            return null;
          }
        },
        setItem: async (name, value) => {
          const uid = useAuthStore.getState().user?.uid;
          if (!uid) return; // 未登入不儲存
          
          try {
            const encrypted = await encryptText(value, uid);
            localStorage.setItem(name, encrypted);
          } catch (e) {
            console.error("[Storage] 本地加密失敗:", e);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        cards: state.cards,
        isPro: state.isPro,
        customMerchants: state.customMerchants,
      }),
    }
  )
);
