import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcryptjs.hash(
    process.env.ADMIN_PASSWORD ?? "vinito2024",
    12
  );
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@vinitopichincha.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL ?? "admin@vinitopichincha.com",
      passwordHash,
      name: "Admin",
      role: "ADMIN1",
    },
  });

  // Read Excel file
  const excelPath = path.join(process.cwd(), "data", "VINOS VINITO PICHINCHA1.xlsx");
  if (!fs.existsSync(excelPath)) {
    console.log("No Excel file found at data/VINOS VINITO PICHINCHA1.xlsx — skipping wine seed");
    return;
  }

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

  // Clear existing wines
  await prisma.wine.deleteMany();

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const vino = String(row["VINO"] ?? "").trim().toUpperCase();
    const etiqueta = String(row["ETIQUETA"] ?? "").trim();
    const cepa = row["CEPA"] ? String(row["CEPA"]).trim() : null;
    const anada = row["AÑADA"] ? parseInt(String(row["AÑADA"])) : null;
    const bodega = String(row["BODEGA"] ?? "").trim();
    const region = String(row["REGION"] ?? "").trim();
    const ficha = row["FICHA"] ? String(row["FICHA"]).trim() : null;
    const precio = row["SUGERIDO"] ? parseInt(String(row["SUGERIDO"])) : null;
    const stock = row["UNIDADES"] ? parseInt(String(row["UNIDADES"])) : 0;

    const validCategories = ["TINTO", "BLANCO", "ROSADO", "NARANJO", "ESPUMANTE"];
    if (!validCategories.includes(vino)) {
      skipped++;
      continue;
    }

    if (!etiqueta || !bodega) {
      skipped++;
      continue;
    }

    await prisma.wine.create({
      data: {
        name: etiqueta,
        winery: bodega,
        category: vino as any,
        varietal: cepa,
        zone: region || "Sin región",
        vintage: anada && !isNaN(anada) ? anada : null,
        price: precio && !isNaN(precio) ? precio : null,
        stock: stock && !isNaN(stock) ? stock : 1,
        fichaUrl: ficha,
        available: true,
      },
    });
    imported++;
  }

  console.log(`Seeded ${imported} wines (${skipped} skipped), 1 admin user`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
