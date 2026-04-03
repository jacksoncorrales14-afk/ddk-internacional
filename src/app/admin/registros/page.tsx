"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { RegistroAdmin, UBICACIONES } from "@/types/models";
import { useApiGet } from "@/hooks/useApi";

interface BitacoraAdmin {
  id: string;
  fecha: string;
  incidencias: string;
  entregaA: string;
  ubicacion: string;
  trabajador: { nombre: string; cedula: string };
}

export default function RegistrosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"registros" | "rondas" | "bitacoras">("registros");
  const [filtroPuesto, setFiltroPuesto] = useState("todos");

  const isAdmin = session?.user?.role === "admin";
  const { data: registros } = useApiGet<RegistroAdmin[]>(isAdmin ? "/api/admin/registros" : null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rondas } = useApiGet<any[]>(isAdmin ? "/api/admin/rondas" : null);
  const { data: bitacoras } = useApiGet<BitacoraAdmin[]>(isAdmin ? "/api/admin/bitacoras" : null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const bitacorasFiltradas = useMemo(() =>
    filtroPuesto === "todos"
      ? (bitacoras || [])
      : (bitacoras || []).filter((b) => b.ubicacion === filtroPuesto),
    [bitacoras, filtroPuesto]
  );

  const bitacorasPorPuesto = useMemo(() =>
    bitacorasFiltradas.reduce<Record<string, BitacoraAdmin[]>>((acc, b) => {
      if (!acc[b.ubicacion]) acc[b.ubicacion] = [];
      acc[b.ubicacion].push(b);
      return acc;
    }, {}),
    [bitacorasFiltradas]
  );

  if (status === "loading" || !registros || !rondas || !bitacoras) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

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
        <div>
          {rondas.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No hay rondas registradas.</div>
          ) : (
            <div className="space-y-4">
              {rondas.map((r) => {
                const puntosEscaneados = r.escaneos?.length || 0;
                const total = r.totalPuntos || 0;
                const progreso = total > 0 ? (puntosEscaneados / total) * 100 : 0;

                return (
                  <div key={r.id} className="card p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {/* Semaforo */}
                        <span className={`inline-flex h-4 w-4 rounded-full ${
                          r.completada ? "bg-green-500" : puntosEscaneados > 0 ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{r.trabajador.nombre}</span>
                          <span className="ml-2 text-xs text-gray-400">({r.trabajador.cedula})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.completada ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {puntosEscaneados}/{total} puntos
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(r.fecha).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="px-6 py-2 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 shrink-0">{r.ubicacion}</span>
                        <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.completada ? "bg-green-500" : "bg-amber-500"}`}
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detalle de escaneos */}
                    {r.escaneos && r.escaneos.length > 0 && (
                      <div className="px-6 py-3">
                        <div className="flex flex-wrap gap-2">
                          {r.escaneos.map((e: { id: string; fecha: string; puntoRuta: { nombre: string } }) => (
                            <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {e.puntoRuta.nombre}
                              <span className="text-green-500 ml-1">{new Date(e.fecha).toLocaleTimeString()}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observaciones */}
                    {(r.observaciones || r.novedades) && (
                      <div className="px-6 py-3 border-t border-gray-100">
                        {r.observaciones && <p className="text-xs text-gray-500">{r.observaciones}</p>}
                        {r.novedades && <p className="text-xs font-medium text-red-600 mt-1">Novedad: {r.novedades}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "bitacoras" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroPuesto("todos")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filtroPuesto === "todos" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {UBICACIONES.map((p) => (
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
