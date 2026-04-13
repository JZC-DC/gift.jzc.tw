import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      name: "sgcm-cards-v1", // localStorage 的 key 名稱
      // 只持久化 cards 和 customMerchants，不持久化 isInitialized
      partialize: (state) => ({
        cards: state.cards,
        isPro: state.isPro,
        customMerchants: state.customMerchants,
      }),
    }
  )
);
