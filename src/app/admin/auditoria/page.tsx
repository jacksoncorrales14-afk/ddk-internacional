"use client";

import { useState } from "react";
import Link from "next/link";
import { useApiGet, PaginatedResponse } from "@/hooks/useApi";
import Paginacion from "@/components/Paginacion";

interface AuditoriaItem {
  id: string;
  adminId: string;
  adminNombre: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: string | null;
  createdAt: string;
}

const ACCIONES: { value: string; label: string }[] = [
  { value: "", label: "Todas las acciones" },
  { value: "candidato_aprobado", label: "Candidato aprobado" },
  { value: "candidato_rechazado", label: "Candidato rechazado" },
  { value: "trabajador_creado", label: "Trabajador creado" },
  { value: "trabajador_actualizado", label: "Trabajador actualizado" },
  { value: "trabajador_eliminado", label: "Trabajador eliminado" },
  { value: "trabajador_codigo_regenerado", label: "Codigo regenerado" },
];

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resumenDetalle(detalle: string | null): string {
  if (!detalle) return "";
  try {
    const obj = JSON.parse(detalle);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  } catch {
    return detalle;
  }
}

export default function AuditoriaPage() {
  const [page, setPage] = useState(1);
  const [accion, setAccion] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (accion) params.set("accion", accion);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);

  const { data, isLoading } = useApiGet<PaginatedResponse<AuditoriaItem>>(
    `/api/admin/auditoria?${params.toString()}`
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auditoria</h1>
          <p className="text-sm text-gray-500">Registro de acciones realizadas por administradores</p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          Volver
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Accion</label>
          <select
            value={accion}
            onChange={(e) => {
              setAccion(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {ACCIONES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setAccion("");
              setDesde("");
              setHasta("");
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Accion</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Entidad</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : !data?.data.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                  Sin registros
                </td>
              </tr>
            ) : (
              data.data.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-700">{formatFecha(item.createdAt)}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">{item.adminNombre}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-700">{item.accion}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">{item.entidad}</td>
                  <td className="px-6 py-3 text-xs text-gray-500">{resumenDetalle(item.detalle)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <Paginacion
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
