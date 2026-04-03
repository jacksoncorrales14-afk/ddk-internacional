import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarRegistrosTrabajador,
  crearRegistro,
} from "@/services/registro.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const registros = await listarRegistrosTrabajador(session.user.id);
  return NextResponse.json(registros);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { tipo, nota, codigoQR } = await req.json();
    const registro = await crearRegistro({
      trabajadorId: session.user.id,
      tipo,
      nota,
      codigoQR,
    });
    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
