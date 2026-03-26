"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = session?.user?.role;

  return (
    <nav className="sticky top-0 z-50 border-b border-primary-100 bg-primary-700/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="DDK Internacional" width={45} height={45} />
          <span className="text-xl font-bold text-white sm:text-2xl">
            DDK Internacional
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/aplicar"
            className="text-sm font-medium text-primary-100 transition-colors hover:text-white"
          >
            Aplicar
          </Link>
          {role === "trabajador" && (
            <Link
              href="/trabajador"
              className="text-sm font-medium text-primary-100 transition-colors hover:text-white"
            >
              Mi Panel
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-primary-100 transition-colors hover:text-white"
            >
              Admin
            </Link>
          )}
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
            <Link href="/aplicar" className="text-sm font-medium text-primary-100" onClick={() => setMenuOpen(false)}>
              Aplicar
            </Link>
            {role === "trabajador" && (
              <Link href="/trabajador" className="text-sm font-medium text-primary-100" onClick={() => setMenuOpen(false)}>
                Mi Panel
              </Link>
            )}
            {role === "admin" && (
              <Link href="/admin" className="text-sm font-medium text-primary-100" onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
            )}
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
