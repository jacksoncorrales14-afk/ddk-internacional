"use client";

import { useState, useRef, useEffect } from "react";

interface QRScannerProps {
  onScan: (code: string, puesto: string) => void;
  onError: (msg: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);
  const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");

    scannerTimeoutRef.current = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            let puesto = "";
            try {
              const decoded = JSON.parse(atob(decodedText));
              puesto = decoded.puesto || "";
            } catch {
              // ignore
            }
            onScan(decodedText, puesto);
            stopScanner();
          },
          () => {}
        );
      } catch {
        onError("No se pudo acceder a la camara. Verifica los permisos.");
        setScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current = null;
      }
    } catch {
      // Ignorar errores al detener
    }
    setScanning(false);
  };

  if (scanning) {
    return (
      <div>
        <div id="qr-reader" ref={scannerRef} className="mx-auto mb-3 overflow-hidden rounded-lg" style={{ maxWidth: 350 }} />
        <button onClick={stopScanner} className="btn-secondary w-full text-sm">
          Cancelar escaneo
        </button>
      </div>
    );
  }

  return (
    <button onClick={startScanner} className="btn-accent w-full flex items-center justify-center gap-2">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
      Escanear QR del Puesto
    </button>
  );
}
