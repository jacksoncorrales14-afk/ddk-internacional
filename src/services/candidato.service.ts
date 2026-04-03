import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { Candidato, Medalla } from "@/types/models";

// ─── Scoring y Medallas ───

export function calcularPuntaje(c: {
  aniosExperiencia: number;
  portacionArma: boolean;
  licenciaConducir: string | null;
  cursoBasicoPolicial: boolean;
  atestados: { id: string }[];
}): number {
  let pts = 0;
  pts += c.aniosExperiencia * 10;
  if (c.portacionArma) pts += 25;
  if (c.licenciaConducir) pts += 20;
  if (c.cursoBasicoPolicial) pts += 25;
  if (c.atestados.length >= 3) pts += 20;
  else if (c.atestados.length >= 1) pts += 10;
  return pts;
}

export function getMedalla(c: {
  portacionArma: boolean;
  licenciaConducir: string | null;
  cursoBasicoPolicial: boolean;
  atestados: { id: string }[];
  aniosExperiencia: number;
}): Medalla {
  const tieneTodo =
    c.portacionArma &&
    c.licenciaConducir &&
    c.cursoBasicoPolicial &&
    c.atestados.length >= 3 &&
    c.aniosExperiencia >= 2;

  const tieneBastante =
    (c.portacionArma || c.licenciaConducir || c.cursoBasicoPolicial) &&
    c.atestados.length >= 1 &&
    c.aniosExperiencia >= 1;

  if (tieneTodo) return "oro";
  if (tieneBastante) return "plata";
  return "bronce";
}

// ─── Queries ───

export interface ListCandidatosOptions {
  page?: number;
  limit?: number;
  estado?: string;
  puesto?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listarCandidatos(
  options: ListCandidatosOptions = {}
): Promise<PaginatedResult<Candidato>> {
  const { page = 1, limit = 20, estado, puesto } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, string> = {};
  if (estado && estado !== "todos") where.estado = estado;
  if (puesto && puesto !== "todos") where.puesto = puesto;

  const [candidatos, total] = await Promise.all([
    prisma.candidato.findMany({
      where,
      include: { atestados: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.candidato.count({ where }),
  ]);

  return {
    data: candidatos as unknown as Candidato[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function obtenerCandidato(id: string) {
  return prisma.candidato.findUnique({
    where: { id },
    include: { atestados: true },
  });
}

export async function crearCandidato(data: {
  nombre: string;
  tipoDocumento: string;
  cedula: string;
  email: string;
  fechaNacimiento?: Date;
  telefono: string;
  direccion: string;
  puesto: string;
  experiencia?: string;
  disponibilidad?: string;
  aniosExperiencia: number;
  portacionArma: boolean;
  licenciaConducir: string | null;
  cursoBasicoPolicial: boolean;
}) {
  const existe = await prisma.candidato.findUnique({
    where: { cedula: data.cedula },
  });
  if (existe) {
    throw new Error("Ya existe una solicitud con este numero de documento");
  }

  return prisma.candidato.create({ data });
}

export async function subirAtestados(
  candidatoId: string,
  archivos: File[],
  tiposArchivo: string[]
) {
  const uploadPromises = archivos.map(async (archivo, i) => {
    if (archivo.size === 0) return;

    const tipo = tiposArchivo[i] || "otro";
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const fileName = `${candidatoId}/${Date.now()}-${i}-${archivo.name}`;

    const { error } = await supabase.storage
      .from("atestados")
      .upload(fileName, buffer, { contentType: archivo.type });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("atestados")
        .getPublicUrl(fileName);

      await prisma.atestado.create({
        data: {
          nombre: archivo.name,
          url: urlData.publicUrl,
          tipo,
          candidatoId,
        },
      });
    }
  });

  await Promise.all(uploadPromises);
}

export async function actualizarEstadoCandidato(id: string, estado: string) {
  return prisma.candidato.update({
    where: { id },
    data: { estado },
  });
}

// ─── Emergencia: candidatos rankeados ───

export async function listarCandidatosEmergencia(puesto?: string) {
  const where: Record<string, unknown> = { estado: { not: "rechazado" } };
  if (puesto && puesto !== "todos") where.puesto = puesto;

  const candidatos = await prisma.candidato.findMany({
    where,
    include: { atestados: true },
    orderBy: { createdAt: "desc" },
  });

  return (candidatos as unknown as Candidato[])
    .map((c) => ({
      ...c,
      puntaje: calcularPuntaje(c),
      medalla: getMedalla(c),
    }))
    .sort((a, b) => b.puntaje - a.puntaje);
}
