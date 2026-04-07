import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { loginLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

// GET: generar opciones de autenticacion
export async function GET() {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });

  const response = NextResponse.json(options);
  response.cookies.set("webauthn_auth_challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300,
  });

  return response;
}

// POST: verificar autenticacion biometrica
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = loginLimiter.check(5, ip);
  if (!success) return rateLimitResponse();

  const body = await req.json();
  const challenge = req.cookies.get("webauthn_auth_challenge")?.value;

  if (!challenge) {
    return NextResponse.json({ error: "Challenge expirado" }, { status: 400 });
  }

  const credentialIdBase64 = Buffer.from(body.rawId, "base64").toString("base64url");

  const credential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: credentialIdBase64 },
    include: { trabajador: true },
  });

  if (!credential) {
    return NextResponse.json({ error: "Credencial no reconocida" }, { status: 400 });
  }

  if (!credential.trabajador.activo) {
    return NextResponse.json({ error: "Cuenta desactivada" }, { status: 401 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.publicKey),
        counter: Number(credential.counter),
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Verificacion fallida" }, { status: 400 });
    }

    // Actualizar contador
    await prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter) },
    });

    // Devolver datos del trabajador para login
    const response = NextResponse.json({
      success: true,
      trabajador: {
        id: credential.trabajador.id,
        cedula: credential.trabajador.cedula,
        nombre: credential.trabajador.nombre,
      },
    });
    response.cookies.delete("webauthn_auth_challenge");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de verificacion";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
