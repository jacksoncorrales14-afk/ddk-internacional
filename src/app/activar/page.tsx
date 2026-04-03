"use client";

import { useState } from "react";
import Image from "next/image";

type Step = "codigo" | "biometria" | "listo";

export default function ActivarPage() {
  const [step, setStep] = useState<Step>("codigo");
  const [cedula, setCedula] = useState("");
  const [codigo, setCodigo] = useState("");
  const [trabajadorId, setTrabajadorId] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setTrabajadorId(data.trabajadorId);
        setNombre(data.nombre);
        setStep("biometria");
      } else {
        setError(data.error || "Codigo invalido");
      }
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

  const registrarBiometria = async () => {
    setLoading(true);
    setError("");

    try {
      const { startRegistration } = await import("@simplewebauthn/browser");

      const optionsRes = await fetch("/api/webauthn/register", {
        headers: { "x-activacion-trabajador-id": trabajadorId },
      });
      const options = await optionsRes.json();

      if (!optionsRes.ok) {
        setError(options.error || "Error al obtener opciones");
        setLoading(false);
        return;
      }

      const regResp = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regResp),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        setStep("listo");
      } else {
        setError(verifyData.error || "Error al registrar biometria");
      }
    } catch {
      setError("No se pudo completar el registro biometrico. Verifica que tu dispositivo lo soporte.");
    }
    setLoading(false);
  };

  if (step === "listo") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Cuenta Activada</h2>
          <p className="mb-4 text-gray-500">
            {nombre}, tu acceso biometrico ha sido registrado exitosamente.
          </p>
          <p className="mb-6 text-sm text-gray-400">
            A partir de ahora puedes iniciar sesion usando Face ID o tu huella dactilar.
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
            Activar Cuenta
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            {step === "codigo"
              ? "Ingresa tu cedula y el codigo de activacion proporcionado por tu supervisor."
              : `Hola ${nombre}, registra tu acceso biometrico para completar la activacion.`}
          </p>

          {/* Progress */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              step === "codigo" ? "bg-primary-600 text-white" : "bg-green-500 text-white"
            }`}>
              {step === "codigo" ? "1" : "\u2713"}
            </div>
            <div className={`h-0.5 w-12 ${step === "biometria" ? "bg-primary-600" : "bg-gray-200"}`} />
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              step === "biometria" ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-400"
            }`}>
              2
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {step === "codigo" && (
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
          )}

          {step === "biometria" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary-50 border border-primary-200 p-4 text-center">
                <svg className="mx-auto mb-2 h-12 w-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                <p className="text-sm font-medium text-primary-800">
                  Al presionar el boton, tu dispositivo te pedira autenticacion biometrica (Face ID, huella o Windows Hello).
                </p>
              </div>
              <button
                onClick={registrarBiometria}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                {loading ? "Registrando..." : "Registrar Face ID / Huella"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
