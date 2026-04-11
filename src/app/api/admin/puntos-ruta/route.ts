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
    const { nombre, ubicacion, orden } = await req.json();
    if (!nombre || !ubicacion || orden === undefined) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    const punto = await crearPuntoRuta({ nombre, ubicacion, orden });
    return NextResponse.json(punto, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
