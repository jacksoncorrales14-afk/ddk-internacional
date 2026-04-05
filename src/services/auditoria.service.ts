import { prisma } from "@/lib/prisma";

export interface ListAuditoriaOptions {
  page?: number;
  limit?: number;
  adminId?: string;
  accion?: string;
  desde?: Date;
  hasta?: Date;
}

export async function listarAuditoria(options: ListAuditoriaOptions = {}) {
  const { page = 1, limit = 50, adminId, accion, desde, hasta } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (adminId) where.adminId = adminId;
  if (accion) where.accion = accion;
  if (desde || hasta) {
    const createdAt: Record<string, Date> = {};
    if (desde) createdAt.gte = desde;
    if (hasta) createdAt.lte = hasta;
    where.createdAt = createdAt;
  }

  const [data, total] = await Promise.all([
    prisma.auditoriaLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditoriaLog.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
