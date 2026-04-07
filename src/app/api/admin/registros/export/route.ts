import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarRegistrosAdmin,
  listarBitacorasAdmin,
} from "@/services/registro.service";
import { listarRondasAdmin } from "@/services/ronda.service";
import { parseFiltros } from "@/lib/filters";
import { toCSV, csvFilename } from "@/lib/csv";

type Tipo = "registros" | "rondas" | "bitacoras";

function formatFecha(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatHora(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tipo = (searchParams.get("tipo") || "registros") as Tipo;
  const filtros = parseFiltros(req.url);

  let csv = "";
  let filename = "registros";

  if (tipo === "registros") {
    const data = await listarRegistrosAdmin({ ...filtros, limit: 5000 });
    const rows = data.map((r) => ({
      trabajador: r.trabajador.nombre,
      cedula: r.trabajador.cedula,
      tipo: r.tipo,
      fecha: formatFecha(r.fecha),
      hora: formatHora(r.fecha),
      ubicacion: r.ubicacion || r.trabajador.ubicacion || "",
      nota: r.nota || "",
    }));
    csv = toCSV(rows, [
      { key: "trabajador", label: "Trabajador" },
      { key: "cedula", label: "Cedula" },
      { key: "tipo", label: "Tipo" },
      { key: "fecha", label: "Fecha" },
      { key: "hora", label: "Hora" },
      { key: "ubicacion", label: "Ubicacion" },
      { key: "nota", label: "Nota" },
    ]);
    filename = "registros";
  } else if (tipo === "rondas") {
    const data = await listarRondasAdmin({ ...filtros, limit: 5000 });
    const rows = data.map((r) => ({
      trabajador: r.trabajador.nombre,
      cedula: r.trabajador.cedula,
      ubicacion: r.ubicacion,
      fecha: formatFecha(r.fecha),
      hora: formatHora(r.fecha),
      totalPuntos: r.totalPuntos,
      escaneados: r.escaneos.length,
      completada: r.completada ? "Si" : "No",
      observaciones: r.observaciones || "",
      novedades: r.novedades || "",
    }));
    csv = toCSV(rows, [
      { key: "trabajador", label: "Trabajador" },
      { key: "cedula", label: "Cedula" },
      { key: "ubicacion", label: "Ubicacion" },
      { key: "fecha", label: "Fecha" },
      { key: "hora", label: "Hora" },
      { key: "totalPuntos", label: "Total Puntos" },
      { key: "escaneados", label: "Escaneados" },
      { key: "completada", label: "Completada" },
      { key: "observaciones", label: "Observaciones" },
      { key: "novedades", label: "Novedades" },
    ]);
    filename = "rondas";
  } else if (tipo === "bitacoras") {
    const data = await listarBitacorasAdmin({ ...filtros, limit: 5000 });
    const tipoLabels: Record<string, string> = {
      robo: "Robo", intrusion: "Intrusion", dano_equipo: "Dano a equipo",
      lesion: "Lesion", clima: "Evento climatico", horario: "Incidencia de horario", otro: "Otro",
    };
    const estadoLabels: Record<string, string> = {
      abierto: "Abierto", en_revision: "En revision", cerrado: "Cerrado",
    };
    const rows = data.map((b) => ({
      trabajador: b.trabajador.nombre,
      cedula: b.trabajador.cedula,
      ubicacion: b.ubicacion,
      fecha: formatFecha(b.fecha),
      hora: formatHora(b.fecha),
      tipoIncidencia: b.tipoIncidencia ? (tipoLabels[b.tipoIncidencia] || b.tipoIncidencia) : "",
      severidad: b.severidad || "media",
      estado: estadoLabels[b.estado] || b.estado || "abierto",
      incidencias: b.incidencias,
      entregaA: b.entregaA,
    }));
    csv = toCSV(rows, [
      { key: "trabajador", label: "Trabajador" },
      { key: "cedula", label: "Cedula" },
      { key: "ubicacion", label: "Ubicacion" },
      { key: "fecha", label: "Fecha" },
      { key: "hora", label: "Hora" },
      { key: "tipoIncidencia", label: "Tipo Incidencia" },
      { key: "severidad", label: "Severidad" },
      { key: "estado", label: "Estado" },
      { key: "incidencias", label: "Incidencias" },
      { key: "entregaA", label: "Entrega a" },
    ]);
    filename = "bitacoras";
  } else {
    return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename(filename)}"`,
    },
  });
}
