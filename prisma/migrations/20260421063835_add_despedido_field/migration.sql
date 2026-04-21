-- AlterTable
ALTER TABLE "Trabajador" ADD COLUMN     "despedido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaDespido" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Trabajador_despedido_idx" ON "Trabajador"("despedido");
