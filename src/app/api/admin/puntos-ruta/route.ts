import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarPuntosRuta, crearPuntoRuta } from "@/services/ronda.service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ubicacion = req.nextUrl.searchParams.get("ubicacion") || undefined;
  const puntos = await listarPuntosRuta(ubicacion);
  return NextResponse.json(puntos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("[api/puntos-ruta POST] body recibido:", body);
    const { nombre, ubicacion, orden } = body;
    if (!nombre || !ubicacion || orden === undefined) {
      console.warn("[api/puntos-ruta POST] faltan campos");
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    const punto = await crearPuntoRuta({ nombre, ubicacion, orden });
    console.log("[api/puntos-ruta POST] punto creado:", punto);
    return NextResponse.json(punto, { status: 201 });
  } catch (error) {
    console.error("[api/puntos-ruta POST] error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
