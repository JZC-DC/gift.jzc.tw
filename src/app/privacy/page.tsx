"use client";

import { useRouter } from "next/navigation";
import { 
  ChevronLeft, ShieldCheck, Database, Code, AlertTriangle, 
  Globe, Lock, Share2, Trash2, Gavel, HeartHandshake, 
  Eye, ShieldAlert, Copyright, ExternalLink, Mail, Scale, Info
} from "lucide-react";
import Link from "next/link";
import { VERSION } from "@/constants/version";

/**
 * ZJ Card Privacy Policy & Legal Disclaimer Page (VERSION)
 * ─────────────────────────────────────────────
 * Layout: 
 *   Top -> Main Chinese version for local users (Large/Clear).
 *   Bottom -> Dedicated English version for Google Verification (Small/Formal).
 */
export default function PrivacyPage() {
  const router = useRouter();
  const githubUrl = "https://github.com/jhouzihcing/gift.jzc.tw";
  const contactEmail = "admin@jzc.tw";

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col font-sans text-gray-900 pb-24">
      
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <header className="px-6 py-8 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-4">
             <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                <ChevronLeft size={24} />
             </button>
             <h1 className="text-xl font-black tracking-tight text-slate-800">隱私權政策與法律聲明</h1>
          </div>
          <div className="bg-[#34DA4F]/10 text-[#34DA4F] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
             {VERSION}
          </div>
        </header>

        <main className="p-6 md:p-10 flex flex-col gap-16">
          
          {/* ============================================================
              CHINESE VERSION (FOR USERS) - LARGE & CLEAR
              ============================================================ */}
          <div className="flex flex-col gap-12">
            
            <section className="space-y-4 text-center md:text-left">
               <h2 className="text-4xl font-black text-slate-900 leading-tight">ZJ Card 奇蹟卡</h2>
               <div className="p-6 bg-[#34DA4F]/5 rounded-[2rem] border border-[#34DA4F]/10 space-y-4 text-left">
                  <p className="text-[#1A8A2A] font-black text-base leading-relaxed">
                     本程式為「完全免費、開源且不盈利」之公益專案。
                     我們依據《個人資料保護法》之相關規定，致力於保護您的隱私。本政策說明我們如何蒐集、處理及利用您的個人資料。
                  </p>
                  
                  {/* GitHub Link */}
                  <div className="flex flex-col md:flex-row gap-3 pt-2">
                     <Link 
                       href={githubUrl}
                       target="_blank"
                       className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-slate-200"
                     >
                        <Code size={18} />
                        開源專案程式碼 (GitHub)
                        <ExternalLink size={14} className="opacity-50" />
                     </Link>
                     <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] text-[#1A8A2A]/60 font-black uppercase tracking-tighter">
                        <Copyright size={12} />
                        品牌標誌、名稱及網域歸開發者所有。
                     </div>
                  </div>
               </div>
            </section>

            {/* 中文：1. 資料存取方式與特定目的 */}
            <section className="space-y-4">
               <div className="flex items-center gap-3 text-blue-600">
                  <Eye size={24} />
                  <h3 className="text-xl font-black tracking-tight">1. 資料存取方式與特定目的</h3>
               </div>
               <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4 overflow-hidden">
                  <p className="text-slate-600 font-bold leading-relaxed">
                    本程式僅基於身分辨識與提供「禮物卡餘額與條碼同步」之核心服務目的，在您授權下存取您的 <span className="text-slate-900">Google 主要電子郵件地址</span>。
                  </p>
                  <p className="text-slate-600 font-bold leading-relaxed">
                    同步檔案存放於您 Google Drive 帳號內的隱藏隔離區與根目錄。這些資料僅供您本人同步資訊之用，開發者無法且絕不主動讀取、攔截或傳輸。
                  </p>
               </div>
            </section>

            {/* 中文：2. 資料安全與適當安全措施 */}
            <section className="space-y-4">
               <div className="flex items-center gap-3 text-[#34DA4F]">
                  <ShieldCheck size={24} />
                  <h3 className="text-xl font-black tracking-tight">2. 資料安全與適當安全措施</h3>
               </div>
               <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-slate-600 font-bold">
                  <p>
                    為落實《個人資料保護法》第 27 條關於適當安全措施之要求，本程式採用 AES-256-GCM 高強度加密技術。
                  </p>
                  <p>
                    加密密鑰是依據您的 Google 身分於本機生成；即使檔案存放於雲端空間，未經您的身分授權亦無法解讀。我們已採取符合業界標準之技術措施，防止資料被竊取、竄改或洩漏。
                  </p>
               </div>
            </section>

            {/* 中文：新章節：使用 Cookie 與本機存儲技術 */}
            <section className="space-y-4">
               <div className="flex items-center gap-3 text-cyan-600">
                  <Info size={24} />
                  <h3 className="text-xl font-black tracking-tight">3. 使用 Cookie 與本機存儲技術</h3>
               </div>
               <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-slate-600 font-bold">
                  <p>
                    本程式使用 <span className="text-slate-900">Cookies (Session)</span> 技術以維持您的登入狀態。這些 Cookie 僅用於核心功能辨識，不包含任何廣告追蹤資訊。
                  </p>
                  <p>
                    本程式亦使用 <span className="text-slate-900">LocalStorage</span> 技術於您的本機裝置暫存加密後的卡片清單。這能確保在離線狀態下仍能顯示條碼，且所有本地數據皆受到加密保護。
                  </p>
               </div>
            </section>

            {/* 中文：4. 行使個資刪除權 */}
            <section className="space-y-4">
               <div className="flex items-center gap-3 text-red-500">
                  <Trash2 size={24} />
                  <h3 className="text-xl font-black tracking-tight">4. 行使個資刪除權</h3>
               </div>
               <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-3 font-bold text-slate-600">
                  <p>
                    您得依《個人資料保護法》第 11 條規定，隨時行使對您各項資料之刪除權。您可以透過設定中的「核彈級重設」或「刪除帳號」功能，一鍵清除所有雲端同步檔與本地快取。
                  </p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                    註：刪除操作一旦執行即無法還原。若因刪除導致禮物卡資訊遺失，本程式不負賠償責任。
                  </p>
               </div>
            </section>

            {/* 中文：5. 法律免責與責任上限 */}
            <section className="space-y-4">
               <div className="flex items-center gap-3 text-indigo-700">
                  <Gavel size={24} />
                  <h3 className="text-xl font-black tracking-tight">5. 法律免責與責任上限</h3>
               </div>
               <div className="bg-red-50/50 p-8 rounded-3xl border border-red-100 space-y-4">
                  <p className="text-sm text-slate-700 leading-relaxed font-black">
                     本程式以「現狀 (As Is)」提供。作為非盈利公益性質之專案：
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-xs text-slate-500 font-bold">
                     <li>在任何情況下，開發者對您因使用本服務所衍生之損害（包括但不限於禮物卡價值損失、資料遺失、利潤損失），其損害賠償責任總額以「新台幣零元」為上限。</li>
                     <li>因不可抗力因素（如天災、戰爭、Google 服務大規模中斷、駭客攻擊等）導致之資料外洩或服務異常，本程式不負擔法律責任。</li>
                     <li>您應妥善保管 Google 帳號憑證與裝置安全性。任何因您授權第三方存取帳號而導致之損失，與本程式無涉。</li>
                  </ul>
               </div>
            </section>

            {/* 中文：6. 管轄權與聯絡方式 */}
            <section className="space-y-4">
               <div className="flex items-center gap-3 text-slate-600">
                  <Scale size={24} />
                  <h3 className="text-xl font-black tracking-tight">6. 管轄權與聯絡方式</h3>
               </div>
               <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-slate-600 font-bold">
                  <p>
                    本聲明之解釋與適用，以及因本聲明所生之爭議，均以中華民國法律為準據法，並以臺灣臺北地方法院為第一審管轄法院。
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                     <Mail size={18} className="text-[#34DA4F]" />
                     <span>聯絡信箱：</span>
                     <Link href={`mailto:${contactEmail}`} className="text-slate-900 border-b border-slate-900/10">{contactEmail}</Link>
                  </div>
               </div>
            </section>

          </div>

          <div className="h-px bg-slate-100 my-4" />

          {/* ============================================================
              ENGLISH VERSION (FOR GOOGLE VERIFICATION) - SMALL & FORMAL
              ============================================================ */}
          <section className="space-y-8 opacity-60 hover:opacity-100 transition-opacity">
             <div className="flex flex-col gap-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Globe size={14} /> Formal Privacy Policy (English Version for Google Review)
                </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] leading-relaxed text-slate-500 font-medium border-t border-slate-50 pt-8">
                
                <div className="space-y-2">
                   <h4 className="font-black text-slate-700 uppercase tracking-tight">1. Purpose & Access</h4>
                   <p>ZJ Card accesses your Google primary email and Drive storage (appDataFolder/root) solely for identity verification and user-controlled data synchronization.</p>
                </div>

                <div className="space-y-2">
                   <h4 className="font-black text-slate-700 uppercase tracking-tight">2. Cookies & Storage</h4>
                   <p>We use Session Cookies for authentication and LocalStorage for encrypted temporary data. We do not use third-party tracking or advertising cookies.</p>
                </div>

                <div className="space-y-2">
                   <h4 className="font-black text-slate-700 uppercase tracking-tight">3. Data Protection</h4>
                   <p>In accordance with PDPA Article 27, data is encrypted via AES-256-GCM before storage. We implement appropriate technical measures to prevent unauthorized access.</p>
                </div>

                <div className="space-y-2">
                   <h4 className="font-black text-slate-700 uppercase tracking-tight">4. Right to Deletion</h4>
                   <p>Users may exercise their right to deletion (PDPA Article 11) via the "Delete Account" feature. This process is irreversible.</p>
                </div>

                <div className="space-y-2">
                   <h4 className="font-black text-slate-700 uppercase tracking-tight">5. Limitation of Liability</h4>
                   <p>This is a non-profit project. Total liability for any damages (data loss, value loss) is limited to USD $0.00. We are not liable for force majeure events.</p>
                </div>

                <div className="space-y-2">
                   <h4 className="font-black text-slate-700 uppercase tracking-tight">6. Jurisdiction</h4>
                   <p>These terms are governed by the laws of the R.O.C. Any disputes shall be settled in the Taiwan Taipei District Court. Contact: admin@jzc.tw</p>
                </div>

             </div>
          </section>

          <footer className="pt-10 border-t border-slate-100 text-center flex flex-col items-center gap-4">
             <div className="flex flex-col items-center gap-2 text-slate-300 font-black text-[10px] uppercase tracking-widest leading-loose">
                <div className="flex items-center gap-2">
                   <HeartHandshake size={14} className="text-[#34DA4F]" />
                   ZJ Card公益開發小組 • Version {VERSION}
                </div>
                <div className="opacity-50 text-[9px] tracking-widest mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                   最後更新時間 Last Updated: 2026-04-19 21:00:00
                </div>
             </div>
          </footer>

        </main>
      </div>
    </div>
  );
}
