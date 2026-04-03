-- AlterTable
ALTER TABLE "Candidato" ADD COLUMN     "fechaNacimiento" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Candidato_estado_idx" ON "Candidato"("estado");

-- CreateIndex
CREATE INDEX "Candidato_puesto_idx" ON "Candidato"("puesto");

-- CreateIndex
CREATE INDEX "Trabajador_activo_idx" ON "Trabajador"("activo");
