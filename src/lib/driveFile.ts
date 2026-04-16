import { encryptDB, decryptDB } from "./crypto";

const VISIBLE_FILENAME = "zj-card-sync.json";
const OLD_VISIBLE_FILENAME = "zc-card 請勿刪除·此為禮物卡檔案.json";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

export type DriveCardStatus = "Active" | "Trashed" | "Empty";

export interface DriveCard {
  id: string;
  merchant: string;
  name: string;
  barcode: string;
  secondaryBarcode: string | null;
  amount: number;
  createdAt: number;
  deletedAt: number | null;
  status: DriveCardStatus;
}

export interface DriveDB {
  version: number;
  lastModified: number;
  cards: DriveCard[];
  customMerchants: string[];
}

const emptyDB = (): DriveDB => ({
  version: 1,
  lastModified: Date.now(),
  cards: [],
  customMerchants: [],
});

/**
 * 搜尋或建立資料檔案 (v2.17.0 絕對校驗版)
 * 策略：搜尋所有同名檔案，並選取「最後修改時間」最新的一個，解決多設備衝突。
 */
export async function getOrCreateDriveFile(
  token: string, 
  uid: string
): Promise<string> {
  const q = `name='${VISIBLE_FILENAME}' and trashed=false`;
  
  let attempts = 0;
  while (attempts < 2) {
    // 請求 id 與 modifiedTime
    const res = await fetch(
      `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,modifiedTime)&spaces=drive&t=${Date.now()}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Search failed`);
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      // v2.17.0: 按修改時間降序排列，取第一個（最新）
      const sorted = data.files.sort((a: any, b: any) => 
        new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      );
      console.log(`[Drive] 偵測到 ${sorted.length} 個同步檔，已鎖定最新版本：${sorted[0].id}`);
      return sorted[0].id;
    }

    attempts++;
    if (attempts < 2) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 建立新檔案
  const encrypted = await encryptDB(emptyDB(), uid);
  const metadata = { 
    name: VISIBLE_FILENAME, 
    mimeType: "text/plain",
    parents: ['root'] 
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([encrypted], { type: "text/plain" }));

  const createRes = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!createRes.ok) throw new Error(`Create failed`);
  const created = await createRes.json();
  return created.id;
}

/**
 * 讀取資料庫
 */
export async function readDriveDB(
  token: string,
  fileId: string,
  uid: string
): Promise<{ db: DriveDB }> {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media&t=${Date.now()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Read failed: ${res.status}`);

  const ciphertext = await res.text();

  if (ciphertext.trimStart().startsWith("{")) {
    return { db: JSON.parse(ciphertext) as DriveDB };
  }
  return { db: await decryptDB(ciphertext, uid) };
}

/**
 * 寫入資料庫
 */
export async function writeDriveDB(
  token: string,
  fileId: string,
  db: DriveDB,
  uid: string
): Promise<void> {
  const encrypted = await encryptDB({ ...db, lastModified: Date.now() }, uid);
  const res = await fetch(`${UPLOAD_API}/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: encrypted,
  });
  if (!res.ok) {
    throw new Error(`Write failed: ${res.status}`);
  }
}

/**
 * 舊檔遷移
 */
export async function migrateOldVisibleFile(token: string): Promise<void> {
  try {
    const q = `name='${OLD_VISIBLE_FILENAME}' and trashed=false`;
    const res = await fetch(
      `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive&t=${Date.now()}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.files?.length > 0) {
      const oldFileId = data.files[0].id;
      await fetch(`${DRIVE_API}/files/${oldFileId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: VISIBLE_FILENAME }),
      });
    }
  } catch {}
}

export function cleanupTrash(db: DriveDB): { db: DriveDB; changed: boolean } {
  const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
  const before = db.cards.length;
  db.cards = db.cards.filter((c) => !c.deletedAt || c.deletedAt >= fifteenDaysAgo);
  return { db, changed: db.cards.length !== before };
}
