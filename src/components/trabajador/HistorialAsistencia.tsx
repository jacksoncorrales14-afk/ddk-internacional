"use client";

import { Registro } from "@/types/models";

interface HistorialAsistenciaProps {
  registros: Registro[];
}

export default function HistorialAsistencia({ registros }: HistorialAsistenciaProps) {
  return (
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
  );
}
