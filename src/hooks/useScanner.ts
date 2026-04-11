"use client";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useState, useCallback, useRef, useEffect } from "react";

export type ScanState = "idle" | "scanning-a" | "scanning-b" | "success" | "error" | "duplicate";

interface BarcodeData {
  primary: string | null;
  secondary: string | null;
}

export function useScanner(elementId: string) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [data, setData] = useState<BarcodeData>({ primary: null, secondary: null });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDualMode, setIsDualMode] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const dataRef = useRef<BarcodeData>({ primary: null, secondary: null });

  // 震動回饋輔助函式
  const triggerVibrate = (pattern: number | number[]) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const stopScanning = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("終止掃描失敗", err);
      }
    }
    setScanState("idle");
  }, []);

  const startScanning = useCallback(async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await stopScanning();
      }

      setErrorMsg(null);
      setScanState("scanning-a");
      dataRef.current = { primary: null, secondary: null };
      setData({ primary: null, secondary: null });

      const html5Qrcode = new Html5Qrcode(elementId);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" }, 
        {
          fps: 20, // 提升至每秒 20 幀
          qrbox: (viewfinderWidth, viewfinderHeight) => {
             // 動態計算掃描框，更適合長條形狀
             return { width: Math.min(viewfinderWidth * 0.8, 320), height: 120 };
          },
          aspectRatio: 1.77777778, // 16:9 比例，適合水平條碼
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ]
        },
        (decodedText) => {
          const currentData = dataRef.current;
          
          if (!currentData.primary) {
            // 掃到第一個條碼 (A)
            triggerVibrate(60); 
            currentData.primary = decodedText;
            setData({ ...currentData });

            if (!isDualMode) {
              // 單條碼模式：直接成功
              setScanState("success");
              stopScanning();
            } else {
              // 雙條碼模式：進入 B 階段
              setScanState("scanning-b");
              html5Qrcode.pause();
              setTimeout(() => {
                if (scannerRef.current && scannerRef.current.isScanning) {
                  scannerRef.current.resume();
                }
              }, 1200);
            }
          } else if (isDualMode && !currentData.secondary) {
            if (decodedText === currentData.primary) {
              // 掃到重複條碼：顯示警告但不中斷
              setScanState("duplicate");
              triggerVibrate([50, 50, 50]);
              setTimeout(() => {
                if (dataRef.current.secondary) return;
                setScanState("scanning-b");
              }, 1500);
            } else {
              // 掃到第二個不同條碼 (B)
              triggerVibrate([100, 50, 100]);
              currentData.secondary = decodedText;
              setData({ ...currentData });
              setScanState("success");
              stopScanning();
            }
          }
        },
        () => {}
      );
    } catch (err: any) {
      setErrorMsg(err?.message || "相機啟動異常");
      setScanState("error");
    }
  }, [elementId, stopScanning, isDualMode]);

  const skipSecondary = useCallback(() => {
    if (dataRef.current.primary) {
      setScanState("success");
      stopScanning();
    }
  }, [stopScanning]);

  useEffect(() => {
    return () => { stopScanning(); };
  }, [stopScanning]);

  return {
    scanState,
    data,
    errorMsg,
    isDualMode,
    setIsDualMode,
    startScanning,
    stopScanning,
    skipSecondary
  };
}
