"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RegistroAdmin, RondaAdmin, PUESTOS } from "@/types/models";

interface BitacoraAdmin {
  id: string;
  fecha: string;
  incidencias: string;
  entregaA: string;
  puesto: string;
  trabajador: { nombre: string; cedula: string };
}

export default function RegistrosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registros, setRegistros] = useState<RegistroAdmin[]>([]);
  const [rondas, setRondas] = useState<RondaAdmin[]>([]);
  const [bitacoras, setBitacoras] = useState<BitacoraAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"registros" | "rondas" | "bitacoras">("registros");
  const [filtroPuesto, setFiltroPuesto] = useState("todos");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      Promise.all([
        fetch("/api/admin/registros").then((r) => r.json()),
        fetch("/api/admin/rondas").then((r) => r.json()),
        fetch("/api/admin/bitacoras").then((r) => r.json()),
      ])
        .then(([reg, ron, bit]) => {
          setRegistros(reg);
          setRondas(ron);
          setBitacoras(bit);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  // Agrupar bitácoras por puesto
  const bitacorasFiltradas = filtroPuesto === "todos"
    ? bitacoras
    : bitacoras.filter((b) => b.puesto === filtroPuesto);

  // Agrupar por puesto para vista organizada
  const bitacorasPorPuesto = bitacorasFiltradas.reduce<Record<string, BitacoraAdmin[]>>((acc, b) => {
    if (!acc[b.puesto]) acc[b.puesto] = [];
    acc[b.puesto].push(b);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Registros, Rondas y Bitacoras</h1>

      {/* Tabs */}
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1 sm:w-fit">
        <button
          onClick={() => setTab("registros")}
          className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
            tab === "registros" ? "bg-primary-600 text-white shadow-sm" : "text-gray-600"
          }`}
        >
          Entradas / Salidas
        </button>
        <button
          onClick={() => setTab("rondas")}
          className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
            tab === "rondas" ? "bg-primary-600 text-white shadow-sm" : "text-gray-600"
          }`}
        >
          Rondas
        </button>
        <button
          onClick={() => setTab("bitacoras")}
          className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
            tab === "bitacoras" ? "bg-primary-600 text-white shadow-sm" : "text-gray-600"
          }`}
        >
          Bitacoras
        </button>
      </div>

      {tab === "registros" && (
        <div className="card overflow-hidden p-0">
          {registros.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No hay registros.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Trabajador</th>
                    <th className="px-6 py-3">Cedula</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Puesto</th>
                    <th className="px-6 py-3">Fecha y Hora</th>
                    <th className="px-6 py-3">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {registros.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.trabajador.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.trabajador.cedula}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.tipo === "entrada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {r.tipo === "entrada" ? "Entrada" : "Salida"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.ubicacion || r.trabajador.ubicacion}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.fecha).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.nota || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "rondas" && (
        <div className="card overflow-hidden p-0">
          {rondas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No hay rondas registradas.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Trabajador</th>
                    <th className="px-6 py-3">Ubicacion</th>
                    <th className="px-6 py-3">Fecha y Hora</th>
                    <th className="px-6 py-3">Observaciones</th>
                    <th className="px-6 py-3">Novedades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rondas.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.trabajador.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.ubicacion}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.fecha).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.observaciones || "-"}</td>
                      <td className="px-6 py-4">
                        {r.novedades ? (
                          <span className="text-sm font-medium text-red-600">{r.novedades}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Sin novedades</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "bitacoras" && (
        <div>
          {/* Filtro por puesto */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroPuesto("todos")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filtroPuesto === "todos" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {PUESTOS.map((p) => (
              <button
                key={p}
                onClick={() => setFiltroPuesto(p)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  filtroPuesto === p ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {Object.keys(bitacorasPorPuesto).length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No hay bitacoras registradas.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(bitacorasPorPuesto).map(([puesto, entries]) => (
                <div key={puesto} className="card p-0 overflow-hidden">
                  <div className="bg-primary-700 px-6 py-3">
                    <h3 className="text-sm font-bold text-white">{puesto}</h3>
                    <p className="text-xs text-primary-200">{entries.length} registro{entries.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {entries.map((b) => (
                      <div key={b.id} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900">{b.trabajador.nombre}</span>
                            <span className="text-xs text-gray-400">({b.trabajador.cedula})</span>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(b.fecha).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{b.incidencias}</p>
                        <div className="flex items-center gap-1 text-xs text-primary-600">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          Entregado a: <span className="font-medium">{b.entregaA}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
