import { encryptDB, decryptDB } from "./crypto";

const DB_FILENAME = "zc-card 請勿刪除·此為禮物卡檔案.json";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

export interface DriveCard {
  id: string;
  merchant: string;
  name: string;
  barcode: string;
  secondaryBarcode: string | null;
  amount: number;
  createdAt: number;
  deletedAt: number | null;
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
 * 在 Drive 根目錄中搜尋或建立資料檔案
 */
export async function getOrCreateDriveFile(
  token: string,
  uid: string
): Promise<string> {
  const q = `name='${DB_FILENAME}' and trashed=false`;
  const searchRes = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!searchRes.ok) throw new Error(`Drive search failed: ${searchRes.status}`);
  const searchData = await searchRes.json();

  if (searchData.files?.length > 0) {
    return searchData.files[0].id;
  }

  // 找不到檔案，建立全新資料庫
  return createNewDriveFile(token, uid, emptyDB());
}

/**
 * 單一檔案建立
 */
async function createNewDriveFile(token: string, uid: string, db: DriveDB): Promise<string> {
  const encryptedContent = await encryptDB(db, uid);
  const metadata = {
    name: DB_FILENAME,
    mimeType: "text/plain",
    parents: ["root"],
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([encryptedContent], { type: "text/plain" }));

  const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
  const created = await res.json();
  return created.id;
}

/**
 * 從指定 ID 讀取並解密資料庫
 */
export async function readDriveDB(
  token: string,
  fileId: string,
  uid: string
): Promise<{ db: DriveDB; etag: string }> {
  const res = await fetch(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Cloud Read Failed: HTTP ${res.status}`);
  }

  let cloudEtag = res.headers.get("ETag") || res.headers.get("etag") || "";
  cloudEtag = cloudEtag.replace(/^W\//, "").replace(/"/g, "");

  if (!cloudEtag) {
    const metaRes = await fetch(
      `${DRIVE_API}/files/${fileId}?fields=etag`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      cloudEtag = meta.etag?.replace(/"/g, "") || "";
    }
  }

  const ciphertext = await res.text();

  if (ciphertext.trimStart().startsWith("{")) {
    return { db: JSON.parse(ciphertext) as DriveDB, etag: cloudEtag };
  }

  try {
    const db = await decryptDB(ciphertext, uid);
    return { db, etag: cloudEtag };
  } catch (error) {
    console.error(`[Drive] Decryption failed for ${fileId}:`, error);
    throw new Error("DECRYPTION_FAILED");
  }
}

/**
 * 加密並寫入單個檔案 (支援 ETag 衝突保護)
 */
export async function writeDriveDB(
  token: string,
  fileId: string,
  db: DriveDB,
  uid: string,
  etag?: string
): Promise<string> {
  const encryptedContent = await encryptDB(
    { ...db, lastModified: Date.now() },
    uid
  );

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain",
  };

  if (etag) {
    headers["If-Match"] = etag;
  }

  const res = await fetch(
    `${UPLOAD_API}/files/${fileId}?uploadType=media&fields=etag`,
    {
      method: "PATCH",
      headers,
      body: encryptedContent,
    }
  );

  if (res.status === 412) {
    throw new Error("SYNC_CONFLICT");
  }

  if (!res.ok) throw new Error(`Drive write failed: ${res.status}`);
  
  const data = await res.json();
  return data.etag?.replace(/"/g, "") || "";
}

/**
 * 垃圾桶大掃除
 */
export function cleanupTrash(db: DriveDB) {
  const now = Date.now();
  const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;

  const originalCount = db.cards.length;
  db.cards = db.cards.filter((card) => {
    if (card.deletedAt && card.deletedAt < fifteenDaysAgo) {
      return false;
    }
    return true;
  });

  return { db, changed: db.cards.length !== originalCount };
}
