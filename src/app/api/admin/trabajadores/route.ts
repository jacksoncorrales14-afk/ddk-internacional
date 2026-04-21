import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarTrabajadoresConStats,
  crearTrabajador,
} from "@/services/trabajador.service";
import { registrarAccion } from "@/lib/audit";
import { trabajadorCreateSchema } from "@/lib/validations";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(100, ip);
  if (!success) return rateLimitResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;

  const result = await listarTrabajadoresConStats(q);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(100, ip);
  if (!success) return rateLimitResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const validated = trabajadorCreateSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }
  const {
    nombre, cedula, password, email, telefono, puesto, ubicacion,
    tipoDocumento, fechaNacimiento, paisOrigen, direccion,
    experiencia, aniosExperiencia, disponibilidad,
    portacionArma, licenciaConducir, cursoBasicoPolicial,
  } = validated.data;

  try {
    const trabajador = await crearTrabajador({
      nombre, cedula, password, email, telefono, puesto, ubicacion,
      tipoDocumento,
      fechaNacimiento,
      paisOrigen,
      direccion,
      experiencia,
      aniosExperiencia: aniosExperiencia != null ? Number(aniosExperiencia) : undefined,
      disponibilidad,
      portacionArma: portacionArma === true,
      licenciaConducir: licenciaConducir || undefined,
      cursoBasicoPolicial: cursoBasicoPolicial === true,
    });

    await registrarAccion(session, "trabajador_creado", "Trabajador", trabajador.id, {
      nombre: trabajador.nombre,
      ubicacion: trabajador.ubicacion,
    });

    return NextResponse.json(trabajador, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear el trabajador";
    const isDuplicate = message.includes("Unique constraint");
    return NextResponse.json(
      { error: isDuplicate ? "Ya existe un trabajador con esa cedula" : message },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}
