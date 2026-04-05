import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/audit";
import {
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "@/services/notificacion.service";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await listarNotificaciones();
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  if (body.todas) {
    await marcarTodasLeidas();
    return NextResponse.json({ success: true });
  }

  if (body.id) {
    await marcarLeida(body.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Falta id o todas" }, { status: 400 });
}
