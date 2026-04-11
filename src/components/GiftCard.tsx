"use client";

import Barcode from "react-barcode";

interface GiftCardProps {
  card: {
    id: string;
    merchant: string;
    amount: number;
    barcode: string;
    secondaryBarcode?: string | null;
  };
  onDelete: (id: string) => void;
}

export default function GiftCard({ card, onDelete }: GiftCardProps) {
  return (
    <div className="relative bg-white rounded-[2rem] shadow-[var(--card-shadow)] overflow-hidden flex flex-col items-center p-8 border border-slate-100 transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-1">
      
      {/* 商家與面額 */}
      <div className="w-full text-center space-y-2 mb-6">
        <h3 className="text-xl font-black text-slate-400 tracking-widest uppercase">{card.merchant}</h3>
        <div className="flex items-center justify-center gap-1">
          <span className="text-xl font-black text-slate-300">$</span>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
            {card.amount}
          </h2>
        </div>
      </div>

      <div className="w-full h-[1px] bg-slate-50 mb-8" />

      {/* 條碼顯示區 */}
      <div className="w-full flex flex-col gap-10 items-center overflow-hidden">
        {/* 條碼 1 */}
        <div className="flex flex-col items-center gap-3 w-full">
          <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">Primary Barcode</p>
          <div className="bg-white p-3 border border-slate-50 rounded-xl w-full flex justify-center">
            <Barcode 
              value={card.barcode} 
              width={1.6} 
              height={64} 
              fontSize={14}
              margin={0}
              background="transparent"
              fontOptions="bold"
              lineColor="#1e293b"
            />
          </div>
        </div>

        {/* 條碼 2 (如果有) */}
        {card.secondaryBarcode && (
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">Secondary Barcode</p>
            <div className="bg-white p-3 border border-slate-50 rounded-xl w-full flex justify-center">
              <Barcode 
                value={card.secondaryBarcode} 
                width={1.6} 
                height={64} 
                fontSize={14}
                margin={0}
                background="transparent"
                fontOptions="bold"
                lineColor="#1e293b"
              />
            </div>
          </div>
        )}
      </div>

      {/* 功能按鈕 */}
      <button
        onClick={() => {
          if (confirm("這張卡片已耗盡餘額並要移至垃圾桶嗎？")) {
            onDelete(card.id);
          }
        }}
        className="mt-12 w-full py-5 bg-slate-50 text-slate-400 font-bold rounded-3xl hover:bg-red-50 hover:text-red-500 transition-all text-xs tracking-[0.2em] uppercase active:scale-95"
      >
        已無餘額 / 刪除卡片
      </button>

      {/* 側邊裝飾 - 安心綠小標籤 */}
      <div className="absolute top-8 right-0 w-1.5 h-12 bg-[#10b981] rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
    </div>
  );
}
