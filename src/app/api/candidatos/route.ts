import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const candidatos = await prisma.candidato.findMany({
    include: { atestados: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(candidatos);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const nombre = formData.get("nombre") as string;
    const cedula = formData.get("cedula") as string;
    const email = formData.get("email") as string;
    const telefono = formData.get("telefono") as string;
    const direccion = formData.get("direccion") as string;
    const puesto = formData.get("puesto") as string;
    const experiencia = formData.get("experiencia") as string;
    const disponibilidad = formData.get("disponibilidad") as string;
    const aniosExperiencia = parseInt(formData.get("aniosExperiencia") as string) || 0;
    const portacionArma = formData.get("portacionArma") === "true";
    const licenciaConducir = formData.get("licenciaConducir") === "true";
    const cursoBasicoPolicial = formData.get("cursoBasicoPolicial") === "true";

    if (!nombre || !cedula || !email || !telefono || !direccion || !puesto) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Verificar cedula unica
    const existe = await prisma.candidato.findUnique({ where: { cedula } });
    if (existe) {
      return NextResponse.json({ error: "Ya existe una solicitud con esta cedula" }, { status: 400 });
    }

    // Crear candidato
    const candidato = await prisma.candidato.create({
      data: {
        nombre, cedula, email, telefono, direccion, puesto,
        experiencia, disponibilidad, aniosExperiencia,
        portacionArma, licenciaConducir, cursoBasicoPolicial,
      },
    });

    // Subir archivos
    const archivos = formData.getAll("archivos") as File[];
    for (const archivo of archivos) {
      if (archivo.size === 0) continue;

      const buffer = Buffer.from(await archivo.arrayBuffer());
      const ext = archivo.name.split(".").pop();
      const fileName = `${candidato.id}/${Date.now()}-${archivo.name}`;

      const { error } = await supabase.storage
        .from("atestados")
        .upload(fileName, buffer, { contentType: archivo.type });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("atestados")
          .getPublicUrl(fileName);

        await prisma.atestado.create({
          data: {
            nombre: archivo.name,
            url: urlData.publicUrl,
            tipo: ext || "otro",
            candidatoId: candidato.id,
          },
        });
      }
    }

    return NextResponse.json(candidato, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
