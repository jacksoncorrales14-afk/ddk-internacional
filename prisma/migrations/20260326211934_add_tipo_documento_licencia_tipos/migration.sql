-- AlterTable
ALTER TABLE "Candidato" ADD COLUMN     "tipoDocumento" TEXT NOT NULL DEFAULT 'cedula',
ALTER COLUMN "licenciaConducir" DROP NOT NULL,
ALTER COLUMN "licenciaConducir" DROP DEFAULT,
ALTER COLUMN "licenciaConducir" SET DATA TYPE TEXT;
