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
}

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
