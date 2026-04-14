"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"admin" | "trabajador">("trabajador");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [recuperarMsg, setRecuperarMsg] = useState("");

  // Admin fields
  const [identificacion, setIdentificacion] = useState("");
  const [password, setPassword] = useState("");

  // Trabajador fields
  const [cedula, setCedula] = useState("");
  const [passwordTrab, setPasswordTrab] = useState("");

  const handleAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("admin-login", {
      identificacion,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Credenciales incorrectas");
    } else {
      router.push("/admin");
      router.refresh();
    }
  };

  const handleRecuperar = async () => {
    if (!identificacion) {
      setError("Ingresa tu numero de identificacion primero");
      return;
    }
    setRecuperando(true);
    setError("");
    setRecuperarMsg("");
    try {
      const res = await fetch("/api/admin/recuperar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificacion }),
      });
      if (res.ok) {
        setRecuperarMsg("Se envio una nueva contraseña al correo autorizado");
      } else {
        setError("Error al procesar la solicitud");
      }
    } catch {
      setError("Error de conexion");
    }
    setRecuperando(false);
  };

  const handleTrabajador = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("trabajador-login", {
      cedula,
      password: passwordTrab,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Cedula o contraseña incorrecta");
    } else {
      router.push("/trabajador");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <Image src="/logo.png" alt="DDK Internacional" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Iniciar Sesion
          </h1>

          {/* Tabs */}
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => { setTab("trabajador"); setError(""); setRecuperarMsg(""); }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === "trabajador" ? "bg-primary-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Trabajador
            </button>
            <button
              onClick={() => { setTab("admin"); setError(""); setRecuperarMsg(""); }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === "admin" ? "bg-primary-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Administrador
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {tab === "trabajador" ? (
            <form onSubmit={handleTrabajador} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Numero de Cedula o Pasaporte</label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="input-field"
                  placeholder="Tu numero de cedula o pasaporte"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  value={passwordTrab}
                  onChange={(e) => setPasswordTrab(e.target.value)}
                  className="input-field"
                  placeholder="Tu contraseña"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Numero de Identificacion</label>
                <input
                  type="text"
                  value={identificacion}
                  onChange={(e) => setIdentificacion(e.target.value)}
                  className="input-field"
                  placeholder="Tu numero de identificacion"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Tu contraseña"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
              <button
                type="button"
                onClick={handleRecuperar}
                disabled={recuperando}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-800"
              >
                {recuperando ? "Enviando..." : "Olvide mi contraseña"}
              </button>
              {recuperarMsg && (
                <div role="alert" className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{recuperarMsg}</div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
