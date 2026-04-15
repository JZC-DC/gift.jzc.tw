/**
 * Google Drive 備份工具（SGCM v2）
 * 備份檔案同樣存入 appDataFolder，使用者在 Drive UI 看不到。
 */

const BACKUP_FILENAME = "sgcm_backup_2026.enc";

export async function findBackupFile(token: string) {
  const q = `name = '${BACKUP_FILENAME}' and trashed = false`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=appDataFolder`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to find backup file: ${response.status}`);
  }
  const data = await response.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

export async function uploadBackup(token: string, content: any, fileId?: string) {
  const metadata: Record<string, unknown> = {
    name: BACKUP_FILENAME,
    mimeType: "text/plain",
  };

  // 新建時才需要指定 parent
  if (!fileId) {
    metadata.parents = ["appDataFolder"];
  }

  const body = new FormData();
  body.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  body.append(
    "file",
    new Blob([JSON.stringify(content)], { type: "text/plain" })
  );

  let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  let method = "POST";

  if (fileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    method = "PATCH";
  }

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  return await response.json();
}

export async function downloadBackup(token: string, fileId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) return null;
  return await response.json();
}
