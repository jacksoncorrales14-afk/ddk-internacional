"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Ubicacion } from "@/types/models";
import { useApiGet } from "@/hooks/useApi";
import Breadcrumb from "@/components/admin/Breadcrumb";

export default function UbicacionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [error, setError] = useState<string | null>(null);

  // QR state
  const [qrData, setQrData] = useState<{ puesto: string; qrDataUrl: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const { data: ubicaciones, mutate } = useApiGet<Ubicacion[]>(
    isAdmin ? "/api/admin/ubicaciones" : null
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setFormLoading(true);
    setError(null);

    const res = await fetch("/api/admin/ubicaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim() }),
    });

    if (res.ok) {
      setNombre("");
      mutate();
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear ubicacion");
    }
    setFormLoading(false);
  }, [nombre, mutate]);

  const handleToggle = useCallback(async (id: string, activa: boolean) => {
    await fetch(`/api/admin/ubicaciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !activa }),
    });
    mutate();
  }, [mutate]);

  const handleDelete = useCallback(async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la ubicacion "${nombre}"? Esta accion no se puede deshacer.`)) return;
    await fetch(`/api/admin/ubicaciones/${id}`, { method: "DELETE" });
    mutate();
  }, [mutate]);

  const startEdit = useCallback((u: Ubicacion) => {
    setEditandoId(u.id);
    setEditNombre(u.nombre);
  }, []);

  const handleSaveEdit = useCallback(async (id: string) => {
    if (!editNombre.trim()) return;
    setError(null);
    const res = await fetch(`/api/admin/ubicaciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: editNombre.trim() }),
    });
    if (res.ok) {
      setEditandoId(null);
      setEditNombre("");
      mutate();
    } else {
      const data = await res.json();
      setError(data.error || "Error al actualizar");
    }
  }, [editNombre, mutate]);

  // QR functions
  const generarQR = useCallback(async (puesto: string) => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/admin/qr?puesto=${encodeURIComponent(puesto)}`);
      const data = await res.json();
      setQrData(data);
    } catch {
      alert("Error al generar QR");
    }
    setQrLoading(false);
  }, []);

  const descargarQR = useCallback(() => {
    if (!qrData) return;
    const link = document.createElement("a");
    link.download = `QR-${qrData.puesto}.png`;
    link.href = qrData.qrDataUrl;
    link.click();
  }, [qrData]);

  const imprimirQR = useCallback(() => {
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
  }, [qrData]);

  if (status === "loading" || !ubicaciones) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Ubicaciones y QR" }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ubicaciones y Codigos QR</h1>
        <p className="text-sm text-gray-500">Gestiona ubicaciones y genera codigos QR para marcar entrada/salida</p>
      </div>

      {/* Form to add */}
      <form onSubmit={handleCreate} className="card mb-6">
        <h2 className="mb-3 text-lg font-bold text-gray-900">Agregar Ubicacion</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input-field flex-1"
            placeholder="Nombre de la ubicacion"
            required
          />
          <button type="submit" className="btn-primary shrink-0" disabled={formLoading}>
            {formLoading ? "..." : "Agregar"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {ubicaciones.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No hay ubicaciones registradas.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {ubicaciones.map((u) => (
              <div key={u.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {editandoId === u.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          className="input-field flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(u.id);
                            if (e.key === "Escape") setEditandoId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(u.id)}
                          className="text-xs font-medium text-green-600 hover:text-green-800"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          className="text-xs font-medium text-gray-400 hover:text-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-sm font-medium ${u.activa ? "text-gray-900" : "text-gray-400 line-through"}`}>
                          {u.nombre}
                        </span>
                        {!u.activa && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactiva</span>
                        )}
                      </>
                    )}
                  </div>
                  {editandoId !== u.id && (
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      {u.activa && (
                        <button
                          onClick={() => generarQR(u.nombre)}
                          disabled={qrLoading}
                          className={`text-xs font-medium text-purple-600 hover:text-purple-800 ${
                            qrData?.puesto === u.nombre ? "underline" : ""
                          }`}
                        >
                          {qrLoading && qrData?.puesto === u.nombre ? "..." : "QR"}
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(u)}
                        className="text-xs font-medium text-primary-600 hover:text-primary-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggle(u.id, u.activa)}
                        className={`text-xs font-medium ${u.activa ? "text-amber-600 hover:text-amber-800" : "text-green-600 hover:text-green-800"}`}
                      >
                        {u.activa ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.nombre)}
                        className="text-xs font-medium text-red-400 hover:text-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Display */}
      {qrData && (
        <div className="mt-6 card text-center">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{qrData.puesto}</h2>
            <button
              onClick={() => setQrData(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
