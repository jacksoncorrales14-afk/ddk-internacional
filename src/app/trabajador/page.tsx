"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Registro, Bitacora } from "@/types/models";
import { useApiGet } from "@/hooks/useApi";
import QRScanner from "@/components/trabajador/QRScanner";
import RondaSection from "@/components/trabajador/RondaSection";
import BitacoraSection from "@/components/trabajador/BitacoraSection";
import HistorialAsistencia from "@/components/trabajador/HistorialAsistencia";

export default function TrabajadorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [marcando, setMarcando] = useState(false);
  const [nota, setNota] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [scannedPuesto, setScannedPuesto] = useState("");

  const isTrabajador = session?.user?.role === "trabajador";
  const { data: registros, mutate: mutateRegistros } = useApiGet<Registro[]>(isTrabajador ? "/api/registros" : null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rondas, mutate: mutateRondas } = useApiGet<any[]>(isTrabajador ? "/api/rondas" : null);
  const { data: bitacoras, mutate: mutateBitacoras } = useApiGet<Bitacora[]>(isTrabajador ? "/api/bitacoras" : null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const refreshAll = () => {
    mutateRegistros();
    mutateRondas();
    mutateBitacoras();
  };

  const marcar = async (tipo: "entrada" | "salida") => {
    if (tipo === "entrada" && !scannedCode) {
      setErrorMsg("Primero escanea el codigo QR del puesto");
      return;
    }
    setMarcando(true);
    setMensaje("");
    setErrorMsg("");
    const res = await fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, nota, codigoQR: scannedCode || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setMensaje(`${tipo === "entrada" ? "Entrada" : "Salida"} registrada${scannedPuesto ? ` en ${scannedPuesto}` : ""}`);
      setNota("");
      setScannedCode("");
      setScannedPuesto("");
      refreshAll();
    } else {
      setErrorMsg(data.error || "Error al registrar");
    }
    setMarcando(false);
  };

  if (status === "loading" || !registros || !rondas || !bitacoras) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!isTrabajador) return null;

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

      {/* Marcar Asistencia */}
      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Marcar Asistencia</h2>

        {!scannedCode ? (
          <div className="mb-4">
            <QRScanner
              onScan={(code, puesto) => { setScannedCode(code); setScannedPuesto(puesto); }}
              onError={setErrorMsg}
            />
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
          <button onClick={() => marcar("salida")} className="btn-danger flex-1" disabled={marcando}>
            Marcar Salida
          </button>
        </div>
      </div>

      <RondaSection
        rondas={rondas}
        loading={marcando}
        onSuccess={setMensaje}
        onRefresh={refreshAll}
      />

      <BitacoraSection
        bitacoras={bitacoras}
        loading={marcando}
        onSuccess={setMensaje}
        onRefresh={refreshAll}
      />

      <HistorialAsistencia registros={registros} />

    </div>
  );
}
