import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rondas = await prisma.ronda.findMany({
    where: { trabajadorId: session.user.id },
    orderBy: { fecha: "desc" },
    take: 50,
  });

  return NextResponse.json(rondas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { ubicacion, observaciones, novedades } = await req.json();

  if (!ubicacion) {
    return NextResponse.json({ error: "La ubicacion es requerida" }, { status: 400 });
  }

  const ronda = await prisma.ronda.create({
    data: {
      trabajadorId: session.user.id,
      ubicacion,
      observaciones: observaciones || null,
      novedades: novedades || null,
    },
  });

  return NextResponse.json(ronda, { status: 201 });
}
