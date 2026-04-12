"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { readBarcodesFromImageData, ZXingReadOptions } from "zxing-wasm/reader";

export type ScanState = "idle" | "scanning-a" | "scanning-b" | "success" | "error" | "duplicate" | "loading";

interface BarcodeData {
  primary: string | null;
  secondary: string | null;
}

export function useScanner(videoElementId: string) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [data, setData] = useState<BarcodeData>({ primary: null, secondary: null });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDualMode, setIsDualMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataRef = useRef<BarcodeData>({ primary: null, secondary: null });
  const isInitializing = useRef(false);
  const isMounted = useRef(true);
  const isProcessing = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const triggerVibrate = (pattern: number | number[]) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const stopScanning = useCallback(async () => {
    isProcessing.current = false;
    
    // 取消動畫循環
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 停止相機流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (isMounted.current) setScanState("idle");
  }, []);

  const resetData = useCallback(() => {
    dataRef.current = { primary: null, secondary: null };
    setData({ primary: null, secondary: null });
    setScanState("scanning-a");
    isProcessing.current = false;
  }, []);

  // 核心辨識循環
  const scanLoop = useCallback(async () => {
    if (!isMounted.current || scanState === "idle" || scanState === "success") return;
    if (isProcessing.current) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      
      if (ctx) {
        // 設定 Canvas 大小 (優化：縮放至偵測窗口比例以提升性能)
        const dWidth = video.videoWidth;
        const dHeight = video.videoHeight;
        
        // 為了極速，我們只取中央區域 (對比 qrbox)
        // 假設 qrbox 是居中的 320x160 (比例在 video 中需換算)
        canvas.width = dWidth;
        canvas.height = dHeight;
        ctx.drawImage(video, 0, 0, dWidth, dHeight);
        
        try {
          const imageData = ctx.getImageData(0, 0, dWidth, dHeight);
          const options: ZXingReadOptions = {
            formats: ["Code128"],
            tryHarder: true, // v1.7.1 WASM 特色：增加暴力破解深度以提升成功率
          };

          const results = await readBarcodesFromImageData(imageData, options);
          
          if (results.length > 0 && isMounted.current && !isProcessing.current) {
            const decodedText = results[0].text;
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
          }
        } catch (e) {
          // 忽略解碼失敗，進入下一幀
        }
      }
    }
    
    // 控制掃描頻率 (約 100ms 一次，避免效能暴走)
    setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    }, 80); 
  }, [scanState, isDualMode]);

  const startScanning = useCallback(async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    
    try {
      if (!isMounted.current) return;
      await stopScanning();

      setErrorMsg(null);
      setScanState("loading");
      isProcessing.current = false;
      dataRef.current = { primary: null, secondary: null };
      setData({ primary: null, secondary: null });

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          // 請求持續對焦
          advanced: [{ focusMode: "continuous" }] as any
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      const video = document.getElementById(videoElementId) as HTMLVideoElement;
      if (video) {
        videoRef.current = video;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();
        
        setScanState("scanning-a");
        animationFrameRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      console.error("WASM Scanner startup failed:", err);
      if (isMounted.current) {
        setErrorMsg("無法啟動相機");
        setScanState("error");
      }
    } finally {
      isInitializing.current = false;
    }
  }, [videoElementId, stopScanning, scanLoop]);

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
