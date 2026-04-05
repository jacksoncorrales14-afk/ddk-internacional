import { prisma } from "@/lib/prisma";

export async function crearNotificacion(data: {
  tipo: string;
  titulo: string;
  mensaje: string;
  link?: string | null;
}) {
  return prisma.notificacion.create({
    data: {
      tipo: data.tipo,
      titulo: data.titulo,
      mensaje: data.mensaje,
      link: data.link || null,
    },
  });
}

export async function listarNotificaciones(limit = 50) {
  const [items, noLeidas] = await Promise.all([
    prisma.notificacion.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notificacion.count({ where: { leida: false } }),
  ]);
  return { items, noLeidas };
}

export async function marcarLeida(id: string) {
  return prisma.notificacion.update({
    where: { id },
    data: { leida: true },
  });
}

export async function marcarTodasLeidas() {
  return prisma.notificacion.updateMany({
    where: { leida: false },
    data: { leida: true },
  });
}

/**
 * Verifica si ya existe una notificacion del mismo tipo y link creada hoy,
 * para evitar duplicar alertas (ej. trabajador ausente).
 */
export async function existeNotificacionHoy(tipo: string, link: string) {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  return prisma.notificacion.findFirst({
    where: {
      tipo,
      link,
      createdAt: { gte: inicioDia },
    },
  });
}
