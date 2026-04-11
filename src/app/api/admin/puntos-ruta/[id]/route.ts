import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { actualizarPuntoRuta, eliminarPuntoRuta } from "@/services/ronda.service";
import { puntoRutaUpdateSchema, esIdValido } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const validated = puntoRutaUpdateSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const punto = await actualizarPuntoRuta(params.id, validated.data);
  return NextResponse.json(punto);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  await eliminarPuntoRuta(params.id);
  return NextResponse.json({ success: true });
}
