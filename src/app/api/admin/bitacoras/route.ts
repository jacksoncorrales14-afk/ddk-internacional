import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const bitacoras = await prisma.bitacora.findMany({
    include: { trabajador: { select: { nombre: true, cedula: true } } },
    orderBy: { fecha: "desc" },
    take: 200,
  });

  return NextResponse.json(bitacoras);
}
