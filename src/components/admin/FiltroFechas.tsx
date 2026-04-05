"use client";

import { UBICACIONES } from "@/types/models";

export interface FiltrosState {
  desde: string;
  hasta: string;
  ubicacion: string;
}

interface FiltroFechasProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
  onExportar?: () => void;
}

function primerDiaDelMes(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function filtrosIniciales(): FiltrosState {
  return {
    desde: primerDiaDelMes(),
    hasta: hoyISO(),
    ubicacion: "",
  };
}

export default function FiltroFechas({ filtros, onChange, onExportar }: FiltroFechasProps) {
  return (
    <div className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
        <input
          type="date"
          value={filtros.desde}
          onChange={(e) => onChange({ ...filtros, desde: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
        <input
          type="date"
          value={filtros.hasta}
          onChange={(e) => onChange({ ...filtros, hasta: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-gray-600">Ubicacion</label>
        <select
          value={filtros.ubicacion}
          onChange={(e) => onChange({ ...filtros, ubicacion: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Todas las ubicaciones</option>
          {UBICACIONES.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button
          onClick={() => onChange(filtrosIniciales())}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Limpiar
        </button>
        {onExportar && (
          <button
            onClick={onExportar}
            className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
        )}
      </div>
    </div>
  );
}

export function buildFiltrosQuery(filtros: FiltrosState): string {
  const params = new URLSearchParams();
  if (filtros.desde) params.set("desde", filtros.desde);
  if (filtros.hasta) params.set("hasta", filtros.hasta);
  if (filtros.ubicacion) params.set("ubicacion", filtros.ubicacion);
  return params.toString();
}
