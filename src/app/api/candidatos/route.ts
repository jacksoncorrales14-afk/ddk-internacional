import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarCandidatos,
  crearCandidato,
  subirAtestados,
} from "@/services/candidato.service";
import { crearNotificacion } from "@/services/notificacion.service";
import { candidatoCreateSchema } from "@/lib/validations";
import { uploadLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { errorTracker } from "@/lib/error-tracking";

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
  const ip = getClientIp(req);
  const { success } = uploadLimiter.check(10, ip);
  if (!success) return rateLimitResponse();

  try {
    const formData = await req.formData();

    const rawData = {
      nombre: formData.get("nombre") as string,
      tipoDocumento: (formData.get("tipoDocumento") as string) || "cedula",
      cedula: formData.get("cedula") as string,
      email: formData.get("email") as string,
      telefono: formData.get("telefono") as string,
      direccion: formData.get("direccion") as string,
      puesto: formData.get("puesto") as string,
      aniosExperiencia: parseInt(formData.get("aniosExperiencia") as string) || 0,
      paisOrigen: (formData.get("paisOrigen") as string) || undefined,
    };

    const validated = candidatoCreateSchema.safeParse(rawData);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { nombre, tipoDocumento, cedula, email, telefono, direccion, puesto, aniosExperiencia, paisOrigen } = validated.data;
    const experiencia = formData.get("experiencia") as string;
    const disponibilidad = formData.get("disponibilidad") as string;
    const portacionArma = formData.get("portacionArma") === "true";
    const licenciaConducir = (formData.get("licenciaConducir") as string) || null;
    const cursoBasicoPolicial = formData.get("cursoBasicoPolicial") === "true";
    const fechaNacimientoStr = formData.get("fechaNacimiento") as string;
    const fechaNacimiento = fechaNacimientoStr ? new Date(fechaNacimientoStr) : undefined;

    const candidato = await crearCandidato({
      nombre, tipoDocumento, cedula, email, telefono, direccion, puesto,
      experiencia, disponibilidad, aniosExperiencia,
      portacionArma, licenciaConducir, cursoBasicoPolicial, fechaNacimiento, paisOrigen,
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
    errorTracker.captureException(error, {
      route: "/api/candidatos",
      action: "POST",
    });
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
