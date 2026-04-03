import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarTrabajadoresConStats,
  crearTrabajador,
} from "@/services/trabajador.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await listarTrabajadoresConStats();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { nombre, cedula, email, telefono, puesto, ubicacion } = await req.json();

  if (!nombre || !cedula || !email || !telefono || !puesto || !ubicacion) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const trabajador = await crearTrabajador({
    nombre, cedula, email, telefono, puesto, ubicacion,
  });

  return NextResponse.json(trabajador, { status: 201 });
}
