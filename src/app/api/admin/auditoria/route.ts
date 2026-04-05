import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/audit";
import { listarAuditoria } from "@/services/auditoria.service";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const adminId = searchParams.get("adminId") || undefined;
  const accion = searchParams.get("accion") || undefined;
  const desdeStr = searchParams.get("desde");
  const hastaStr = searchParams.get("hasta");

  const desde = desdeStr ? new Date(desdeStr) : undefined;
  const hasta = hastaStr ? new Date(hastaStr + "T23:59:59") : undefined;

  const result = await listarAuditoria({
    page,
    limit,
    adminId,
    accion,
    desde,
    hasta,
  });
  return NextResponse.json(result);
}
