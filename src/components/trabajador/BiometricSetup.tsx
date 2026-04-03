"use client";

import { useState } from "react";

export default function BiometricSetup() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const registrarBiometria = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const { startRegistration } = await import("@simplewebauthn/browser");

      // Obtener opciones del servidor
      const optionsRes = await fetch("/api/webauthn/register");
      const options = await optionsRes.json();

      if (!optionsRes.ok) {
        setStatus("error");
        setMessage(options.error || "Error al obtener opciones");
        return;
      }

      // Iniciar registro biometrico
      const regResp = await startRegistration({ optionsJSON: options });

      // Enviar al servidor para verificar y guardar
      const verifyRes = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regResp),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        setStatus("success");
        setMessage("Face ID / Huella registrado exitosamente. Ahora puedes usarlo para iniciar sesion.");
      } else {
        setStatus("error");
        setMessage(verifyData.error || "Error al registrar biometria");
      }
    } catch {
      setStatus("error");
      setMessage("No se pudo completar el registro. Verifica que tu dispositivo soporte autenticacion biometrica.");
    }
  };

  return (
    <div className="card mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
          <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Acceso Biometrico</h2>
          <p className="text-xs text-gray-500">Registra Face ID o huella para ingresar sin contraseña</p>
        </div>
      </div>

      {status === "success" && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>
      )}
      {status === "error" && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</div>
      )}

      <button
        onClick={registrarBiometria}
        disabled={status === "loading"}
        className="btn-accent w-full flex items-center justify-center gap-2"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
        {status === "loading" ? "Registrando..." : "Registrar Face ID / Huella"}
      </button>
    </div>
  );
}
