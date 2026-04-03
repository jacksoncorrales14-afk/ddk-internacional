import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { actualizarEstadoCandidato } from "@/services/candidato.service";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { estado } = await req.json();
  const candidato = await actualizarEstadoCandidato(params.id, estado);
  return NextResponse.json(candidato);
}
