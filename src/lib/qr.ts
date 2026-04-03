const QR_SECRET = process.env.NEXTAUTH_SECRET || "ddk-qr-secret";

export function generarCodigoQR(puesto: string): string {
  const payload = JSON.stringify({
    puesto,
    key: Buffer.from(`${QR_SECRET}-${puesto}`).toString("base64").slice(0, 12),
  });
  return Buffer.from(payload).toString("base64");
}

export function generarCodigoQRRonda(puntoId: string, nombre: string, ubicacion: string): string {
  const payload = JSON.stringify({
    tipo: "ronda",
    puntoId,
    nombre,
    ubicacion,
    key: Buffer.from(`${QR_SECRET}-ronda-${puntoId}`).toString("base64").slice(0, 12),
  });
  return Buffer.from(payload).toString("base64");
}

export function validarCodigoQRRonda(codigo: string): { valid: boolean; puntoId: string; nombre: string; ubicacion: string } {
  try {
    const decoded = Buffer.from(codigo, "base64").toString("utf-8");
    const { tipo, puntoId, nombre, ubicacion, key } = JSON.parse(decoded);
    if (tipo !== "ronda") return { valid: false, puntoId: "", nombre: "", ubicacion: "" };
    const expectedKey = Buffer.from(`${QR_SECRET}-ronda-${puntoId}`).toString("base64").slice(0, 12);
    if (key === expectedKey) {
      return { valid: true, puntoId, nombre, ubicacion };
    }
    return { valid: false, puntoId: "", nombre: "", ubicacion: "" };
  } catch {
    return { valid: false, puntoId: "", nombre: "", ubicacion: "" };
  }
}

export function validarCodigoQR(codigo: string): { valid: boolean; puesto: string } {
  try {
    const decoded = Buffer.from(codigo, "base64").toString("utf-8");
    const { puesto, key } = JSON.parse(decoded);
    const expectedKey = Buffer.from(`${QR_SECRET}-${puesto}`).toString("base64").slice(0, 12);
    if (key === expectedKey) {
      return { valid: true, puesto };
    }
    return { valid: false, puesto: "" };
  } catch {
    return { valid: false, puesto: "" };
  }
}
