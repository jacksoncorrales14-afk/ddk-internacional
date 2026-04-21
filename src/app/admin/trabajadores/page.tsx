"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Trabajador, Ubicacion } from "@/types/models";
import { useApiGet } from "@/hooks/useApi";
import BuscadorTexto from "@/components/admin/BuscadorTexto";
import { TableSkeleton } from "@/components/Skeleton";
import Breadcrumb from "@/components/admin/Breadcrumb";

const LICENCIAS = [
  { group: "Tipo A - Motocicletas", options: [
    { value: "A1", label: "A1 - Motocicletas menores de 125cc" },
    { value: "A2", label: "A2 - Motocicletas de 125cc en adelante" },
    { value: "A3", label: "A3 - Triciclos motorizados" },
  ]},
  { group: "Tipo B - Vehiculos livianos y buses", options: [
    { value: "B1", label: "B1 - Automoviles y microbuses (hasta 8 pasajeros)" },
    { value: "B2", label: "B2 - Vehiculos de carga liviana y taxis" },
    { value: "B3", label: "B3 - Buses de hasta 35 pasajeros" },
    { value: "B4", label: "B4 - Buses de mas de 35 pasajeros" },
  ]},
  { group: "Tipo C - Vehiculos de carga", options: [
    { value: "C2", label: "C2 - Camiones livianos y medianos" },
    { value: "C3", label: "C3 - Vehiculos pesados y articulados" },
  ]},
  { group: "Tipo D - Equipo especial", options: [
    { value: "D1", label: "D1 - Equipo especial liviano" },
    { value: "D2", label: "D2 - Equipo especial pesado" },
    { value: "D3", label: "D3 - Equipo especial agricola" },
  ]},
  { group: "Tipo E - Maquinaria", options: [
    { value: "E1", label: "E1 - Maquinaria agricola e industrial" },
  ]},
];

function LicenciaSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select name={name} defaultValue={defaultValue || ""} className="input-field">
      <option value="">No posee licencia</option>
      {LICENCIAS.map((g) => (
        <optgroup key={g.group} label={g.group}>
          {g.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

interface WorkerComponentProps {
  t: Trabajador;
  abrirEditor: (t: Trabajador) => void;
  toggleActivo: (id: string, activo: boolean) => void;
  resetearPassword: (id: string, nombre: string) => void;
  handleDelete: (id: string, nombre: string) => void;
}

function MobileWorkerCard({ t, abrirEditor, toggleActivo, resetearPassword, handleDelete }: WorkerComponentProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">{t.nombre}</p>
          <p className="text-xs capitalize text-gray-400">{t.puesto}</p>
        </div>
        <div className="flex items-center gap-1.5">
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
        {t.enServicio && t.ubicacionActual && (
          <p className="font-medium text-primary-600">En: {t.ubicacionActual}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
        <button onClick={() => abrirEditor(t)} className="text-xs font-medium text-primary-600 hover:text-primary-800">Editar</button>
        <button onClick={() => toggleActivo(t.id, t.activo)} className={`text-xs font-medium ${t.activo ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}>{t.activo ? "Desactivar" : "Activar"}</button>
        <button onClick={() => resetearPassword(t.id, t.nombre)} className="text-xs font-medium text-amber-600 hover:text-amber-800">Resetear Contraseña</button>
        <button onClick={() => handleDelete(t.id, t.nombre)} className="text-xs font-medium text-red-400 hover:text-red-600">Eliminar</button>
      </div>
    </div>
  );
}

function WorkerTableRow({ t, abrirEditor, toggleActivo, resetearPassword, handleDelete }: WorkerComponentProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{t.nombre}</p>
          <p className="text-xs capitalize text-gray-400">{t.puesto}</p>
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-gray-500">{t.cedula}</td>
      <td className="px-3 py-3 text-sm text-gray-500">{t.ubicacion}</td>
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
            <button onClick={() => abrirEditor(t)} className="text-xs font-medium text-primary-600 hover:text-primary-800">Editar</button>
            <button onClick={() => toggleActivo(t.id, t.activo)} className={`text-xs font-medium ${t.activo ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}>{t.activo ? "Desactivar" : "Activar"}</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => resetearPassword(t.id, t.nombre)} className="text-xs font-medium text-amber-600 hover:text-amber-800">Resetear Contraseña</button>
            <button onClick={() => handleDelete(t.id, t.nombre)} className="text-xs font-medium text-red-400 hover:text-red-600">Eliminar</button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function TrabajadoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [passwordMostrada, setPasswordMostrada] = useState<{ nombre: string; password: string } | null>(null);
  const [q, setQ] = useState("");
  const [editando, setEditando] = useState<Trabajador | null>(null);

  // Create form state
  const [createTipoDoc, setCreateTipoDoc] = useState("cedula");

  // Edit form state
  const [editTipoDoc, setEditTipoDoc] = useState("cedula");

  const [filtroUbicacion, setFiltroUbicacion] = useState<string>("Todos");
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});

  const isAdmin = session?.user?.role === "admin";
  const url = isAdmin ? `/api/admin/trabajadores${q.trim() ? "?q=" + encodeURIComponent(q.trim()) : ""}` : null;
  const { data: trabajadores, mutate } = useApiGet<Trabajador[]>(url);
  const { data: ubicaciones } = useApiGet<Ubicacion[]>(isAdmin ? "/api/admin/ubicaciones" : null);

  const ubicacionesNombres = (ubicaciones || []).filter((u) => u.activa).map((u) => u.nombre);

  const toggleSeccion = useCallback((nombre: string) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [nombre]: !prev[nombre] }));
  }, []);

  // Group workers by ubicacion
  const trabajadoresFiltrados = trabajadores
    ? filtroUbicacion === "Todos"
      ? trabajadores
      : trabajadores.filter((t) => t.ubicacion === filtroUbicacion)
    : null;

  const gruposPorUbicacion = (() => {
    if (!trabajadoresFiltrados || filtroUbicacion !== "Todos") return null;
    const grupos: Record<string, Trabajador[]> = {};
    for (const t of trabajadoresFiltrados) {
      const key = t.ubicacion || "Sin ubicacion";
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(t);
    }
    // Sort workers within each group alphabetically
    for (const key of Object.keys(grupos)) {
      grupos[key].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    // Sort groups by ubicacion name
    const sorted = Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
    return sorted;
  })();

  // When filtering by specific ubicacion, sort alphabetically
  const trabajadoresOrdenados = (() => {
    if (filtroUbicacion === "Todos" || !trabajadoresFiltrados) return trabajadoresFiltrados;
    return [...trabajadoresFiltrados].sort((a, b) => a.nombre.localeCompare(b.nombre));
  })();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const data: Record<string, unknown> = {};

      // Basic fields
      data.nombre = form.get("nombre") as string;
      data.cedula = form.get("cedula") as string;
      data.password = form.get("password") as string;
      data.email = form.get("email") as string;
      data.telefono = form.get("telefono") as string;
      data.puesto = form.get("puesto") as string;
      data.ubicacion = form.get("ubicacion") as string;

      // New personal fields
      data.tipoDocumento = form.get("tipoDocumento") as string;
      const fechaNac = form.get("fechaNacimiento") as string;
      if (fechaNac) data.fechaNacimiento = fechaNac;
      const paisOrigen = form.get("paisOrigen") as string;
      if (paisOrigen) data.paisOrigen = paisOrigen;
      const direccion = form.get("direccion") as string;
      if (direccion) data.direccion = direccion;

      // Experience fields
      const anios = form.get("aniosExperiencia") as string;
      if (anios) data.aniosExperiencia = parseInt(anios);
      const experiencia = form.get("experiencia") as string;
      if (experiencia) data.experiencia = experiencia;
      const disponibilidad = form.get("disponibilidad") as string;
      if (disponibilidad) data.disponibilidad = disponibilidad;

      // Certifications
      data.portacionArma = form.get("portacionArma") === "true";
      const licencia = form.get("licenciaConducir") as string;
      if (licencia) data.licenciaConducir = licencia;
      data.cursoBasicoPolicial = form.get("cursoBasicoPolicial") === "true";

      const res = await fetch("/api/admin/trabajadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await res.json();
        const passwordAsignada = data.password as string;
        const nombreCreado = data.nombre as string;
        setShowForm(false);
        setPasswordMostrada({ nombre: nombreCreado, password: passwordAsignada });
        setCreateTipoDoc("cedula");
        mutate();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Error al crear el trabajador");
      }
    } catch {
      alert("Error de conexion al crear el trabajador");
    } finally {
      setFormLoading(false);
    }
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

  const resetearPasswordFn = useCallback(async (id: string, nombre: string) => {
    const nuevaPassword = prompt(`Ingresa la nueva contraseña para ${nombre} (minimo 4 caracteres):`);
    if (!nuevaPassword || nuevaPassword.length < 4) {
      if (nuevaPassword !== null) alert("La contraseña debe tener al menos 4 caracteres");
      return;
    }
    const res = await fetch(`/api/admin/trabajadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetearPassword: nuevaPassword }),
    });
    if (res.ok) {
      setPasswordMostrada({ nombre, password: nuevaPassword });
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
    setEditTipoDoc(t.tipoDocumento || "cedula");
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
      tipoDocumento: form.get("tipoDocumento") as string || null,
      fechaNacimiento: (form.get("fechaNacimiento") as string) || null,
      paisOrigen: (form.get("paisOrigen") as string) || null,
      direccion: (form.get("direccion") as string) || null,
      // Experience fields
      aniosExperiencia: parseInt(form.get("aniosExperiencia") as string) || null,
      experiencia: (form.get("experiencia") as string) || null,
      disponibilidad: (form.get("disponibilidad") as string) || null,
      // Certifications
      portacionArma: form.get("portacionArma") === "true",
      licenciaConducir: (form.get("licenciaConducir") as string) || null,
      cursoBasicoPolicial: form.get("cursoBasicoPolicial") === "true",
    };

    await fetch(`/api/admin/trabajadores/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditando(null);
    mutate();
  }, [editando, mutate]);

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

      {/* Filtro por ubicacion */}
      {ubicacionesNombres.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroUbicacion("Todos")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filtroUbicacion === "Todos" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
          {ubicacionesNombres.map((u) => (
            <button
              key={u}
              onClick={() => setFiltroUbicacion(u)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filtroUbicacion === u ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      )}

      {/* Contraseña asignada */}
      {passwordMostrada && (
        <div className="card mb-8 border-2 border-green-300 bg-green-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-800">Contraseña Asignada</h3>
              <p className="text-sm text-green-700 mt-1">
                Entrega estas credenciales a <span className="font-semibold">{passwordMostrada.nombre}</span> para que ingrese al sistema:
              </p>
              <div className="mt-3 inline-block rounded-lg bg-white border-2 border-green-400 px-6 py-3">
                <span className="font-mono text-2xl font-bold tracking-wider text-green-800">{passwordMostrada.password}</span>
              </div>
              <p className="mt-2 text-xs text-green-600">
                El trabajador debe ingresar con su numero de cedula/pasaporte y esta contraseña.
              </p>
            </div>
            <button onClick={() => setPasswordMostrada(null)} className="text-green-400 hover:text-green-600" aria-label="Cerrar">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Registrar Trabajador</h2>
            <p className="text-sm text-gray-500">Asigna una contraseña unica al trabajador para que ingrese con su cedula/pasaporte.</p>
          </div>

          {/* Datos personales */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Datos Personales</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                <input name="nombre" className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Documento</label>
                <select
                  name="tipoDocumento"
                  className="input-field"
                  value={createTipoDoc}
                  onChange={(e) => setCreateTipoDoc(e.target.value)}
                >
                  <option value="cedula">Cedula</option>
                  <option value="pasaporte">Pasaporte</option>
                  <option value="dimex">DIMEX</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Numero de Documento</label>
                <input name="cedula" className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña de Acceso</label>
                <input name="password" type="text" className="input-field" required minLength={4} placeholder="Contraseña unica para el trabajador" />
              </div>
              {(createTipoDoc === "pasaporte" || createTipoDoc === "dimex") && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Pais de Origen</label>
                  <input name="paisOrigen" className="input-field" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                <input name="fechaNacimiento" type="date" className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
                <input name="telefono" className="input-field" required />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Direccion</label>
                <input name="direccion" className="input-field" />
              </div>
            </div>
          </div>

          {/* Puesto y ubicacion */}
          <div className="grid gap-4 sm:grid-cols-2">
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
                {ubicacionesNombres.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Experiencia */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Experiencia</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Anios de Experiencia</label>
                <input name="aniosExperiencia" type="number" min="0" className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Disponibilidad</label>
                <input name="disponibilidad" className="input-field" placeholder="Ej: Inmediata, 2 semanas..." />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Experiencia Laboral</label>
                <textarea name="experiencia" rows={3} className="input-field" placeholder="Describa su experiencia laboral..." />
              </div>
            </div>
          </div>

          {/* Certificaciones */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Certificaciones</h3>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50">
              <input name="portacionArma" type="checkbox" value="true" className="h-5 w-5 rounded border-gray-300 text-primary-600" />
              <div>
                <span className="text-sm font-medium text-gray-900">Portacion de Arma</span>
                <p className="text-xs text-gray-500">Permiso vigente de portacion de arma</p>
              </div>
            </label>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <label className="mb-2 block text-sm font-medium text-gray-900">Licencia de Conducir</label>
              <LicenciaSelect name="licenciaConducir" />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50">
              <input name="cursoBasicoPolicial" type="checkbox" value="true" className="h-5 w-5 rounded border-gray-300 text-primary-600" />
              <div>
                <span className="text-sm font-medium text-gray-900">Curso Basico Policial</span>
                <p className="text-xs text-gray-500">Certificacion de curso basico policial aprobado</p>
              </div>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={formLoading}>
            {formLoading ? "Creando..." : "Crear Trabajador"}
          </button>
        </form>
      )}

      {/* Modal de edicion de trabajador */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Editar Trabajador</h2>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={guardarEdicion} className="space-y-5">
              {/* Datos personales */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Datos Personales</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                    <input name="nombre" defaultValue={editando.nombre} className="input-field" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Documento</label>
                    <select
                      name="tipoDocumento"
                      className="input-field"
                      value={editTipoDoc}
                      onChange={(e) => setEditTipoDoc(e.target.value)}
                    >
                      <option value="cedula">Cedula</option>
                      <option value="pasaporte">Pasaporte</option>
                      <option value="dimex">DIMEX</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Numero de Documento</label>
                    <input name="cedula" defaultValue={editando.cedula} className="input-field" required />
                  </div>
                  {(editTipoDoc === "pasaporte" || editTipoDoc === "dimex") && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Pais de Origen</label>
                      <input name="paisOrigen" defaultValue={editando.paisOrigen || ""} className="input-field" />
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                    <input
                      name="fechaNacimiento"
                      type="date"
                      defaultValue={editando.fechaNacimiento ? editando.fechaNacimiento.slice(0, 10) : ""}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input name="email" type="email" defaultValue={editando.email} className="input-field" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
                    <input name="telefono" defaultValue={editando.telefono} className="input-field" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Direccion</label>
                    <input name="direccion" defaultValue={editando.direccion || ""} className="input-field" />
                  </div>
                </div>
              </div>

              {/* Puesto y ubicacion */}
              <div className="grid gap-4 sm:grid-cols-2">
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
                    {ubicacionesNombres.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Experiencia */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Experiencia</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Anios de Experiencia</label>
                    <input name="aniosExperiencia" type="number" min="0" defaultValue={editando.aniosExperiencia ?? ""} className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Disponibilidad</label>
                    <input name="disponibilidad" defaultValue={editando.disponibilidad || ""} className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Experiencia Laboral</label>
                    <textarea name="experiencia" rows={3} defaultValue={editando.experiencia || ""} className="input-field" />
                  </div>
                </div>
              </div>

              {/* Certificaciones */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Certificaciones</h3>
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50">
                  <input name="portacionArma" type="checkbox" value="true" defaultChecked={editando.portacionArma} className="h-5 w-5 rounded border-gray-300 text-primary-600" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Portacion de Arma</span>
                    <p className="text-xs text-gray-500">Permiso vigente de portacion de arma</p>
                  </div>
                </label>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="mb-2 block text-sm font-medium text-gray-900">Licencia de Conducir</label>
                  <LicenciaSelect name="licenciaConducir" defaultValue={editando.licenciaConducir || ""} />
                </div>
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50">
                  <input name="cursoBasicoPolicial" type="checkbox" value="true" defaultChecked={editando.cursoBasicoPolicial} className="h-5 w-5 rounded border-gray-300 text-primary-600" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Curso Basico Policial</span>
                    <p className="text-xs text-gray-500">Certificacion de curso basico policial aprobado</p>
                  </div>
                </label>
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
        {!trabajadoresFiltrados ? (
          <div className="card p-8 text-center text-gray-400">Cargando...</div>
        ) : trabajadoresFiltrados.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No hay trabajadores registrados.</div>
        ) : filtroUbicacion === "Todos" && gruposPorUbicacion ? (
          gruposPorUbicacion.map(([ubicacion, workers]) => (
            <div key={ubicacion}>
              <button
                onClick={() => toggleSeccion(ubicacion)}
                className="mb-2 flex w-full items-center justify-between rounded-lg bg-gray-100 px-4 py-2.5"
              >
                <span className="text-sm font-bold text-gray-700">{ubicacion} ({workers.length})</span>
                <svg className={`h-4 w-4 text-gray-500 transition-transform ${seccionesAbiertas[ubicacion] === false ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {seccionesAbiertas[ubicacion] !== false && (
                <div className="space-y-3 mb-4">
                  {workers.map((t) => (
                    <MobileWorkerCard key={t.id} t={t} abrirEditor={abrirEditor} toggleActivo={toggleActivo} resetearPassword={resetearPasswordFn} handleDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          (trabajadoresOrdenados || []).map((t) => (
            <MobileWorkerCard key={t.id} t={t} abrirEditor={abrirEditor} toggleActivo={toggleActivo} resetearPassword={resetearPasswordFn} handleDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Tabla (desktop) */}
      <div className="card hidden md:block overflow-hidden p-0">
        {!trabajadoresFiltrados ? (
          <TableSkeleton columns={9} rows={5} />
        ) : trabajadoresFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay trabajadores registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-3 py-3">Nombre</th>
                  <th scope="col" className="px-3 py-3">Cedula</th>
                  <th scope="col" className="px-3 py-3">Ubicacion</th>
                  <th scope="col" className="px-3 py-3 text-center">Estado</th>
                  <th scope="col" className="px-3 py-3 text-center">Dias</th>
                  <th scope="col" className="px-3 py-3 text-center">Horas</th>
                  <th scope="col" className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtroUbicacion === "Todos" && gruposPorUbicacion ? (
                  gruposPorUbicacion.map(([ubicacion, workers]) => (
                    <>
                      <tr key={`header-${ubicacion}`} className="bg-gray-100 cursor-pointer" onClick={() => toggleSeccion(ubicacion)}>
                        <td colSpan={7} className="px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700">{ubicacion} ({workers.length})</span>
                            <svg className={`h-4 w-4 text-gray-500 transition-transform ${seccionesAbiertas[ubicacion] === false ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </td>
                      </tr>
                      {seccionesAbiertas[ubicacion] !== false && workers.map((t) => (
                        <WorkerTableRow key={t.id} t={t} abrirEditor={abrirEditor} toggleActivo={toggleActivo} resetearPassword={resetearPasswordFn} handleDelete={handleDelete} />
                      ))}
                    </>
                  ))
                ) : (
                  (trabajadoresOrdenados || []).map((t) => (
                    <WorkerTableRow key={t.id} t={t} abrirEditor={abrirEditor} toggleActivo={toggleActivo} resetearPassword={resetearPasswordFn} handleDelete={handleDelete} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
