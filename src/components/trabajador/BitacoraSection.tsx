"use client";

import { useState } from "react";
import { Bitacora, UBICACIONES, TIPOS_INCIDENCIA, SEVERIDADES, TIPOS_INCIDENCIA_LABELS, SEVERIDAD_COLORS, ESTADO_BITACORA_COLORS, ESTADO_BITACORA_LABELS } from "@/types/models";

interface BitacoraSectionProps {
  bitacoras: Bitacora[];
  loading: boolean;
  onSuccess: (msg: string) => void;
  onRefresh: () => void;
}

export default function BitacoraSection({ bitacoras, loading, onSuccess, onRefresh }: BitacoraSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ incidencias: "", entregaA: "", ubicacion: "", tipoIncidencia: "", severidad: "media" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/bitacoras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onSuccess("Bitacora registrada correctamente");
      setForm({ incidencias: "", entregaA: "", ubicacion: "", tipoIncidencia: "", severidad: "media" });
      setShowForm(false);
      onRefresh();
    }
    setSubmitting(false);
  };

  return (
    <div className="card mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Bitacora</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-accent text-xs">
          {showForm ? "Cancelar" : "+ Nueva Entrada"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-lg bg-gray-50 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Puesto</label>
            <select
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Seleccionar ubicacion...</option>
              {UBICACIONES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de incidencia</label>
              <select
                value={form.tipoIncidencia}
                onChange={(e) => setForm({ ...form, tipoIncidencia: e.target.value })}
                className="input-field"
              >
                <option value="">Sin clasificar</option>
                {TIPOS_INCIDENCIA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Severidad</label>
              <select
                value={form.severidad}
                onChange={(e) => setForm({ ...form, severidad: e.target.value })}
                className="input-field"
                required
              >
                {SEVERIDADES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Incidencias del dia</label>
            <textarea
              value={form.incidencias}
              onChange={(e) => setForm({ ...form, incidencias: e.target.value })}
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
              value={form.entregaA}
              onChange={(e) => setForm({ ...form, entregaA: e.target.value })}
              className="input-field"
              placeholder="Nombre de la persona que recibe el puesto"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting || loading}>
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
                <span className="text-sm font-medium text-gray-900">{b.ubicacion}</span>
                <span className="text-xs text-gray-400">{new Date(b.fecha).toLocaleString()}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {b.tipoIncidencia && (
                  <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                    {TIPOS_INCIDENCIA_LABELS[b.tipoIncidencia] || b.tipoIncidencia}
                  </span>
                )}
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${SEVERIDAD_COLORS[b.severidad] || "bg-gray-100 text-gray-600"}`}>
                  {b.severidad?.charAt(0).toUpperCase() + b.severidad?.slice(1)}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${ESTADO_BITACORA_COLORS[b.estado] || "bg-gray-100 text-gray-600"}`}>
                  {ESTADO_BITACORA_LABELS[b.estado] || b.estado}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{b.incidencias}</p>
              <p className="mt-1 text-xs text-primary-600">Entregado a: {b.entregaA}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
