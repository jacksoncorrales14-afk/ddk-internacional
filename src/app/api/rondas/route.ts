import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { iniciarRonda, listarRondasTrabajador } from "@/services/ronda.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rondas = await listarRondasTrabajador(session.user.id);
  return NextResponse.json(rondas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { ubicacion } = await req.json();
    if (!ubicacion) {
      return NextResponse.json({ error: "Ubicacion requerida" }, { status: 400 });
    }
    const ronda = await iniciarRonda(session.user.id, ubicacion);
    return NextResponse.json(ronda, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
