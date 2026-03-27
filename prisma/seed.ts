import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );

  await prisma.admin.upsert({
    where: { identificacion: process.env.ADMIN_ID || "101110111" },
    update: { password: hashedPassword },
    create: {
      identificacion: process.env.ADMIN_ID || "101110111",
      password: hashedPassword,
      name: "Administrador DDK",
      role: "admin",
    },
  });

  console.log("Seed completado: admin creado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
