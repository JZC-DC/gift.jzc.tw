"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useCardStore } from "@/store/useCardStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ScanLine, CreditCard, Trash2, Store, Settings } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuthStore();
  const { cards, moveToTrash } = useCardStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("7-11");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const displayCards = useMemo(() => {
    return cards
      .filter((c) => c.deletedAt === null && c.merchant === activeTab)
      .sort((a, b) => a.amount - b.amount);
  }, [cards, activeTab]);

  const merchants = useMemo(() => {
    const defaultMerchants = ["7-11"];
    const existing = cards.filter(c => c.deletedAt === null).map(c => c.merchant);
    return Array.from(new Set([...defaultMerchants, ...existing]));
  }, [cards]);

  if (loading || !user) return <div className="min-h-[100dvh] bg-white flex items-center justify-center font-black tracking-widest text-gray-900 animate-pulse text-lg">LOADING...</div>;

  return (
    <div className="min-h-[100dvh] bg-white pb-32 relative text-gray-900 font-sans">
      
      {/* 頂部標題 */}
      <header className="px-8 py-8 flex justify-between items-center z-10 relative max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">我的卡包</h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest mt-1 uppercase opacity-60">Ready to spend · {user.displayName || "User"}</p>
        </div>
      </header>

      {/* 商家分類捲動條 (Tabs) */}
      <div className="px-8 pb-4 overflow-x-auto whitespace-nowrap scrollbar-hide sticky top-0 bg-white/80 backdrop-blur-xl z-20 pt-2 border-b border-gray-50">
        <div className="flex gap-2 max-w-4xl mx-auto">
          {merchants.map((m) => (
            <button
              key={m}
              onClick={() => setActiveTab(m)}
              className={`px-6 py-3 rounded-full font-black text-xs transition-all flex items-center gap-2 uppercase tracking-widest ${
                activeTab === m 
                  ? 'bg-gray-900 text-[#00F5FF] shadow-2xl shadow-gray-900/20' 
                  : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'
              }`}
            >
              <Store size={14} className={activeTab === m ? "text-[#00F5FF]" : "opacity-30"} /> {m} 
            </button>
          ))}
        </div>
      </div>

      {/* 主要卡片區 */}
      <main className="px-8 pt-8 max-w-4xl mx-auto">
        {displayCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-32 text-gray-400">
            <CreditCard size={80} strokeWidth={1} className="opacity-10 mb-8" />
            <p className="font-black text-xl text-gray-900 tracking-tight">空空如也</p>
            <p className="text-xs mt-2 font-bold text-gray-400">目前沒有 {activeTab} 的有效卡片</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayCards.map((card) => (
              <div key={card.id} className="relative aspect-[1.6/1] w-full bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col justify-between p-8 group transition-all active:scale-[0.98]">
                 
                 {/* 晶片與裝飾 */}
                 <div className="absolute top-8 left-8 w-12 h-10 bg-gradient-to-br from-amber-200 to-amber-500 rounded-lg opacity-80 blur-[0.5px] border border-amber-600/20 flex flex-col justify-around p-1.5 overflow-hidden">
                    <div className="w-full h-[1px] bg-amber-700/20" />
                    <div className="w-full h-[1px] bg-amber-700/20" />
                    <div className="w-full h-[1px] bg-amber-700/20" />
                 </div>

                 {/* 商家 Logo / 名稱 */}
                 <div className="absolute top-8 right-8 text-right">
                    <span className="text-[#00F5FF] font-black text-xs uppercase tracking-[0.3em] opacity-80">
                      {card.merchant} Card
                    </span>
                 </div>

                 {/* 面額與幣值 */}
                 <div className="mt-auto flex flex-col items-start">
                    <span className="text-gray-500 font-black text-[10px] uppercase tracking-widest mb-1">Available Balance</span>
                    <h2 className="text-5xl font-black text-white tracking-tighter flex items-center gap-1">
                      <span className="text-lg opacity-40">$</span>
                      {card.amount}
                    </h2>
                 </div>

                 {/* 條碼區域 */}
                 <div className="mt-6 flex flex-col gap-2">
                    <div className="w-full h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden px-4 gap-[2px]">
                       {Array.from({length: 45}).map((_, i) => (
                         <div key={i} className="h-full bg-gray-900" style={{ width: `${Math.random() > 0.6 ? 2 : 1}px`, opacity: Math.random() > 0.1 ? 1 : 0.2 }} />
                       ))}
                    </div>
                    <div className="flex justify-between items-center px-1">
                       <p className="text-[10px] font-mono font-bold text-gray-500 tracking-[0.5em]">{card.barcode}</p>
                       <button
                         onClick={() => {
                           if (confirm("這張卡片已耗盡餘額並要移至垃圾桶嗎？")) {
                             moveToTrash(card.id);
                           }
                         }}
                         className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                 </div>

                 {/* 玻璃擬態裝飾 */}
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00F5FF]/10 rounded-full blur-3xl pointer-events-none" />
              </div>
            ))}
          </div>
        )}
      </main>


      {/* 底部導航列 (Bottom Navigation Bar) */}
      <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur-2xl border-t border-gray-100 pb-safe z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center px-8 h-20 max-w-md mx-auto relative">
          
          {/* 左側：禮物卡管家 (首頁) */}
          <button className="flex flex-col items-center justify-center gap-1 text-[#00c5cc] active:scale-95 transition-transform w-[4.5rem]">
             <CreditCard size={24} strokeWidth={2.5} />
             <span className="text-[10px] font-bold mt-1">卡管家</span>
          </button>

          {/* 中央：懸浮掃描按鈕 (浮出設計) */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-5">
             <button 
               onClick={() => router.push("/scan")}
               className="pointer-events-auto bg-gray-900 text-white w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center shadow-xl shadow-gray-900/30 active:scale-[0.9] transition-transform border-4 border-white"
             >
               <ScanLine size={28} />
             </button>
          </div>

          {/* 右側：設定中心 */}
          <button 
            onClick={() => router.push("/settings")}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-800 transition-colors active:scale-95 w-[4.5rem]"
          >
             <Settings size={24} strokeWidth={2} />
             <span className="text-[10px] font-bold mt-1">設定</span>
          </button>
          
        </div>
      </div>
    </div>
  );
}
