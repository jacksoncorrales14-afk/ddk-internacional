-- Renombrar columna email a identificacion
ALTER TABLE "Admin" RENAME COLUMN "email" TO "identificacion";

-- Renombrar indice unico
ALTER INDEX "Admin_email_key" RENAME TO "Admin_identificacion_key";
