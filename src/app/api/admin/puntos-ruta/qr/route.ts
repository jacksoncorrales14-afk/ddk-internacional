import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generarCodigoQRRonda } from "@/lib/qr";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const puntoId = req.nextUrl.searchParams.get("puntoId");
  const nombre = req.nextUrl.searchParams.get("nombre");
  const ubicacion = req.nextUrl.searchParams.get("ubicacion");

  if (!puntoId || !nombre || !ubicacion) {
    return NextResponse.json({ error: "Faltan parametros" }, { status: 400 });
  }

  const codigo = generarCodigoQRRonda(puntoId, nombre, ubicacion);
  const qrDataUrl = await QRCode.toDataURL(codigo, { width: 300, margin: 2 });

  return NextResponse.json({ puntoId, nombre, ubicacion, qrDataUrl });
}
