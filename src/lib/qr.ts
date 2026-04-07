import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET || process.env.NEXTAUTH_SECRET || "ddk-qr-secret";

/** Default TTL for location QR codes: 365 days (printed, long-lived) */
const DEFAULT_LOCATION_QR_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/** Default TTL for ronda QR codes: 365 days (printed, long-lived) */
const DEFAULT_RONDA_QR_TTL_MS = 365 * 24 * 60 * 60 * 1000;

function hmac(data: string): string {
  return crypto.createHmac("sha256", QR_SECRET).update(data).digest("hex");
}

function isExpired(timestamp: number, ttlMs: number): boolean {
  return Date.now() - timestamp > ttlMs;
}

// ─── Location QR (puesto) ───

export function generarCodigoQR(puesto: string): string {
  const timestamp = Date.now();
  const key = hmac(`location:${puesto}:${timestamp}`);
  const payload = JSON.stringify({ puesto, timestamp, key });
  return Buffer.from(payload).toString("base64");
}

export function validarCodigoQR(
  codigo: string,
  ttlMs: number = DEFAULT_LOCATION_QR_TTL_MS
): { valid: boolean; puesto: string } {
  try {
    const decoded = Buffer.from(codigo, "base64").toString("utf-8");
    const { puesto, timestamp, key } = JSON.parse(decoded);

    if (!puesto || !timestamp || !key) {
      return { valid: false, puesto: "" };
    }

    if (isExpired(timestamp, ttlMs)) {
      return { valid: false, puesto: "" };
    }

    const expectedKey = hmac(`location:${puesto}:${timestamp}`);
    if (crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expectedKey))) {
      return { valid: true, puesto };
    }
    return { valid: false, puesto: "" };
  } catch {
    return { valid: false, puesto: "" };
  }
}

// ─── Ronda QR (punto de ruta) ───

export function generarCodigoQRRonda(puntoId: string, nombre: string, ubicacion: string): string {
  const timestamp = Date.now();
  const key = hmac(`ronda:${puntoId}:${ubicacion}:${timestamp}`);
  const payload = JSON.stringify({ tipo: "ronda", puntoId, nombre, ubicacion, timestamp, key });
  return Buffer.from(payload).toString("base64");
}

export function validarCodigoQRRonda(
  codigo: string,
  ttlMs: number = DEFAULT_RONDA_QR_TTL_MS
): { valid: boolean; puntoId: string; nombre: string; ubicacion: string } {
  const invalid = { valid: false, puntoId: "", nombre: "", ubicacion: "" };
  try {
    const decoded = Buffer.from(codigo, "base64").toString("utf-8");
    const { tipo, puntoId, nombre, ubicacion, timestamp, key } = JSON.parse(decoded);

    if (tipo !== "ronda" || !puntoId || !timestamp || !key) {
      return invalid;
    }

    if (isExpired(timestamp, ttlMs)) {
      return invalid;
    }

    const expectedKey = hmac(`ronda:${puntoId}:${ubicacion}:${timestamp}`);
    if (crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expectedKey))) {
      return { valid: true, puntoId, nombre, ubicacion };
    }
    return invalid;
  } catch {
    return invalid;
  }
}
