"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Ubicacion } from "@/types/models";
import { useApiGet } from "@/hooks/useApi";
import Breadcrumb from "@/components/admin/Breadcrumb";

interface PuntoRuta {
  id: string;
  nombre: string;
  ubicacion: string;
  orden: number;
}

export default function RutasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [qrData, setQrData] = useState<{ nombre: string; qrDataUrl: string } | null>(null);
  const [formError, setFormError] = useState("");

  const isAdmin = session?.user?.role === "admin";
  const { data: ubicacionesData } = useApiGet<Ubicacion[]>(isAdmin ? "/api/admin/ubicaciones" : null);
  const ubicacionesNombres = (ubicacionesData || []).filter((u) => u.activa).map((u) => u.nombre);

  // Set default selection when ubicaciones load
  useEffect(() => {
    if (ubicacionesNombres.length > 0 && !ubicacionSeleccionada) {
      setUbicacionSeleccionada(ubicacionesNombres[0]);
    }
  }, [ubicacionesNombres, ubicacionSeleccionada]);

  const puntosKey = isAdmin && ubicacionSeleccionada
    ? `/api/admin/puntos-ruta?ubicacion=${encodeURIComponent(ubicacionSeleccionada)}`
    : null;
  const { data: puntos, mutate } = useApiGet<PuntoRuta[]>(puntosKey);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function handleCreate(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    setFormError("");

    if (!ubicacionSeleccionada) {
      setFormError("Selecciona una ubicacion antes de agregar un punto");
      return;
    }
    if (!nombre.trim()) {
      setFormError("El nombre del punto es requerido");
      return;
    }

    setFormLoading(true);

    const maxOrden = puntos && Array.isArray(puntos) && puntos.length > 0
      ? Math.max(...puntos.map((p) => p.orden))
      : 0;

    try {
      const res = await fetch("/api/admin/puntos-ruta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          ubicacion: ubicacionSeleccionada,
          orden: maxOrden + 1,
        }),
      });

      if (res.ok) {
        setNombre("");
        setShowForm(false);
        setFormError("");
        await mutate();
      } else {
        const data = await res.json().catch(() => null);
        setFormError(data?.error || `Error al crear el punto (${res.status})`);
      }
    } catch (err) {
      setFormError(`Error de conexion: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este punto de ruta?")) return;
    await fetch(`/api/admin/puntos-ruta/${id}`, { method: "DELETE" });
    await mutate();
  }

  const generarQR = async (punto: PuntoRuta) => {
    const params = new URLSearchParams({
      puntoId: punto.id,
      nombre: punto.nombre,
      ubicacion: punto.ubicacion,
    });
    const res = await fetch(`/api/admin/puntos-ruta/qr?${params}`);
    const data = await res.json();
    setQrData(data);
  };

  const imprimirQR = () => {
    if (!qrData) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html>
          <head><title>QR Ronda - ${qrData.nombre}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,sans-serif;">
            <h2 style="color:#102a43;">DDK Internacional</h2>
            <h3>Punto de Ronda: ${qrData.nombre}</h3>
            <img src="${qrData.qrDataUrl}" style="width:250px;height:250px;" />
            <p style="color:#666;margin-top:20px;">Escanee este codigo durante la ronda de seguridad</p>
          </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const puntosLista = puntos || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Rutas de Ronda" }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Rutas de Ronda</h1>
        <p className="text-sm text-gray-500">Define los puntos de control que los oficiales deben escanear durante cada ronda</p>
      </div>

      {/* Selector de ubicacion */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ubicacionesNombres.map((u) => (
          <button
            key={u}
            onClick={() => { setUbicacionSeleccionada(u); setQrData(null); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              ubicacionSeleccionada === u ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Lista de puntos */}
      <div className="card mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Puntos de control - {ubicacionSeleccionada || "(sin ubicacion)"}
          </h2>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setFormError(""); }}
            className="btn-primary text-sm"
            disabled={!ubicacionSeleccionada}
          >
            {showForm ? "Cancelar" : "+ Agregar Punto"}
          </button>
        </div>

        {showForm && (
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                className="input-field flex-1"
                placeholder="Nombre del punto (ej: Entrada Principal)"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleCreate()}
                className="btn-primary shrink-0"
                disabled={formLoading}
              >
                {formLoading ? "..." : "Agregar"}
              </button>
            </div>
            {formError && (
              <p className="mt-2 text-sm text-red-600">{formError}</p>
            )}
          </div>
        )}

        {puntosLista.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No hay puntos de ruta definidos para esta ubicacion.</p>
        ) : (
          <div className="space-y-2">
            {puntosLista.map((punto, index) => (
              <div key={punto.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{punto.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generarQR(punto)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800"
                  >
                    Ver QR
                  </button>
                  <button
                    onClick={() => handleDelete(punto.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {puntosLista.length > 0 && (
          <div className="mt-4 rounded-lg bg-primary-50 border border-primary-200 p-3">
            <p className="text-xs text-primary-700">
              Ruta: {puntosLista.map((p) => p.nombre).join(" → ")}
            </p>
          </div>
        )}
      </div>

      {/* QR generado */}
      {qrData && (
        <div className="card text-center">
          <h3 className="mb-2 text-lg font-bold text-gray-900">{qrData.nombre}</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrData.qrDataUrl} alt={`QR ${qrData.nombre}`} className="mx-auto mb-4" style={{ width: 250, height: 250 }} />
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.download = `QR-Ronda-${qrData.nombre}.png`;
                link.href = qrData.qrDataUrl;
                link.click();
              }}
              className="btn-primary"
            >
              Descargar
            </button>
            <button onClick={imprimirQR} className="btn-secondary">
              Imprimir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
