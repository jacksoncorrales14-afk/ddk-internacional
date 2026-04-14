import { prisma } from "@/lib/prisma";
import { validarCodigoQR, validarCodigoQRRonda } from "@/lib/qr";
import type { Jornada, JornadasAgrupadas } from "@/types/models";

// ─── Registros Horarios ───

export async function listarRegistrosTrabajador(trabajadorId: string) {
  return prisma.registroHorario.findMany({
    where: { trabajadorId },
    orderBy: { fecha: "desc" },
    take: 50,
  });
}

export interface FiltrosRegistros {
  desde?: Date;
  hasta?: Date;
  trabajadorId?: string;
  ubicacion?: string;
  limit?: number;
}

function buildWhere(filtros: FiltrosRegistros): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (filtros.trabajadorId) where.trabajadorId = filtros.trabajadorId;
  if (filtros.ubicacion) where.ubicacion = filtros.ubicacion;
  if (filtros.desde || filtros.hasta) {
    const fecha: Record<string, Date> = {};
    if (filtros.desde) fecha.gte = filtros.desde;
    if (filtros.hasta) fecha.lte = filtros.hasta;
    where.fecha = fecha;
  }
  return where;
}

export async function listarRegistrosAdmin(filtros: FiltrosRegistros = {}) {
  const where = buildWhere(filtros);
  return prisma.registroHorario.findMany({
    where,
    include: { trabajador: { select: { nombre: true, cedula: true, ubicacion: true } } },
    orderBy: { fecha: "desc" },
    take: filtros.limit || 500,
  });
}

/**
 * Retorna registros agrupados en jornadas (entrada+salida) por ubicacion.
 * Toda la logica de sorting/pairing/grouping se ejecuta en el servidor.
 */
export async function listarRegistrosAdminAgrupados(
  filtros: FiltrosRegistros = {}
): Promise<JornadasAgrupadas> {
  const where = buildWhere(filtros);
  const registros = await prisma.registroHorario.findMany({
    where,
    include: {
      trabajador: { select: { nombre: true, cedula: true, ubicacion: true } },
    },
    orderBy: [{ trabajadorId: "asc" }, { fecha: "asc" }],
    take: filtros.limit || 500,
  });

  // Emparejar entradas con salidas por trabajador
  const porUbicacion: JornadasAgrupadas = {};
  const entradasPendientes: Record<
    string,
    (typeof registros)[number]
  > = {};

  function pushJornada(
    ubic: string,
    jornada: Jornada
  ) {
    if (!porUbicacion[ubic]) porUbicacion[ubic] = [];
    porUbicacion[ubic].push(jornada);
  }

  for (const r of registros) {
    const key = r.trabajador.cedula;
    if (r.tipo === "entrada") {
      // Si ya habia una entrada sin cerrar, registrarla como jornada abierta
      if (entradasPendientes[key]) {
        const prev = entradasPendientes[key];
        const ubic =
          prev.ubicacion || prev.trabajador.ubicacion || "Sin ubicacion";
        pushJornada(ubic, {
          trabajador: prev.trabajador.nombre,
          cedula: prev.trabajador.cedula,
          entrada: prev.fecha.toISOString(),
          salida: null,
          duracionMin: 0,
        });
      }
      entradasPendientes[key] = r;
    } else if (r.tipo === "salida") {
      const entrada = entradasPendientes[key];
      if (entrada) {
        const ubic =
          entrada.ubicacion ||
          r.ubicacion ||
          r.trabajador.ubicacion ||
          "Sin ubicacion";
        const dur = Math.max(
          0,
          Math.floor(
            (r.fecha.getTime() - entrada.fecha.getTime()) / 60000
          )
        );
        pushJornada(ubic, {
          trabajador: entrada.trabajador.nombre,
          cedula: entrada.trabajador.cedula,
          entrada: entrada.fecha.toISOString(),
          salida: r.fecha.toISOString(),
          duracionMin: dur,
        });
        delete entradasPendientes[key];
      } else {
        // Salida sin entrada correspondiente
        const ubic =
          r.ubicacion || r.trabajador.ubicacion || "Sin ubicacion";
        pushJornada(ubic, {
          trabajador: r.trabajador.nombre,
          cedula: r.trabajador.cedula,
          entrada: null,
          salida: r.fecha.toISOString(),
          duracionMin: 0,
        });
      }
    }
  }

  // Las entradas que nunca cerraron
  for (const key of Object.keys(entradasPendientes)) {
    const r = entradasPendientes[key];
    const ubic =
      r.ubicacion || r.trabajador.ubicacion || "Sin ubicacion";
    pushJornada(ubic, {
      trabajador: r.trabajador.nombre,
      cedula: r.trabajador.cedula,
      entrada: r.fecha.toISOString(),
      salida: null,
      duracionMin: 0,
    });
  }

  // Dentro de cada ubicacion, ordenar por fecha descendente
  for (const ubic of Object.keys(porUbicacion)) {
    porUbicacion[ubic].sort((a, b) => {
      const ta = a.entrada || a.salida || "";
      const tb = b.entrada || b.salida || "";
      return new Date(tb).getTime() - new Date(ta).getTime();
    });
  }

  return porUbicacion;
}

export async function crearRegistro(data: {
  trabajadorId: string;
  tipo: string;
  nota?: string;
  codigoQR?: string;
}) {
  if (!["entrada", "salida"].includes(data.tipo)) {
    throw new Error("Tipo invalido");
  }

  let ubicacion: string | undefined;

  if (data.tipo === "entrada") {
    if (!data.codigoQR) {
      throw new Error("Debe escanear el codigo QR del puesto");
    }
    const { valid, puesto } = validarCodigoQR(data.codigoQR);
    if (valid) {
      ubicacion = puesto;
    } else {
      // Intentar como QR de ronda (ej: Caseta Principal tambien sirve para marcar entrada)
      const rondaResult = validarCodigoQRRonda(data.codigoQR);
      if (!rondaResult.valid) {
        throw new Error("Codigo QR invalido");
      }
      ubicacion = rondaResult.ubicacion;
    }
  } else {
    // Para salida, usar la ubicacion de la ultima entrada
    const ultimaEntrada = await prisma.registroHorario.findFirst({
      where: { trabajadorId: data.trabajadorId, tipo: "entrada" },
      orderBy: { fecha: "desc" },
    });
    ubicacion = ultimaEntrada?.ubicacion || undefined;
  }

  return prisma.registroHorario.create({
    data: {
      trabajadorId: data.trabajadorId,
      tipo: data.tipo,
      ubicacion: ubicacion || null,
      nota: data.nota || null,
    },
  });
}

// ─── Rondas ───

export async function listarRondasTrabajador(trabajadorId: string) {
  return prisma.ronda.findMany({
    where: { trabajadorId },
    orderBy: { fecha: "desc" },
    take: 50,
  });
}

export async function listarRondasAdmin() {
  return prisma.ronda.findMany({
    include: { trabajador: { select: { nombre: true, cedula: true } } },
    orderBy: { fecha: "desc" },
    take: 100,
  });
}

export async function crearRonda(data: {
  trabajadorId: string;
  ubicacion: string;
  observaciones?: string;
  novedades?: string;
}) {
  if (!data.ubicacion) {
    throw new Error("La ubicacion es requerida");
  }

  return prisma.ronda.create({
    data: {
      trabajadorId: data.trabajadorId,
      ubicacion: data.ubicacion,
      observaciones: data.observaciones || null,
      novedades: data.novedades || null,
    },
  });
}

// ─── Bitacoras ───

export async function listarBitacorasTrabajador(trabajadorId: string) {
  return prisma.bitacora.findMany({
    where: { trabajadorId },
    orderBy: { fecha: "desc" },
    take: 50,
  });
}

export async function listarBitacorasAdmin(filtros: FiltrosRegistros = {}) {
  const where = buildWhere(filtros);
  return prisma.bitacora.findMany({
    where,
    include: { trabajador: { select: { nombre: true, cedula: true } } },
    orderBy: { fecha: "desc" },
    take: filtros.limit || 500,
  });
}

export async function crearBitacora(data: {
  trabajadorId: string;
  incidencias: string;
  entregaA: string;
  ubicacion: string;
  tipoIncidencia?: string;
  severidad?: string;
}) {
  if (!data.incidencias || !data.entregaA || !data.ubicacion) {
    throw new Error("Todos los campos son requeridos");
  }

  const tiposValidos = ["robo", "intrusion", "dano_equipo", "lesion", "clima", "horario", "otro"];
  const severidadesValidas = ["baja", "media", "alta", "critica"];

  if (data.tipoIncidencia && !tiposValidos.includes(data.tipoIncidencia)) {
    throw new Error("Tipo de incidencia invalido");
  }
  if (data.severidad && !severidadesValidas.includes(data.severidad)) {
    throw new Error("Severidad invalida");
  }

  return prisma.bitacora.create({
    data: {
      trabajadorId: data.trabajadorId,
      incidencias: data.incidencias,
      entregaA: data.entregaA,
      ubicacion: data.ubicacion,
      tipoIncidencia: data.tipoIncidencia || null,
      severidad: data.severidad || "media",
      estado: "abierto",
    },
  });
}

// ─── Stats ───

export async function obtenerStatsAdmin() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [candidatos, trabajadores, registrosHoy] = await Promise.all([
    prisma.candidato.count(),
    prisma.trabajador.count({ where: { activo: true } }),
    prisma.registroHorario.count({ where: { fecha: { gte: hoy } } }),
  ]);

  return { candidatos, trabajadores, registrosHoy };
}
