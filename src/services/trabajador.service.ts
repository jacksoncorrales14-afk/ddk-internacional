import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

// ─── Queries ───

export async function listarTrabajadoresConStats(q?: string) {
  const where: Record<string, unknown> = {};
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { nombre: { contains: term, mode: "insensitive" } },
      { cedula: { contains: term } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  // Run the Prisma query and the combined raw SQL query in parallel
  const [trabajadores, registroStats] = await Promise.all([
    prisma.trabajador.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { credenciales: true } },
      },
    }),

    // Single raw SQL query combining latest record + work stats using CTEs
    prisma.$queryRaw<
      {
        trabajadorId: string;
        ultimoTipo: string | null;
        ultimoUbicacion: string | null;
        diasTrabajados: bigint;
        horasTotales: number;
      }[]
    >`
      WITH ultimo_registro AS (
        SELECT DISTINCT ON ("trabajadorId")
          "trabajadorId",
          "tipo" AS "ultimoTipo",
          "ubicacion" AS "ultimoUbicacion"
        FROM "RegistroHorario"
        ORDER BY "trabajadorId", "fecha" DESC
      ),
      dias_trabajados AS (
        SELECT
          "trabajadorId",
          COUNT(DISTINCT DATE("fecha")) AS "diasTrabajados"
        FROM "RegistroHorario"
        WHERE "tipo" = 'entrada'
        GROUP BY "trabajadorId"
      ),
      horas_totales AS (
        SELECT
          e."trabajadorId",
          COALESCE(SUM(
            EXTRACT(EPOCH FROM (s."fecha" - e."fecha")) / 3600
          ), 0) AS "horasTotales"
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
      ),
      estadisticas AS (
        SELECT
          COALESCE(d."trabajadorId", h."trabajadorId") AS "trabajadorId",
          COALESCE(d."diasTrabajados", 0) AS "diasTrabajados",
          COALESCE(h."horasTotales", 0) AS "horasTotales"
        FROM dias_trabajados d
        FULL OUTER JOIN horas_totales h ON d."trabajadorId" = h."trabajadorId"
      )
      SELECT
        COALESCE(u."trabajadorId", st."trabajadorId") AS "trabajadorId",
        u."ultimoTipo",
        u."ultimoUbicacion",
        COALESCE(st."diasTrabajados", 0) AS "diasTrabajados",
        COALESCE(st."horasTotales", 0) AS "horasTotales"
      FROM ultimo_registro u
      FULL OUTER JOIN estadisticas st ON u."trabajadorId" = st."trabajadorId"
    `,
  ]);

  const statsMap = new Map(
    registroStats.map((r) => [
      r.trabajadorId,
      {
        ultimoTipo: r.ultimoTipo,
        ultimoUbicacion: r.ultimoUbicacion,
        diasTrabajados: Number(r.diasTrabajados),
        horasTotales: Math.round(Number(r.horasTotales) * 10) / 10,
      },
    ])
  );

  return trabajadores.map((t) => {
    const stats = statsMap.get(t.id);
    return {
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
      // Campos equivalentes a Candidato
      tipoDocumento: t.tipoDocumento,
      fechaNacimiento: t.fechaNacimiento,
      paisOrigen: t.paisOrigen,
      direccion: t.direccion,
      experiencia: t.experiencia,
      aniosExperiencia: t.aniosExperiencia,
      disponibilidad: t.disponibilidad,
      portacionArma: t.portacionArma,
      licenciaConducir: t.licenciaConducir,
      cursoBasicoPolicial: t.cursoBasicoPolicial,
      biometriaRegistrada: t._count.credenciales > 0,
      createdAt: t.createdAt,
      enServicio: stats?.ultimoTipo === "entrada",
      ubicacionActual: stats?.ultimoTipo === "entrada" ? stats.ultimoUbicacion || null : null,
      diasTrabajados: stats?.diasTrabajados || 0,
      horasTotales: stats?.horasTotales || 0,
    };
  });
}

function generarCodigoActivacion(): string {
  return "DDK-" + nanoid(8).toUpperCase();
}

export async function crearTrabajador(data: {
  nombre: string;
  cedula: string;
  password: string;
  email: string;
  telefono: string;
  puesto: string;
  ubicacion: string;
  // Campos equivalentes a Candidato
  tipoDocumento?: string;
  fechaNacimiento?: string;
  paisOrigen?: string;
  direccion?: string;
  experiencia?: string;
  aniosExperiencia?: number;
  disponibilidad?: string;
  portacionArma?: boolean;
  licenciaConducir?: string;
  cursoBasicoPolicial?: boolean;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const trabajador = await prisma.trabajador.create({
    data: {
      nombre: data.nombre,
      cedula: data.cedula,
      password: hashedPassword,
      email: data.email,
      telefono: data.telefono,
      puesto: data.puesto,
      ubicacion: data.ubicacion,
      activado: true,
      // Campos equivalentes a Candidato
      tipoDocumento: data.tipoDocumento || null,
      fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
      paisOrigen: data.paisOrigen || null,
      direccion: data.direccion || null,
      experiencia: data.experiencia || null,
      aniosExperiencia: data.aniosExperiencia != null ? Number(data.aniosExperiencia) : null,
      disponibilidad: data.disponibilidad || null,
      portacionArma: data.portacionArma ?? false,
      licenciaConducir: data.licenciaConducir || null,
      cursoBasicoPolicial: data.cursoBasicoPolicial ?? false,
    },
  });

  return trabajador;
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

export async function resetearPassword(id: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return prisma.trabajador.update({
    where: { id },
    data: { password: hashedPassword },
  });
}

export async function revocarBiometria(id: string) {
  // Delete all WebAuthn credentials for this trabajador
  await prisma.webAuthnCredential.deleteMany({ where: { trabajadorId: id } });

  // Regenerate activation code and set activado=false so they can re-register
  const codigoActivacion = generarCodigoActivacion();
  return prisma.trabajador.update({
    where: { id },
    data: { activado: false, codigoActivacion },
  });
}

export async function eliminarTrabajador(id: string) {
  return prisma.trabajador.delete({ where: { id } });
}

export async function actualizarTrabajador(
  id: string,
  data: Record<string, unknown>
) {
  // Convert fechaNacimiento string to Date if present
  if (typeof data.fechaNacimiento === "string") {
    data.fechaNacimiento = new Date(data.fechaNacimiento as string);
  }

  return prisma.trabajador.update({
    where: { id },
    data,
  });
}

