"use client";

import { useEffect, useRef } from "react";
import { Candidato, tipoDocLabels } from "@/types/models";

interface CandidatoModalProps {
  candidato: Candidato;
  onClose: () => void;
  onActualizarEstado: (id: string, estado: string) => void;
}

export default function CandidatoModal({ candidato, onClose, onActualizarEstado }: CandidatoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    modalRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div ref={modalRef} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900">{candidato.nombre}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div><span className="text-xs text-gray-500">{tipoDocLabels[candidato.tipoDocumento] || "Documento"}:</span><p className="font-medium">{candidato.cedula}</p></div>
          <div><span className="text-xs text-gray-500">Email:</span><p className="font-medium">{candidato.email}</p></div>
          <div><span className="text-xs text-gray-500">Telefono:</span><p className="font-medium">{candidato.telefono}</p></div>
          <div><span className="text-xs text-gray-500">Puesto:</span><p className="font-medium capitalize">{candidato.puesto}</p></div>
          <div className="sm:col-span-2"><span className="text-xs text-gray-500">Direccion:</span><p className="font-medium">{candidato.direccion}</p></div>
          {candidato.licenciaConducir && (
            <div><span className="text-xs text-gray-500">Licencia de Conducir:</span><p className="font-medium">{candidato.licenciaConducir}</p></div>
          )}
          {candidato.experiencia && (
            <div className="sm:col-span-2"><span className="text-xs text-gray-500">Experiencia:</span><p className="font-medium">{candidato.experiencia}</p></div>
          )}
          {candidato.disponibilidad && (
            <div><span className="text-xs text-gray-500">Disponibilidad:</span><p className="font-medium">{candidato.disponibilidad}</p></div>
          )}
          <div><span className="text-xs text-gray-500">Fecha:</span><p className="font-medium">{new Date(candidato.createdAt).toLocaleDateString()}</p></div>
        </div>

        <h3 className="mb-3 text-lg font-bold text-gray-900">Atestados ({candidato.atestados.length})</h3>
        {candidato.atestados.length === 0 ? (
          <p className="text-sm text-gray-400">No adjunto documentos</p>
        ) : (
          <div className="mb-6 space-y-2">
            {candidato.atestados.map((a) => (
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

        <div className="flex gap-3">
          <button onClick={() => onActualizarEstado(candidato.id, "aprobado")} className="btn-primary flex-1">
            Aprobar
          </button>
          <button onClick={() => onActualizarEstado(candidato.id, "rechazado")} className="btn-danger flex-1">
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}
