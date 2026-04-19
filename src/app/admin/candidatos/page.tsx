"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Candidato, tipoDocLabels } from "@/types/models";
import CandidatoModal from "@/components/admin/CandidatoModal";
import Paginacion from "@/components/Paginacion";
import BuscadorTexto from "@/components/admin/BuscadorTexto";
import { TableSkeleton } from "@/components/Skeleton";
import Breadcrumb from "@/components/admin/Breadcrumb";

interface PaginatedResponse {
  data: Candidato[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CandidatosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<Candidato | null>(null);
  const [filtro, setFiltro] = useState("todos");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchCandidatos = useCallback((currentPage: number, estado: string, query: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString(),
    });
    if (estado !== "todos") params.set("estado", estado);
    if (query.trim()) params.set("q", query.trim());

    fetch(`/api/candidatos?${params}`)
      .then((r) => r.json())
      .then((res: PaginatedResponse) => {
        setCandidatos(res.data);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchCandidatos(page, filtro, q);
    }
  }, [session, page, filtro, q, fetchCandidatos]);

  const cambiarFiltro = (nuevoFiltro: string) => {
    setFiltro(nuevoFiltro);
    setPage(1);
  };

  const aprobarCandidato = useCallback(async (
    id: string,
    datos: { ubicacion: string }
  ) => {
    const res = await fetch(`/api/candidatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "aprobado", ...datos }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al aprobar");
    }
    const data = await res.json();
    setCandidatos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: "aprobado" } : c))
    );
    setDetalle((prev) => (prev?.id === id ? { ...prev, estado: "aprobado" } : prev));
    return { codigoActivacion: data.codigoActivacion };
  }, []);

  const rechazarCandidato = useCallback(async (id: string) => {
    await fetch(`/api/candidatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "rechazado" }),
    });
    setCandidatos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: "rechazado" } : c))
    );
  }, []);

  const eliminarCandidato = useCallback(async (id: string, nombre: string) => {
    if (!confirm(`¿Estas seguro de eliminar al candidato ${nombre}? Esta accion no se puede deshacer.`)) return;
    const res = await fetch(`/api/candidatos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCandidatos((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
      if (detalle?.id === id) setDetalle(null);
    }
  }, [detalle]);

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <TableSkeleton columns={7} rows={5} />
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Candidatos" }]} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidatos</h1>
          <p className="text-sm text-gray-500">{total} solicitudes recibidas</p>
        </div>
        <BuscadorTexto
          value={q}
          onChange={(value) => {
            setQ(value);
            setPage(1);
          }}
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["todos", "pendiente", "aprobado", "rechazado"].map((f) => (
          <button
            key={f}
            onClick={() => cambiarFiltro(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filtro === f ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {detalle && (
        <CandidatoModal
          candidato={detalle}
          onClose={() => setDetalle(null)}
          onAprobar={aprobarCandidato}
          onRechazar={rechazarCandidato}
        />
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {candidatos.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No hay candidatos en esta categoria.</div>
        ) : (
          candidatos.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{c.nombre}</p>
                  <p className="text-xs text-gray-500">
                    <span className="uppercase text-gray-400">{tipoDocLabels[c.tipoDocumento] || "Doc"}: </span>
                    {c.cedula}
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.estado === "aprobado" ? "bg-green-100 text-green-700" :
                  c.estado === "rechazado" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {c.estado}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 capitalize">{c.puesto}</span>
                <span>{c.atestados.length} docs</span>
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                <button onClick={() => setDetalle(c)} className="text-sm font-medium text-primary-600 hover:text-primary-800">
                  Ver Detalle
                </button>
                {c.estado === "rechazado" && (
                  <button
                    onClick={() => eliminarCandidato(c.id, c.nombre)}
                    className="text-sm font-medium text-red-400 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla (desktop) */}
      <div className="card hidden md:block overflow-hidden p-0">
        {candidatos.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay candidatos en esta categoria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-6 py-3">Nombre</th>
                  <th scope="col" className="px-6 py-3">Documento</th>
                  <th scope="col" className="px-6 py-3">Puesto</th>
                  <th scope="col" className="px-6 py-3">Estado</th>
                  <th scope="col" className="px-6 py-3">Docs</th>
                  <th scope="col" className="px-6 py-3">Fecha</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {candidatos.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="text-xs text-gray-400 uppercase">{tipoDocLabels[c.tipoDocumento] || "Doc"}: </span>
                      {c.cedula}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-500">{c.puesto}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.estado === "aprobado" ? "bg-green-100 text-green-700" :
                        c.estado === "rechazado" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.atestados.length}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDetalle(c)} className="text-sm font-medium text-primary-600 hover:text-primary-800">
                          Ver Detalle
                        </button>
                        {c.estado === "rechazado" && (
                          <button
                            onClick={() => eliminarCandidato(c.id, c.nombre)}
                            className="text-sm font-medium text-red-400 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Paginacion
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
