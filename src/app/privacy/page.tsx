"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldCheck, Database, Code, AlertTriangle, Globe, Lock, Share2, Trash2 } from "lucide-react";

/**
 * ZJ Card Privacy Policy Page (v2.25.0)
 * ─────────────────────────────────────────────
 * This page is public and fulfills Google OAuth verification requirements.
 * Included: Data Accessed, Usage, Sharing, Storage, and Deletion.
 */
export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col font-sans text-gray-900 pb-20">
      
      <div className="max-w-3xl mx-auto w-full">
        {/* Simple Header for Public View */}
        <header className="px-6 py-8 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-4">
             <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                <ChevronLeft size={24} />
             </button>
             <h1 className="text-xl font-black tracking-tight text-slate-800">Privacy Policy 隱私權政策</h1>
          </div>
          <div className="bg-[#34DA4F]/10 text-[#34DA4F] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
             v2.25.0 Verified
          </div>
        </header>

        <main className="p-6 md:p-10 flex flex-col gap-12">
          
          {/* Introduction */}
          <section className="space-y-4">
             <h2 className="text-3xl font-black text-slate-800 leading-tight">ZJ Card 禮物卡管家</h2>
             <p className="text-slate-500 font-medium leading-relaxed">
                ZJ Card is committed to protecting your privacy. This policy explains how we handle your Google User Data in compliance with the Google API Services User Data Policy.
                <br />
                ZJ Card 致力於保護您的隱私。本政策說明我們如何根據 Google API 服務使用者數據政策處理您的 Google 使用者資料。
             </p>
          </section>

          {/* 1. Data Accessed */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 text-blue-500">
                <Globe size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight">1. Data Accessed 資料存取</h3>
             </div>
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="space-y-2">
                   <p className="font-bold text-slate-700">English:</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      ZJ Card accesses your Google primary email address for identity verification and Google Drive storage (specifically the <code className="bg-white px-1">appDataFolder</code> and specific root files) to synchronize your data across devices.
                   </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-200/50">
                   <p className="font-bold text-slate-700">中文：</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      ZJ Card 存取您的 Google 主要電子郵件地址用於身分驗證，並存取 Google 雲端硬碟空間（包含隱藏的 <code className="bg-white px-1">appDataFolder</code> 與特定根目錄檔案）以實作跨裝置數據同步。
                   </p>
                </div>
             </div>
          </section>

          {/* 2. Data Usage */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 text-[#34DA4F]">
                <Database size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight">2. Data Usage 資料用途</h3>
             </div>
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="space-y-2">
                   <p className="font-bold text-slate-700">English:</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      We use your Google Drive data solely to store and retrieve an encrypted JSON file containing your gift cards and barcode information. All data processing occurs strictly on your local device. We do not use this data for any marketing or non-functional purposes.
                   </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-200/50">
                   <p className="font-bold text-slate-700">中文：</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      我們使用您的雲端硬碟資料僅用於儲存與讀取包含您禮物卡與條碼資訊的加密 JSON 檔案。所有資料處理均在您的本機裝置上進行。我們不會將此資料用於任何行銷或非關功能之用途。
                   </p>
                </div>
             </div>
          </section>

          {/* 3. Data Sharing */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 text-orange-500">
                <Share2 size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight">3. Data Sharing 資料分享</h3>
             </div>
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="space-y-2">
                   <p className="font-bold text-slate-700">English:</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      ZJ Card does NOT share your Google user data with any third parties. Your data remains entirely within your own Google Drive and your local browser storage.
                   </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-200/50">
                   <p className="font-bold text-slate-700">中文：</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      ZJ Card 絕不與任何第三方分享您的 Google 使用者資料。您的資料完全保留在您自己的 Google 雲端硬碟與本機瀏覽器儲存空間中。
                   </p>
                </div>
             </div>
          </section>

          {/* 4. Data Storage & Protection */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 text-purple-600">
                <Lock size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight">4. Storage & Protection 儲存與保護</h3>
             </div>
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="space-y-2">
                   <p className="font-bold text-slate-700">English:</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      All gift card data is encrypted using high-strength AES-256-GCM client-side encryption before being uploaded to Google Drive. The encryption key is derived locally; neither the developer nor Google can decrypt your content.
                   </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-200/50">
                   <p className="font-bold text-slate-700">中文：</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      所有禮物卡資料在上传至 Google 雲端硬碟前，皆已使用高強度的 AES-256-GCM 客戶端加密。加密密鑰於本機衍生；開發者與 Google 皆無法解密您的內容。
                   </p>
                </div>
             </div>
          </section>

          {/* 5. Data Retention & Deletion */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 text-red-500">
                <Trash2 size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight">5. Retention & Deletion 保留與刪除</h3>
             </div>
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="space-y-2">
                   <p className="font-bold text-slate-700">English:</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      Data is retained as long as it exists on your Google Drive. You can permanently delete all data by using the "Nuclear Reset" tool in the App settings or by manually deleting the sync files from your Google Drive. Deleted items in the app's trash are purged after 15 days.
                   </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-200/50">
                   <p className="font-bold text-slate-700">中文：</p>
                   <p className="text-sm text-slate-500 leading-relaxed">
                      資料將在您 Google 雲端硬碟上持續保留。您可以透過 App 設定中的「核彈級重設 (Nuclear Reset)」工具，或手動從雲端硬碟刪除同步檔來永久移除資料。App 內回收桶的項目將於 15 天後自動清除。
                   </p>
                </div>
             </div>
          </section>

          <footer className="pt-10 border-t border-slate-100 text-center">
             <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                Last Updated: 2026-04-16 • ZJ Card公益開發小組
             </p>
          </footer>

        </main>
      </div>
    </div>
  );
}
