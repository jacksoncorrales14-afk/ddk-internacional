import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarUbicaciones, crearUbicacion } from "@/services/ubicacion.service";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { ubicacionCreateSchema } from "@/lib/validations";

const DEFAULT_UBICACIONES = [
  "Jacaranda",
  "Malinches",
  "Parques del Sol (Finca Madre)",
  "Bosque Escondido",
  "Bosque del Rio",
  "Terrazas del Oeste",
  "City Place Santa Ana",
  "Fuerte Ventura",
];

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(100, ip);
  if (!success) return rateLimitResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let ubicaciones = await listarUbicaciones(false);
  if (ubicaciones.length === 0) {
    // Seed defaults
    await Promise.all(DEFAULT_UBICACIONES.map((nombre) => crearUbicacion(nombre)));
    ubicaciones = await listarUbicaciones(false);
  }

  return NextResponse.json(ubicaciones);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(100, ip);
  if (!success) return rateLimitResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const validated = ubicacionCreateSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  try {
    const ubicacion = await crearUbicacion(validated.data.nombre);
    return NextResponse.json(ubicacion, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una ubicacion con ese nombre" }, { status: 409 });
    }
    throw e;
  }
}
