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
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Ubicaciones" }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ubicaciones</h1>
        <p className="text-sm text-gray-500">Gestiona las ubicaciones disponibles para asignar trabajadores</p>
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
              <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
