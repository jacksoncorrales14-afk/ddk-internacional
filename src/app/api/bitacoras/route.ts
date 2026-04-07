import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarBitacorasTrabajador,
  crearBitacora,
} from "@/services/registro.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const bitacoras = await listarBitacorasTrabajador(session.user.id);
  return NextResponse.json(bitacoras);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { incidencias, entregaA, ubicacion, tipoIncidencia, severidad } = await req.json();
    const bitacora = await crearBitacora({
      trabajadorId: session.user.id,
      incidencias,
      entregaA,
      ubicacion,
      tipoIncidencia,
      severidad,
    });
    return NextResponse.json(bitacora, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
