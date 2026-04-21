import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { restaurarTrabajador, eliminarTrabajadorDefinitivo } from "@/services/trabajador.service";
import { registrarAccion } from "@/lib/audit";
import { esIdValido } from "@/lib/validations";

// Restaurar trabajador despedido
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const trabajador = await restaurarTrabajador(params.id);
  await registrarAccion(session, "trabajador_restaurado", "Trabajador", params.id, {
    nombre: trabajador.nombre,
  });
  return NextResponse.json(trabajador);
}

// Eliminar definitivamente
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  await eliminarTrabajadorDefinitivo(params.id);
  await registrarAccion(session, "trabajador_eliminado_definitivo", "Trabajador", params.id);
  return NextResponse.json({ success: true });
}
