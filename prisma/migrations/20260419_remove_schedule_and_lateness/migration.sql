-- DropForeignKey
ALTER TABLE "HorarioDia" DROP CONSTRAINT IF EXISTS "HorarioDia_trabajadorId_fkey";

-- DropTable
DROP TABLE IF EXISTS "HorarioDia";

-- AlterTable: remove schedule/lateness columns from Trabajador
ALTER TABLE "Trabajador" DROP COLUMN IF EXISTS "diasSemana";
ALTER TABLE "Trabajador" DROP COLUMN IF EXISTS "horaFin";
ALTER TABLE "Trabajador" DROP COLUMN IF EXISTS "horaInicio";
ALTER TABLE "Trabajador" DROP COLUMN IF EXISTS "toleranciaMin";
