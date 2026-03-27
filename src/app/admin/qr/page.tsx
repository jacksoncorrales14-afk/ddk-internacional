"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PUESTOS } from "@/types/models";

export default function QRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [qrData, setQrData] = useState<{ puesto: string; qrDataUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (session?.user?.role !== "admin") return null;

  const generarQR = async (puesto: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/qr?puesto=${encodeURIComponent(puesto)}`);
    const data = await res.json();
    setQrData(data);
    setLoading(false);
  };

  const descargarQR = () => {
    if (!qrData) return;
    const link = document.createElement("a");
    link.download = `QR-${qrData.puesto}.png`;
    link.href = qrData.qrDataUrl;
    link.click();
  };

  const imprimirQR = () => {
    if (!qrData) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html>
          <head><title>QR - ${qrData.puesto}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,sans-serif;">
            <h2 style="color:#102a43;">DDK Internacional</h2>
            <h3>${qrData.puesto}</h3>
            <img src="${qrData.qrDataUrl}" style="width:300px;height:300px;" />
            <p style="color:#666;margin-top:20px;">Escanee este codigo para marcar entrada/salida</p>
          </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Codigos QR por Puesto</h1>
        <p className="text-sm text-gray-500">Genera e imprime los codigos QR para cada puesto. Los trabajadores deben escanearlos para marcar entrada y salida.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PUESTOS.map((puesto) => (
          <button
            key={puesto}
            onClick={() => generarQR(puesto)}
            disabled={loading}
            className={`card text-left transition-all hover:border-primary-300 ${
              qrData?.puesto === puesto ? "border-primary-500 ring-2 ring-primary-200" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">{puesto}</span>
            </div>
          </button>
        ))}
      </div>

      {qrData && (
        <div className="mt-8 card text-center">
          <h2 className="mb-2 text-xl font-bold text-gray-900">{qrData.puesto}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrData.qrDataUrl} alt={`QR ${qrData.puesto}`} className="mx-auto mb-4" style={{ width: 300, height: 300 }} />
          <div className="flex justify-center gap-3">
            <button onClick={descargarQR} className="btn-primary">
              Descargar QR
            </button>
            <button onClick={imprimirQR} className="btn-secondary">
              Imprimir QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
