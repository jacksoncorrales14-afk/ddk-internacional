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
        horarios: { orderBy: { diaSemana: "asc" } },
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
      estadisticas AS (
        SELECT
          e."trabajadorId",
          COUNT(DISTINCT DATE(e."fecha")) AS "diasTrabajados",
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
      horaInicio: t.horaInicio,
      horaFin: t.horaFin,
      diasSemana: t.diasSemana,
      toleranciaMin: t.toleranciaMin,
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
      // Horarios por dia
      horarios: t.horarios.map((h) => ({
        id: h.id,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        toleranciaMin: h.toleranciaMin,
      })),
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
  horaInicio?: string | null;
  horaFin?: string | null;
  diasSemana?: string | null;
  toleranciaMin?: number;
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
  // Horarios por dia
  horarios?: { diaSemana: number; horaInicio: string; horaFin: string; toleranciaMin?: number }[];
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
      horaInicio: data.horaInicio || null,
      horaFin: data.horaFin || null,
      diasSemana: data.diasSemana || null,
      toleranciaMin: data.toleranciaMin ?? 15,
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

  // Crear horarios por dia si se proporcionaron
  if (data.horarios && data.horarios.length > 0) {
    await prisma.horarioDia.createMany({
      data: data.horarios.map((h) => ({
        trabajadorId: trabajador.id,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        toleranciaMin: h.toleranciaMin ?? 15,
      })),
    });
  }

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
  // Extract horarios before passing to Prisma update
  const horarios = data.horarios as { diaSemana: number; horaInicio: string; horaFin: string; toleranciaMin?: number }[] | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { horarios: _h, ...updateData } = data;

  // Convert fechaNacimiento string to Date if present
  if (typeof updateData.fechaNacimiento === "string") {
    updateData.fechaNacimiento = new Date(updateData.fechaNacimiento as string);
  }

  const trabajador = await prisma.trabajador.update({
    where: { id },
    data: updateData,
  });

  // Replace horarios if provided
  if (horarios !== undefined) {
    await prisma.horarioDia.deleteMany({ where: { trabajadorId: id } });
    if (horarios.length > 0) {
      await prisma.horarioDia.createMany({
        data: horarios.map((h) => ({
          trabajadorId: id,
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          toleranciaMin: h.toleranciaMin ?? 15,
        })),
      });
    }
  }

  return trabajador;
}

// ─── Deteccion de ausencias ───

function minutosDesdeHora(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Detecta trabajadores que deberian estar trabajando (segun horario) pero no han marcado entrada hoy.
 * Crea una notificacion por cada uno, sin duplicar si ya existe una para hoy.
 */
export async function detectarAusencias() {
  const ahora = new Date();
  const diaSemanaNum = ahora.getDay() === 0 ? 7 : ahora.getDay(); // 1..7 lun..dom
  const diaSemanaStr = String(diaSemanaNum);
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

  const inicioDia = new Date(ahora);
  inicioDia.setHours(0, 0, 0, 0);

  // Trabajadores activos con horario definido (old fields OR new HorarioDia records)
  const trabajadores = await prisma.trabajador.findMany({
    where: {
      activo: true,
      OR: [
        { horaInicio: { not: null } },
        { horarios: { some: {} } },
      ],
    },
    include: {
      horarios: true,
    },
  });

  // Batch-fetch ALL entrada records for today in a single query
  const trabajadorIds = trabajadores.map((t) => t.id);
  const entradasHoy = await prisma.registroHorario.findMany({
    where: {
      trabajadorId: { in: trabajadorIds },
      tipo: "entrada",
      fecha: { gte: inicioDia },
    },
    select: { trabajadorId: true },
  });
  const trabajadoresConEntrada = new Set(entradasHoy.map((e) => e.trabajadorId));

  // Batch-fetch ALL "trabajador_ausente" notifications created today in a single query
  const notificacionesHoy = await prisma.notificacion.findMany({
    where: {
      tipo: "trabajador_ausente",
      createdAt: { gte: inicioDia },
    },
    select: { mensaje: true },
  });
  const mensajesNotificados = new Set(notificacionesHoy.map((n) => n.mensaje));

  const ausentes: { id: string; nombre: string; ubicacion: string }[] = [];

  for (const t of trabajadores) {
    // Check HorarioDia records first (new system)
    const horarioDia = t.horarios.find((h) => h.diaSemana === diaSemanaNum);

    if (horarioDia) {
      // Use per-day schedule
      const horaInicioMin = minutosDesdeHora(horarioDia.horaInicio);
      const limite = horaInicioMin + horarioDia.toleranciaMin;

      if (minutosActuales < limite) continue;

      if (!trabajadoresConEntrada.has(t.id)) {
        ausentes.push({ id: t.id, nombre: t.nombre, ubicacion: t.ubicacion });
      }
    } else if (t.horarios.length > 0) {
      // Worker has HorarioDia records but not for today -> not scheduled today
      continue;
    } else if (t.horaInicio) {
      // Backward compatibility: use old flat fields
      const dias = (t.diasSemana || "").split(",").filter(Boolean);
      if (dias.length > 0 && !dias.includes(diaSemanaStr)) continue;

      const horaInicioMin = minutosDesdeHora(t.horaInicio);
      const limite = horaInicioMin + (t.toleranciaMin ?? 15);

      if (minutosActuales < limite) continue;

      if (!trabajadoresConEntrada.has(t.id)) {
        ausentes.push({ id: t.id, nombre: t.nombre, ubicacion: t.ubicacion });
      }
    }
  }

  // Crear notificaciones (sin duplicados del mismo dia, checked against pre-fetched set)
  const link = "/admin/trabajadores";
  for (const a of ausentes) {
    const mensajeEsperado = `${a.nombre} no ha marcado entrada hoy en ${a.ubicacion}.`;
    const yaNotificado = Array.from(mensajesNotificados).some((msg) => msg.includes(a.nombre));
    if (!yaNotificado) {
      await prisma.notificacion.create({
        data: {
          tipo: "trabajador_ausente",
          titulo: "Trabajador ausente",
          mensaje: mensajeEsperado,
          link,
        },
      });
    }
  }

  return { ausentes: ausentes.length, detalle: ausentes };
}
