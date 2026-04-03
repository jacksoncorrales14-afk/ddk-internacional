import { prisma } from "@/lib/prisma";
import { validarCodigoQR } from "@/lib/qr";

// ─── Registros Horarios ───

export async function listarRegistrosTrabajador(trabajadorId: string) {
  return prisma.registroHorario.findMany({
    where: { trabajadorId },
    orderBy: { fecha: "desc" },
    take: 50,
  });
}

export async function listarRegistrosAdmin() {
  return prisma.registroHorario.findMany({
    include: { trabajador: { select: { nombre: true, cedula: true, ubicacion: true } } },
    orderBy: { fecha: "desc" },
    take: 100,
  });
}

export async function crearRegistro(data: {
  trabajadorId: string;
  tipo: string;
  nota?: string;
  codigoQR: string;
}) {
  if (!["entrada", "salida"].includes(data.tipo)) {
    throw new Error("Tipo invalido");
  }

  if (!data.codigoQR) {
    throw new Error("Debe escanear el codigo QR del puesto");
  }

  const { valid, puesto } = validarCodigoQR(data.codigoQR);
  if (!valid) {
    throw new Error("Codigo QR invalido");
  }

  return prisma.registroHorario.create({
    data: {
      trabajadorId: data.trabajadorId,
      tipo: data.tipo,
      ubicacion: puesto,
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

export async function listarBitacorasAdmin() {
  return prisma.bitacora.findMany({
    include: { trabajador: { select: { nombre: true, cedula: true } } },
    orderBy: { fecha: "desc" },
    take: 200,
  });
}

export async function crearBitacora(data: {
  trabajadorId: string;
  incidencias: string;
  entregaA: string;
  ubicacion: string;
}) {
  if (!data.incidencias || !data.entregaA || !data.ubicacion) {
    throw new Error("Todos los campos son requeridos");
  }

  return prisma.bitacora.create({
    data: {
      trabajadorId: data.trabajadorId,
      incidencias: data.incidencias,
      entregaA: data.entregaA,
      ubicacion: data.ubicacion,
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
