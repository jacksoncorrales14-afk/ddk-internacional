-- AlterTable
ALTER TABLE "Bitacora" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'abierto',
ADD COLUMN     "severidad" TEXT NOT NULL DEFAULT 'media',
ADD COLUMN     "tipoIncidencia" TEXT;
