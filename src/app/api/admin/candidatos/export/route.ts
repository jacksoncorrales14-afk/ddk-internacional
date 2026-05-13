import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarCandidatos } from "@/services/candidato.service";
import { toCSV, csvFilename } from "@/lib/csv";
import { tipoDocLabels } from "@/types/models";

function formatFecha(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") || undefined;
  const q = searchParams.get("q") || undefined;

  const result = await listarCandidatos({ estado, q, page: 1, limit: 10000 });

  const rows = result.data.map((c) => ({
    nombre: c.nombre,
    tipoDocumento: tipoDocLabels[c.tipoDocumento] || c.tipoDocumento,
    cedula: c.cedula,
    email: c.email,
    telefono: c.telefono,
    direccion: c.direccion,
    fechaNacimiento: c.fechaNacimiento ? formatFecha(c.fechaNacimiento) : "",
    paisOrigen: c.paisOrigen || "",
    puesto: c.puesto,
    experiencia: c.experiencia || "",
    aniosExperiencia: c.aniosExperiencia,
    portacionArma: c.portacionArma ? "Si" : "No",
    licenciaConducir: c.licenciaConducir || "No",
    cursoBasicoPolicial: c.cursoBasicoPolicial ? "Si" : "No",
    disponibilidad: c.disponibilidad || "",
    estado: estadoLabels[c.estado] || c.estado,
    documentos: c.atestados.length,
    fechaRegistro: formatFecha(c.createdAt),
  }));

  const csv = toCSV(rows, [
    { key: "nombre", label: "Nombre" },
    { key: "tipoDocumento", label: "Tipo Documento" },
    { key: "cedula", label: "Cedula" },
    { key: "email", label: "Email" },
    { key: "telefono", label: "Telefono" },
    { key: "direccion", label: "Direccion" },
    { key: "fechaNacimiento", label: "Fecha Nacimiento" },
    { key: "paisOrigen", label: "Pais Origen" },
    { key: "puesto", label: "Puesto" },
    { key: "experiencia", label: "Experiencia" },
    { key: "aniosExperiencia", label: "Anos Experiencia" },
    { key: "portacionArma", label: "Portacion Arma" },
    { key: "licenciaConducir", label: "Licencia Conducir" },
    { key: "cursoBasicoPolicial", label: "Curso Basico Policial" },
    { key: "disponibilidad", label: "Disponibilidad" },
    { key: "estado", label: "Estado" },
    { key: "documentos", label: "Documentos" },
    { key: "fechaRegistro", label: "Fecha Registro" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename("candidatos")}"`,
    },
  });
}
