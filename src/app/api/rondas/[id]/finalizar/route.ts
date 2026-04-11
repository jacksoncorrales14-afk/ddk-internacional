import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { finalizarRonda } from "@/services/ronda.service";
import { prisma } from "@/lib/prisma";
import { crearNotificacion } from "@/services/notificacion.service";
import { rondaFinalizarSchema, esIdValido } from "@/lib/validations";

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
    const validated = rondaFinalizarSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const ronda = await finalizarRonda(
      params.id,
      session.user.id,
      validated.data.observaciones,
      validated.data.novedades
    );

    // Si la ronda no se completo, notificar al admin
    if (!ronda.completada) {
      const trabajador = await prisma.trabajador.findUnique({
        where: { id: session.user.id as string },
        select: { nombre: true },
      });
      await crearNotificacion({
        tipo: "ronda_incompleta",
        titulo: "Ronda incompleta",
        mensaje: `${trabajador?.nombre || "Trabajador"} finalizo una ronda en ${ronda.ubicacion} sin completar todos los puntos.`,
        link: "/admin/registros",
      });
    }

    return NextResponse.json(ronda);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
