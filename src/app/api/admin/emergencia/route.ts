import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarCandidatosEmergencia } from "@/services/candidato.service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const puesto = searchParams.get("puesto") || undefined;

  const candidatos = await listarCandidatosEmergencia(puesto);
  return NextResponse.json(candidatos);
}
