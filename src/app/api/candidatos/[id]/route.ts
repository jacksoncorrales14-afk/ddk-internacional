import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  actualizarEstadoCandidato,
  obtenerCandidato,
  eliminarCandidato,
} from "@/services/candidato.service";
import { crearTrabajador } from "@/services/trabajador.service";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { registrarAccion } from "@/lib/audit";
import { crearNotificacion } from "@/services/notificacion.service";
import { candidatoUpdateSchema, esIdValido } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const validated = candidatoUpdateSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }
  const { estado, ubicacion } = validated.data;

  // RECHAZO: solo actualizar estado + auditoria
  if (estado === "rechazado") {
    const candidato = await actualizarEstadoCandidato(params.id, estado);
    await registrarAccion(session, "candidato_rechazado", "Candidato", params.id, {
      nombre: candidato.nombre,
    });
    return NextResponse.json({ candidato });
  }

  // APROBACION con auto-conversion a trabajador
  if (estado === "aprobado") {
    if (!ubicacion) {
      return NextResponse.json(
        { error: "Debe indicar la ubicacion al aprobar" },
        { status: 400 }
      );
    }

    const candidato = await obtenerCandidato(params.id);
    if (!candidato) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    // Verificar que no exista trabajador con esa cedula
    const existente = await prisma.trabajador.findUnique({
      where: { cedula: candidato.cedula },
    });
    if (existente) {
      // Si ya existe, solo marcamos como aprobado sin crear duplicado
      const actualizado = await actualizarEstadoCandidato(params.id, "aprobado");
      await registrarAccion(session, "candidato_aprobado", "Candidato", params.id, {
        nombre: actualizado.nombre,
        nota: "Ya existia trabajador con esta cedula",
      });
      return NextResponse.json({
        candidato: actualizado,
        trabajador: existente,
        aviso: "Ya existia un trabajador con esta cedula",
      });
    }

    const passwordGenerada = nanoid(8);
    const trabajador = await crearTrabajador({
      nombre: candidato.nombre,
      cedula: candidato.cedula,
      password: passwordGenerada,
      email: candidato.email,
      telefono: candidato.telefono,
      puesto: candidato.puesto,
      ubicacion,
    });

    const actualizado = await actualizarEstadoCandidato(params.id, "aprobado");

    await registrarAccion(session, "candidato_aprobado", "Candidato", params.id, {
      nombre: actualizado.nombre,
      trabajadorCreadoId: trabajador.id,
      ubicacion,
    });

    await crearNotificacion({
      tipo: "trabajador_creado",
      titulo: "Nuevo trabajador creado",
      mensaje: `${trabajador.nombre} fue aprobado y asignado a ${ubicacion}.`,
      link: "/admin/trabajadores",
    });

    return NextResponse.json({
      candidato: actualizado,
      trabajador,
      passwordAsignada: passwordGenerada,
    });
  }

  // Cualquier otro cambio de estado
  const candidato = await actualizarEstadoCandidato(params.id, estado);
  return NextResponse.json({ candidato });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!esIdValido(params.id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const candidato = await obtenerCandidato(params.id);
  if (!candidato) {
    return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
  }

  if (candidato.estado !== "rechazado") {
    return NextResponse.json({ error: "Solo se pueden eliminar candidatos rechazados" }, { status: 400 });
  }

  await eliminarCandidato(params.id);
  await registrarAccion(session, "candidato_eliminado", "Candidato", params.id, {
    nombre: candidato.nombre,
  });

  return NextResponse.json({ success: true });
}
