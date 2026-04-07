import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/audit";
import { detectarAusencias } from "@/services/trabajador.service";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(100, ip);
  if (!success) return rateLimitResponse();

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultado = await detectarAusencias();
  return NextResponse.json(resultado);
}

// Tambien aceptamos GET para simplificar la llamada desde cron jobs externos.
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = apiLimiter.check(100, ip);
  if (!success) return rateLimitResponse();

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultado = await detectarAusencias();
  return NextResponse.json(resultado);
}
