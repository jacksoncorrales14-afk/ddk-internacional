"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import NotificacionesBell from "./admin/NotificacionesBell";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = session?.user?.role;
  const homeHref = role === "admin" ? "/admin" : role === "trabajador" ? "/trabajador" : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-primary-100 bg-primary-700/95 backdrop-blur-md" aria-label="Navegacion principal">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="DDK Internacional" width={45} height={45} />
          <span className="text-xl font-bold text-white sm:text-2xl">
            DDK Internacional
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/aplicar"
            className="text-sm font-medium text-primary-100 transition-colors hover:text-white"
          >
            Aplicar
          </Link>
          {homeHref && (
            <Link
              href={homeHref}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
              aria-label="Ir al inicio"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Inicio
            </Link>
          )}
          {role === "admin" && <NotificacionesBell />}
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg border border-primary-400 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600"
            >
              Cerrar Sesion
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-accent-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-600"
            >
              Ingresar
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-primary-600 bg-primary-700 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {homeHref && (
              <Link
                href={homeHref}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Inicio
              </Link>
            )}
            <Link href="/aplicar" className="text-sm font-medium text-primary-100" onClick={() => setMenuOpen(false)}>
              Aplicar
            </Link>
            {session ? (
              <button
                onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                className="text-left text-sm font-medium text-red-300"
              >
                Cerrar Sesion
              </button>
            ) : (
              <Link href="/login" className="text-sm font-medium text-accent-400" onClick={() => setMenuOpen(false)}>
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
