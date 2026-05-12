import { prisma } from "./prisma";
import { parseExcelAll } from "./excel-import";
import type { ImportResult } from "./types";

export type SyncMode = "upsert" | "replace" | "sync"; // sync = upsert + delete orphans

export type SectionResult = ImportResult & { deleted: number };

export type FullSyncResult = {
  wines: SectionResult;
  drinks: SectionResult;
  dishes: SectionResult;
};

const wineKey = (w: { name: string; winery: string; varietal: string | null; category: string }) =>
  `${w.name}|||${w.winery}|||${w.varietal ?? ""}|||${w.category}`;

const drinkKey = (d: { name: string; category: string }) => `${d.name}|||${d.category}`;
const dishKey = (d: { name: string; category: string }) => `${d.name}|||${d.category}`;

export async function syncFromBuffer(buffer: ArrayBuffer, mode: SyncMode = "sync"): Promise<FullSyncResult> {
  const parsed = parseExcelAll(buffer);

  if (mode === "replace") {
    await prisma.sale.deleteMany();
    await prisma.drink.deleteMany();
    await prisma.dish.deleteMany();
    await prisma.wine.deleteMany();
  }

  // ---------------- VINOS ----------------
  const winesResult: SectionResult = { added: 0, updated: 0, deleted: 0, errors: parsed.wines.errors };
  for (const row of parsed.wines.rows) {
    const data = {
      name: row.name,
      winery: row.winery,
      category: row.category,
      varietal: row.varietal,
      zone: row.zone,
      vintage: row.vintage,
      price: row.price,
      cost: row.cost,
      fichaUrl: row.fichaUrl,
      available: true,
    };
    if (mode === "replace") {
      await prisma.wine.create({ data });
      winesResult.added++;
    } else {
      const existing = await prisma.wine.findFirst({
        where: {
          name: data.name,
          winery: data.winery,
          varietal: data.varietal,
          category: data.category,
        },
      });
      if (existing) {
        const { available: _ignored, ...updateData } = data;
        await prisma.wine.update({ where: { id: existing.id }, data: updateData });
        winesResult.updated++;
      } else {
        await prisma.wine.create({ data });
        winesResult.added++;
      }
    }
  }
  if (mode === "sync") {
    const excelKeys = new Set(parsed.wines.rows.map(wineKey));
    const dbWines = await prisma.wine.findMany({
      select: { id: true, name: true, winery: true, varietal: true, category: true },
    });
    const seen = new Set<string>();
    const toDelete: number[] = [];
    for (const w of dbWines) {
      const k = wineKey(w);
      if (!excelKeys.has(k) || seen.has(k)) toDelete.push(w.id);
      else seen.add(k);
    }
    if (toDelete.length > 0) {
      await prisma.sale.deleteMany({ where: { wineId: { in: toDelete } } });
      const r = await prisma.wine.deleteMany({ where: { id: { in: toDelete } } });
      winesResult.deleted = r.count;
    }
  }

  // ---------------- TRAGOS ----------------
  const drinksResult: SectionResult = { added: 0, updated: 0, deleted: 0, errors: parsed.drinks.errors };
  for (const row of parsed.drinks.rows) {
    const data = {
      name: row.name,
      category: row.category,
      description: row.description,
      price: row.price,
      available: true,
    };
    if (mode === "replace") {
      await prisma.drink.create({ data });
      drinksResult.added++;
    } else {
      const existing = await prisma.drink.findFirst({
        where: { name: data.name, category: data.category },
      });
      if (existing) {
        await prisma.drink.update({
          where: { id: existing.id },
          data: { description: data.description, price: data.price },
        });
        drinksResult.updated++;
      } else {
        await prisma.drink.create({ data });
        drinksResult.added++;
      }
    }
  }
  if (mode === "sync") {
    const excelKeys = new Set(parsed.drinks.rows.map(drinkKey));
    const dbDrinks = await prisma.drink.findMany({ select: { id: true, name: true, category: true } });
    const toDelete = dbDrinks.filter((d) => !excelKeys.has(drinkKey(d))).map((d) => d.id);
    if (toDelete.length > 0) {
      const r = await prisma.drink.deleteMany({ where: { id: { in: toDelete } } });
      drinksResult.deleted = r.count;
    }
  }

  // ---------------- PLATOS ----------------
  const dishesResult: SectionResult = { added: 0, updated: 0, deleted: 0, errors: parsed.dishes.errors };
  for (const row of parsed.dishes.rows) {
    const data = {
      name: row.name,
      category: row.category,
      subSection: row.subSection,
      description: row.description,
      price: row.price,
      available: true,
    };
    if (mode === "replace") {
      await prisma.dish.create({ data });
      dishesResult.added++;
    } else {
      const existing = await prisma.dish.findFirst({
        where: { name: data.name, category: data.category },
      });
      if (existing) {
        await prisma.dish.update({
          where: { id: existing.id },
          data: { description: data.description, price: data.price, subSection: data.subSection },
        });
        dishesResult.updated++;
      } else {
        await prisma.dish.create({ data });
        dishesResult.added++;
      }
    }
  }
  if (mode === "sync") {
    const excelKeys = new Set(parsed.dishes.rows.map(dishKey));
    const dbDishes = await prisma.dish.findMany({ select: { id: true, name: true, category: true } });
    const toDelete = dbDishes.filter((d) => !excelKeys.has(dishKey(d))).map((d) => d.id);
    if (toDelete.length > 0) {
      const r = await prisma.dish.deleteMany({ where: { id: { in: toDelete } } });
      dishesResult.deleted = r.count;
    }
  }

  return { wines: winesResult, drinks: drinksResult, dishes: dishesResult };
}

/**
 * Convierte un link de Google Sheet a la URL de export en xlsx.
 * Acepta: el link normal del navegador, el link "publish to web", o solo el ID.
 */
export function buildSheetExportUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Solo el ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return `https://docs.google.com/spreadsheets/d/${trimmed}/export?format=xlsx`;
  }

  const m = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) {
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=xlsx`;
  }

  return null;
}

export async function fetchSheetBuffer(sheetUrlOrId: string): Promise<ArrayBuffer> {
  const url = buildSheetExportUrl(sheetUrlOrId);
  if (!url) throw new Error("Link de Google Sheet inválido");

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Drive devolvió HTTP ${res.status}`);

  const contentType = res.headers.get("content-type") ?? "";
  // Si el sheet no es público, Drive devuelve HTML (página de login)
  if (contentType.includes("text/html")) {
    throw new Error(
      "El Google Sheet no es público. Compartilo como 'Cualquiera con el link puede ver' o pegá un link de 'Archivo → Compartir → Publicar en la web'."
    );
  }

  return await res.arrayBuffer();
}
