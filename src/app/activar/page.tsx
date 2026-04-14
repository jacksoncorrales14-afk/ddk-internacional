"use client";

import { useState } from "react";
import Image from "next/image";

export default function ActivarPage() {
  const [cedula, setCedula] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activado, setActivado] = useState(false);
  const [nombre, setNombre] = useState("");

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/activar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, codigo }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNombre(data.nombre);
        setActivado(true);
      } else {
        setError(data.error || "Codigo invalido");
      }
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

  if (activado) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Cuenta Verificada</h2>
          <p className="mb-4 text-gray-500">
            {nombre}, tu cuenta ha sido verificada exitosamente.
          </p>
          <p className="mb-6 text-sm text-gray-400">
            Ingresa al sistema con tu numero de cedula/pasaporte y la contraseña asignada por tu supervisor.
          </p>
          <a href="/login" className="btn-primary inline-block">
            Ir a Iniciar Sesion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <Image src="/logo.png" alt="DDK Internacional" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Verificar Cuenta
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            Ingresa tu cedula y el codigo de activacion proporcionado por tu supervisor.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={verificarCodigo} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cedula</label>
              <input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="input-field"
                placeholder="Tu numero de cedula"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Codigo de Activacion</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                className="input-field font-mono tracking-wider"
                placeholder="DDK-XXXXXXXX"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Verificando..." : "Verificar Codigo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
