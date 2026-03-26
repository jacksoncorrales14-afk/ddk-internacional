import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [candidatos, trabajadores, registrosHoy] = await Promise.all([
    prisma.candidato.count(),
    prisma.trabajador.count({ where: { activo: true } }),
    prisma.registroHorario.count({ where: { fecha: { gte: hoy } } }),
  ]);

  return NextResponse.json({ candidatos, trabajadores, registrosHoy });
}
