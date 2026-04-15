/**
 * Google Drive JSON File Storage for SGCM
 * ─────────────────────────────────────────────
 * v2：改用 appDataFolder（使用者在 Drive UI 看不到、無法直接刪除）
 *      + AES-256-GCM 加密（以 Google UID 為金鑰種子）
 *
 * 每次寫入只需 1 次 API 呼叫（原子覆寫），大幅提升穩定性。
 */

import { encryptDB, decryptDB } from "./crypto";

const DB_FILENAME = "sgcm-data.json";
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
 * 在 Drive appDataFolder 中搜尋或建立 sgcm-data.json，回傳其 fileId
 * appDataFolder 為隱藏空間：使用者在 Drive UI 完全看不到，無法手動刪除
 */
export async function getOrCreateDriveFile(
  token: string,
  uid: string
): Promise<string> {
  // 只搜尋 appDataFolder 空間
  const q = `name='${DB_FILENAME}' and trashed=false`;
  const searchRes = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=appDataFolder`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!searchRes.ok) throw new Error(`Drive search failed: ${searchRes.status}`);
  const searchData = await searchRes.json();

  if (searchData.files?.length > 0) {
    return searchData.files[0].id;
  }

  // --- 搬家邏輯 (Migration): 若隱藏空間找不到，去根目錄找找看有沒有舊檔案 ---
  const qRoot = `name='${DB_FILENAME}' and trashed=false`;
  const rootSearchRes = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(qRoot)}&fields=files(id)&spaces=drive`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (rootSearchRes.ok) {
    const rootSearchData = await rootSearchRes.json();
    if (rootSearchData.files?.length > 0) {
      const oldFileId = rootSearchData.files[0].id;
      console.log("[Drive Migration] 發現根目錄舊檔案，準備搬家至 appDataFolder...");

      try {
        // 1. 讀取舊檔案內容 (相容明文或加密)
        const oldDB = await readDriveDB(token, oldFileId, uid);

        // 2. 在 appDataFolder 建立新的加密檔案
        const newFileId = await createNewDriveFile(token, uid, oldDB);

        // 3. 將根目錄的舊檔案移至垃圾桶（避免重複搬家）
        await fetch(`${DRIVE_API}/files/${oldFileId}`, {
          method: "DELETE", // 或者使用 PATCH trashed=true
          headers: { Authorization: `Bearer ${token}` }
        }).catch(e => console.warn("[Drive Migration] 刪除舊檔案失敗 (非致命):", e));

        console.log("[Drive Migration] 搬家成功！新 ID:", newFileId);
        return newFileId;
      } catch (error) {
        console.error("[Drive Migration] 搬家失敗，將建立全新資料庫:", error);
      }
    }
  }

  // 找不到任何檔案，建立全新的 JSON 檔案
  return createNewDriveFile(token, uid, emptyDB());
}

/**
 * 內部輔助函式：在 appDataFolder 建立加密檔案
 */
async function createNewDriveFile(token: string, uid: string, db: DriveDB): Promise<string> {
  const encryptedContent = await encryptDB(db, uid);
  const metadata = {
    name: DB_FILENAME,
    mimeType: "text/plain",
    parents: ["appDataFolder"],
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
 * 從 Drive 讀取並解密完整資料庫（1 次 API 呼叫）
 */
export async function readDriveDB(
  token: string,
  fileId: string,
  uid: string
): Promise<DriveDB> {
  const res = await fetch(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Drive read failed: ${res.status}`);

  try {
    const ciphertext = await res.text();

    // 相容性處理：若是舊格式（明文 JSON），直接解析後回傳
    if (ciphertext.trimStart().startsWith("{")) {
      console.warn("[Drive] 偵測到未加密的舊格式資料，將在下次寫入時自動升級為加密版本");
      return JSON.parse(ciphertext) as DriveDB;
    }

    return await decryptDB(ciphertext, uid);
  } catch {
    // 若檔案損毀則回傳空資料庫
    console.error("[Drive] 解密失敗，回傳空資料庫");
    return emptyDB();
  }
}

/**
 * 加密後寫入 Drive（1 次原子 API 呼叫，覆蓋寫入）
 */
export async function writeDriveDB(
  token: string,
  fileId: string,
  db: DriveDB,
  uid: string
): Promise<void> {
  const encryptedContent = await encryptDB(
    { ...db, lastModified: Date.now() },
    uid
  );

  const res = await fetch(
    `${UPLOAD_API}/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: encryptedContent,
    }
  );

  if (!res.ok) throw new Error(`Drive write failed: ${res.status}`);
}

/**
 * 清除垃圾桶中超過 15 天的卡片（本地操作，不需 API）
 */
export function cleanupTrash(db: DriveDB): { db: DriveDB; changed: boolean } {
  const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const filtered = db.cards.filter(
    (c) => !(c.deletedAt && now - c.deletedAt > FIFTEEN_DAYS)
  );
  return {
    db: { ...db, cards: filtered },
    changed: filtered.length !== db.cards.length,
  };
}
