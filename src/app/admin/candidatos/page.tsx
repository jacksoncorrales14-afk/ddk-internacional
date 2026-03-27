"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Candidato, tipoDocLabels } from "@/types/models";

export default function CandidatosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<Candidato | null>(null);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetch("/api/candidatos")
        .then((r) => r.json())
        .then(setCandidatos)
        .finally(() => setLoading(false));
    }
  }, [session]);

  const actualizarEstado = async (id: string, estado: string) => {
    if (estado === "rechazado" && !confirm("¿Estas seguro de rechazar este candidato?")) return;
    await fetch(`/api/candidatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setCandidatos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado } : c))
    );
    if (detalle?.id === id) setDetalle({ ...detalle, estado });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  const filtrados = filtro === "todos" ? candidatos : candidatos.filter((c) => c.estado === filtro);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidatos</h1>
          <p className="text-sm text-gray-500">{candidatos.length} solicitudes recibidas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        {["todos", "pendiente", "aprobado", "rechazado"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filtro === f ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Detalle modal */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{detalle.nombre}</h2>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <div><span className="text-xs text-gray-500">{tipoDocLabels[detalle.tipoDocumento] || "Documento"}:</span><p className="font-medium">{detalle.cedula}</p></div>
              <div><span className="text-xs text-gray-500">Email:</span><p className="font-medium">{detalle.email}</p></div>
              <div><span className="text-xs text-gray-500">Telefono:</span><p className="font-medium">{detalle.telefono}</p></div>
              <div><span className="text-xs text-gray-500">Puesto:</span><p className="font-medium capitalize">{detalle.puesto}</p></div>
              <div className="sm:col-span-2"><span className="text-xs text-gray-500">Direccion:</span><p className="font-medium">{detalle.direccion}</p></div>
              {detalle.licenciaConducir && (
                <div><span className="text-xs text-gray-500">Licencia de Conducir:</span><p className="font-medium">{detalle.licenciaConducir}</p></div>
              )}
              {detalle.experiencia && (
                <div className="sm:col-span-2"><span className="text-xs text-gray-500">Experiencia:</span><p className="font-medium">{detalle.experiencia}</p></div>
              )}
              {detalle.disponibilidad && (
                <div><span className="text-xs text-gray-500">Disponibilidad:</span><p className="font-medium">{detalle.disponibilidad}</p></div>
              )}
              <div><span className="text-xs text-gray-500">Fecha:</span><p className="font-medium">{new Date(detalle.createdAt).toLocaleDateString()}</p></div>
            </div>

            {/* Atestados */}
            <h3 className="mb-3 text-lg font-bold text-gray-900">Atestados ({detalle.atestados.length})</h3>
            {detalle.atestados.length === 0 ? (
              <p className="text-sm text-gray-400">No adjunto documentos</p>
            ) : (
              <div className="mb-6 space-y-2">
                {detalle.atestados.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {a.nombre}
                  </a>
                ))}
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
              <button onClick={() => actualizarEstado(detalle.id, "aprobado")} className="btn-primary flex-1">
                Aprobar
              </button>
              <button onClick={() => actualizarEstado(detalle.id, "rechazado")} className="btn-danger flex-1">
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        {filtrados.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay candidatos en esta categoria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Documento</th>
                  <th className="px-6 py-3">Puesto</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Docs</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map((c) => (
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
                      <button onClick={() => setDetalle(c)} className="text-sm font-medium text-primary-600 hover:text-primary-800">
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
