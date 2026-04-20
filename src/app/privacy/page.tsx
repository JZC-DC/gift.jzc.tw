"use client";

import { useRouter } from "next/navigation";
import { 
  ChevronLeft, ShieldCheck, Code, Globe, Lock, Trash2, 
  Gavel, HeartHandshake, Eye, Scale, Info, 
  ExternalLink, Mail, Copyright, Sparkles, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { VERSION } from "@/constants/version";

/**
 * ZJ Card Privacy Policy & Legal Disclaimer Page (VERSION 2.34.0)
 * ─────────────────────────────────────────────
 * Redesigned for high aesthetics, performance, and compliance.
 * Includes both Chinese and English versions.
 */
export default function PrivacyPage() {
  const router = useRouter();
  const githubUrl = "https://github.com/JZC-DC/gift.jzc.tw";
  const contactEmail = "admin@jzc.tw";
  const lastUpdated = "2026-04-20";

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 pb-24 selection:bg-[#34DA4F]/30">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-[#34DA4F]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 md:px-6">
        {/* Header */}
        <header className="py-8 flex items-center justify-between sticky top-0 bg-slate-50/60 backdrop-blur-xl z-50 transition-all duration-300">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => router.back()} 
               className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-100"
             >
                <ChevronLeft size={24} />
             </button>
             <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-800">隱私權政策及法律聲明</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Privacy Policy & Legal Statement</p>
             </div>
          </div>
          <div className="bg-[#34DA4F]/10 text-[#34DA4F] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#34DA4F]/10 shadow-sm animate-pulse">
             v{VERSION}
          </div>
        </header>

        <main className="flex flex-col gap-12 mt-4">
          
          {/* Hero Section */}
          <section className="relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-[#34DA4F]/10 to-transparent rounded-[3rem] blur-2xl group-hover:opacity-75 transition-opacity duration-500" />
             <div className="relative bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-[3.5rem] border border-white shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-10">
                <div className="w-32 h-32 md:w-40 md:h-40 relative flex-shrink-0">
                  <div className="absolute inset-0 bg-[#34DA4F]/20 rounded-[2.5rem] rotate-6 animate-pulse" />
                  <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-4 relative z-10 flex items-center justify-center">
                    <Image 
                      src="/logo.png" 
                      alt="ZJ Card Logo" 
                      width={120} 
                      height={120}
                      priority
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-6 text-center md:text-left">
                   <div className="space-y-2">
                      <h2 className="text-4xl font-black text-slate-900 leading-tight">ZJ Card 奇蹟卡</h2>
                      <div className="flex items-center justify-center md:justify-start gap-2 text-[#34DA4F] font-black text-xs uppercase tracking-widest">
                         <Sparkles size={14} />
                         公益專案 Public Welfare Project
                      </div>
                   </div>
                   <p className="text-slate-600 font-bold text-base md:text-lg leading-relaxed max-w-xl">
                      本程式為「完全免費、開源且不盈利」之公益專案。我們致力於保護您的隱私權與個人資料自主控制權。
                   </p>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <Link 
                        href={githubUrl}
                        target="_blank"
                        className="group flex items-center gap-3 bg-slate-900 text-white px-7 py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] hover:shadow-xl hover:shadow-slate-900/20 active:scale-95 transition-all"
                      >
                         <Code size={18} className="text-[#34DA4F]" />
                         GitHub 開源專案
                         <ExternalLink size={14} className="opacity-50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Link>
                      <div className="flex items-center gap-2 px-5 py-4 bg-slate-100/50 rounded-2xl text-[10px] text-slate-400 font-black uppercase tracking-tighter border border-slate-100">
                         <Copyright size={14} />
                         Brand logos & Domain belong to Developer
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* ============================================================
              CHINESE VERSION (壹 ~ 陸)
              ============================================================ */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 mb-4 px-4">
               <div className="w-1.5 h-6 bg-[#34DA4F] rounded-full" />
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">中文版條款</h2>
            </div>

            {/* 壹 */}
            <div className="group relative">
               <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[2.5rem] blur opacity-5 group-hover:opacity-10 transition duration-500" />
               <section className="relative bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 space-y-6">
                  <div className="flex items-center gap-4 text-blue-600">
                     <div className="p-3 bg-blue-50 rounded-2xl"><Eye size={28} /></div>
                     <h3 className="text-xl font-black tracking-tight text-slate-800">壹、 個人資料之蒐集、處理與利用</h3>
                  </div>
                  <div className="space-y-6 text-slate-600 font-bold leading-relaxed text-sm md:text-base">
                     <div className="space-y-3">
                        <p className="text-slate-900 font-black flex items-center gap-2">
                           <span className="w-2 h-2 bg-blue-500 rounded-full" />
                           一、 蒐集之特定目的與法律依據
                        </p>
                        <p>本程式僅為提供「禮物卡餘額與條碼同步」之核心服務，最小化地蒐集必要之個人資料：</p>
                        <ul className="list-none space-y-3 pl-4">
                           <li className="flex gap-3">
                              <span className="text-blue-500 font-black">●</span>
                              <span><span className="text-slate-800">特定目的：</span>消費者、客戶管理與服務（代號090）。</span>
                           </li>
                           <li className="flex gap-3">
                              <span className="text-blue-500 font-black">●</span>
                              <span><span className="text-slate-800">法律依據：</span>依《個資法》第19條履行契約必要範圍內，以及經您的書面同意。</span>
                           </li>
                           <li className="flex gap-3">
                              <span className="text-blue-500 font-black">●</span>
                              <span><span className="text-slate-800">範圍：</span>存取您登入 Google 帳戶之主要電子郵件地址。</span>
                           </li>
                        </ul>
                     </div>
                     <div className="space-y-3">
                        <p className="text-slate-900 font-black flex items-center gap-2">
                           <span className="w-2 h-2 bg-blue-500 rounded-full" />
                           二、 資料處理與利用範圍
                        </p>
                        <p>電子郵件僅用於身分驗證，所有同步檔案均存放在您 Google Drive 內之專屬隔離區（App Data Folder），開發者絕不主動讀取或攔截。</p>
                     </div>
                  </div>
               </section>
            </div>

            {/* 貳 */}
            <div className="group relative">
               <div className="absolute -inset-1 bg-gradient-to-r from-[#34DA4F] to-emerald-500 rounded-[2.5rem] blur opacity-5 group-hover:opacity-10 transition duration-500" />
               <section className="relative bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 space-y-6">
                  <div className="flex items-center gap-4 text-[#34DA4F]">
                     <div className="p-3 bg-[#34DA4F]/5 rounded-2xl"><ShieldCheck size={28} /></div>
                     <h3 className="text-xl font-black tracking-tight text-slate-800">貳、 個人資料之安全維護措施</h3>
                  </div>
                  <div className="space-y-6 text-slate-600 font-bold leading-relaxed text-sm">
                     <p>為落實《個資法》第27條，本程式已採取符合業界標準之技術措施：</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 space-y-2">
                           <Lock size={20} className="text-[#34DA4F]" />
                           <h4 className="font-black text-slate-800">傳輸與儲存加密</h4>
                           <p className="text-xs leading-relaxed">使用 AES-256-GCM 高強度加密，密鑰依據您的帳戶於本機生成，開發者亦無法解讀內容。</p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 space-y-2">
                           <Globe size={20} className="text-[#34DA4F]" />
                           <h4 className="font-black text-slate-800">OAuth 2.0 存取控制</h4>
                           <p className="text-xs leading-relaxed">完全依賴 Google 登入授權，本程式不儲存您的帳號密碼。</p>
                        </div>
                     </div>
                     <p className="text-xs text-slate-400 italic">※ 注意：您應妥善保管 Google 帳號憑證。若因不可歸責於本程式之原因（如裝置感染病毒）導致資料外洩，本程式將盡力協助但不承擔責任。</p>
                  </div>
               </section>
            </div>

            {/* 參 */}
            <div className="group relative">
               <section className="relative bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 space-y-6">
                  <div className="flex items-center gap-4 text-cyan-600">
                     <div className="p-3 bg-cyan-50 rounded-2xl"><Info size={28} /></div>
                     <h3 className="text-xl font-black tracking-tight text-slate-800">參、 Cookie、本機儲存與追蹤技術</h3>
                  </div>
                  <div className="space-y-4 text-slate-600 font-bold leading-relaxed text-sm">
                     <p>1. <span className="text-slate-800">Cookie使用：</span>僅限於 Session Cookie 以維持登入狀態，不包含個人追蹤，關閉後自動失效。</p>
                     <p>2. <span className="text-slate-800">LocalStorage：</span>僅用於本機暫存加密後的卡片清單，以供離線顯示條碼，不會自動同步至伺服器。</p>
                     <p>3. <span className="text-slate-800">無追蹤行為：</span>本程式絕不包含任何用於廣告分析或跨站追蹤之第三方 SDK 或追蹤器。</p>
                  </div>
               </section>
            </div>

            {/* 肆 */}
            <div className="group relative">
               <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-[2.5rem] blur opacity-5 group-hover:opacity-10 transition duration-500" />
               <section className="relative bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 space-y-6 overflow-hidden">
                  <div className="flex items-center gap-4 text-red-500">
                     <div className="p-3 bg-red-50 rounded-2xl"><Trash2 size={28} /></div>
                     <h3 className="text-xl font-black tracking-tight text-slate-800">肆、 您依《個資法》享有之權利</h3>
                  </div>
                  <div className="space-y-6 text-slate-600 font-bold leading-relaxed text-sm">
                     <p>您得依法行使「查詢閱覽、補充更正、停止處理、刪除」等權利。您可以透過設定頁面執行以下操作：</p>
                     <div className="flex flex-col gap-3 p-6 bg-red-50/50 rounded-3xl border border-red-100">
                        <div className="flex items-start gap-4">
                           <ShieldAlert size={20} className="text-red-500 shrink-0 mt-1" />
                           <div>
                              <p className="text-slate-900 font-black uppercase text-xs tracking-widest mb-1">核彈級重設 / 刪除帳號</p>
                              <p className="text-xs leading-relaxed">一鍵刪除 Google Drive 內所有同步檔案及本機快取。操作一經執行即為永久且不可回復。</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </section>
            </div>

            {/* 伍 */}
            <div className="group relative">
               <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-slate-900 rounded-[2.5rem] blur opacity-5 group-hover:opacity-10 transition duration-500" />
               <section className="relative bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl space-y-6">
                  <div className="flex items-center gap-4 text-[#34DA4F]">
                     <div className="p-3 bg-white/5 rounded-2xl"><Gavel size={28} /></div>
                     <h3 className="text-xl font-black tracking-tight text-white">伍、 法律免責聲明與責任限制</h3>
                  </div>
                  <div className="space-y-4 text-slate-400 font-bold leading-relaxed text-sm">
                     <p>1. 基於非營利公益性質，開發者與本專案對於損害賠償責任總額，以<span className="text-[#34DA4F] font-black text-lg mx-1 whitespace-nowrap text-nowrap">新台幣零元 (NT$0)</span> 為上限。</p>
                     <p>2. 對於不可抗力因素（如 Google 服務大規模故障、全球駭客攻擊等）所致之損失，本程式不負擔法律責任。</p>
                     <p>3. 維護帳號與裝置之安全性屬於使用者自身責任。任何因保管疏失所致之損害，與本專案無涉。</p>
                  </div>
               </section>
            </div>

            {/* 陸 */}
            <div className="group relative">
               <section className="relative bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 space-y-6">
                  <div className="flex items-center gap-4 text-slate-600">
                     <div className="p-3 bg-slate-50 rounded-2xl"><Scale size={28} /></div>
                     <h3 className="text-xl font-black tracking-tight text-slate-800">陸、 隱私權政策之修訂與管轄</h3>
                  </div>
                  <div className="space-y-6 text-slate-600 font-bold leading-relaxed text-sm">
                     <p>本政策修訂將公告於應用程式內。因本政策所生之爭議，均以中華民國法律為準據法，並以臺灣臺北地方法院為第一審管轄法院。</p>
                     <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <Mail size={18} className="text-[#34DA4F]" />
                        <span className="text-xs">聯絡信箱：</span>
                        <Link href={`mailto:${contactEmail}`} className="text-slate-900 border-b border-slate-900/10 font-black">{contactEmail}</Link>
                     </div>
                  </div>
               </section>
            </div>
          </div>

          <div className="relative py-12 flex items-center justify-center">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
             <div className="relative bg-slate-50 px-6">
                <Globe size={24} className="text-slate-300" />
             </div>
          </div>

          {/* ============================================================
              ENGLISH VERSION (FOR GOOGLE VERIFICATION)
              ============================================================ */}
          <div className="flex flex-col gap-10 opacity-70 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-3 px-4">
               <div className="w-1.5 h-6 bg-slate-300 rounded-full" />
               <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-slate-400 tracking-tight uppercase">Formal Privacy Policy</h2>
                  <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">English Version for Compliance Review</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] leading-relaxed text-slate-500 font-medium px-4">
               
               <div className="space-y-3 p-6 bg-white rounded-3xl border border-slate-100/50">
                  <h4 className="font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                     1. Purpose & Access
                  </h4>
                  <p>ZJ Card accesses your Google primary email and Drive storage (appDataFolder) solely for identity verification and user-controlled data synchronization. Based on PDPA Article 19, we establish a service contract by your usage.</p>
               </div>

               <div className="space-y-3 p-6 bg-white rounded-3xl border border-slate-100/50">
                  <h4 className="font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                     2. Security Measures
                  </h4>
                  <p>Implementing PDPA Article 27, all sensitive data is encrypted via AES-256-GCM locally. Keys are dynamically generated based on your identity; developers cannot access your data.</p>
               </div>

               <div className="space-y-3 p-6 bg-white rounded-3xl border border-slate-100/50">
                  <h4 className="font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                     3. Cookies & Tracking
                  </h4>
                  <p>We use Session Cookies for authentication and LocalStorage for encrypted temporary data. No third-party tracking, advertising SDKs, or profiling tools are included.</p>
               </div>

               <div className="space-y-3 p-6 bg-white rounded-3xl border border-slate-100/50">
                  <h4 className="font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                     4. User Rights
                  </h4>
                  <p>Users may exercise rights of access and deletion (PDPA Article 3 & 11) via the in-app "Delete Account" feature. This process is permanent and irreversible.</p>
               </div>

               <div className="space-y-3 p-6 bg-white rounded-3xl border border-slate-100/50">
                  <h4 className="font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                     5. Liability Limitation
                  </h4>
                  <p>As a non-profit project, total liability for any nature of damages (data loss, monetary loss) is capped at NT$0. Force majeure events are legally exempt from our responsibility.</p>
               </div>

               <div className="space-y-3 p-6 bg-white rounded-3xl border border-slate-100/50">
                  <h4 className="font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                     6. Jurisdiction
                  </h4>
                  <p>Governed by R.O.C. laws. Disputes shall be settled in the Taiwan Taipei District Court. Contact: admin@jzc.tw</p>
               </div>
            </div>
          </div>

          <footer className="pt-20 border-t border-slate-200 text-center flex flex-col items-center gap-6">
             <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><HeartHandshake size={20} className="text-[#34DA4F]" /></div>
                   <div className="text-left">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">ZJ Card 公益開發小組</p>
                      <p className="text-[10px] text-slate-400 font-bold">Public Welfare Development Team</p>
                   </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="px-5 py-2 bg-white rounded-full border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Last Updated: {lastUpdated}
                   </div>
                   <p className="text-[9px] text-slate-300 uppercase tracking-[0.4em] mt-2 italic">Non-Profit • Open Source • Secure</p>
                </div>
             </div>
          </footer>

        </main>
      </div>
    </div>
  );
}
