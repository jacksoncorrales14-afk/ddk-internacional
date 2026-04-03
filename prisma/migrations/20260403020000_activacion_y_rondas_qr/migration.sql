-- AlterTable
ALTER TABLE "Ronda" ADD COLUMN     "completada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalPuntos" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Trabajador" ADD COLUMN     "activado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "codigoActivacion" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PuntoRuta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuntoRuta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscaneoRonda" (
    "id" TEXT NOT NULL,
    "rondaId" TEXT NOT NULL,
    "puntoRutaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscaneoRonda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PuntoRuta_ubicacion_idx" ON "PuntoRuta"("ubicacion");

-- CreateIndex
CREATE UNIQUE INDEX "PuntoRuta_ubicacion_orden_key" ON "PuntoRuta"("ubicacion", "orden");

-- CreateIndex
CREATE INDEX "EscaneoRonda_rondaId_idx" ON "EscaneoRonda"("rondaId");

-- CreateIndex
CREATE UNIQUE INDEX "EscaneoRonda_rondaId_puntoRutaId_key" ON "EscaneoRonda"("rondaId", "puntoRutaId");

-- CreateIndex
CREATE UNIQUE INDEX "Trabajador_codigoActivacion_key" ON "Trabajador"("codigoActivacion");

-- AddForeignKey
ALTER TABLE "EscaneoRonda" ADD CONSTRAINT "EscaneoRonda_rondaId_fkey" FOREIGN KEY ("rondaId") REFERENCES "Ronda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscaneoRonda" ADD CONSTRAINT "EscaneoRonda_puntoRutaId_fkey" FOREIGN KEY ("puntoRutaId") REFERENCES "PuntoRuta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
