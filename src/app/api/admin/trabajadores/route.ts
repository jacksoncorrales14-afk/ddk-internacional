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

  // Obtener ultimo registro de cada trabajador en una sola query
  const ultimosRegistros = await prisma.$queryRaw<
    { trabajadorId: string; tipo: string }[]
  >`
    SELECT DISTINCT ON ("trabajadorId") "trabajadorId", "tipo"
    FROM "RegistroHorario"
    ORDER BY "trabajadorId", "fecha" DESC
  `;

  // Obtener dias y horas trabajadas con agregacion SQL
  const estadisticas = await prisma.$queryRaw<
    { trabajadorId: string; diasTrabajados: bigint; horasTotales: number }[]
  >`
    SELECT
      e."trabajadorId",
      COUNT(DISTINCT DATE(e."fecha")) as "diasTrabajados",
      COALESCE(SUM(
        EXTRACT(EPOCH FROM (s."fecha" - e."fecha")) / 3600
      ), 0) as "horasTotales"
    FROM "RegistroHorario" e
    INNER JOIN LATERAL (
      SELECT "fecha"
      FROM "RegistroHorario" s
      WHERE s."trabajadorId" = e."trabajadorId"
        AND s."tipo" = 'salida'
        AND s."fecha" > e."fecha"
      ORDER BY s."fecha" ASC
      LIMIT 1
    ) s ON true
    WHERE e."tipo" = 'entrada'
    GROUP BY e."trabajadorId"
  `;

  const ultimoMap = new Map(
    ultimosRegistros.map((r) => [r.trabajadorId, r.tipo])
  );
  const statsMap = new Map(
    estadisticas.map((s) => [s.trabajadorId, {
      diasTrabajados: Number(s.diasTrabajados),
      horasTotales: Math.round(Number(s.horasTotales) * 10) / 10,
    }])
  );

  const result = trabajadores.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    cedula: t.cedula,
    email: t.email,
    telefono: t.telefono,
    puesto: t.puesto,
    ubicacion: t.ubicacion,
    activo: t.activo,
    createdAt: t.createdAt,
    enServicio: ultimoMap.get(t.id) === "entrada",
    diasTrabajados: statsMap.get(t.id)?.diasTrabajados || 0,
    horasTotales: statsMap.get(t.id)?.horasTotales || 0,
  }));

  return NextResponse.json(result);
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
