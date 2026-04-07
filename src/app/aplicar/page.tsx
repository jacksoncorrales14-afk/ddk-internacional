"use client";

import { useState } from "react";

function calcularEdad(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth() - nacimiento.getMonth();
  if (mesActual < 0 || (mesActual === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export default function AplicarPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("cedula");
  const [archivoCV, setArchivoCV] = useState<File | null>(null);
  const [archivoDelincuencia, setArchivoDelincuencia] = useState<File | null>(null);
  const [archivoDocumento, setArchivoDocumento] = useState<File | null>(null);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Agregar archivos con su tipo
    if (archivoCV) {
      formData.append("archivos", archivoCV);
      formData.append("tiposArchivo", "cv");
    }
    if (archivoDelincuencia) {
      formData.append("archivos", archivoDelincuencia);
      formData.append("tiposArchivo", "hoja-delincuencia");
    }
    if (archivoDocumento) {
      formData.append("archivos", archivoDocumento);
      formData.append("tiposArchivo", "documento-identificacion");
    }
    if (archivoFoto) {
      formData.append("archivos", archivoFoto);
      formData.append("tiposArchivo", "foto-pasaporte");
    }

    try {
      const res = await fetch("/api/candidatos", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al enviar la solicitud");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900" role="alert">Solicitud Enviada</h2>
          <p className="text-gray-500">
            Tu solicitud ha sido recibida exitosamente. Nuestro equipo revisara tus datos
            y te contactara pronto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Aplicar a un Puesto</h1>
        <p className="text-gray-500">Completa el formulario con tus datos y sube tus atestados</p>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Datos Personales</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input name="nombre" type="text" className="input-field" placeholder="Tu nombre completo" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo de Documento <span className="text-red-500">*</span>
            </label>
            <select
              name="tipoDocumento"
              className="input-field"
              required
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
            >
              <option value="cedula">Cedula</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="dimex">DIMEX</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Numero de Documento <span className="text-red-500">*</span>
            </label>
            <input name="cedula" type="text" className="input-field" placeholder="Numero de documento" required />
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Importante:</span> Asegurese de seleccionar correctamente el tipo de documento de identificacion y que el numero coincida con el documento fisico. Datos incorrectos pueden retrasar o invalidar su solicitud.
          </p>
        </div>

        {(tipoDocumento === "pasaporte" || tipoDocumento === "dimex") && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pais de Origen <span className="text-red-500">*</span>
            </label>
            <input name="paisOrigen" type="text" className="input-field" placeholder="Ej: Nicaragua, Colombia, Venezuela..." required />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" className="input-field" placeholder="tu@email.com" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Telefono <span className="text-red-500">*</span>
            </label>
            <input name="telefono" type="tel" className="input-field" placeholder="8888-8888" required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Direccion Exacta <span className="text-red-500">*</span>
          </label>
          <input name="direccion" type="text" className="input-field" placeholder="Provincia, canton, distrito, senas exactas" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fecha de Nacimiento <span className="text-red-500">*</span>
            </label>
            <input
              name="fechaNacimiento"
              type="date"
              className="input-field"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="flex items-end">
            {fechaNacimiento && (
              <div className="w-full rounded-lg bg-primary-50 border border-primary-200 px-4 py-2.5 text-center">
                <span className="text-sm text-primary-600">Edad: </span>
                <span className="text-lg font-bold text-primary-800">{calcularEdad(fechaNacimiento)} anos</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Puesto al que Aplica</label>
          <select name="puesto" className="input-field" required>
            <option value="">Seleccionar...</option>
            <option value="seguridad">Seguridad</option>
            <option value="limpieza">Limpieza</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Anos de Experiencia</label>
            <input name="aniosExperiencia" type="number" min="0" className="input-field" placeholder="0" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Disponibilidad</label>
            <input name="disponibilidad" type="text" className="input-field" placeholder="Ej: Lunes a Viernes, turnos rotativos" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Experiencia Laboral</label>
          <textarea
            name="experiencia"
            className="input-field"
            rows={3}
            placeholder="Describe brevemente tu experiencia laboral relevante"
          />
        </div>

        <hr className="border-gray-200" />

        <h2 className="text-lg font-bold text-gray-900">Certificaciones</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
            <input name="portacionArma" type="checkbox" value="true" className="h-5 w-5 rounded border-gray-300 text-primary-600" />
            <div>
              <span className="text-sm font-medium text-gray-900">Portacion de Arma</span>
              <p className="text-xs text-gray-500">Permiso vigente de portacion de arma de fuego</p>
            </div>
          </label>

          <div className="rounded-lg border border-gray-200 p-3">
            <label className="mb-2 block text-sm font-medium text-gray-900">Licencia de Conducir</label>
            <select name="licenciaConducir" className="input-field">
              <option value="">No poseo licencia</option>
              <optgroup label="Tipo A - Motocicletas">
                <option value="A1">A1 - Motocicletas menores de 125cc</option>
                <option value="A2">A2 - Motocicletas de 125cc en adelante</option>
                <option value="A3">A3 - Triciclos motorizados</option>
              </optgroup>
              <optgroup label="Tipo B - Vehiculos livianos y buses">
                <option value="B1">B1 - Automoviles y microbuses (hasta 8 pasajeros)</option>
                <option value="B2">B2 - Vehiculos de carga liviana y taxis</option>
                <option value="B3">B3 - Buses de hasta 35 pasajeros</option>
                <option value="B4">B4 - Buses de mas de 35 pasajeros</option>
              </optgroup>
              <optgroup label="Tipo C - Vehiculos de carga">
                <option value="C2">C2 - Camiones livianos y medianos</option>
                <option value="C3">C3 - Vehiculos pesados y articulados</option>
              </optgroup>
              <optgroup label="Tipo D - Equipo especial">
                <option value="D1">D1 - Equipo especial liviano</option>
                <option value="D2">D2 - Equipo especial pesado</option>
                <option value="D3">D3 - Equipo especial agricola</option>
              </optgroup>
              <optgroup label="Tipo E - Maquinaria">
                <option value="E1">E1 - Maquinaria agricola e industrial</option>
              </optgroup>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
            <input name="cursoBasicoPolicial" type="checkbox" value="true" className="h-5 w-5 rounded border-gray-300 text-primary-600" />
            <div>
              <span className="text-sm font-medium text-gray-900">Curso Basico Policial</span>
              <p className="text-xs text-gray-500">Certificacion de curso basico policial aprobado</p>
            </div>
          </label>
        </div>

        <hr className="border-gray-200" />

        <h2 className="text-lg font-bold text-gray-900">Documentos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sube los siguientes documentos en formato PDF, JPG o PNG.
        </p>
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 mb-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-red-800">
            <span className="font-semibold">Obligatorio:</span> La <span className="font-semibold">Hoja de Delincuencia</span> y la <span className="font-semibold">Copia del Documento de Identificacion</span> son requisitos indispensables para que su solicitud sea tomada en cuenta.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-900">Curriculum Vitae (CV)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setArchivoCV(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
            />
            {archivoCV && <p className="mt-1 text-xs text-gray-500">{archivoCV.name} ({(archivoCV.size / 1024).toFixed(0)} KB)</p>}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-900">Hoja de Delincuencia</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setArchivoDelincuencia(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
            />
            {archivoDelincuencia && <p className="mt-1 text-xs text-gray-500">{archivoDelincuencia.name} ({(archivoDelincuencia.size / 1024).toFixed(0)} KB)</p>}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-900">Copia del Documento de Identificacion</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setArchivoDocumento(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
            />
            {archivoDocumento && <p className="mt-1 text-xs text-gray-500">{archivoDocumento.name} ({(archivoDocumento.size / 1024).toFixed(0)} KB)</p>}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-900">Fotografia Tamano Pasaporte</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => setArchivoFoto(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
            />
            {archivoFoto && <p className="mt-1 text-xs text-gray-500">{archivoFoto.name} ({(archivoFoto.size / 1024).toFixed(0)} KB)</p>}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar Solicitud"}
        </button>
      </form>
    </div>
  );
}
