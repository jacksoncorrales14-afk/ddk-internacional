import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/audit";
import {
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "@/services/notificacion.service";
import { notificacionPatchSchema } from "@/lib/validations";

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

  const body = await req.json().catch(() => ({}));
  const validated = notificacionPatchSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  if (validated.data.todas) {
    await marcarTodasLeidas();
    return NextResponse.json({ success: true });
  }

  if (validated.data.id) {
    await marcarLeida(validated.data.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Falta id o todas" }, { status: 400 });
}
