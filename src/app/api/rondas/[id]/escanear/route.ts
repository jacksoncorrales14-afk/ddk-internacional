import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { escanearPuntoRonda } from "@/services/ronda.service";
import { rondaEscanearSchema, esIdValido } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "trabajador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID de ronda invalido" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const validated = rondaEscanearSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const resultado = await escanearPuntoRonda({
      rondaId: params.id,
      trabajadorId: session.user.id,
      codigoQR: validated.data.codigoQR,
    });
    return NextResponse.json(resultado);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
