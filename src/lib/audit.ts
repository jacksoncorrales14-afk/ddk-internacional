import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Registra una accion del admin en el log de auditoria.
 * Usa session.user.id/name como autor. Silencioso: si falla, no interrumpe la accion principal.
 */
export async function registrarAccion(
  session: Session | null,
  accion: string,
  entidad: string,
  entidadId?: string,
  detalle?: Record<string, unknown>
): Promise<void> {
  try {
    if (!session?.user?.id) return;
    await prisma.auditoriaLog.create({
      data: {
        adminId: session.user.id as string,
        adminNombre: session.user.name || "desconocido",
        accion,
        entidad,
        entidadId: entidadId || null,
        detalle: detalle ? JSON.stringify(detalle) : null,
      },
    });
  } catch (error) {
    console.error("[audit] Error al registrar accion:", error);
  }
}

/**
 * Helper para obtener la sesion de admin dentro de un route handler.
 * Devuelve null si no es admin.
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") return null;
  return session;
}
