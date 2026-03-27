import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generarCodigoQR } from "@/lib/qr";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const puesto = req.nextUrl.searchParams.get("puesto");
  if (!puesto) {
    return NextResponse.json({ error: "Puesto requerido" }, { status: 400 });
  }

  const codigo = generarCodigoQR(puesto);
  const qrDataUrl = await QRCode.toDataURL(codigo, {
    width: 400,
    margin: 2,
    color: { dark: "#102a43", light: "#ffffff" },
  });

  return NextResponse.json({ puesto, qrDataUrl, codigo });
}
