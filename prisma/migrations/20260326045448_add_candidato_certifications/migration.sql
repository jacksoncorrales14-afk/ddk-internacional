-- AlterTable
ALTER TABLE "Candidato" ADD COLUMN     "aniosExperiencia" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cursoBasicoPolicial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "licenciaConducir" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "portacionArma" BOOLEAN NOT NULL DEFAULT false;
