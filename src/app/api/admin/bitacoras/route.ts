import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarBitacorasAdmin } from "@/services/registro.service";
import { parseFiltros } from "@/lib/filters";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const filtros = parseFiltros(req.url);
  const bitacoras = await listarBitacorasAdmin(filtros);
  return NextResponse.json(bitacoras);
}
