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

export async function listarRondasAdmin() {
  return prisma.ronda.findMany({
    include: {
      trabajador: { select: { nombre: true, cedula: true } },
      escaneos: {
        include: { puntoRuta: { select: { nombre: true, orden: true } } },
        orderBy: { fecha: "asc" },
      },
    },
    orderBy: { fecha: "desc" },
    take: 100,
  });
}
