"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Registro {
  id: string;
  tipo: string;
  fecha: string;
  ubicacion: string;
  nota: string;
}

interface RondaItem {
  id: string;
  fecha: string;
  ubicacion: string;
  observaciones: string;
  novedades: string;
}

export default function TrabajadorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [rondas, setRondas] = useState<RondaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);
  const [nota, setNota] = useState("");
  const [rondaForm, setRondaForm] = useState({ ubicacion: "", observaciones: "", novedades: "" });
  const [showRondaForm, setShowRondaForm] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "trabajador") {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [regRes, ronRes] = await Promise.all([
        fetch("/api/registros"),
        fetch("/api/rondas"),
      ]);
      setRegistros(await regRes.json());
      setRondas(await ronRes.json());
    } finally {
      setLoading(false);
    }
  };

  const marcar = async (tipo: "entrada" | "salida") => {
    setMarcando(true);
    setMensaje("");
    const res = await fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, nota }),
    });
    if (res.ok) {
      setMensaje(`${tipo === "entrada" ? "Entrada" : "Salida"} registrada correctamente`);
      setNota("");
      fetchData();
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

      {/* Marcar Entrada/Salida */}
      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Marcar Asistencia</h2>
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
          <button onClick={() => marcar("entrada")} className="btn-primary flex-1" disabled={marcando}>
            Marcar Entrada
          </button>
          <button onClick={() => marcar("salida")} className="btn-danger flex-1" disabled={marcando}>
            Marcar Salida
          </button>
        </div>
      </div>

      {/* Registrar Ronda */}
      <div className="card mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Rondas de Supervision</h2>
          <button onClick={() => setShowRondaForm(!showRondaForm)} className="btn-accent text-xs">
            {showRondaForm ? "Cancelar" : "+ Nueva Ronda"}
          </button>
        </div>

        {showRondaForm && (
          <form onSubmit={registrarRonda} className="mb-6 space-y-4 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ubicacion / Zona</label>
              <input
                type="text"
                value={rondaForm.ubicacion}
                onChange={(e) => setRondaForm({ ...rondaForm, ubicacion: e.target.value })}
                className="input-field"
                placeholder="Ej: Edificio A - Piso 3"
                required
              />
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
          <p className="text-sm text-gray-400">No hay rondas registradas hoy.</p>
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
