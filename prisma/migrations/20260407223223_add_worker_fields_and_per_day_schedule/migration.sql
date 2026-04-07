-- AlterTable
ALTER TABLE "Trabajador" ADD COLUMN     "aniosExperiencia" INTEGER,
ADD COLUMN     "cursoBasicoPolicial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "disponibilidad" TEXT,
ADD COLUMN     "experiencia" TEXT,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3),
ADD COLUMN     "licenciaConducir" TEXT,
ADD COLUMN     "paisOrigen" TEXT,
ADD COLUMN     "portacionArma" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoDocumento" TEXT;

-- CreateTable
CREATE TABLE "HorarioDia" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "toleranciaMin" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "HorarioDia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HorarioDia_trabajadorId_idx" ON "HorarioDia"("trabajadorId");

-- CreateIndex
CREATE UNIQUE INDEX "HorarioDia_trabajadorId_diaSemana_key" ON "HorarioDia"("trabajadorId", "diaSemana");

-- AddForeignKey
ALTER TABLE "HorarioDia" ADD CONSTRAINT "HorarioDia_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
