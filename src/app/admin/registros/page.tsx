"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { TIPOS_INCIDENCIA_LABELS, SEVERIDAD_COLORS, ESTADO_BITACORA_COLORS, ESTADO_BITACORA_LABELS } from "@/types/models";
import type { Jornada, JornadasAgrupadas } from "@/types/models";
import { useApiGet } from "@/hooks/useApi";
import FiltroFechas, {
  FiltrosState,
  filtrosIniciales,
  buildFiltrosQuery,
} from "@/components/admin/FiltroFechas";
import AcordeonPuesto from "@/components/admin/AcordeonPuesto";
import Breadcrumb from "@/components/admin/Breadcrumb";

interface BitacoraAdmin {
  id: string;
  fecha: string;
  incidencias: string;
  entregaA: string;
  ubicacion: string;
  tipoIncidencia: string | null;
  severidad: string;
  estado: string;
  trabajador: { nombre: string; cedula: string };
}

interface RondaAdmin {
  id: string;
  fecha: string;
  ubicacion: string;
  observaciones: string | null;
  novedades: string | null;
  completada: boolean;
  totalPuntos: number;
  escaneos: { id: string; fecha: string; puntoRuta: { nombre: string; orden: number } }[];
  trabajador: { nombre: string; cedula: string };
}

// ─── Utilidades de formato ───

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
}

function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// ─── Agrupar rondas por ubicacion ───

function agruparRondas(rondas: RondaAdmin[]): Record<string, RondaAdmin[]> {
  const result: Record<string, RondaAdmin[]> = {};
  for (const r of rondas) {
    if (!result[r.ubicacion]) result[r.ubicacion] = [];
    result[r.ubicacion].push(r);
  }
  for (const u of Object.keys(result)) {
    result[u].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }
  return result;
}

export default function RegistrosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"registros" | "rondas" | "bitacoras">("registros");
  const [filtros, setFiltros] = useState<FiltrosState>(filtrosIniciales);

  const isAdmin = session?.user?.role === "admin";
  const query = buildFiltrosQuery(filtros);

  const { data: jornadasAgrupadas } = useApiGet<JornadasAgrupadas>(
    isAdmin ? `/api/admin/registros?${query}&agrupado=1` : null
  );
  const { data: rondas } = useApiGet<RondaAdmin[]>(
    isAdmin ? `/api/admin/rondas?${query}` : null
  );
  const { data: bitacoras } = useApiGet<BitacoraAdmin[]>(
    isAdmin ? `/api/admin/bitacoras?${query}` : null
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const jornadasPorPuesto = jornadasAgrupadas || {};
  const rondasPorPuesto = useMemo(() => agruparRondas(rondas || []), [rondas]);
  const bitacorasPorPuesto = useMemo(
    () =>
      (bitacoras || []).reduce<Record<string, BitacoraAdmin[]>>((acc, b) => {
        if (!acc[b.ubicacion]) acc[b.ubicacion] = [];
        acc[b.ubicacion].push(b);
        return acc;
      }, {}),
    [bitacoras]
  );

  const exportar = () => {
    const params = new URLSearchParams(query);
    params.set("tipo", tab);
    window.location.href = `/api/admin/registros/export?${params.toString()}`;
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const cargando = !jornadasAgrupadas || !rondas || !bitacoras;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Registros" }]} />
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Registros, Rondas y Bitacoras</h1>

      <FiltroFechas filtros={filtros} onChange={setFiltros} onExportar={exportar} />

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

      {cargando ? (
        <div className="card p-8 text-center text-gray-400">Cargando...</div>
      ) : (
        <>
          {tab === "registros" && <TabRegistros porPuesto={jornadasPorPuesto} />}
          {tab === "rondas" && <TabRondas porPuesto={rondasPorPuesto} />}
          {tab === "bitacoras" && <TabBitacoras porPuesto={bitacorasPorPuesto} />}
        </>
      )}
    </div>
  );
}

// ─── Tab Registros ───

function TabRegistros({ porPuesto }: { porPuesto: Record<string, Jornada[]> }) {
  const puestos = Object.keys(porPuesto).sort();
  if (puestos.length === 0) {
    return <div className="card p-8 text-center text-gray-400">No hay registros en el rango seleccionado.</div>;
  }

  return (
    <div>
      {puestos.map((puesto) => {
        const jornadas = porPuesto[puesto];
        const trabajadoresUnicos = new Set(jornadas.map((j) => j.cedula)).size;
        const totalMinutos = jornadas.reduce((sum, j) => sum + j.duracionMin, 0);
        const jornadasCerradas = jornadas.filter((j) => j.entrada && j.salida).length;

        return (
          <AcordeonPuesto
            key={puesto}
            titulo={puesto}
            subtitulo={`${jornadas.length} jornada${jornadas.length !== 1 ? "s" : ""} registrada${jornadas.length !== 1 ? "s" : ""}`}
            color="primary"
            stats={[
              { label: "Trabajadores", value: trabajadoresUnicos },
              { label: "Completas", value: jornadasCerradas },
              { label: "Horas", value: formatDuracion(totalMinutos) },
            ]}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">Trabajador</th>
                    <th scope="col" className="px-5 py-3">Fecha</th>
                    <th scope="col" className="px-5 py-3">Entrada</th>
                    <th scope="col" className="px-5 py-3">Salida</th>
                    <th scope="col" className="px-5 py-3">Duracion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jornadas.map((j, i) => {
                    const fechaRef = j.entrada || j.salida!;
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-900">{j.trabajador}</p>
                          <p className="text-xs text-gray-400">{j.cedula}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{formatFechaCorta(fechaRef)}</td>
                        <td className="px-5 py-3">
                          {j.entrada ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                              {formatHora(j.entrada)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {j.salida ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                              {formatHora(j.salida)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              En servicio
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-700">
                          {j.duracionMin > 0 ? formatDuracion(j.duracionMin) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AcordeonPuesto>
        );
      })}
    </div>
  );
}

// ─── Tab Rondas ───

function TabRondas({ porPuesto }: { porPuesto: Record<string, RondaAdmin[]> }) {
  const puestos = Object.keys(porPuesto).sort();
  if (puestos.length === 0) {
    return <div className="card p-8 text-center text-gray-400">No hay rondas en el rango seleccionado.</div>;
  }

  return (
    <div>
      {puestos.map((puesto) => {
        const lista = porPuesto[puesto];
        const completas = lista.filter((r) => r.completada).length;
        const pct = lista.length > 0 ? Math.round((completas / lista.length) * 100) : 0;
        const trabajadoresUnicos = new Set(lista.map((r) => r.trabajador.cedula)).size;

        // Color del header segun completitud
        const color = pct >= 80 ? "green" : pct >= 50 ? "amber" : "red";

        return (
          <AcordeonPuesto
            key={puesto}
            titulo={puesto}
            subtitulo={`${lista.length} ronda${lista.length !== 1 ? "s" : ""} \u2022 Ultima: ${formatFechaCorta(lista[0].fecha)} ${formatHora(lista[0].fecha)}`}
            color={color}
            stats={[
              { label: "Total", value: lista.length },
              { label: "Completas", value: `${pct}%` },
              { label: "Guardias", value: trabajadoresUnicos },
            ]}
          >
            <div className="divide-y divide-gray-100">
              {lista.map((r) => {
                const escaneados = r.escaneos?.length || 0;
                const progreso = r.totalPuntos > 0 ? (escaneados / r.totalPuntos) * 100 : 0;

                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-3 w-3 rounded-full ${
                            r.completada ? "bg-green-500" : escaneados > 0 ? "bg-amber-500" : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.trabajador.nombre}</p>
                          <p className="text-xs text-gray-400">
                            {formatFechaCorta(r.fecha)} {"\u2022"} {formatHora(r.fecha)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.completada
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {escaneados}/{r.totalPuntos} puntos
                      </span>
                    </div>

                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${r.completada ? "bg-green-500" : "bg-amber-500"}`}
                        style={{ width: `${progreso}%` }}
                      />
                    </div>

                    {r.escaneos && r.escaneos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.escaneos.map((e) => (
                          <span
                            key={e.id}
                            className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] text-green-700"
                          >
                            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {e.puntoRuta.nombre} {formatHora(e.fecha)}
                          </span>
                        ))}
                      </div>
                    )}

                    {(r.observaciones || r.novedades) && (
                      <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2">
                        {r.observaciones && <p className="text-xs text-gray-600">{r.observaciones}</p>}
                        {r.novedades && (
                          <p className="mt-1 text-xs font-medium text-red-600">Novedad: {r.novedades}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AcordeonPuesto>
        );
      })}
    </div>
  );
}

// ─── Tab Bitacoras ───

function TabBitacoras({ porPuesto }: { porPuesto: Record<string, BitacoraAdmin[]> }) {
  const puestos = Object.keys(porPuesto).sort();
  if (puestos.length === 0) {
    return <div className="card p-8 text-center text-gray-400">No hay bitacoras en el rango seleccionado.</div>;
  }

  return (
    <div>
      {puestos.map((puesto) => {
        const lista = [...porPuesto[puesto]].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        const guardias = new Set(lista.map((b) => b.trabajador.cedula)).size;
        const criticas = lista.filter((b) => b.severidad === "critica" || b.severidad === "alta").length;
        const abiertas = lista.filter((b) => b.estado === "abierto").length;
        const color = criticas > 0 ? "red" : abiertas > 0 ? "amber" : "green";

        return (
          <AcordeonPuesto
            key={puesto}
            titulo={puesto}
            subtitulo={`Ultima entrega: ${formatFechaCorta(lista[0].fecha)} ${formatHora(lista[0].fecha)}`}
            color={color}
            stats={[
              { label: "Entradas", value: lista.length },
              { label: "Guardias", value: guardias },
              { label: "Alta/Critica", value: criticas },
              { label: "Abiertas", value: abiertas },
            ]}
          >
            <div className="divide-y divide-gray-100">
              {lista.map((b) => (
                <div key={b.id} className="px-5 py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.trabajador.nombre}</p>
                      <p className="text-xs text-gray-400">{b.trabajador.cedula}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatFechaCorta(b.fecha)} {"\u2022"} {formatHora(b.fecha)}
                    </span>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {b.tipoIncidencia && (
                      <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {TIPOS_INCIDENCIA_LABELS[b.tipoIncidencia] || b.tipoIncidencia}
                      </span>
                    )}
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SEVERIDAD_COLORS[b.severidad] || "bg-gray-100 text-gray-600"}`}>
                      {b.severidad?.charAt(0).toUpperCase() + b.severidad?.slice(1)}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BITACORA_COLORS[b.estado] || "bg-gray-100 text-gray-600"}`}>
                      {ESTADO_BITACORA_LABELS[b.estado] || b.estado}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-700">{b.incidencias}</p>
                  <div className="flex items-center gap-1 text-xs text-primary-600">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    Entregado a: <span className="font-medium">{b.entregaA}</span>
                  </div>
                </div>
              ))}
            </div>
          </AcordeonPuesto>
        );
      })}
    </div>
  );
}
