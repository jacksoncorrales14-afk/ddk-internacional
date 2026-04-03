import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { finalizarRonda } from "@/services/ronda.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { observaciones, novedades } = await req.json();
    const ronda = await finalizarRonda(params.id, session.user.id, observaciones, novedades);
    return NextResponse.json(ronda);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
