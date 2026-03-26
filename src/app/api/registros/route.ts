import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const registros = await prisma.registroHorario.findMany({
    where: { trabajadorId: session.user.id },
    orderBy: { fecha: "desc" },
    take: 50,
  });

  return NextResponse.json(registros);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { tipo, nota } = await req.json();

  if (!tipo || !["entrada", "salida"].includes(tipo)) {
    return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
  }

  const trabajador = await prisma.trabajador.findUnique({
    where: { id: session.user.id },
  });

  const registro = await prisma.registroHorario.create({
    data: {
      trabajadorId: session.user.id,
      tipo,
      ubicacion: trabajador?.ubicacion || "",
      nota: nota || null,
    },
  });

  return NextResponse.json(registro, { status: 201 });
}
