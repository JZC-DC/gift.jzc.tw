/**
 * Google Drive JSON File Storage for SGCM
 * 替換 Google Sheets，使用單一 JSON 檔案作為資料庫
 * 每次寫入只需 1 次 API 呼叫（原子覆寫），大幅提升穩定性
 */

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
 * 在 Drive 中搜尋或建立 sgcm-data.json 並回傳其 fileId
 */
export async function getOrCreateDriveFile(token: string): Promise<string> {
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

  // 建立新的 JSON 檔案
  const content = JSON.stringify(emptyDB(), null, 2);
  const metadata = { name: DB_FILENAME, mimeType: "application/json" };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([content], { type: "application/json" }));

  const createRes = await fetch(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  if (!createRes.ok) throw new Error(`Drive create failed: ${createRes.status}`);
  const created = await createRes.json();
  return created.id;
}

/**
 * 從 Drive 讀取完整資料庫（1 次 API 呼叫）
 */
export async function readDriveDB(token: string, fileId: string): Promise<DriveDB> {
  const res = await fetch(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Drive read failed: ${res.status}`);

  try {
    return await res.json();
  } catch {
    // 若檔案損毀則回傳空資料庫
    return emptyDB();
  }
}

/**
 * 將完整資料庫寫入 Drive（1 次原子 API 呼叫，覆蓋寫入）
 */
export async function writeDriveDB(token: string, fileId: string, db: DriveDB): Promise<void> {
  const content = JSON.stringify({ ...db, lastModified: Date.now() }, null, 2);

  const res = await fetch(
    `${UPLOAD_API}/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: content,
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
    c => !(c.deletedAt && now - c.deletedAt > FIFTEEN_DAYS)
  );
  return {
    db: { ...db, cards: filtered },
    changed: filtered.length !== db.cards.length,
  };
}
