import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { Candidato, calcularPuntaje, getMedalla } from "@/types/models";

// ─── Queries ───

export interface ListCandidatosOptions {
  page?: number;
  limit?: number;
  estado?: string;
  puesto?: string;
  q?: string;
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
  const { page = 1, limit = 20, estado, puesto, q } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (estado && estado !== "todos") where.estado = estado;
  if (puesto && puesto !== "todos") where.puesto = puesto;
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { nombre: { contains: term, mode: "insensitive" } },
      { cedula: { contains: term } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

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
  paisOrigen?: string;
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

    const { error } = await supabaseAdmin.storage
      .from("atestados")
      .upload(fileName, buffer, { contentType: archivo.type });

    if (error) {
      console.error(`Error subiendo archivo ${archivo.name}:`, error.message);
      // Guardar el atestado sin URL de Supabase como fallback
      await prisma.atestado.create({
        data: {
          nombre: archivo.name,
          url: "",
          tipo,
          candidatoId,
        },
      });
      return;
    }

    const { data: urlData } = supabaseAdmin.storage
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
  });

  await Promise.all(uploadPromises);
}

export async function actualizarEstadoCandidato(id: string, estado: string) {
  return prisma.candidato.update({
    where: { id },
    data: { estado },
  });
}

export async function eliminarCandidato(id: string) {
  return prisma.candidato.delete({ where: { id } });
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
