-- AlterTable
ALTER TABLE "Trabajador" ADD COLUMN     "diasSemana" TEXT,
ADD COLUMN     "horaFin" TEXT,
ADD COLUMN     "horaInicio" TEXT,
ADD COLUMN     "toleranciaMin" INTEGER NOT NULL DEFAULT 15;

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "link" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminNombre" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacion_leida_createdAt_idx" ON "Notificacion"("leida", "createdAt");

-- CreateIndex
CREATE INDEX "AuditoriaLog_createdAt_idx" ON "AuditoriaLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditoriaLog_adminId_idx" ON "AuditoriaLog"("adminId");
