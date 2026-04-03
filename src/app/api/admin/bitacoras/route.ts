import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarBitacorasAdmin } from "@/services/registro.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const bitacoras = await listarBitacorasAdmin();
  return NextResponse.json(bitacoras);
}
