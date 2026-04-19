import { z } from "zod";

// ─── Validacion de archivos subidos ───
export const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_CANDIDATO = 15;

export function validarArchivo(archivo: File): { ok: true } | { ok: false; error: string } {
  if (archivo.size === 0) {
    return { ok: false, error: `El archivo "${archivo.name}" esta vacio` };
  }
  if (archivo.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `El archivo "${archivo.name}" supera el limite de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    };
  }
  if (!ALLOWED_FILE_MIME_TYPES.includes(archivo.type as (typeof ALLOWED_FILE_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: `Tipo de archivo no permitido: "${archivo.name}" (${archivo.type || "desconocido"}). Solo PDF, JPG, PNG, WEBP o HEIC.`,
    };
  }
  return { ok: true };
}

// Helper para validar IDs tipo cuid en params de URL
const cuidRegex = /^c[a-z0-9]{24}$/;
export function esIdValido(id: string | undefined | null): id is string {
  return typeof id === "string" && cuidRegex.test(id);
}

// Escapa HTML para interpolacion segura en plantillas de correo
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// POST /api/admin/recuperar-password
export const recuperarPasswordSchema = z.object({
  identificacion: z
    .string()
    .min(4, "Identificacion invalida")
    .max(30, "Identificacion demasiado larga")
    .regex(/^[a-zA-Z0-9-]+$/, "Identificacion contiene caracteres invalidos"),
});

// POST /api/candidatos
export const candidatoCreateSchema = z
  .object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    tipoDocumento: z.enum(["cedula", "pasaporte", "dimex"]).default("cedula"),
    cedula: z.string().min(4, "El documento debe tener al menos 4 caracteres"),
    email: z.string().email("Correo electronico invalido"),
    telefono: z.string().min(7, "El telefono debe tener al menos 7 caracteres"),
    direccion: z.string().min(5, "La direccion debe tener al menos 5 caracteres"),
    puesto: z.enum(["seguridad", "limpieza"], {
      error: "El puesto debe ser seguridad o limpieza",
    }),
    aniosExperiencia: z.number().min(0, "Los anios de experiencia no pueden ser negativos"),
    paisOrigen: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipoDocumento === "pasaporte" || data.tipoDocumento === "dimex") {
        return !!data.paisOrigen && data.paisOrigen.trim().length > 0;
      }
      return true;
    },
    { message: "Debe indicar el pais de origen", path: ["paisOrigen"] }
  );

// POST /api/registros
export const registroCreateSchema = z.object({
  tipo: z.enum(["entrada", "salida"], {
    error: "El tipo debe ser entrada o salida",
  }),
  codigoQR: z.string().optional(),
  nota: z.string().optional(),
});

// PATCH /api/candidatos/[id]
export const candidatoUpdateSchema = z.object({
  estado: z.enum(["pendiente", "aprobado", "rechazado"], {
    error: "Estado invalido",
  }),
  ubicacion: z.string().optional(),
});

// POST /api/admin/trabajadores
export const trabajadorCreateSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  cedula: z.string().min(4, "La cedula debe tener al menos 4 caracteres"),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
  email: z.string().email("Correo electronico invalido"),
  telefono: z.string().min(7, "El telefono debe tener al menos 7 caracteres"),
  puesto: z.enum(["seguridad", "limpieza"], {
    error: "El puesto debe ser seguridad o limpieza",
  }),
  ubicacion: z.string().min(1, "La ubicacion es requerida"),
  // Campos equivalentes a Candidato
  tipoDocumento: z.enum(["cedula", "pasaporte", "dimex"]).optional(),
  fechaNacimiento: z.string().optional(),
  paisOrigen: z.string().optional(),
  direccion: z.string().optional(),
  experiencia: z.string().optional(),
  aniosExperiencia: z.union([z.number(), z.string().transform(Number)]).optional(),
  disponibilidad: z.string().optional(),
  portacionArma: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
  licenciaConducir: z.string().optional(),
  cursoBasicoPolicial: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
});

// PATCH /api/admin/trabajadores/[id]
export const trabajadorUpdateSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  cedula: z.string().min(4, "La cedula debe tener al menos 4 caracteres").optional(),
  email: z.string().email("Correo electronico invalido").optional(),
  telefono: z.string().min(7, "El telefono debe tener al menos 7 caracteres").optional(),
  puesto: z.enum(["seguridad", "limpieza"], {
    error: "El puesto debe ser seguridad o limpieza",
  }).optional(),
  ubicacion: z.string().optional(),
  activo: z.boolean().optional(),
  regenerarCodigo: z.boolean().optional(),
  revocarBiometria: z.boolean().optional(),
  resetearPassword: z.string().min(4, "La contraseña debe tener al menos 4 caracteres").optional(),
  // Campos equivalentes a Candidato
  tipoDocumento: z.enum(["cedula", "pasaporte", "dimex"]).nullable().optional(),
  fechaNacimiento: z.string().nullable().optional(),
  paisOrigen: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  experiencia: z.string().nullable().optional(),
  aniosExperiencia: z.union([z.number(), z.string().transform(Number)]).nullable().optional(),
  disponibilidad: z.string().nullable().optional(),
  portacionArma: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
  licenciaConducir: z.string().nullable().optional(),
  cursoBasicoPolicial: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
});

// POST /api/activar (activacion de trabajador)
export const activarTrabajadorSchema = z.object({
  cedula: z.string().min(4, "Cedula invalida").max(30, "Cedula demasiado larga"),
  codigo: z.string().min(4, "Codigo invalido").max(30, "Codigo demasiado largo"),
});

// PATCH /api/admin/notificaciones
export const notificacionPatchSchema = z
  .object({
    id: z.string().min(1).optional(),
    todas: z.boolean().optional(),
  })
  .refine((d) => d.id || d.todas, {
    message: "Debe indicar id o todas=true",
  });

// POST /api/admin/puntos-ruta
export const puntoRutaCreateSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  ubicacion: z.string().min(1, "Ubicacion requerida").max(100),
  orden: z.number().int().min(0, "Orden invalido"),
});

// PATCH /api/admin/puntos-ruta/[id]
export const puntoRutaUpdateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  ubicacion: z.string().min(1).max(100).optional(),
  orden: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

// POST /api/admin/ubicaciones
export const ubicacionCreateSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre requerido").max(100),
});

// PATCH /api/admin/ubicaciones/[id]
export const ubicacionUpdateSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    activa: z.boolean().optional(),
  })
  .refine((d) => d.nombre !== undefined || d.activa !== undefined, {
    message: "No hay datos para actualizar",
  });

// POST /api/bitacoras
export const bitacoraCreateSchema = z.object({
  incidencias: z.string().min(1, "Incidencias requeridas").max(5000),
  entregaA: z.string().min(1, "EntregaA requerido").max(200),
  ubicacion: z.string().min(1, "Ubicacion requerida").max(100),
  tipoIncidencia: z.enum(["robo", "intrusion", "dano_equipo", "lesion", "clima", "horario", "otro"]).optional(),
  severidad: z.enum(["baja", "media", "alta", "critica"]).optional(),
});

// POST /api/rondas
export const rondaCreateSchema = z.object({
  ubicacion: z.string().min(1, "Ubicacion requerida").max(100),
});

// POST /api/rondas/[id]/escanear
export const rondaEscanearSchema = z.object({
  codigoQR: z.string().min(1, "Codigo QR requerido").max(500),
});

// POST /api/rondas/[id]/finalizar
export const rondaFinalizarSchema = z.object({
  observaciones: z.string().max(5000).optional(),
  novedades: z.string().max(5000).optional(),
});
