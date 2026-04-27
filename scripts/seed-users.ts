import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@vinitopichincha.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "vinito2024";
  const mozoEmail = process.env.MOZO_EMAIL ?? "local@vinitopichincha.com";
  const mozoPassword = process.env.MOZO_PASSWORD ?? "mozo2024";

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const mozoHash = await bcrypt.hash(mozoPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: "ADMIN1", name: "Admin" },
    create: { email: adminEmail, passwordHash: adminHash, role: "ADMIN1", name: "Admin" },
  });
  await prisma.user.upsert({
    where: { email: mozoEmail },
    update: { passwordHash: mozoHash, role: "ADMIN2", name: "Mozo" },
    create: { email: mozoEmail, passwordHash: mozoHash, role: "ADMIN2", name: "Mozo" },
  });

  console.log("✓ Admin:", adminEmail);
  console.log("✓ Mozo:", mozoEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
