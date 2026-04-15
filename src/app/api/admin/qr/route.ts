import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generarCodigoQR, generarCodigoQRRonda } from "@/lib/qr";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

// Ubicaciones donde el QR de caseta retorno sustituye al QR de puesto
const UBICACIONES_CON_QR_RONDA = [
  "Parques del Sol",
  "Malinches",
  "Jacaranda",
  "Fuerte Ventura",
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const puesto = req.nextUrl.searchParams.get("puesto");
  if (!puesto) {
    return NextResponse.json({ error: "Puesto requerido" }, { status: 400 });
  }

  // Para ubicaciones con caseta retorno, generar QR de ronda en vez de puesto
  const usaRondaQR = UBICACIONES_CON_QR_RONDA.some((u) => puesto.startsWith(u));

  let codigo: string;
  let nombreQR = puesto;

  if (usaRondaQR) {
    // Buscar el punto de ruta "retorno" de esta ubicacion
    const puntoRetorno = await prisma.puntoRuta.findFirst({
      where: {
        ubicacion: puesto,
        nombre: { contains: "retorno", mode: "insensitive" },
      },
    });

    if (puntoRetorno) {
      codigo = generarCodigoQRRonda(puntoRetorno.id, puntoRetorno.nombre, puntoRetorno.ubicacion);
      nombreQR = `${puntoRetorno.nombre} - ${puesto}`;
    } else {
      // Si no hay punto retorno, usar QR de puesto normal
      codigo = generarCodigoQR(puesto);
    }
  } else {
    codigo = generarCodigoQR(puesto);
  }

  const qrDataUrl = await QRCode.toDataURL(codigo, {
    width: 400,
    margin: 2,
    color: { dark: "#102a43", light: "#ffffff" },
  });

  return NextResponse.json({ puesto, nombreQR, qrDataUrl, codigo });
}
