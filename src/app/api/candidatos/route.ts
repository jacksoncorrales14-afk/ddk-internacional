import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarCandidatos,
  crearCandidato,
  subirAtestados,
} from "@/services/candidato.service";
import { crearNotificacion } from "@/services/notificacion.service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const estado = searchParams.get("estado") || undefined;
  const puesto = searchParams.get("puesto") || undefined;
  const q = searchParams.get("q") || undefined;

  const result = await listarCandidatos({ page, limit, estado, puesto, q });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const nombre = formData.get("nombre") as string;
    const tipoDocumento = (formData.get("tipoDocumento") as string) || "cedula";
    const cedula = formData.get("cedula") as string;
    const email = formData.get("email") as string;
    const telefono = formData.get("telefono") as string;
    const direccion = formData.get("direccion") as string;
    const puesto = formData.get("puesto") as string;
    const experiencia = formData.get("experiencia") as string;
    const disponibilidad = formData.get("disponibilidad") as string;
    const aniosExperiencia = parseInt(formData.get("aniosExperiencia") as string) || 0;
    const portacionArma = formData.get("portacionArma") === "true";
    const licenciaConducir = (formData.get("licenciaConducir") as string) || null;
    const cursoBasicoPolicial = formData.get("cursoBasicoPolicial") === "true";
    const fechaNacimientoStr = formData.get("fechaNacimiento") as string;
    const fechaNacimiento = fechaNacimientoStr ? new Date(fechaNacimientoStr) : undefined;

    if (!nombre || !cedula || !email || !telefono || !direccion || !puesto) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const candidato = await crearCandidato({
      nombre, tipoDocumento, cedula, email, telefono, direccion, puesto,
      experiencia, disponibilidad, aniosExperiencia,
      portacionArma, licenciaConducir, cursoBasicoPolicial, fechaNacimiento,
    });

    // Subir archivos en paralelo
    const archivos = formData.getAll("archivos") as File[];
    const tiposArchivo = formData.getAll("tiposArchivo") as string[];
    await subirAtestados(candidato.id, archivos, tiposArchivo);

    // Notificar al admin
    await crearNotificacion({
      tipo: "candidato_nuevo",
      titulo: "Nuevo candidato registrado",
      mensaje: `${candidato.nombre} aplico para el puesto de ${candidato.puesto}.`,
      link: "/admin/candidatos",
    });

    return NextResponse.json(candidato, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
