import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { actualizarTrabajador, regenerarCodigo, eliminarTrabajador } from "@/services/trabajador.service";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const data = await req.json();

  // Regenerar codigo de activacion
  if (data.regenerarCodigo) {
    const trabajador = await regenerarCodigo(params.id);
    return NextResponse.json(trabajador);
  }

  const trabajador = await actualizarTrabajador(params.id, data);
  return NextResponse.json(trabajador);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await eliminarTrabajador(params.id);
  return NextResponse.json({ success: true });
}
