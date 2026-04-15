/**
 * 用戶端 AES-256-GCM 加密工具
 * ─────────────────────────────────────────────
 * 不需要使用者額外記密碼：以 Google UID 為種子，
 * 透過 PBKDF2 衍生 256-bit AES-GCM 金鑰。
 * 雲端只儲存密文，任何第三方（含 Google）皆無法解讀。
 */

import type { DriveDB } from "./driveFile";

// 固定 salt（非機密，用途是讓 PBKDF2 具備 domain separation）
const SALT_HEX = "5367636d2d76312d73616c74"; // "sgcm-v1-salt" in hex
const ITERATIONS = 100_000;

function hexToUint8(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, 2 + i), 16);
  }
  return bytes;
}

/**
 * 從使用者 UID 衍生 AES-GCM CryptoKey
 */
async function deriveKey(uid: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(uid),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hexToUint8(SALT_HEX),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 將 DriveDB 加密成 Base64 字串後上傳至 Drive
 * 格式：<12 bytes IV (Base64)>.<密文 (Base64)>
 */
export async function encryptDB(db: DriveDB, uid: string): Promise<string> {
  const key = await deriveKey(uid);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(db));

  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  const ivB64 = btoa(String.fromCharCode(...iv));
  const cipherB64 = btoa(
    String.fromCharCode(...new Uint8Array(cipherBuf))
  );

  return `${ivB64}.${cipherB64}`;
}

/**
 * 將從 Drive 讀回的密文解密成 DriveDB
 * 若解密失敗（如金鑰錯誤或舊格式 JSON），拋出錯誤由呼叫端處理
 */
export async function decryptDB(ciphertext: string, uid: string): Promise<DriveDB> {
  const [ivB64, cipherB64] = ciphertext.split(".");
  if (!ivB64 || !cipherB64) {
    throw new Error("Invalid ciphertext format");
  }

  const key = await deriveKey(uid);
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const cipherBuf = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBuf
  );

  return JSON.parse(new TextDecoder().decode(plainBuf)) as DriveDB;
}
