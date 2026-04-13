"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
}

export default function BarcodeScanner({ onScanSuccess }: Props) {
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Only initialize if it doesn't exist
    if (!qrCodeRef.current) {
      qrCodeRef.current = new Html5Qrcode("qr-reader");
    }

    const startScanner = async () => {
      try {
        await qrCodeRef.current?.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {} // Ignore failures during scan for less noise
        );
      } catch (err) {
        console.error("Camera start failed:", err);
      }
    };

    startScanner();

    return () => {
      const stopScanner = async () => {
        if (qrCodeRef.current?.isScanning) {
          try {
            await qrCodeRef.current.stop();
          } catch (err) {
            console.error("Scanner stop failed:", err);
          }
        }
      };
      stopScanner();
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-3xl border-4 border-slate-900 shadow-2xl bg-white aspect-square flex items-center justify-center">
      <div id="qr-reader" className="w-full" />
    </div>
  );
}
