import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

// ─── Queries ───

export async function listarTrabajadoresConStats() {
  const trabajadores = await prisma.trabajador.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { credenciales: true } } },
  });

  const ultimosRegistros = await prisma.$queryRaw<
    { trabajadorId: string; tipo: string; ubicacion: string | null }[]
  >`
    SELECT DISTINCT ON ("trabajadorId") "trabajadorId", "tipo", "ubicacion"
    FROM "RegistroHorario"
    ORDER BY "trabajadorId", "fecha" DESC
  `;

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
    ultimosRegistros.map((r) => [r.trabajadorId, { tipo: r.tipo, ubicacion: r.ubicacion }])
  );
  const statsMap = new Map(
    estadisticas.map((s) => [
      s.trabajadorId,
      {
        diasTrabajados: Number(s.diasTrabajados),
        horasTotales: Math.round(Number(s.horasTotales) * 10) / 10,
      },
    ])
  );

  return trabajadores.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    cedula: t.cedula,
    email: t.email,
    telefono: t.telefono,
    puesto: t.puesto,
    ubicacion: t.ubicacion,
    activo: t.activo,
    activado: t.activado,
    codigoActivacion: t.codigoActivacion,
    biometriaRegistrada: t._count.credenciales > 0,
    createdAt: t.createdAt,
    enServicio: ultimoMap.get(t.id)?.tipo === "entrada",
    ubicacionActual: ultimoMap.get(t.id)?.tipo === "entrada" ? ultimoMap.get(t.id)?.ubicacion || null : null,
    diasTrabajados: statsMap.get(t.id)?.diasTrabajados || 0,
    horasTotales: statsMap.get(t.id)?.horasTotales || 0,
  }));
}

function generarCodigoActivacion(): string {
  return "DDK-" + nanoid(8).toUpperCase();
}

export async function crearTrabajador(data: {
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  puesto: string;
  ubicacion: string;
}) {
  const codigoActivacion = generarCodigoActivacion();

  return prisma.trabajador.create({
    data: { ...data, codigoActivacion },
  });
}

export async function regenerarCodigo(id: string) {
  const codigoActivacion = generarCodigoActivacion();
  return prisma.trabajador.update({
    where: { id },
    data: { codigoActivacion, activado: false },
  });
}

export async function activarTrabajador(cedula: string, codigo: string) {
  const trabajador = await prisma.trabajador.findUnique({ where: { cedula } });

  if (!trabajador) throw new Error("Trabajador no encontrado");
  if (!trabajador.activo) throw new Error("Cuenta desactivada");
  if (!trabajador.codigoActivacion) throw new Error("No hay codigo de activacion pendiente");
  if (trabajador.codigoActivacion !== codigo) throw new Error("Codigo de activacion incorrecto");

  return trabajador;
}

export async function marcarActivado(id: string) {
  return prisma.trabajador.update({
    where: { id },
    data: { activado: true, codigoActivacion: null },
  });
}

export async function eliminarTrabajador(id: string) {
  return prisma.trabajador.delete({ where: { id } });
}

export async function actualizarTrabajador(
  id: string,
  data: Record<string, unknown>
) {
  return prisma.trabajador.update({
    where: { id },
    data,
  });
}
