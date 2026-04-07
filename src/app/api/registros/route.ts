import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarRegistrosTrabajador,
  crearRegistro,
} from "@/services/registro.service";
import { registroCreateSchema } from "@/lib/validations";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { errorTracker } from "@/lib/error-tracking";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const registros = await listarRegistrosTrabajador(session.user.id);
  return NextResponse.json(registros);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(20, ip);
  if (!success) return rateLimitResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = registroCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { tipo, nota, codigoQR } = validated.data;
    const registro = await crearRegistro({
      trabajadorId: session.user.id,
      tipo,
      nota,
      codigoQR,
    });
    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    errorTracker.captureException(error, {
      route: "/api/registros",
      action: "POST",
    });
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
