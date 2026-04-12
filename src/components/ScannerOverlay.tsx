"use client";

import { X, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { ScanState } from "@/hooks/useScanner";

interface ScannerOverlayProps {
  scanState: ScanState;
  onClose: () => void;
  onSkipSecondary: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  amount?: number | "";
}

export default function ScannerOverlay({ 
  scanState, 
  onClose, 
  onSkipSecondary, 
  onNext,
  onFinish,
  amount
}: ScannerOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col overflow-hidden">
       
       {/* 全螢幕背景遮罩與開口 - v1.6.1 極簡版本 */}
       <div className="absolute inset-0 z-0">
          {/* 使用 shadow 技巧產生的遮罩，中央 bg-transparent 保證通透 */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[160px] bg-transparent shadow-[0_0_0_1000px_rgba(15,23,42,0.7)] rounded-[2rem]" 
          />
       </div>

       {/* 頂部控制欄 */}
       <div className="p-10 flex justify-between items-start pointer-events-auto z-20">
          <button 
            onClick={onClose}
            className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl"
          >
            <X size={28} />
          </button>

          <div className="flex flex-col items-end gap-2">
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${scanState === "success" ? "bg-[#34DA4F]" : "bg-[#34DA4F] animate-pulse"}`} />
                <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">
                  {scanState === "scanning-a" ? "正在掃描卡號" : 
                   scanState === "scanning-b" ? "正在掃描密碼" : 
                   scanState === "success" ? "辨識完成" : "等待啟動"}
                </span>
             </div>
             {amount !== undefined && amount !== "" && (
                <div className="text-[#34DA4F] font-black text-3xl tracking-tighter mt-1 bg-white/10 backdrop-blur-xl px-6 py-2 rounded-2xl shadow-2xl border border-white/10">
                  ${amount}
                </div>
             )}
          </div>
       </div>

       {/* 引導文字 - 簡化 */}
       <div className="absolute left-1/2 -translate-x-1/2 top-[calc(50%-110px)] z-20 w-full text-center">
          <p className="text-white/80 font-bold text-sm tracking-[0.3em] uppercase opacity-80">
             請對準條碼
          </p>
       </div>

       {/* 唯一取景窗口輔助標記 */}
       <div className="flex-1 flex items-center justify-center z-10 p-12">
          <div className="relative w-[320px] h-[160px]">
            {/* 四個角落的 L 型邊緣 - 白色、簡約、無動效 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-xl" />
            
            {/* 掃描雷射線已移除 (v1.6.1) */}
            
            {scanState === "success" && (
              <div className="absolute inset-0 bg-[#34DA4F]/10 flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in duration-500 pointer-events-auto rounded-[2rem]">
                 <div className="bg-white rounded-full p-4 shadow-2xl animate-in bounce-in duration-700">
                    <CheckCircle2 size={48} className="text-[#34DA4F]" />
                 </div>
              </div>
            )}

            {scanState === "duplicate" && (
              <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center animate-in shake duration-300 backdrop-blur-sm pointer-events-auto rounded-[2rem]">
                 <div className="bg-white rounded-full p-4 shadow-2xl animate-in bounce-in duration-700">
                    <AlertTriangle size={48} className="text-red-500" />
                 </div>
              </div>
            )}
          </div>
       </div>

       {/* 底部控制介面 (成功後顯示) */}
       <div className="p-10 pb-20 z-30 pointer-events-auto">
          {scanState === "success" ? (
             <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-[50px] duration-700">
                <button 
                  onClick={onNext}
                  className="w-full bg-gradient-to-b from-[#5CF777] via-[#34DA4F] to-[#0EBE2C] text-white font-black py-6 rounded-full text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  <Plus size={28} /> 掃描下一張
                </button>
                <button 
                  onClick={onFinish}
                  className="w-full bg-slate-900 text-[#34DA4F] font-black py-6 rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-lg shadow-2xl"
                >
                  結束掃描
                </button>
             </div>
          ) : (
            scanState === "scanning-b" && (
              <button 
                onClick={onSkipSecondary}
                className="w-full bg-slate-900/60 backdrop-blur-md text-white font-black py-5 rounded-3xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/5"
              >
                跳過密碼掃描 <Plus size={20} className="rotate-45 text-[#34DA4F]" />
              </button>
            )
          )}
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
