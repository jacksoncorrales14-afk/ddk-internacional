import { NextRequest, NextResponse } from "next/server";
import { activarTrabajador } from "@/services/trabajador.service";

// POST: verificar cedula + codigo de activacion
export async function POST(req: NextRequest) {
  try {
    const { cedula, codigo } = await req.json();

    if (!cedula || !codigo) {
      return NextResponse.json({ error: "Cedula y codigo son requeridos" }, { status: 400 });
    }

    const trabajador = await activarTrabajador(cedula, codigo);

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
