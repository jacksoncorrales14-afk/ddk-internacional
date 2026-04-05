import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarTrabajadoresConStats,
  crearTrabajador,
} from "@/services/trabajador.service";
import { registrarAccion } from "@/lib/audit";

export async function GET(req: NextRequest) {
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    nombre, cedula, email, telefono, puesto, ubicacion,
    horaInicio, horaFin, diasSemana, toleranciaMin,
  } = body;

  if (!nombre || !cedula || !email || !telefono || !puesto || !ubicacion) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const trabajador = await crearTrabajador({
    nombre, cedula, email, telefono, puesto, ubicacion,
    horaInicio: horaInicio || null,
    horaFin: horaFin || null,
    diasSemana: diasSemana || null,
    toleranciaMin: toleranciaMin ? parseInt(String(toleranciaMin)) : undefined,
  });

  await registrarAccion(session, "trabajador_creado", "Trabajador", trabajador.id, {
    nombre: trabajador.nombre,
    ubicacion: trabajador.ubicacion,
  });

  return NextResponse.json(trabajador, { status: 201 });
}
