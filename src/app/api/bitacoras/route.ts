import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const bitacoras = await prisma.bitacora.findMany({
    where: { trabajadorId: session.user.id },
    orderBy: { fecha: "desc" },
    take: 50,
  });

  return NextResponse.json(bitacoras);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { incidencias, entregaA, puesto } = await req.json();

  if (!incidencias || !entregaA || !puesto) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const bitacora = await prisma.bitacora.create({
    data: {
      trabajadorId: session.user.id,
      incidencias,
      entregaA,
      puesto,
    },
  });

  return NextResponse.json(bitacora, { status: 201 });
}
