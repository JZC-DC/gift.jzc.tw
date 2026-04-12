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
  const isInitializing = useRef(false);
  const isMounted = useRef(true);
  const isProcessing = useRef(false);

  const triggerVibrate = (pattern: number | number[]) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const stopScanning = useCallback(async () => {
    isProcessing.current = false;
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        const container = document.getElementById(elementId);
        if (container) container.innerHTML = ""; 
      } catch (err) {
        // Quiet fail
      }
      scannerRef.current = null;
    }
    if (isMounted.current) setScanState("idle");
  }, [elementId]);

  const resetData = useCallback(() => {
    dataRef.current = { primary: null, secondary: null };
    setData({ primary: null, secondary: null });
    setScanState("scanning-a");
    isProcessing.current = false;
  }, []);

  const startScanning = useCallback(async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    
    // 短暫延遲確保 DOM 渲染與前次清理完成
    setTimeout(async () => {
      try {
        if (!isMounted.current) return;
        if (scannerRef.current) await stopScanning();

        setErrorMsg(null);
        setScanState("scanning-a");
        isProcessing.current = false;
        dataRef.current = { primary: null, secondary: null };
        setData({ primary: null, secondary: null });

        // v1.7.2 回歸高度穩定的 html5-qrcode 模式
        const html5Qrcode = new Html5Qrcode(elementId, {
          formatsToSupport: [ Html5QrcodeSupportedFormats.CODE_128 ],
          verbose: false
        });
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" }, 
          {
            fps: 30, // 降低 FPS 以換取手機瀏覽器上的高度穩定性與省電
            qrbox: { width: 320, height: 160 },
            aspectRatio: 1.77777778,
            disableFlip: true,
            rememberLastUsedCamera: true,
          },
          (decodedText) => {
            if (isProcessing.current || !isMounted.current) return;

            const currentData = dataRef.current;
            
            // 處理第一段條碼 (卡號)
            if (!currentData.primary) {
              if (decodedText.length === 16 || !decodedText.match(/^\d+$/)) {
                 triggerVibrate(60); 
                 currentData.primary = decodedText;
                 setData({ ...currentData });

                 if (!isDualMode) {
                   isProcessing.current = true;
                   setScanState("success");
                 } else {
                   setScanState("scanning-b");
                   isProcessing.current = true;
                   // 給予一段緩衝時間避免立即重複偵測同一個條碼
                   setTimeout(() => { if (isMounted.current) isProcessing.current = false; }, 1200);
                 }
              }
            } 
            // 處理第二段條碼 (密碼/序號)
            else if (isDualMode && !currentData.secondary) {
              if (decodedText === currentData.primary) {
                isProcessing.current = true;
                setScanState("duplicate");
                triggerVibrate([50, 50, 50]);
                setTimeout(() => {
                  if (dataRef.current.secondary) return;
                  if (isMounted.current) {
                    setScanState("scanning-b");
                    isProcessing.current = false;
                  }
                }, 1800);
              } else {
                triggerVibrate([100, 50, 100]);
                currentData.secondary = decodedText;
                setData({ ...currentData });
                isProcessing.current = true;
                setScanState("success");
              }
            }
          },
          () => {} 
        );
      } catch (err: any) {
        console.error("Stable Scanner startup failed:", err);
        if (isMounted.current) {
          setErrorMsg("無法連結相機");
          setScanState("error");
        }
      } finally {
        isInitializing.current = false;
      }
    }, 400); 
  }, [elementId, stopScanning, isDualMode]);

  const skipSecondary = useCallback(() => {
    if (dataRef.current.primary) {
      isProcessing.current = true;
      setScanState("success");
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
      stopScanning(); 
    };
  }, [stopScanning]);

  return {
    scanState,
    data,
    errorMsg,
    isDualMode,
    setIsDualMode,
    startScanning,
    stopScanning,
    resetData,
    skipSecondary
  };
}
