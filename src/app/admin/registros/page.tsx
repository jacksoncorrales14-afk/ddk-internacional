"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RegistroAdmin {
  id: string;
  tipo: string;
  fecha: string;
  ubicacion: string;
  nota: string;
  trabajador: { nombre: string; cedula: string; ubicacion: string };
}

interface RondaAdmin {
  id: string;
  fecha: string;
  ubicacion: string;
  observaciones: string;
  novedades: string;
  trabajador: { nombre: string; cedula: string };
}

export default function RegistrosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registros, setRegistros] = useState<RegistroAdmin[]>([]);
  const [rondas, setRondas] = useState<RondaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"registros" | "rondas">("registros");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      Promise.all([
        fetch("/api/admin/registros").then((r) => r.json()),
        fetch("/api/admin/rondas").then((r) => r.json()),
      ])
        .then(([reg, ron]) => {
          setRegistros(reg);
          setRondas(ron);
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Registros y Rondas</h1>

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
          Rondas de Supervision
        </button>
      </div>

      {tab === "registros" ? (
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
      ) : (
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
    </div>
  );
}
