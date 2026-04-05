import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/audit";
import { detectarAusencias } from "@/services/trabajador.service";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultado = await detectarAusencias();
  return NextResponse.json(resultado);
}

// Tambien aceptamos GET para simplificar la llamada desde cron jobs externos.
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultado = await detectarAusencias();
  return NextResponse.json(resultado);
}
