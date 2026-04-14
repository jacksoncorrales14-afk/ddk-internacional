import { NextRequest, NextResponse } from "next/server";
import { activarTrabajador, marcarActivado } from "@/services/trabajador.service";
import { activarTrabajadorSchema } from "@/lib/validations";
import { loginLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// POST: verificar cedula + codigo de activacion
export async function POST(req: NextRequest) {
  // Rate-limit: 10 intentos por IP en 15 min (brute-force contra codigos)
  const ip = getClientIp(req);
  const { success } = loginLimiter.check(10, ip);
  if (!success) return rateLimitResponse();

  try {
    const body = await req.json().catch(() => ({}));
    const validated = activarTrabajadorSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { cedula, codigo } = validated.data;

    const trabajador = await activarTrabajador(cedula, codigo);
    await marcarActivado(trabajador.id);

    return NextResponse.json({
      success: true,
      trabajadorId: trabajador.id,
      nombre: trabajador.nombre,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de verificacion";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
