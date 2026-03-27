const QR_SECRET = process.env.NEXTAUTH_SECRET || "ddk-qr-secret";

export function generarCodigoQR(puesto: string): string {
  const payload = JSON.stringify({
    puesto,
    key: Buffer.from(`${QR_SECRET}-${puesto}`).toString("base64").slice(0, 12),
  });
  return Buffer.from(payload).toString("base64");
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
