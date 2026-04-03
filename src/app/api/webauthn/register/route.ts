import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { marcarActivado } from "@/services/trabajador.service";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

const rpName = "DDK Internacional";
const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Obtener trabajadorId desde session o desde header (activacion)
async function getTrabajadorId(req: NextRequest): Promise<string | null> {
  // Primero intentar desde session
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.role === "trabajador") {
    return session.user.id;
  }
  // Si no hay session, buscar header de activacion
  const activacionId = req.headers.get("x-activacion-trabajador-id");
  return activacionId;
}

// GET: generar opciones de registro
export async function GET(req: NextRequest) {
  const trabajadorId = await getTrabajadorId(req);
  if (!trabajadorId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const trabajador = await prisma.trabajador.findUnique({
    where: { id: trabajadorId },
    include: { credenciales: true },
  });

  if (!trabajador) {
    return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(trabajador.id),
    userName: trabajador.cedula,
    userDisplayName: trabajador.nombre,
    excludeCredentials: trabajador.credenciales.map((c) => ({
      id: c.credentialId,
    })),
    authenticatorSelection: {
      userVerification: "preferred",
      residentKey: "preferred",
    },
  });

  const response = NextResponse.json(options);
  response.cookies.set("webauthn_challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300,
  });
  response.cookies.set("webauthn_trabajador_id", trabajadorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300,
  });

  return response;
}

// POST: verificar y guardar credencial
export async function POST(req: NextRequest) {
  const body = await req.json();
  const challenge = req.cookies.get("webauthn_challenge")?.value;
  const trabajadorId = req.cookies.get("webauthn_trabajador_id")?.value;

  if (!challenge || !trabajadorId) {
    return NextResponse.json({ error: "Challenge expirado" }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verificacion fallida" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    await prisma.webAuthnCredential.create({
      data: {
        trabajadorId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceName: body.deviceName || "Dispositivo biometrico",
      },
    });

    // Marcar trabajador como activado
    await marcarActivado(trabajadorId);

    const response = NextResponse.json({ success: true });
    response.cookies.delete("webauthn_challenge");
    response.cookies.delete("webauthn_trabajador_id");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de verificacion";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
