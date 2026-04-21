"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { useApiGet } from "@/hooks/useApi";
import Breadcrumb from "@/components/admin/Breadcrumb";

interface TrabajadorDespedido {
  id: string;
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  puesto: string;
  ubicacion: string;
  fechaDespido: string | null;
  createdAt: string;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DespedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";
  const { data: despedidos, mutate } = useApiGet<TrabajadorDespedido[]>(
    isAdmin ? "/api/admin/despedidos" : null
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const restaurar = useCallback(async (id: string, nombre: string) => {
    if (!confirm(`¿Restaurar a ${nombre} como trabajador activo?`)) return;
    await fetch(`/api/admin/despedidos/${id}`, { method: "PATCH" });
    mutate();
  }, [mutate]);

  const eliminarDefinitivo = useCallback(async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar PERMANENTEMENTE a ${nombre}? Se borraran todos sus registros. Esta accion NO se puede deshacer.`)) return;
    await fetch(`/api/admin/despedidos/${id}`, { method: "DELETE" });
    mutate();
  }, [mutate]);

  if (status === "loading" || !despedidos) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Trabajadores", href: "/admin/trabajadores" }, { label: "Ex-Trabajadores" }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ex-Trabajadores</h1>
        <p className="text-sm text-gray-500">{despedidos.length} ex-trabajadores en esta carpeta</p>
      </div>

      {despedidos.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400">No hay ex-trabajadores.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {despedidos.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.nombre}</p>
                  <p className="text-xs capitalize text-gray-400">{t.puesto} - {t.ubicacion}</p>
                </div>
                {t.fechaDespido && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                    Removido {formatFecha(t.fechaDespido)}
                  </span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 sm:grid-cols-3">
                <p>Cedula: {t.cedula}</p>
                <p>Email: {t.email}</p>
                <p>Telefono: {t.telefono}</p>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => restaurar(t.id, t.nombre)}
                  className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  Restaurar
                </button>
                <button
                  onClick={() => eliminarDefinitivo(t.id, t.nombre)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100"
                >
                  Eliminar Permanentemente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
