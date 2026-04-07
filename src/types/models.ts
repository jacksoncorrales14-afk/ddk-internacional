// Interfaces compartidas del dominio

export interface Atestado {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
}

export interface Candidato {
  id: string;
  nombre: string;
  tipoDocumento: string;
  cedula: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string | null;
  paisOrigen: string | null;
  puesto: string;
  experiencia: string;
  aniosExperiencia: number;
  portacionArma: boolean;
  licenciaConducir: string | null;
  cursoBasicoPolicial: boolean;
  disponibilidad: string;
  estado: string;
  createdAt: string;
  atestados: Atestado[];
}

export interface HorarioDia {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  toleranciaMin: number;
}

export interface Trabajador {
  id: string;
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  puesto: string;
  ubicacion: string;
  activo: boolean;
  activado: boolean;
  codigoActivacion: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  diasSemana: string | null;
  toleranciaMin: number;
  // Campos equivalentes a Candidato
  tipoDocumento: string | null;
  fechaNacimiento: string | null;
  paisOrigen: string | null;
  direccion: string | null;
  experiencia: string | null;
  aniosExperiencia: number | null;
  disponibilidad: string | null;
  portacionArma: boolean;
  licenciaConducir: string | null;
  cursoBasicoPolicial: boolean;
  // Horarios por dia
  horarios: HorarioDia[];
  biometriaRegistrada: boolean;
  enServicio: boolean;
  ubicacionActual: string | null;
  diasTrabajados: number;
  horasTotales: number;
  createdAt: string;
}

export interface Registro {
  id: string;
  tipo: string;
  fecha: string;
  ubicacion: string;
  nota: string;
}

export interface RegistroAdmin extends Registro {
  trabajador: { nombre: string; cedula: string; ubicacion: string };
}

export interface Jornada {
  trabajador: string;
  cedula: string;
  entrada: string | null;
  salida: string | null;
  duracionMin: number;
}

export type JornadasAgrupadas = Record<string, Jornada[]>;

export interface Ronda {
  id: string;
  fecha: string;
  ubicacion: string;
  observaciones: string;
  novedades: string;
}

export interface RondaAdmin extends Ronda {
  trabajador: { nombre: string; cedula: string };
}

export interface Bitacora {
  id: string;
  fecha: string;
  incidencias: string;
  entregaA: string;
  ubicacion: string;
  tipoIncidencia: string | null;
  severidad: string;
  estado: string;
}

export const TIPOS_INCIDENCIA: { value: string; label: string }[] = [
  { value: "robo", label: "Robo" },
  { value: "intrusion", label: "Intrusion" },
  { value: "dano_equipo", label: "Dano a equipo" },
  { value: "lesion", label: "Lesion" },
  { value: "clima", label: "Evento climatico" },
  { value: "horario", label: "Incidencia de horario" },
  { value: "otro", label: "Otro" },
];

export const SEVERIDADES: { value: string; label: string }[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Critica" },
];

export const TIPOS_INCIDENCIA_LABELS: Record<string, string> = Object.fromEntries(
  TIPOS_INCIDENCIA.map((t) => [t.value, t.label])
);

export const SEVERIDAD_COLORS: Record<string, string> = {
  baja: "bg-blue-100 text-blue-700",
  media: "bg-yellow-100 text-yellow-700",
  alta: "bg-orange-100 text-orange-700",
  critica: "bg-red-100 text-red-700",
};

export const ESTADO_BITACORA_COLORS: Record<string, string> = {
  abierto: "bg-red-100 text-red-700",
  en_revision: "bg-yellow-100 text-yellow-700",
  cerrado: "bg-green-100 text-green-700",
};

export const ESTADO_BITACORA_LABELS: Record<string, string> = {
  abierto: "Abierto",
  en_revision: "En revision",
  cerrado: "Cerrado",
};

export interface Ubicacion {
  id: string;
  nombre: string;
  activa: boolean;
}

/** @deprecated Usar ubicaciones dinamicas desde /api/admin/ubicaciones en su lugar */
export const UBICACIONES = [
  "Jacaranda",
  "Malinches",
  "Parques del Sol (Finca Madre)",
  "Bosque Escondido",
  "Bosque del Rio",
  "Terrazas del Oeste",
  "City Place Santa Ana",
  "Fuerte Ventura",
];

/** @deprecated Usar UBICACIONES */
export const PUESTOS = UBICACIONES;

// Scoring y medallas
export type Medalla = "oro" | "plata" | "bronce";

export function calcularPuntaje(c: Candidato): number {
  let pts = 0;
  pts += c.aniosExperiencia * 10;
  if (c.portacionArma) pts += 25;
  if (c.licenciaConducir) pts += 20;
  if (c.cursoBasicoPolicial) pts += 25;
  if (c.atestados.length >= 3) pts += 20;
  else if (c.atestados.length >= 1) pts += 10;
  return pts;
}

export function getMedalla(c: Candidato): Medalla {
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

export const tipoDocLabels: Record<string, string> = {
  cedula: "Cedula",
  pasaporte: "Pasaporte",
  dimex: "DIMEX",
};
