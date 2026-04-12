/**
 * Google Sheets API Helper for SGCM-Sync
 * Version: 1.3.0
 */

const DB_FILENAME = "智慧商品卡資料庫 (SGCM-Sync)";
const SHEET_RANGE = "Sheet1!A:G"; // ID, Merchant, Amount, Barcode, SecondaryBarcode, CreatedAt, DeletedAt

export interface SheetRow {
  id: string;
  merchant: string;
  amount: number;
  barcode: string;
  secondaryBarcode: string | null;
  createdAt: number;
  deletedAt: number | null;
}

/**
 * 尋找或建立雲端資料庫試算表
 */
export async function getOrCreateDatabaseSheet(token: string): Promise<string> {
  // 1. 先用 Drive API 搜尋是否有同名試算表
  const q = `name = '${DB_FILENAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  if (!searchRes.ok) throw new Error("Failed to search Drive");
  const searchData = await searchRes.json();
  
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. 若沒找到，建立一個新的並寫入標題列
  const createRes = await fetch(
    "https://sheets.googleapis.com/v4/spreadsheets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { title: DB_FILENAME },
      }),
    }
  );

  if (!createRes.ok) throw new Error("Failed to create Spreadsheet");
  const sheet = await createRes.json();
  const spreadsheetId = sheet.spreadsheetId;

  // 3. 寫入標題列 (Headers)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G1?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [["ID", "Merchant", "Amount", "Barcode", "SecondaryBarcode", "CreatedAt", "DeletedAt"]],
      }),
    }
  );

  return spreadsheetId;
}

/**
 * 讀取所有卡片資料
 */
export async function fetchCardsFromSheet(token: string, spreadsheetId: string): Promise<SheetRow[]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:G`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return [];
  const data = await res.json();
  if (!data.values) return [];

  return data.values.map((row: any[]) => ({
    id: row[0] || "",
    merchant: row[1] || "",
    amount: Number(row[2]) || 0,
    barcode: row[3] || "",
    secondaryBarcode: row[4] || null,
    createdAt: Number(row[5]) || 0,
    deletedAt: row[6] ? Number(row[6]) : null,
  }));
}

/**
 * 即時添加或更新卡片 (Upsert)
 * 為了效率，我們會先抓取全量資料比對 ID 是否存在，若存在則更新，不存在則 Append
 */
export async function syncCardToSheet(token: string, spreadsheetId: string, card: SheetRow) {
  // 1. 抓取全量資料以確認位置 (Row Index)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Sync failed: Cannot read Rows");
  const data = await res.json();
  const rows = data.values || [];
  
  const rowIndex = rows.findIndex((r: any[]) => r[0] === card.id);
  const rowData = [[
    card.id, 
    card.merchant, 
    card.amount, 
    card.barcode, 
    card.secondaryBarcode || "", 
    card.createdAt, 
    card.deletedAt || ""
  ]];

  if (rowIndex !== -1) {
    // 2a. 更新現有列 (1-indexed, A2 is row 1)
    const range = `Sheet1!A${rowIndex + 1}:G${rowIndex + 1}`;
    await fetch(
       `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
       {
         method: "PUT",
         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
         body: JSON.stringify({ values: rowData })
       }
    );
  } else {
    // 2b. 新增列
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:G:append?valueInputOption=RAW`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: rowData })
      }
    );
  }
}

/**
 * 垃圾桶大掃除：永久刪除超過 15 天的卡片
 */
export async function cleanupTrashInSheet(token: string, spreadsheetId: string) {
  const cards = await fetchCardsFromSheet(token, spreadsheetId);
  const now = Date.now();
  const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;
  
  const remainingCards = cards.filter(c => {
    if (c.deletedAt && (now - c.deletedAt) > FIFTEEN_DAYS) {
      return false; // 該刪除，不保留
    }
    return true;
  });

  if (remainingCards.length !== cards.length) {
    // 重新寫入全量資料 (含標題)
    const values = [
      ["ID", "Merchant", "Amount", "Barcode", "SecondaryBarcode", "CreatedAt", "DeletedAt"],
      ...remainingCards.map(c => [c.id, c.merchant, c.amount, c.barcode, c.secondaryBarcode || "", c.createdAt, c.deletedAt || ""])
    ];

    // 全量覆蓋 Sheet1
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values })
      }
    );
    
    return remainingCards;
  }
  
  return null;
}
