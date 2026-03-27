"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trabajador } from "@/types/models";

export default function TrabajadoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") fetchTrabajadores();
  }, [session]);

  const fetchTrabajadores = () => {
    fetch("/api/admin/trabajadores")
      .then((r) => r.json())
      .then(setTrabajadores)
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);

    const res = await fetch("/api/admin/trabajadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setShowForm(false);
      fetchTrabajadores();
    }
    setFormLoading(false);
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    await fetch(`/api/admin/trabajadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    fetchTrabajadores();
  };

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-sm text-gray-500">{trabajadores.length} trabajadores registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancelar" : "+ Nuevo Trabajador"}
        </button>
      </div>

      {/* Form nuevo trabajador */}
      {showForm && (
        <form onSubmit={handleCreate} className="card mb-8 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Registrar Trabajador</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
              <input name="nombre" className="input-field" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cedula</label>
              <input name="cedula" className="input-field" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input name="email" type="email" className="input-field" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
              <input name="telefono" className="input-field" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Puesto</label>
              <select name="puesto" className="input-field" required>
                <option value="seguridad">Seguridad</option>
                <option value="limpieza">Limpieza</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ubicacion Asignada</label>
              <input name="ubicacion" className="input-field" placeholder="Ej: Edificio Central" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
              <input name="password" type="password" className="input-field" required />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={formLoading}>
            {formLoading ? "Creando..." : "Crear Trabajador"}
          </button>
        </form>
      )}

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        {trabajadores.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay trabajadores registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Cedula</th>
                  <th className="px-6 py-3">Puesto</th>
                  <th className="px-6 py-3">Ubicacion</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Dias Trabajados</th>
                  <th className="px-6 py-3">Horas Totales</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trabajadores.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{t.cedula}</td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-500">{t.puesto}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{t.ubicacion}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        !t.activo
                          ? "bg-gray-100 text-gray-600"
                          : t.enServicio
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}>
                        {!t.activo ? "Inactivo" : t.enServicio ? "Activo" : "Ausente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{t.diasTrabajados}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{t.horasTotales}h</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActivo(t.id, t.activo)}
                        className={`text-sm font-medium ${t.activo ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                      >
                        {t.activo ? "Desactivar" : "Activar"}
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
