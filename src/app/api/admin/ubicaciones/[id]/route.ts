import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { actualizarUbicacion, eliminarUbicacion } from "@/services/ubicacion.service";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(100, ip);
  if (!success) return rateLimitResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const data: { nombre?: string; activa?: boolean } = {};

  if (typeof body.nombre === "string" && body.nombre.trim()) {
    data.nombre = body.nombre.trim();
  }
  if (typeof body.activa === "boolean") {
    data.activa = body.activa;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
  }

  try {
    const ubicacion = await actualizarUbicacion(id, data);
    return NextResponse.json(ubicacion);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una ubicacion con ese nombre" }, { status: 409 });
    }
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Ubicacion no encontrada" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(100, ip);
  if (!success) return rateLimitResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = params;

  try {
    await eliminarUbicacion(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Ubicacion no encontrada" }, { status: 404 });
    }
    throw e;
  }
}
