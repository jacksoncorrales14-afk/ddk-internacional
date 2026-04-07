"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

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

  const handleBiometrico = async () => {
    setError("");
    setLoading(true);
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");

      const optionsRes = await fetch("/api/webauthn/login");
      const options = await optionsRes.json();

      const authResp = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResp),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        const result = await signIn("trabajador-login", {
          cedula: verifyData.trabajador.cedula,
          biometricVerified: "true",
          redirect: false,
        });

        if (result?.error) {
          setError("Error al iniciar sesion biometrica");
        } else {
          router.push("/trabajador");
          router.refresh();
        }
      } else {
        setError(verifyData.error || "Autenticacion biometrica fallida");
      }
    } catch {
      setError("No se pudo completar la autenticacion biometrica. Verifica que tu dispositivo lo soporte.");
    }
    setLoading(false);
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
            <div className="space-y-4">
              <div className="rounded-lg bg-primary-50 border border-primary-200 p-4 text-center">
                <svg className="mx-auto mb-3 h-12 w-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                <p className="text-sm text-primary-800 mb-1">
                  Usa tu <span className="font-semibold">Face ID</span> o <span className="font-semibold">huella dactilar</span> para ingresar
                </p>
              </div>

              <button
                type="button"
                onClick={handleBiometrico}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                {loading ? "Verificando..." : "Ingresar con Biometria"}
              </button>

              <div className="text-center">
                <Link href="/activar" className="text-sm text-primary-600 hover:text-primary-800">
                  Primera vez? Activar mi cuenta
                </Link>
              </div>
            </div>
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
