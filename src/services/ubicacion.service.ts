import { prisma } from "@/lib/prisma";

export async function listarUbicaciones(soloActivas = true) {
  const where = soloActivas ? { activa: true } : {};
  return prisma.ubicacion.findMany({ where, orderBy: { nombre: "asc" } });
}

export async function crearUbicacion(nombre: string) {
  return prisma.ubicacion.create({ data: { nombre } });
}

export async function actualizarUbicacion(id: string, data: { nombre?: string; activa?: boolean }) {
  return prisma.ubicacion.update({ where: { id }, data });
}

export async function eliminarUbicacion(id: string) {
  return prisma.ubicacion.delete({ where: { id } });
}
