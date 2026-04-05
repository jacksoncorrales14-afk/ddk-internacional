import { prisma } from "@/lib/prisma";
import { validarCodigoQRRonda } from "@/lib/qr";

// ─── Puntos de Ruta ───

export async function listarPuntosRuta(ubicacion?: string) {
  const where = ubicacion ? { ubicacion } : {};
  return prisma.puntoRuta.findMany({
    where,
    orderBy: [{ ubicacion: "asc" }, { orden: "asc" }],
  });
}

export async function crearPuntoRuta(data: {
  nombre: string;
  ubicacion: string;
  orden: number;
}) {
  return prisma.puntoRuta.create({ data });
}

export async function actualizarPuntoRuta(id: string, data: { nombre?: string; orden?: number }) {
  return prisma.puntoRuta.update({ where: { id }, data });
}

export async function eliminarPuntoRuta(id: string) {
  return prisma.puntoRuta.delete({ where: { id } });
}

// ─── Rondas ───

export async function iniciarRonda(trabajadorId: string, ubicacion: string) {
  const totalPuntos = await prisma.puntoRuta.count({ where: { ubicacion } });

  if (totalPuntos === 0) {
    throw new Error("No hay puntos de ruta definidos para esta ubicacion");
  }

  return prisma.ronda.create({
    data: {
      trabajadorId,
      ubicacion,
      totalPuntos,
    },
  });
}

export async function escanearPuntoRonda(data: {
  rondaId: string;
  trabajadorId: string;
  codigoQR: string;
}) {
  const { valid, puntoId, ubicacion } = validarCodigoQRRonda(data.codigoQR);

  if (!valid) {
    throw new Error("Codigo QR de ronda invalido");
  }

  const ronda = await prisma.ronda.findUnique({
    where: { id: data.rondaId },
    include: { escaneos: true },
  });

  if (!ronda) throw new Error("Ronda no encontrada");
  if (ronda.trabajadorId !== data.trabajadorId) throw new Error("No autorizado");
  if (ronda.completada) throw new Error("Esta ronda ya fue completada");
  if (ronda.ubicacion !== ubicacion) throw new Error("Este punto no pertenece a la ruta de esta ronda");

  // Verificar que no se haya escaneado ya
  const yaEscaneado = ronda.escaneos.some((e) => e.puntoRutaId === puntoId);
  if (yaEscaneado) {
    throw new Error("Este punto ya fue escaneado en esta ronda");
  }

  // Verificar orden - detectar si se salto algun punto
  const puntosRuta = await prisma.puntoRuta.findMany({
    where: { ubicacion: ronda.ubicacion },
    orderBy: { orden: "asc" },
  });
  const puntoActual = puntosRuta.find((p) => p.id === puntoId);
  const puntosEscaneadosIds = new Set(ronda.escaneos.map((e) => e.puntoRutaId));

  let warning: string | null = null;
  if (puntoActual) {
    const puntosSaltados = puntosRuta.filter(
      (p) => p.orden < puntoActual.orden && !puntosEscaneadosIds.has(p.id)
    );
    if (puntosSaltados.length > 0) {
      const nombres = puntosSaltados.map((p) => p.nombre).join(", ");
      warning = `Se saltaron puntos de la ruta: ${nombres}`;
    }
  }

  const escaneo = await prisma.escaneoRonda.create({
    data: {
      rondaId: data.rondaId,
      puntoRutaId: puntoId,
    },
    include: {
      puntoRuta: { select: { nombre: true, orden: true } },
    },
  });

  // Verificar si se completo la ronda
  const totalEscaneos = ronda.escaneos.length + 1;
  if (totalEscaneos >= ronda.totalPuntos) {
    await prisma.ronda.update({
      where: { id: data.rondaId },
      data: { completada: true },
    });
  }

  return {
    escaneo,
    puntosEscaneados: totalEscaneos,
    totalPuntos: ronda.totalPuntos,
    completada: totalEscaneos >= ronda.totalPuntos,
    warning,
  };
}

export async function finalizarRonda(rondaId: string, trabajadorId: string, observaciones?: string, novedades?: string) {
  const ronda = await prisma.ronda.findUnique({ where: { id: rondaId } });
  if (!ronda || ronda.trabajadorId !== trabajadorId) throw new Error("No autorizado");

  return prisma.ronda.update({
    where: { id: rondaId },
    data: { observaciones, novedades },
  });
}

export async function listarRondasTrabajador(trabajadorId: string) {
  return prisma.ronda.findMany({
    where: { trabajadorId },
    include: {
      escaneos: {
        include: { puntoRuta: { select: { nombre: true, orden: true } } },
        orderBy: { fecha: "asc" },
      },
    },
    orderBy: { fecha: "desc" },
    take: 20,
  });
}

export interface FiltrosRondas {
  desde?: Date;
  hasta?: Date;
  trabajadorId?: string;
  ubicacion?: string;
  limit?: number;
}

export async function listarRondasAdmin(filtros: FiltrosRondas = {}) {
  const where: Record<string, unknown> = {};
  if (filtros.trabajadorId) where.trabajadorId = filtros.trabajadorId;
  if (filtros.ubicacion) where.ubicacion = filtros.ubicacion;
  if (filtros.desde || filtros.hasta) {
    const fecha: Record<string, Date> = {};
    if (filtros.desde) fecha.gte = filtros.desde;
    if (filtros.hasta) fecha.lte = filtros.hasta;
    where.fecha = fecha;
  }

  return prisma.ronda.findMany({
    where,
    include: {
      trabajador: { select: { nombre: true, cedula: true } },
      escaneos: {
        include: { puntoRuta: { select: { nombre: true, orden: true } } },
        orderBy: { fecha: "asc" },
      },
    },
    orderBy: { fecha: "desc" },
    take: filtros.limit || 500,
  });
}
