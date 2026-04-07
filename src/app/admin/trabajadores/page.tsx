"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Trabajador, UBICACIONES } from "@/types/models";
import { useApiGet } from "@/hooks/useApi";
import BuscadorTexto from "@/components/admin/BuscadorTexto";
import { TableSkeleton } from "@/components/Skeleton";
import Breadcrumb from "@/components/admin/Breadcrumb";

const DIAS = [
  { value: "1", label: "L" },
  { value: "2", label: "M" },
  { value: "3", label: "X" },
  { value: "4", label: "J" },
  { value: "5", label: "V" },
  { value: "6", label: "S" },
  { value: "7", label: "D" },
];

function formatearHorario(t: Trabajador): string {
  if (!t.horaInicio || !t.horaFin) return "Sin horario";
  const dias = (t.diasSemana || "")
    .split(",")
    .filter(Boolean)
    .map((d) => DIAS.find((dd) => dd.value === d)?.label || "")
    .join("");
  return `${t.horaInicio}-${t.horaFin}${dias ? " " + dias : ""}`;
}

export default function TrabajadoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [codigoMostrado, setCodigoMostrado] = useState<{ nombre: string; codigo: string } | null>(null);
  const [q, setQ] = useState("");
  const [editando, setEditando] = useState<Trabajador | null>(null);
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);

  const isAdmin = session?.user?.role === "admin";
  const url = isAdmin ? `/api/admin/trabajadores${q.trim() ? "?q=" + encodeURIComponent(q.trim()) : ""}` : null;
  const { data: trabajadores, mutate } = useApiGet<Trabajador[]>(url);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);
    const dias = form.getAll("diasSemana") as string[];
    const data: Record<string, unknown> = Object.fromEntries(
      Array.from(form.entries()).filter(([k]) => k !== "diasSemana")
    );
    data.diasSemana = dias.join(",");

    const res = await fetch("/api/admin/trabajadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const trabajador = await res.json();
      setShowForm(false);
      setCodigoMostrado({ nombre: trabajador.nombre, codigo: trabajador.codigoActivacion });
      mutate();
    }
    setFormLoading(false);
  }, [mutate]);

  const toggleActivo = useCallback(async (id: string, activo: boolean) => {
    await fetch(`/api/admin/trabajadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    mutate();
  }, [mutate]);

  const handleDelete = useCallback(async (id: string, nombre: string) => {
    if (!confirm(`¿Estas seguro de eliminar a ${nombre}? Esta accion no se puede deshacer y se eliminaran todos sus registros.`)) return;
    await fetch(`/api/admin/trabajadores/${id}`, { method: "DELETE" });
    mutate();
  }, [mutate]);

  const revocarBiometria = useCallback(async (id: string, nombre: string) => {
    if (!confirm(`¿Revocar la biometria de ${nombre}? Se eliminaran todas sus credenciales biometricas y debera registrarse nuevamente con un nuevo codigo de activacion.`)) return;
    const res = await fetch(`/api/admin/trabajadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revocarBiometria: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setCodigoMostrado({ nombre: data.nombre, codigo: data.codigoActivacion });
      mutate();
    }
  }, [mutate]);

  const regenerarCodigo = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/trabajadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerarCodigo: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setCodigoMostrado({ nombre: data.nombre, codigo: data.codigoActivacion });
      mutate();
    }
  }, [mutate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditando(null);
    };
    if (editando) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [editando]);

  const abrirEditor = useCallback((t: Trabajador) => {
    setEditando(t);
    setDiasSeleccionados((t.diasSemana || "").split(",").filter(Boolean));
  }, []);

  const guardarEdicion = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editando) return;
    const form = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      nombre: form.get("nombre") as string,
      cedula: form.get("cedula") as string,
      email: form.get("email") as string,
      telefono: form.get("telefono") as string,
      puesto: form.get("puesto") as string,
      ubicacion: form.get("ubicacion") as string,
      horaInicio: (form.get("horaInicio") as string) || null,
      horaFin: (form.get("horaFin") as string) || null,
      toleranciaMin: parseInt(form.get("toleranciaMin") as string) || 15,
      diasSemana: diasSeleccionados.join(","),
    };

    await fetch(`/api/admin/trabajadores/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditando(null);
    mutate();
  }, [editando, diasSeleccionados, mutate]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <TableSkeleton columns={9} rows={5} />
      </div>
    );
  }

  if (!isAdmin) return null;

  const total = trabajadores?.length || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Trabajadores" }]} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-sm text-gray-500">{total} trabajadores registrados</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <BuscadorTexto value={q} onChange={setQ} />
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? "Cancelar" : "+ Nuevo Trabajador"}
          </button>
        </div>
      </div>

      {/* Codigo de activacion generado */}
      {codigoMostrado && (
        <div className="card mb-8 border-2 border-green-300 bg-green-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-800">Codigo de Activacion Generado</h3>
              <p className="text-sm text-green-700 mt-1">
                Entrega este codigo a <span className="font-semibold">{codigoMostrado.nombre}</span> para que active su cuenta:
              </p>
              <div className="mt-3 inline-block rounded-lg bg-white border-2 border-green-400 px-6 py-3">
                <span className="font-mono text-2xl font-bold tracking-wider text-green-800">{codigoMostrado.codigo}</span>
              </div>
              <p className="mt-2 text-xs text-green-600">
                El trabajador debe ir a la pagina de activacion, ingresar su cedula y este codigo para registrar su biometria.
              </p>
            </div>
            <button onClick={() => setCodigoMostrado(null)} className="text-green-400 hover:text-green-600" aria-label="Cerrar">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-8 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Registrar Trabajador</h2>
          <p className="text-sm text-gray-500">Al crear el trabajador se generara un codigo de activacion para que registre su acceso biometrico.</p>
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
              <select name="ubicacion" className="input-field" required defaultValue="">
                <option value="" disabled>Seleccionar ubicacion</option>
                {UBICACIONES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Horario laboral (opcional)</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Hora inicio</label>
                <input name="horaInicio" type="time" className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Hora fin</label>
                <input name="horaFin" type="time" className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tolerancia (min)</label>
                <input name="toleranciaMin" type="number" defaultValue="15" min="0" className="input-field" />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-2 block text-xs font-medium text-gray-600">Dias de la semana</label>
              <div className="flex gap-2">
                {DIAS.map((d) => (
                  <label key={d.value} className="flex cursor-pointer items-center justify-center">
                    <input type="checkbox" name="diasSemana" value={d.value} className="peer sr-only" />
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:text-white">
                      {d.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={formLoading}>
            {formLoading ? "Creando..." : "Crear Trabajador"}
          </button>
        </form>
      )}

      {/* Modal de edicion de trabajador */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Editar Trabajador</h2>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={guardarEdicion} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                  <input name="nombre" defaultValue={editando.nombre} className="input-field" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cedula</label>
                  <input name="cedula" defaultValue={editando.cedula} className="input-field" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input name="email" type="email" defaultValue={editando.email} className="input-field" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
                  <input name="telefono" defaultValue={editando.telefono} className="input-field" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Puesto</label>
                  <select name="puesto" defaultValue={editando.puesto} className="input-field" required>
                    <option value="seguridad">Seguridad</option>
                    <option value="limpieza">Limpieza</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ubicacion</label>
                  <select name="ubicacion" defaultValue={editando.ubicacion} className="input-field" required>
                    {UBICACIONES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Horario laboral</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Hora inicio</label>
                    <input name="horaInicio" type="time" defaultValue={editando.horaInicio || ""} className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Hora fin</label>
                    <input name="horaFin" type="time" defaultValue={editando.horaFin || ""} className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Tolerancia (min)</label>
                    <input name="toleranciaMin" type="number" defaultValue={editando.toleranciaMin || 15} min="0" className="input-field" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-2 block text-xs font-medium text-gray-600">Dias de la semana</label>
                  <div className="flex gap-2">
                    {DIAS.map((d) => (
                      <button
                        type="button"
                        key={d.value}
                        onClick={() =>
                          setDiasSeleccionados((prev) =>
                            prev.includes(d.value) ? prev.filter((x) => x !== d.value) : [...prev, d.value]
                          )
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium ${
                          diasSeleccionados.includes(d.value)
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-gray-300 bg-white text-gray-600"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Guardar Cambios</button>
                <button type="button" onClick={() => setEditando(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {!trabajadores ? (
          <div className="card p-8 text-center text-gray-400">Cargando...</div>
        ) : trabajadores.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No hay trabajadores registrados.</div>
        ) : (
          trabajadores.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.nombre}</p>
                  <p className="text-xs capitalize text-gray-400">{t.puesto}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {t.biometriaRegistrada ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Bio</span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Sin Bio</span>
                  )}
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    !t.activo
                      ? "bg-gray-100 text-gray-600"
                      : t.enServicio
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                  }`}>
                    {!t.activo ? "Inactivo" : t.enServicio ? "Activo" : "Ausente"}
                  </span>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <p>Cedula: {t.cedula}</p>
                <p>Ubicacion: {t.ubicacion}</p>
                <p>Horario: {formatearHorario(t)}</p>
                {t.enServicio && t.ubicacionActual && (
                  <p className="font-medium text-primary-600">En: {t.ubicacionActual}</p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => abrirEditor(t)}
                  className="text-xs font-medium text-primary-600 hover:text-primary-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActivo(t.id, t.activo)}
                  className={`text-xs font-medium ${t.activo ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                >
                  {t.activo ? "Desactivar" : "Activar"}
                </button>
                {!t.biometriaRegistrada && (
                  <button
                    onClick={() => regenerarCodigo(t.id)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800"
                  >
                    Codigo
                  </button>
                )}
                {t.biometriaRegistrada && (
                  <button
                    onClick={() => revocarBiometria(t.id, t.nombre)}
                    className="text-xs font-medium text-amber-600 hover:text-amber-800"
                  >
                    Revocar Bio
                  </button>
                )}
                <button
                  onClick={() => handleDelete(t.id, t.nombre)}
                  className="text-xs font-medium text-red-400 hover:text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla (desktop) */}
      <div className="card hidden md:block overflow-hidden p-0">
        {!trabajadores ? (
          <TableSkeleton columns={9} rows={5} />
        ) : trabajadores.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay trabajadores registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-3 py-3">Nombre</th>
                  <th scope="col" className="px-3 py-3">Cedula</th>
                  <th scope="col" className="px-3 py-3">Ubicacion</th>
                  <th scope="col" className="px-3 py-3">Horario</th>
                  <th scope="col" className="px-3 py-3 text-center">Bio</th>
                  <th scope="col" className="px-3 py-3 text-center">Estado</th>
                  <th scope="col" className="px-3 py-3 text-center">Dias</th>
                  <th scope="col" className="px-3 py-3 text-center">Horas</th>
                  <th scope="col" className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trabajadores.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.nombre}</p>
                        <p className="text-xs capitalize text-gray-400">{t.puesto}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">{t.cedula}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{t.ubicacion}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      <button onClick={() => abrirEditor(t)} className="text-primary-600 hover:text-primary-800">
                        {formatearHorario(t)}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {t.biometriaRegistrada ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Si</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">No</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          !t.activo
                            ? "bg-gray-100 text-gray-600"
                            : t.enServicio
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}>
                          {!t.activo ? "Inactivo" : t.enServicio ? "Activo" : "Ausente"}
                        </span>
                        {t.enServicio && t.ubicacionActual && (
                          <p className="mt-1 text-xs font-medium text-primary-600">{t.ubicacionActual}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-500">{t.diasTrabajados}</td>
                    <td className="px-3 py-3 text-center text-sm text-gray-500">{t.horasTotales}h</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirEditor(t)}
                            className="text-xs font-medium text-primary-600 hover:text-primary-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleActivo(t.id, t.activo)}
                            className={`text-xs font-medium ${t.activo ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                          >
                            {t.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {!t.biometriaRegistrada && (
                            <button
                              onClick={() => regenerarCodigo(t.id)}
                              className="text-xs font-medium text-primary-600 hover:text-primary-800"
                            >
                              Codigo
                            </button>
                          )}
                          {t.biometriaRegistrada && (
                            <button
                              onClick={() => revocarBiometria(t.id, t.nombre)}
                              className="text-xs font-medium text-amber-600 hover:text-amber-800"
                            >
                              Revocar Bio
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t.id, t.nombre)}
                            className="text-xs font-medium text-red-400 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
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
