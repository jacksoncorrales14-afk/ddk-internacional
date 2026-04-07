"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CardSkeleton } from "@/components/Skeleton";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ candidatos: 0, trabajadores: 0, registrosHoy: 0 });
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState(false);

  async function verificarAusencias() {
    setVerificando(true);
    try {
      const res = await fetch("/api/admin/ausencias", { method: "POST" });
      const data = await res.json();
      alert(data.ausentes > 0
        ? `Se detectaron ${data.ausentes} trabajador(es) ausente(s). Revisa las notificaciones.`
        : "No se detectaron ausencias."
      );
    } finally {
      setVerificando(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then(setStats)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administracion</h1>
        <p className="text-sm text-gray-500">Bienvenido, {session.user.name}</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.candidatos}</p>
          <p className="text-sm text-gray-500">Candidatos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-600">{stats.trabajadores}</p>
          <p className="text-sm text-gray-500">Trabajadores Activos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{stats.registrosHoy}</p>
          <p className="text-sm text-gray-500">Registros Hoy</p>
        </div>
      </div>

      {/* Boton de verificar ausencias */}
      <button
        onClick={verificarAusencias}
        disabled={verificando}
        className="mb-4 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60"
      >
        {verificando ? "Verificando..." : "Verificar ausencias ahora"}
        <span className="ml-2 text-xs font-normal text-amber-600">
          (Detecta trabajadores que no han marcado entrada segun su horario)
        </span>
      </button>

      {/* Boton de Emergencia */}
      <Link
        href="/admin/emergencia"
        className="mb-8 flex items-center justify-center gap-3 rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-6 transition-all hover:border-red-400 hover:shadow-lg"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg">
          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-red-700">Boton de Emergencia</h3>
          <p className="text-sm text-red-500">Encontrar los mejores candidatos disponibles de inmediato</p>
        </div>
      </Link>

      {/* Navigation */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/candidatos" className="card group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Candidatos</h3>
          <p className="text-sm text-gray-500">Ver solicitudes de empleo y atestados</p>
        </Link>

        <Link href="/admin/trabajadores" className="card group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100">
            <svg className="h-6 w-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Trabajadores</h3>
          <p className="text-sm text-gray-500">Gestionar personal y ver registros de horarios</p>
        </Link>

        <Link href="/admin/registros" className="card group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Registros, Rondas y Bitacoras</h3>
          <p className="text-sm text-gray-500">Ver entradas, salidas, rondas y bitacoras</p>
        </Link>

        <Link href="/admin/qr" className="card group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Codigos QR</h3>
          <p className="text-sm text-gray-500">Generar e imprimir QR por puesto</p>
        </Link>

        <Link href="/admin/rutas" className="card group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
            <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Rutas de Ronda</h3>
          <p className="text-sm text-gray-500">Definir puntos de control por ubicacion</p>
        </Link>

        <Link href="/admin/auditoria" className="card group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Auditoria</h3>
          <p className="text-sm text-gray-500">Ver historial de acciones de administradores</p>
        </Link>
      </div>
    </div>
  );
}
