"use client";

import { useState, useRef, useEffect } from "react";
import { UBICACIONES } from "@/types/models";

interface Escaneo {
  id: string;
  fecha: string;
  puntoRuta: { nombre: string; orden: number };
}

interface RondaData {
  id: string;
  fecha: string;
  ubicacion: string;
  completada: boolean;
  totalPuntos: number;
  observaciones: string | null;
  novedades: string | null;
  escaneos: Escaneo[];
}

interface RondaSectionProps {
  rondas: RondaData[];
  loading: boolean;
  onSuccess: (msg: string) => void;
  onRefresh: () => void;
}

export default function RondaSection({ rondas, loading, onSuccess, onRefresh }: RondaSectionProps) {
  const [rondaActiva, setRondaActiva] = useState<RondaData | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ubicacion, setUbicacion] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [novedades, setNovedades] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopScanner();
    };
  }, []);

  const iniciarRonda = async () => {
    if (!ubicacion) return;
    setIniciando(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/rondas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ubicacion }),
      });
      const data = await res.json();
      if (res.ok) {
        setRondaActiva({ ...data, escaneos: [] });
        onRefresh();
      } else {
        setErrorMsg(data.error);
      }
    } catch {
      setErrorMsg("Error de conexion");
    }
    setIniciando(false);
  };

  const startScanner = async () => {
    setScanning(true);
    setErrorMsg("");
    const { Html5Qrcode } = await import("html5-qrcode");

    timeoutRef.current = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-ronda-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            await stopScanner();
            await registrarEscaneo(decodedText);
          },
          () => {}
        );
      } catch {
        setErrorMsg("No se pudo acceder a la camara");
        setScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
        scannerRef.current = null;
      }
    } catch { /* ignore */ }
    setScanning(false);
  };

  const registrarEscaneo = async (codigoQR: string) => {
    if (!rondaActiva) return;
    setErrorMsg("");
    try {
      const res = await fetch(`/api/rondas/${rondaActiva.id}/escanear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoQR }),
      });
      const data = await res.json();
      if (res.ok) {
        setRondaActiva((prev) => prev ? {
          ...prev,
          escaneos: [...prev.escaneos, data.escaneo],
          completada: data.completada,
        } : null);
        onSuccess(`Punto "${data.escaneo.puntoRuta.nombre}" escaneado (${data.puntosEscaneados}/${data.totalPuntos})`);
        onRefresh();
      } else {
        setErrorMsg(data.error);
      }
    } catch {
      setErrorMsg("Error al registrar escaneo");
    }
  };

  const finalizarRonda = async () => {
    if (!rondaActiva) return;
    await fetch(`/api/rondas/${rondaActiva.id}/finalizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observaciones, novedades }),
    });
    setRondaActiva(null);
    setObservaciones("");
    setNovedades("");
    setUbicacion("");
    onSuccess("Ronda finalizada correctamente");
    onRefresh();
  };

  const progreso = rondaActiva ? (rondaActiva.escaneos.length / rondaActiva.totalPuntos) * 100 : 0;

  return (
    <div className="card mb-8">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Rondas</h2>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>
      )}

      {!rondaActiva ? (
        <>
          {/* Iniciar nueva ronda */}
          <div className="mb-4 space-y-3 rounded-lg bg-gray-50 p-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Seleccionar ubicacion</label>
            <select
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="input-field"
            >
              <option value="">Seleccionar...</option>
              {UBICACIONES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <button
              onClick={iniciarRonda}
              disabled={!ubicacion || iniciando || loading}
              className="btn-primary w-full"
            >
              {iniciando ? "Iniciando..." : "Iniciar Ronda"}
            </button>
          </div>

          {/* Historial */}
          {rondas.length === 0 ? (
            <p className="text-sm text-gray-400">No hay rondas registradas.</p>
          ) : (
            <div className="space-y-3">
              {rondas.slice(0, 10).map((r) => (
                <div key={r.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-3 w-3 rounded-full ${
                        r.completada ? "bg-green-500" : r.escaneos.length > 0 ? "bg-amber-500" : "bg-red-500"
                      }`} />
                      <span className="text-sm font-medium text-gray-900">{r.ubicacion}</span>
                      <span className="text-xs text-gray-400">
                        {r.escaneos.length}/{r.totalPuntos} puntos
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(r.fecha).toLocaleString()}</span>
                  </div>
                  {r.escaneos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.escaneos.map((e) => (
                        <span key={e.id} className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          {e.puntoRuta.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.novedades && <p className="mt-1 text-xs font-medium text-red-600">Novedad: {r.novedades}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Ronda en progreso */
        <div>
          <div className="mb-4 rounded-lg bg-primary-50 border border-primary-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-primary-800">Ronda en {rondaActiva.ubicacion}</span>
              <span className="text-xs font-medium text-primary-600">
                {rondaActiva.escaneos.length}/{rondaActiva.totalPuntos} puntos
              </span>
            </div>
            {/* Barra de progreso */}
            <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  rondaActiva.completada ? "bg-green-500" : "bg-primary-500"
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
            {/* Semaforo */}
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex h-4 w-4 rounded-full ${
                rondaActiva.completada ? "bg-green-500" : progreso >= 50 ? "bg-amber-500" : "bg-red-500"
              }`} />
              <span className="text-xs text-primary-700">
                {rondaActiva.completada
                  ? "Ronda completada"
                  : progreso >= 50
                    ? "En progreso"
                    : "Iniciada"}
              </span>
            </div>
          </div>

          {/* Puntos escaneados */}
          {rondaActiva.escaneos.length > 0 && (
            <div className="mb-4 space-y-1">
              {rondaActiva.escaneos
                .sort((a, b) => a.puntoRuta.orden - b.puntoRuta.orden)
                .map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-800">{e.puntoRuta.nombre}</span>
                  </div>
                  <span className="text-xs text-green-600">{new Date(e.fecha).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Scanner o boton */}
          {!rondaActiva.completada && (
            <div className="mb-4">
              {scanning ? (
                <div>
                  <div id="qr-ronda-reader" className="mx-auto mb-3 overflow-hidden rounded-lg" style={{ maxWidth: 350 }} />
                  <button onClick={stopScanner} className="btn-secondary w-full text-sm">
                    Cancelar escaneo
                  </button>
                </div>
              ) : (
                <button onClick={startScanner} className="btn-accent w-full flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Escanear Siguiente Punto
                </button>
              )}
            </div>
          )}

          {/* Observaciones al finalizar */}
          {rondaActiva.completada && (
            <div className="space-y-3">
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Observaciones generales de la ronda (opcional)"
              />
              <textarea
                value={novedades}
                onChange={(e) => setNovedades(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Novedades o situaciones fuera de lo normal (opcional)"
              />
              <button onClick={finalizarRonda} className="btn-primary w-full">
                Finalizar Ronda
              </button>
            </div>
          )}

          {/* Cancelar ronda */}
          {!rondaActiva.completada && (
            <button
              onClick={() => { setRondaActiva(null); setUbicacion(""); }}
              className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Cancelar ronda
            </button>
          )}
        </div>
      )}
    </div>
  );
}
