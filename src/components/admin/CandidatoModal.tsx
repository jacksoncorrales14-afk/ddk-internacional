"use client";

import { useEffect, useRef, useState } from "react";
import { Candidato, Ubicacion, tipoDocLabels, calcularPuntaje, getMedalla } from "@/types/models";
import { useApiGet } from "@/hooks/useApi";

const tipoAtestadoLabels: Record<string, string> = {
  cv: "Curriculum Vitae",
  "hoja-delincuencia": "Hoja de Delincuencia",
  "documento-identificacion": "Documento de Identificacion",
  "foto-pasaporte": "Foto Pasaporte",
  otro: "Otro",
};

function calcularEdad(fecha: string | null): number | null {
  if (!fecha) return null;
  const hoy = new Date();
  const nacimiento = new Date(fecha);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

interface CandidatoModalProps {
  candidato: Candidato;
  onClose: () => void;
  onAprobar: (
    id: string,
    data: { ubicacion: string; horaInicio?: string; horaFin?: string; diasSemana?: string; toleranciaMin?: number }
  ) => Promise<{ codigoActivacion?: string } | void>;
  onRechazar: (id: string) => void;
}

const DIAS = [
  { value: "1", label: "L" },
  { value: "2", label: "M" },
  { value: "3", label: "X" },
  { value: "4", label: "J" },
  { value: "5", label: "V" },
  { value: "6", label: "S" },
  { value: "7", label: "D" },
];

export default function CandidatoModal({ candidato, onClose, onAprobar, onRechazar }: CandidatoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [modo, setModo] = useState<"detalle" | "aprobacion" | "codigo">("detalle");
  const [ubicacion, setUbicacion] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [toleranciaMin, setToleranciaMin] = useState("15");
  const [loading, setLoading] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: ubicacionesData } = useApiGet<Ubicacion[]>("/api/admin/ubicaciones");
  const ubicacionesNombres = (ubicacionesData || []).filter((u) => u.activa).map((u) => u.nombre);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function confirmarAprobacion() {
    if (!ubicacion) {
      setError("Selecciona una ubicacion");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await onAprobar(candidato.id, {
        ubicacion,
        horaInicio: horaInicio || undefined,
        horaFin: horaFin || undefined,
        diasSemana: diasSeleccionados.join(",") || undefined,
        toleranciaMin: parseInt(toleranciaMin) || 15,
      });
      if (res?.codigoActivacion) {
        setCodigoGenerado(res.codigoActivacion);
        setModo("codigo");
      } else {
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aprobar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div ref={modalRef} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900">{candidato.nombre}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {modo === "detalle" && (() => {
          const puntaje = calcularPuntaje(candidato);
          const medalla = getMedalla(candidato);
          const edad = calcularEdad(candidato.fechaNacimiento);
          const medallaColores = { oro: "bg-yellow-100 text-yellow-800 border-yellow-300", plata: "bg-gray-100 text-gray-700 border-gray-300", bronce: "bg-orange-100 text-orange-800 border-orange-300" };
          const medallaIconos = { oro: "🥇", plata: "🥈", bronce: "🥉" };

          return (
            <>
              {/* Score y Medalla */}
              <div className={`mb-4 flex items-center justify-between rounded-lg border p-3 ${medallaColores[medalla]}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{medallaIconos[medalla]}</span>
                  <div>
                    <span className="text-sm font-semibold capitalize">Medalla {medalla}</span>
                    <p className="text-xs opacity-75">Puntaje: {puntaje} pts</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                  candidato.estado === "pendiente" ? "bg-amber-100 text-amber-700" :
                  candidato.estado === "aprobado" ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {candidato.estado}
                </span>
              </div>

              {/* Datos Personales */}
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Datos Personales</h3>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div><span className="text-xs text-gray-500">{tipoDocLabels[candidato.tipoDocumento] || "Documento"}:</span><p className="font-medium">{candidato.cedula}</p></div>
                {candidato.paisOrigen && (
                  <div><span className="text-xs text-gray-500">Pais de Origen:</span><p className="font-medium">{candidato.paisOrigen}</p></div>
                )}
                <div><span className="text-xs text-gray-500">Email:</span><p className="font-medium">{candidato.email}</p></div>
                <div><span className="text-xs text-gray-500">Telefono:</span><p className="font-medium">{candidato.telefono}</p></div>
                {candidato.fechaNacimiento && (
                  <div><span className="text-xs text-gray-500">Fecha de Nacimiento:</span><p className="font-medium">{new Date(candidato.fechaNacimiento).toLocaleDateString()} {edad !== null && <span className="text-gray-500">({edad} anos)</span>}</p></div>
                )}
                <div className="sm:col-span-2"><span className="text-xs text-gray-500">Direccion:</span><p className="font-medium">{candidato.direccion}</p></div>
              </div>

              {/* Puesto y Experiencia */}
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Puesto y Experiencia</h3>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div><span className="text-xs text-gray-500">Puesto:</span><p className="font-medium capitalize">{candidato.puesto}</p></div>
                <div><span className="text-xs text-gray-500">Anos de Experiencia:</span><p className="font-medium">{candidato.aniosExperiencia}</p></div>
                {candidato.disponibilidad && (
                  <div><span className="text-xs text-gray-500">Disponibilidad:</span><p className="font-medium">{candidato.disponibilidad}</p></div>
                )}
                <div><span className="text-xs text-gray-500">Fecha de Aplicacion:</span><p className="font-medium">{new Date(candidato.createdAt).toLocaleDateString()}</p></div>
                {candidato.experiencia && (
                  <div className="sm:col-span-2"><span className="text-xs text-gray-500">Experiencia Laboral:</span><p className="font-medium whitespace-pre-line">{candidato.experiencia}</p></div>
                )}
              </div>

              {/* Certificaciones */}
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Certificaciones</h3>
              <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <div className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${candidato.portacionArma ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
                  <span>{candidato.portacionArma ? "✓" : "✗"}</span>
                  <span>Portacion de Arma</span>
                </div>
                <div className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${candidato.licenciaConducir ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
                  <span>{candidato.licenciaConducir ? "✓" : "✗"}</span>
                  <span>Licencia {candidato.licenciaConducir || "N/A"}</span>
                </div>
                <div className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${candidato.cursoBasicoPolicial ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
                  <span>{candidato.cursoBasicoPolicial ? "✓" : "✗"}</span>
                  <span>Curso Policial</span>
                </div>
              </div>

              {/* Documentos / Atestados */}
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Documentos ({candidato.atestados.length})</h3>
              {candidato.atestados.length === 0 ? (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                  No se encontraron documentos adjuntos. Es posible que haya ocurrido un error durante la carga de archivos.
                </div>
              ) : (
                <div className="mb-4 space-y-2">
                  {candidato.atestados.map((a) => {
                    const urlValida = typeof a.url === "string" && a.url.startsWith("http");
                    const contenido = (
                      <>
                        <svg className="h-5 w-5 shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium truncate ${urlValida ? "text-primary-600" : "text-gray-500"}`}>
                            {tipoAtestadoLabels[a.tipo] || a.tipo}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{a.nombre}</p>
                        </div>
                        <span className={`shrink-0 text-xs ${urlValida ? "text-gray-400" : "text-amber-600"}`}>
                          {urlValida ? "Ver" : "No disponible"}
                        </span>
                      </>
                    );

                    return urlValida ? (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm transition-colors hover:bg-primary-50"
                      >
                        {contenido}
                      </a>
                    ) : (
                      <div
                        key={a.id}
                        title="El archivo no se pudo cargar correctamente. Pide al candidato que lo suba de nuevo."
                        className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm cursor-not-allowed"
                      >
                        {contenido}
                      </div>
                    );
                  })}
                </div>
              )}

              {candidato.estado === "pendiente" ? (
                <div className="flex gap-3">
                  <button onClick={() => setModo("aprobacion")} className="btn-primary flex-1">
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("¿Estas seguro de rechazar este candidato?")) {
                        onRechazar(candidato.id);
                        onClose();
                      }
                    }}
                    className="btn-danger flex-1"
                  >
                    Rechazar
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-500">
                  Estado actual: <span className="font-semibold capitalize">{candidato.estado}</span>
                </div>
              )}
            </>
          );
        })()}

        {modo === "aprobacion" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              Al aprobar, se creara automaticamente un trabajador con un codigo de activacion para que registre su biometria.
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ubicacion asignada *</label>
              <select
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Seleccionar ubicacion</option>
                {ubicacionesNombres.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Horario laboral (opcional)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Hora inicio</label>
                  <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Hora fin</label>
                  <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Tolerancia</label>
                  <input type="number" value={toleranciaMin} onChange={(e) => setToleranciaMin(e.target.value)} min="0" className="input-field" />
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={confirmarAprobacion}
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                {loading ? "Creando trabajador..." : "Confirmar aprobacion"}
              </button>
              <button
                onClick={() => setModo("detalle")}
                disabled={loading}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Atras
              </button>
            </div>
          </div>
        )}

        {modo === "codigo" && codigoGenerado && (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-green-300 bg-green-50 p-6 text-center">
              <svg className="mx-auto mb-3 h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-bold text-green-800">Candidato aprobado</h3>
              <p className="mt-1 text-sm text-green-700">
                {candidato.nombre} ahora es un trabajador activo. Entregale este codigo de activacion:
              </p>
              <div className="mt-4 inline-block rounded-lg bg-white border-2 border-green-400 px-6 py-3">
                <span className="font-mono text-2xl font-bold tracking-wider text-green-800">
                  {codigoGenerado}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codigoGenerado);
                }}
                className="mt-3 block mx-auto text-xs text-green-700 underline hover:text-green-900"
              >
                Copiar al portapapeles
              </button>
            </div>

            <button onClick={onClose} className="btn-primary w-full">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
