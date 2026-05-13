import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarCandidatos } from "@/services/candidato.service";
import { tipoDocLabels } from "@/types/models";
import * as XLSX from "xlsx";

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

  const headers = [
    "Nombre",
    "Tipo Documento",
    "Cedula",
    "Email",
    "Telefono",
    "Direccion",
    "Fecha Nacimiento",
    "Pais Origen",
    "Puesto",
    "Experiencia",
    "Anos Experiencia",
    "Portacion Arma",
    "Licencia Conducir",
    "Curso Basico Policial",
    "Disponibilidad",
    "Estado",
    "Documentos",
    "Fecha Registro",
  ];

  const rows = result.data.map((c) => [
    c.nombre,
    tipoDocLabels[c.tipoDocumento] || c.tipoDocumento,
    c.cedula,
    c.email,
    c.telefono,
    c.direccion,
    c.fechaNacimiento ? formatFecha(c.fechaNacimiento) : "",
    c.paisOrigen || "",
    c.puesto,
    c.experiencia || "",
    c.aniosExperiencia,
    c.portacionArma ? "Si" : "No",
    c.licenciaConducir || "No",
    c.cursoBasicoPolicial ? "Si" : "No",
    c.disponibilidad || "",
    estadoLabels[c.estado] || c.estado,
    c.atestados.length,
    formatFecha(c.createdAt),
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-ajustar ancho de columnas basado en el contenido
  const colWidths = headers.map((h, i) => {
    let max = h.length;
    for (const row of rows) {
      const val = String(row[i] ?? "");
      if (val.length > max) max = val.length;
    }
    return { wch: Math.min(max + 2, 50) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidatos");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const d = new Date();
  const filename = `candidatos_${d.toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
