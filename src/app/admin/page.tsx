"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ candidatos: 0, trabajadores: 0, registrosHoy: 0 });
  const [loading, setLoading] = useState(true);

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
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

      {/* Boton de Emergencia */}
      <Link
        href="/admin/emergencia"
        className="mb-8 flex items-center justify-center gap-3 rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-6 transition-all hover:border-red-400 hover:shadow-lg"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg">
          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Candidatos</h3>
          <p className="text-sm text-gray-500">Ver solicitudes de empleo y atestados</p>
        </Link>

        <Link href="/admin/trabajadores" className="card group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100">
            <svg className="h-6 w-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Trabajadores</h3>
          <p className="text-sm text-gray-500">Gestionar personal y ver registros de horarios</p>
        </Link>

        <Link href="/admin/registros" className="card group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Registros y Rondas</h3>
          <p className="text-sm text-gray-500">Ver entradas, salidas y rondas de supervision</p>
        </Link>
      </div>
    </div>
  );
}
