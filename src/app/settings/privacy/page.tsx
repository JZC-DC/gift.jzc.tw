"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldCheck, Database, Code, AlertTriangle } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col font-sans text-gray-900 pb-12">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <header className="px-4 py-6 flex items-center gap-4 bg-gray-50 sticky top-0 z-10">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 active:scale-95 transition-transform">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">隱私權與法律條款</h1>
        </header>

        <main className="p-4 flex flex-col gap-8">
          
          {/* 隱私權摘要 - 亮點區塊 */}
          <section className="bg-gradient-to-br from-[#5CF777] via-[#34DA4F] to-[#0EBE2C] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-3xl" />
             <div className="relative z-10 flex flex-col gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   <ShieldCheck size={28} />
                </div>
                <h2 className="text-2xl font-black">隱私權摘要</h2>
                <div className="space-y-4 opacity-90 font-bold text-sm leading-relaxed">
                   <p>本 App 採「無中心資料庫」設計。您的所有敏感數據（卡號、金額、商家）均直接存放於您個人的 Google Drive 試算表中。</p>
                   <p>開發者與任何第三方均無法存取、解析或轉傳您的資料。</p>
                </div>
             </div>
          </section>

          {/* 詳細條款 */}
          <div className="flex flex-col gap-6 px-2">
             
             {/* 1. 數據主權 */}
             <section className="space-y-3">
                <div className="flex items-center gap-2 text-[#34DA4F]">
                   <Database size={18} />
                   <h3 className="font-black uppercase tracking-widest text-xs">數據存放說明</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3 text-sm text-slate-600 leading-relaxed font-bold">
                   <p>本程式通過 Google OAuth 授權，僅在您的雲端硬碟建立名為 <code className="bg-slate-50 px-2 py-1 rounded text-slate-800">智慧商品卡資料庫 (SGCM-Sync)</code> 的試算表檔案。</p>
                   <p>所有資料傳輸均在您的瀏覽器與 Google 伺服器之間直接完成，不經過任何中轉伺服器。</p>
                </div>
             </section>

             {/* 2. 智慧財產與開源 */}
             <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                   <Code size={18} />
                   <h3 className="font-black uppercase tracking-widest text-xs">原始碼與品牌資產</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3 text-sm text-slate-600 leading-relaxed font-bold">
                   <p>本 App 之程式原始碼完全開源，保障技術透明度與安全性。然而，本 App 的視覺 UI 設計、配色方案、Logo 以及「智慧商品卡管家 / SGCM」之品牌名稱均屬 <span className="text-slate-900">jzc 平台</span> 所有。</p>
                   <p>未經書面授權，禁止將本 App 的品牌資產用於任何商業改編、二次分發或品牌混淆行為。</p>
                </div>
             </section>

             {/* 3. 法律免責聲明 */}
             <section className="space-y-3">
                <div className="flex items-center gap-2 text-red-400">
                   <AlertTriangle size={18} />
                   <h3 className="font-black uppercase tracking-widest text-xs">法律免責聲明</h3>
                </div>
                <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 shadow-sm space-y-3 text-sm text-slate-600 leading-relaxed font-medium">
                   <ul className="list-disc pl-4 space-y-2 text-red-900/70 font-bold">
                      <li>使用者有義務妥善保管自己的 Google 帳號與手機解鎖資訊，防止他人竊取禮物卡訊息。</li>
                      <li>本工具僅為個人管理便利而開發，開發者不保證 Google API 服務的 100% 穩定性。</li>
                      <li>若因使用者個人操作不當、手機遺失、被駭客入侵或 Google 服務中斷導致之資料遺失或財產損害，開發者與 jzc 平台不承擔任何賠償責任。</li>
                      <li>繼續點擊「登入」或使用本服務，即代表您完全理解並同意上述所有條款。</li>
                   </ul>
                </div>
             </section>

          </div>

          <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-4">
             Versoin 1.3.1 Build 2026.04
          </p>

        </main>
      </div>
    </div>
  );
}
