import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { actualizarTrabajador, regenerarCodigo, revocarBiometria, resetearPassword, despedirTrabajador } from "@/services/trabajador.service";
import { registrarAccion } from "@/lib/audit";
import { trabajadorUpdateSchema, esIdValido } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const raw = await req.json().catch(() => ({}));
  const validated = trabajadorUpdateSchema.safeParse(raw);
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }
  const data = validated.data;

  // Regenerar codigo de activacion
  if (data.regenerarCodigo) {
    const trabajador = await regenerarCodigo(params.id);
    await registrarAccion(session, "trabajador_codigo_regenerado", "Trabajador", params.id, {
      nombre: trabajador.nombre,
    });
    return NextResponse.json(trabajador);
  }

  // Revocar biometria (eliminar credenciales WebAuthn)
  if (data.revocarBiometria) {
    const trabajador = await revocarBiometria(params.id);
    await registrarAccion(session, "trabajador_biometria_revocada", "Trabajador", params.id, {
      nombre: trabajador.nombre,
    });
    return NextResponse.json(trabajador);
  }

  // Resetear contraseña
  if (data.resetearPassword) {
    const trabajador = await resetearPassword(params.id, data.resetearPassword);
    await registrarAccion(session, "trabajador_password_reseteada", "Trabajador", params.id, {
      nombre: trabajador.nombre,
    });
    return NextResponse.json(trabajador);
  }

  const trabajador = await actualizarTrabajador(params.id, data);
  await registrarAccion(session, "trabajador_actualizado", "Trabajador", params.id, {
    nombre: trabajador.nombre,
    campos: Object.keys(data),
  });
  return NextResponse.json(trabajador);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const trabajador = await despedirTrabajador(params.id);
  await registrarAccion(session, "trabajador_despedido", "Trabajador", params.id, {
    nombre: trabajador.nombre,
  });
  return NextResponse.json({ success: true });
}
