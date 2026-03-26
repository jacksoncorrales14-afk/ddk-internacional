"use client";

import { useState } from "react";

export default function AplicarPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Agregar archivos
    archivos.forEach((archivo) => {
      formData.append("archivos", archivo);
    });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(Array.from(e.target.files));
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Solicitud Enviada</h2>
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
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Datos Personales</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input name="nombre" type="text" className="input-field" placeholder="Tu nombre completo" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cedula</label>
            <input name="cedula" type="text" className="input-field" placeholder="Numero de cedula" required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" className="input-field" placeholder="tu@email.com" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
            <input name="telefono" type="tel" className="input-field" placeholder="8888-8888" required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Direccion</label>
          <input name="direccion" type="text" className="input-field" placeholder="Tu direccion completa" required />
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Años de Experiencia</label>
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
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
            <input name="licenciaConducir" type="checkbox" value="true" className="h-5 w-5 rounded border-gray-300 text-primary-600" />
            <div>
              <span className="text-sm font-medium text-gray-900">Licencia de Conducir</span>
              <p className="text-xs text-gray-500">Licencia de conducir vigente</p>
            </div>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
            <input name="cursoBasicoPolicial" type="checkbox" value="true" className="h-5 w-5 rounded border-gray-300 text-primary-600" />
            <div>
              <span className="text-sm font-medium text-gray-900">Curso Basico Policial</span>
              <p className="text-xs text-gray-500">Certificacion de curso basico policial aprobado</p>
            </div>
          </label>
        </div>

        <hr className="border-gray-200" />

        <h2 className="text-lg font-bold text-gray-900">Atestados / Documentos</h2>
        <p className="text-sm text-gray-500">
          Sube tu cedula, antecedentes penales, curriculum, certificaciones u otros documentos relevantes.
          Puedes seleccionar varios archivos.
        </p>

        <div>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-200"
          />
          {archivos.length > 0 && (
            <div className="mt-3 space-y-1">
              {archivos.map((f, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {f.name} ({(f.size / 1024).toFixed(0)} KB)
                </p>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar Solicitud"}
        </button>
      </form>
    </div>
  );
}
