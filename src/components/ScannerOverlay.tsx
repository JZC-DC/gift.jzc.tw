"use client";

import { X, CheckCircle2, AlertTriangle, Plus, CreditCard } from "lucide-react";
import { ScanState } from "@/hooks/useScanner";

interface ScannerOverlayProps {
  scanState: ScanState;
  onClose: () => void;
  onSkipSecondary: () => void;
  onFinish?: () => void;
  amount?: number | "";
  sessionCards?: any[];
}

export default function ScannerOverlay({ 
  scanState, 
  onClose, 
  onSkipSecondary, 
  onFinish,
  amount,
  sessionCards = []
}: ScannerOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col overflow-hidden">
       
       {/* v1.11.0 Fluid UX: 掃描成功瞬發閃光 */}
       {(scanState === "success" || scanState === "cooldown") && (
         <div className="absolute inset-0 bg-white/30 animate-out fade-out duration-500 z-[100] pointer-events-none" />
       )}

       {/* 頂部控制欄 */}
       <div className="p-8 flex justify-between items-start pointer-events-auto z-20">
          <button 
            onClick={onClose}
            className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-end gap-2 text-right">
             <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-full flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${scanState === "success" || scanState === "cooldown" ? "bg-[#34DA4F]" : "bg-[#34DA4F] animate-pulse"}`} />
                <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">
                  {scanState === "scanning-a" ? "等待卡號" : 
                   scanState === "scanning-b" ? "等待密碼" : 
                   scanState === "success" || scanState === "cooldown" ? "記錄成功" : "準備中"}
                </span>
             </div>
             {amount !== undefined && amount !== "" && (
                <div className="text-[#34DA4F] font-black text-2xl tracking-tighter bg-black/40 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/5 shadow-2xl">
                  ${amount}
                </div>
             )}
          </div>
       </div>

       {/* 核心取景框 */}
       <div className="flex-1 flex items-center justify-center z-10">
          <div className="relative w-[360px] h-[200px]">
             {/* 四個角落的標記 */}
             <div className="absolute top-0 left-0 w-12 h-10 border-t-[4px] border-l-[4px] border-white rounded-tl-2xl drop-shadow-md" />
             <div className="absolute top-0 right-0 w-12 h-10 border-t-[4px] border-r-[4px] border-white rounded-tr-2xl drop-shadow-md" />
             <div className="absolute bottom-0 left-0 w-12 h-10 border-b-[4px] border-l-[4px] border-white rounded-bl-2xl drop-shadow-md" />
             <div className="absolute bottom-0 right-0 w-12 h-10 border-b-[4px] border-r-[4px] border-white rounded-br-2xl drop-shadow-md" />
             
             {/* 非阻塞成功提示 */}
             {(scanState === "success" || scanState === "cooldown") && (
               <div className="absolute inset-0 bg-[#34DA4F]/20 flex items-center justify-center backdrop-blur-[2px] animate-in fade-in zoom-in duration-300 pointer-events-none rounded-[2rem]">
                  <div className="bg-white rounded-full p-4 shadow-2xl scale-75">
                     <CheckCircle2 size={48} className="text-[#34DA4F]" />
                  </div>
               </div>
             )}

             {scanState === "duplicate" && (
               <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center animate-in shake duration-300 backdrop-blur-[2px] pointer-events-none rounded-[2rem]">
                  <div className="bg-white rounded-full p-4 shadow-2xl scale-75">
                     <AlertTriangle size={48} className="text-red-500" />
                  </div>
               </div>
             )}
          </div>
       </div>

       {/* 底部功能與 Session 列表 (v1.11.0 核心) */}
       <div className="z-30 pointer-events-auto mt-auto pb-safe">
          {/* 中間輔助按鈕 */}
          {scanState === "scanning-b" && (
            <div className="px-10 pb-4">
               <button 
                 onClick={onSkipSecondary}
                 className="w-full bg-slate-900/60 backdrop-blur-md text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/5"
               >
                 跳過密碼 <Plus size={18} className="rotate-45 text-[#34DA4F]" />
               </button>
            </div>
          )}

          <div className="bg-gradient-to-t from-black/80 to-transparent pt-12 p-8">
             <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col gap-1">
                   <h3 className="text-white/60 font-black text-[10px] uppercase tracking-widest pl-1">本次掃描隊列</h3>
                   <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">{sessionCards.length}</span>
                      <span className="text-white/40 font-bold text-sm">Cards</span>
                   </div>
                </div>
                <button 
                  onClick={onFinish}
                  className="bg-[#34DA4F] text-slate-900 font-black px-8 py-4 rounded-2xl active:scale-95 transition-all shadow-xl shadow-[#34DA4F]/20 flex items-center gap-2"
                >
                  結束掃描 <span className="opacity-40 tracking-tighter">DONE</span>
                </button>
             </div>

             {/* 底部縮圖列 */}
             <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-8 px-8">
                {sessionCards.length === 0 ? (
                  <div className="w-full h-20 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-white/20 font-bold italic text-sm">
                    等待掃描識別...
                  </div>
                ) : (
                  sessionCards.map((c, i) => (
                    <div 
                      key={c.id} 
                      className={`shrink-0 w-40 bg-white/10 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-right-10 duration-500 ${i === 0 ? 'ring-2 ring-[#34DA4F]' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-[#34DA4F]/20 rounded-lg">
                            <CreditCard size={14} className="text-[#34DA4F]" />
                         </div>
                         <span className="text-white/40 text-[9px] font-black truncate">{c.merchant}</span>
                      </div>
                      <div className="text-white font-black text-[10px] tracking-widest truncate">{c.barcode}</div>
                      <div className="flex justify-between items-center mt-auto">
                         <span className="text-[#34DA4F] font-black text-xs">${c.amount}</span>
                         <div className={`w-2 h-2 rounded-full ${c.isSynced ? 'bg-[#34DA4F]' : 'bg-orange-400 animate-pulse'}`} />
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
       </div>

       <style jsx global>{`
         @keyframes shake {
           0%, 100% { transform: translateX(0); }
           25% { transform: translateX(-15px); }
           75% { transform: translateX(15px); }
         }
       `}</style>
    </div>
  );
}
