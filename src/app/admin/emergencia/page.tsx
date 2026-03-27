"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Candidato, calcularPuntaje, getMedalla } from "@/types/models";

const medallaConfig = {
  oro: {
    emoji: "\uD83E\uDD47",
    label: "Oro",
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    text: "text-yellow-700",
    badge: "bg-yellow-400 text-yellow-900",
  },
  plata: {
    emoji: "\uD83E\uDD48",
    label: "Plata",
    bg: "bg-gray-50",
    border: "border-gray-400",
    text: "text-gray-700",
    badge: "bg-gray-300 text-gray-800",
  },
  bronce: {
    emoji: "\uD83E\uDD49",
    label: "Bronce",
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-700",
    badge: "bg-orange-200 text-orange-800",
  },
};

function formatPhone(telefono: string): string {
  return telefono.replace(/[^0-9+]/g, "");
}

export default function EmergenciaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPuesto, setFiltroPuesto] = useState("todos");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetch("/api/candidatos")
        .then((r) => r.json())
        .then((data: Candidato[]) => {
          // Ordenar por puntaje descendente
          const sorted = data
            .filter((c) => c.estado !== "rechazado")
            .sort((a, b) => calcularPuntaje(b) - calcularPuntaje(a));
          setCandidatos(sorted);
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

  const filtrados = filtroPuesto === "todos"
    ? candidatos
    : candidatos.filter((c) => c.puesto === filtroPuesto);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Boton de Emergencia</h1>
            <p className="text-red-200">Mejores candidatos disponibles, ordenados por calificacion</p>
          </div>
        </div>
      </div>

      {/* Leyenda de medallas */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm">
          <span className="text-lg">{medallaConfig.oro.emoji}</span>
          <span className="font-medium text-yellow-700">Oro - Tiene todo: arma, licencia, curso, docs, experiencia 2+ años</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm">
          <span className="text-lg">{medallaConfig.plata.emoji}</span>
          <span className="font-medium text-gray-700">Plata - Tiene certificaciones parciales y experiencia</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm">
          <span className="text-lg">{medallaConfig.bronce.emoji}</span>
          <span className="font-medium text-orange-700">Bronce - Candidato basico</span>
        </div>
      </div>

      {/* Filtro por puesto */}
      <div className="mb-6 flex gap-2">
        {["todos", "seguridad", "limpieza"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltroPuesto(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filtroPuesto === f ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de candidatos */}
      {filtrados.length === 0 ? (
        <div className="card py-16 text-center text-gray-400">No hay candidatos disponibles.</div>
      ) : (
        <div className="space-y-4">
          {filtrados.map((c, index) => {
            const medalla = getMedalla(c);
            const config = medallaConfig[medalla];
            const puntaje = calcularPuntaje(c);
            const phoneClean = formatPhone(c.telefono);

            return (
              <div
                key={c.id}
                className={`rounded-2xl border-2 ${config.border} ${config.bg} p-5 transition-shadow hover:shadow-md`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Info principal */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl">{config.emoji}</span>
                      <span className="mt-1 text-xs font-bold text-gray-500">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{c.nombre}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${config.badge}`}>
                          {config.label}
                        </span>
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary-700">
                          {c.puesto}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {c.aniosExperiencia} año{c.aniosExperiencia !== 1 ? "s" : ""} de experiencia
                        {" | "}{c.atestados.length} documento{c.atestados.length !== 1 ? "s" : ""}
                        {" | "}Puntaje: {puntaje}
                      </p>

                      {/* Certificaciones */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.portacionArma ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                        }`}>
                          {c.portacionArma ? "\u2713" : "\u2717"} Portacion de Arma
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.licenciaConducir ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                        }`}>
                          {c.licenciaConducir ? "\u2713" : "\u2717"} Licencia
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.cursoBasicoPolicial ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                        }`}>
                          {c.cursoBasicoPolicial ? "\u2713" : "\u2717"} Curso Policial
                        </span>
                      </div>

                      {c.experiencia && (
                        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{c.experiencia}</p>
                      )}
                    </div>
                  </div>

                  {/* Botones de contacto */}
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <a
                      href={`tel:${phoneClean}`}
                      className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Llamar
                    </a>
                    <a
                      href={`https://wa.me/506${phoneClean}?text=${encodeURIComponent(`Hola ${c.nombre}, somos DDK Internacional. Nos interesa contactarte para una oportunidad de trabajo en el area de ${c.puesto}. ¿Estas disponible?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
