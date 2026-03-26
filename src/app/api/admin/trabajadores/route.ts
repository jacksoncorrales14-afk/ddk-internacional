import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const trabajadores = await prisma.trabajador.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trabajadores);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { nombre, cedula, email, telefono, puesto, ubicacion, password } = await req.json();

  if (!nombre || !cedula || !email || !telefono || !puesto || !ubicacion || !password) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const trabajador = await prisma.trabajador.create({
    data: { nombre, cedula, email, telefono, puesto, ubicacion, password: hashedPassword },
  });

  return NextResponse.json(trabajador, { status: 201 });
}
