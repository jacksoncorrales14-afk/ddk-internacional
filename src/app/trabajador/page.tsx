"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Registro, Ronda, Bitacora, PUESTOS } from "@/types/models";

export default function TrabajadorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);
  const [nota, setNota] = useState("");
  const [rondaForm, setRondaForm] = useState({ ubicacion: "", observaciones: "", novedades: "" });
  const [showRondaForm, setShowRondaForm] = useState(false);
  const [bitacoraForm, setBitacoraForm] = useState({ incidencias: "", entregaA: "", puesto: "" });
  const [showBitacoraForm, setShowBitacoraForm] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // QR Scanner
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [scannedPuesto, setScannedPuesto] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "trabajador") {
      fetchData();
    }
  }, [session]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [regRes, ronRes, bitRes] = await Promise.all([
        fetch("/api/registros"),
        fetch("/api/rondas"),
        fetch("/api/bitacoras"),
      ]);
      setRegistros(await regRes.json());
      setRondas(await ronRes.json());
      setBitacoras(await bitRes.json());
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setScanning(true);
    setScannedCode("");
    setScannedPuesto("");
    setErrorMsg("");

    // Importar dinámicamente para evitar SSR issues
    const { Html5Qrcode } = await import("html5-qrcode");

    // Esperar a que el div se renderice
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            setScannedCode(decodedText);
            // Decodificar para mostrar el puesto
            try {
              const decoded = JSON.parse(atob(decodedText));
              setScannedPuesto(decoded.puesto || "");
            } catch {
              setScannedPuesto("");
            }
            stopScanner();
          },
          () => {} // error silencioso en cada frame
        );
      } catch {
        setErrorMsg("No se pudo acceder a la camara. Verifica los permisos.");
        setScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current = null;
      }
    } catch {
      // Ignorar errores al detener
    }
    setScanning(false);
  };

  const marcar = async (tipo: "entrada" | "salida") => {
    if (!scannedCode) {
      setErrorMsg("Primero escanea el codigo QR del puesto");
      return;
    }
    setMarcando(true);
    setMensaje("");
    setErrorMsg("");
    const res = await fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, nota, codigoQR: scannedCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setMensaje(`${tipo === "entrada" ? "Entrada" : "Salida"} registrada en ${scannedPuesto}`);
      setNota("");
      setScannedCode("");
      setScannedPuesto("");
      fetchData();
    } else {
      setErrorMsg(data.error || "Error al registrar");
    }
    setMarcando(false);
  };

  const registrarRonda = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarcando(true);
    setMensaje("");
    const res = await fetch("/api/rondas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rondaForm),
    });
    if (res.ok) {
      setMensaje("Ronda registrada correctamente");
      setRondaForm({ ubicacion: "", observaciones: "", novedades: "" });
      setShowRondaForm(false);
      fetchData();
    }
    setMarcando(false);
  };

  const registrarBitacora = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarcando(true);
    setMensaje("");
    const res = await fetch("/api/bitacoras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bitacoraForm),
    });
    if (res.ok) {
      setMensaje("Bitacora registrada correctamente");
      setBitacoraForm({ incidencias: "", entregaA: "", puesto: "" });
      setShowBitacoraForm(false);
      fetchData();
    }
    setMarcando(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (session?.user?.role !== "trabajador") return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Panel</h1>
        <p className="text-sm text-gray-500">Bienvenido, {session.user.name}</p>
      </div>

      {mensaje && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">{mensaje}</div>
      )}
      {errorMsg && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{errorMsg}</div>
      )}

      {/* Marcar Entrada/Salida con QR */}
      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Marcar Asistencia</h2>

        {/* Scanner QR */}
        {!scannedCode ? (
          <div className="mb-4">
            {scanning ? (
              <div>
                <div id="qr-reader" ref={scannerRef} className="mx-auto mb-3 overflow-hidden rounded-lg" style={{ maxWidth: 350 }} />
                <button onClick={stopScanner} className="btn-secondary w-full text-sm">
                  Cancelar escaneo
                </button>
              </div>
            ) : (
              <button onClick={startScanner} className="btn-accent w-full flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Escanear QR del Puesto
              </button>
            )}
          </div>
        ) : (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-sm text-green-600">QR escaneado correctamente</p>
            <p className="text-lg font-bold text-green-800">{scannedPuesto}</p>
            <button
              onClick={() => { setScannedCode(""); setScannedPuesto(""); }}
              className="mt-2 text-xs text-green-600 underline"
            >
              Escanear otro puesto
            </button>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nota (opcional)</label>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="input-field mb-4"
            placeholder="Alguna observacion..."
          />
        </div>
        <div className="flex gap-4">
          <button onClick={() => marcar("entrada")} className="btn-primary flex-1" disabled={marcando || !scannedCode}>
            Marcar Entrada
          </button>
          <button onClick={() => marcar("salida")} className="btn-danger flex-1" disabled={marcando || !scannedCode}>
            Marcar Salida
          </button>
        </div>
      </div>

      {/* Registrar Ronda */}
      <div className="card mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Rondas</h2>
          <button onClick={() => setShowRondaForm(!showRondaForm)} className="btn-accent text-xs">
            {showRondaForm ? "Cancelar" : "+ Nueva Ronda"}
          </button>
        </div>

        {showRondaForm && (
          <form onSubmit={registrarRonda} className="mb-6 space-y-4 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Puesto / Zona</label>
              <select
                value={rondaForm.ubicacion}
                onChange={(e) => setRondaForm({ ...rondaForm, ubicacion: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Seleccionar puesto...</option>
                {PUESTOS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Observaciones</label>
              <textarea
                value={rondaForm.observaciones}
                onChange={(e) => setRondaForm({ ...rondaForm, observaciones: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Estado general del area..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Novedades</label>
              <textarea
                value={rondaForm.novedades}
                onChange={(e) => setRondaForm({ ...rondaForm, novedades: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Situaciones fuera de lo normal (dejar vacio si todo normal)"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={marcando}>
              Registrar Ronda
            </button>
          </form>
        )}

        {rondas.length === 0 ? (
          <p className="text-sm text-gray-400">No hay rondas registradas.</p>
        ) : (
          <div className="space-y-3">
            {rondas.slice(0, 10).map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{r.ubicacion}</span>
                  <span className="text-xs text-gray-400">{new Date(r.fecha).toLocaleString()}</span>
                </div>
                {r.observaciones && <p className="mt-1 text-xs text-gray-500">{r.observaciones}</p>}
                {r.novedades && <p className="mt-1 text-xs font-medium text-red-600">Novedad: {r.novedades}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bitacora */}
      <div className="card mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Bitacora</h2>
          <button onClick={() => setShowBitacoraForm(!showBitacoraForm)} className="btn-accent text-xs">
            {showBitacoraForm ? "Cancelar" : "+ Nueva Entrada"}
          </button>
        </div>

        {showBitacoraForm && (
          <form onSubmit={registrarBitacora} className="mb-6 space-y-4 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Puesto</label>
              <select
                value={bitacoraForm.puesto}
                onChange={(e) => setBitacoraForm({ ...bitacoraForm, puesto: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Seleccionar puesto...</option>
                {PUESTOS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Incidencias del dia</label>
              <textarea
                value={bitacoraForm.incidencias}
                onChange={(e) => setBitacoraForm({ ...bitacoraForm, incidencias: e.target.value })}
                className="input-field"
                rows={4}
                placeholder="Describa las principales incidencias ocurridas durante el turno y en donde se tuvo injerencia..."
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Entrega el puesto a</label>
              <input
                type="text"
                value={bitacoraForm.entregaA}
                onChange={(e) => setBitacoraForm({ ...bitacoraForm, entregaA: e.target.value })}
                className="input-field"
                placeholder="Nombre de la persona que recibe el puesto"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={marcando}>
              Registrar Bitacora
            </button>
          </form>
        )}

        {bitacoras.length === 0 ? (
          <p className="text-sm text-gray-400">No hay entradas en la bitacora.</p>
        ) : (
          <div className="space-y-3">
            {bitacoras.slice(0, 10).map((b) => (
              <div key={b.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{b.puesto}</span>
                  <span className="text-xs text-gray-400">{new Date(b.fecha).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{b.incidencias}</p>
                <p className="mt-1 text-xs text-primary-600">Entregado a: {b.entregaA}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de registros */}
      <div className="card">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Historial de Asistencia</h2>
        {registros.length === 0 ? (
          <p className="text-sm text-gray-400">No hay registros aun.</p>
        ) : (
          <div className="space-y-2">
            {registros.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.tipo === "entrada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {r.tipo === "entrada" ? "Entrada" : "Salida"}
                  </span>
                  {r.ubicacion && <span className="text-xs text-primary-600">{r.ubicacion}</span>}
                  {r.nota && <span className="text-xs text-gray-500">{r.nota}</span>}
                </div>
                <span className="text-xs text-gray-400">{new Date(r.fecha).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
