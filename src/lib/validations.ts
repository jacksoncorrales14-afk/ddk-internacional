import { z } from "zod";

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
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  diasSemana: z.string().optional(),
  toleranciaMin: z.number().optional(),
});

// POST /api/admin/trabajadores
export const trabajadorCreateSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  cedula: z.string().min(4, "La cedula debe tener al menos 4 caracteres"),
  email: z.string().email("Correo electronico invalido"),
  telefono: z.string().min(7, "El telefono debe tener al menos 7 caracteres"),
  puesto: z.enum(["seguridad", "limpieza"], {
    error: "El puesto debe ser seguridad o limpieza",
  }),
  ubicacion: z.string().min(1, "La ubicacion es requerida"),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  diasSemana: z.string().optional(),
  toleranciaMin: z.number().optional(),
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
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  diasSemana: z.string().optional(),
  toleranciaMin: z.number().optional(),
  regenerarCodigo: z.boolean().optional(),
  revocarBiometria: z.boolean().optional(),
});
