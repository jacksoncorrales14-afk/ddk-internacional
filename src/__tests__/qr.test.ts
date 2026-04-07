import {
  generarCodigoQR,
  validarCodigoQR,
  generarCodigoQRRonda,
  validarCodigoQRRonda,
} from "@/lib/qr";

describe("generarCodigoQR", () => {
  it("produces a valid base64 string", () => {
    const code = generarCodigoQR("Jacaranda");
    expect(typeof code).toBe("string");
    // Should be valid base64 - decoding should not throw
    const decoded = Buffer.from(code, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    expect(parsed).toHaveProperty("puesto", "Jacaranda");
    expect(parsed).toHaveProperty("timestamp");
    expect(parsed).toHaveProperty("key");
  });
});

describe("validarCodigoQR", () => {
  it("validates a freshly generated code", () => {
    const code = generarCodigoQR("Malinches");
    const result = validarCodigoQR(code);
    expect(result.valid).toBe(true);
    expect(result.puesto).toBe("Malinches");
  });

  it("rejects tampered codes", () => {
    const code = generarCodigoQR("Jacaranda");
    const decoded = Buffer.from(code, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    parsed.puesto = "Hackeado";
    const tampered = Buffer.from(JSON.stringify(parsed)).toString("base64");
    const result = validarCodigoQR(tampered);
    expect(result.valid).toBe(false);
  });

  it("rejects expired codes with a negative TTL", () => {
    const code = generarCodigoQR("Jacaranda");
    // Use a TTL of -1ms so the code is always expired
    const result = validarCodigoQR(code, -1);
    expect(result.valid).toBe(false);
  });

  it("rejects completely invalid input", () => {
    const result = validarCodigoQR("not-valid-base64!!!");
    expect(result.valid).toBe(false);
    expect(result.puesto).toBe("");
  });

  it("rejects base64 string with missing fields", () => {
    const payload = Buffer.from(JSON.stringify({ puesto: "X" })).toString("base64");
    const result = validarCodigoQR(payload);
    expect(result.valid).toBe(false);
  });
});

describe("generarCodigoQRRonda", () => {
  it("produces a valid base64 string with ronda fields", () => {
    const code = generarCodigoQRRonda("punto-1", "Entrada Principal", "Jacaranda");
    const decoded = Buffer.from(code, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    expect(parsed).toHaveProperty("tipo", "ronda");
    expect(parsed).toHaveProperty("puntoId", "punto-1");
    expect(parsed).toHaveProperty("nombre", "Entrada Principal");
    expect(parsed).toHaveProperty("ubicacion", "Jacaranda");
  });
});

describe("validarCodigoQRRonda", () => {
  it("validates a freshly generated ronda code", () => {
    const code = generarCodigoQRRonda("punto-2", "Piscina", "Bosque del Rio");
    const result = validarCodigoQRRonda(code);
    expect(result.valid).toBe(true);
    expect(result.puntoId).toBe("punto-2");
    expect(result.nombre).toBe("Piscina");
    expect(result.ubicacion).toBe("Bosque del Rio");
  });

  it("rejects tampered ronda codes", () => {
    const code = generarCodigoQRRonda("punto-1", "Entrada", "Jacaranda");
    const decoded = Buffer.from(code, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    parsed.puntoId = "punto-hacked";
    const tampered = Buffer.from(JSON.stringify(parsed)).toString("base64");
    const result = validarCodigoQRRonda(tampered);
    expect(result.valid).toBe(false);
  });

  it("rejects expired ronda codes with a negative TTL", () => {
    const code = generarCodigoQRRonda("punto-1", "Entrada", "Jacaranda");
    const result = validarCodigoQRRonda(code, -1);
    expect(result.valid).toBe(false);
  });
});
