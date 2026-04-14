import {
  candidatoCreateSchema,
  registroCreateSchema,
  trabajadorCreateSchema,
} from "@/lib/validations";

describe("candidatoCreateSchema", () => {
  const validData = {
    nombre: "Juan Perez",
    tipoDocumento: "cedula" as const,
    cedula: "1234567",
    email: "juan@example.com",
    telefono: "88881234",
    direccion: "San Jose Centro",
    puesto: "seguridad" as const,
    aniosExperiencia: 3,
  };

  it("accepts valid candidato data", () => {
    const result = candidatoCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts valid data with paisOrigen", () => {
    const result = candidatoCreateSchema.safeParse({
      ...validData,
      tipoDocumento: "pasaporte",
      paisOrigen: "Nicaragua",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing nombre", () => {
    const { nombre: _nombre, ...rest } = validData;
    const result = candidatoCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = candidatoCreateSchema.safeParse({
      ...validData,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid puesto", () => {
    const result = candidatoCreateSchema.safeParse({
      ...validData,
      puesto: "conductor",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative aniosExperiencia", () => {
    const result = candidatoCreateSchema.safeParse({
      ...validData,
      aniosExperiencia: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects short telefono", () => {
    const result = candidatoCreateSchema.safeParse({
      ...validData,
      telefono: "123",
    });
    expect(result.success).toBe(false);
  });

  it("requires paisOrigen when tipoDocumento is pasaporte", () => {
    const result = candidatoCreateSchema.safeParse({
      ...validData,
      tipoDocumento: "pasaporte",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("paisOrigen");
    }
  });

  it("requires paisOrigen when tipoDocumento is dimex", () => {
    const result = candidatoCreateSchema.safeParse({
      ...validData,
      tipoDocumento: "dimex",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("paisOrigen");
    }
  });

  it("does not require paisOrigen when tipoDocumento is cedula", () => {
    const result = candidatoCreateSchema.safeParse({
      ...validData,
      tipoDocumento: "cedula",
    });
    expect(result.success).toBe(true);
  });
});

describe("registroCreateSchema", () => {
  it('accepts valid entrada registro', () => {
    const result = registroCreateSchema.safeParse({ tipo: "entrada" });
    expect(result.success).toBe(true);
  });

  it('accepts valid salida registro', () => {
    const result = registroCreateSchema.safeParse({ tipo: "salida" });
    expect(result.success).toBe(true);
  });

  it("accepts registro with optional fields", () => {
    const result = registroCreateSchema.safeParse({
      tipo: "entrada",
      codigoQR: "abc123",
      nota: "Llegada puntual",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid tipo", () => {
    const result = registroCreateSchema.safeParse({ tipo: "descanso" });
    expect(result.success).toBe(false);
  });

  it("rejects missing tipo", () => {
    const result = registroCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("trabajadorCreateSchema", () => {
  const validTrabajador = {
    nombre: "Maria Lopez",
    cedula: "9876543",
    password: "pass1234",
    email: "maria@example.com",
    telefono: "88887654",
    puesto: "limpieza" as const,
    ubicacion: "Jacaranda",
  };

  it("accepts valid trabajador data", () => {
    const result = trabajadorCreateSchema.safeParse(validTrabajador);
    expect(result.success).toBe(true);
  });

  it("accepts trabajador with optional fields", () => {
    const result = trabajadorCreateSchema.safeParse({
      ...validTrabajador,
      horaInicio: "06:00",
      horaFin: "14:00",
      diasSemana: "L,M,Mi,J,V",
      toleranciaMin: 15,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing nombre", () => {
    const { nombre: _nombre, ...rest } = validTrabajador;
    const result = trabajadorCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing cedula", () => {
    const { cedula: _cedula, ...rest } = validTrabajador;
    const result = trabajadorCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email: _email, ...rest } = validTrabajador;
    const result = trabajadorCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing ubicacion", () => {
    const { ubicacion: _ubicacion, ...rest } = validTrabajador;
    const result = trabajadorCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid puesto value", () => {
    const result = trabajadorCreateSchema.safeParse({
      ...validTrabajador,
      puesto: "conductor",
    });
    expect(result.success).toBe(false);
  });
});
