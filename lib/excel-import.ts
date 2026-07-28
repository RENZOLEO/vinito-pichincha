import * as XLSX from "xlsx";
import type { ImportResult } from "./types";

export type RawRow = Record<string, unknown>;

export type ParsedWine = {
  name: string;
  winery: string;
  category: "TINTO" | "BLANCO" | "ROSADO" | "NARANJO" | "ESPUMANTE";
  varietal: string | null;
  zone: string;
  vintage: number | null;
  price: number | null;
  cost: number | null;
  fichaUrl: string | null;
};

export type ParsedDrink = {
  name: string;
  category: "VERMUTH" | "CLASICO" | "AUTOR" | "WHISKY" | "SOUR" | "CERVEZA" | "SIN_ALCOHOL" | "CAFETERIA";
  description: string | null;
  price: number | null;
};

export type ParsedDish = {
  name: string;
  category: "FRIO" | "CALIENTE" | "PRINCIPAL" | "POSTRE";
  subSection: string | null;
  description: string | null;
  price: number | null;
};

export type FullImportResult = {
  wines: { rows: ParsedWine[]; errors: ImportResult["errors"] };
  drinks: { rows: ParsedDrink[]; errors: ImportResult["errors"] };
  dishes: { rows: ParsedDish[]; errors: ImportResult["errors"] };
};

const VALID_WINE_CATEGORIES: ParsedWine["category"][] = ["TINTO", "BLANCO", "ROSADO", "NARANJO", "ESPUMANTE"];

function findSheet(wb: XLSX.WorkBook, candidates: string[]): XLSX.WorkSheet | null {
  for (const name of wb.SheetNames) {
    const norm = name.toLowerCase().trim();
    if (candidates.some((c) => norm.includes(c))) return wb.Sheets[name];
  }
  return null;
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function nonEmpty(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

// ---------------- VINOS ----------------
export function parseWinesSheet(sheet: XLSX.WorkSheet): {
  rows: ParsedWine[];
  errors: ImportResult["errors"];
} {
  const rows: ParsedWine[] = [];
  const errors: ImportResult["errors"] = [];
  const raw = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });

  // Mapa de columnas: tomamos lo que coincida sin importar mayúsculas / espacios extras
  const findKey = (row: RawRow, candidates: string[]): string | null => {
    for (const k of Object.keys(row)) {
      const norm = k.toLowerCase().trim();
      if (candidates.some((c) => norm === c || norm.startsWith(c))) return k;
    }
    return null;
  };

  raw.forEach((row, idx) => {
    if (!Object.values(row).some(nonEmpty)) return; // fila vacía

    const k = {
      cat: findKey(row, ["vino"]),
      etiqueta: findKey(row, ["etiqueta"]),
      cepa: findKey(row, ["cepa"]),
      añada: findKey(row, ["añada", "anada"]),
      bodega: findKey(row, ["bodega"]),
      region: findKey(row, ["region", "región"]),
      ficha: findKey(row, ["ficha"]),
      precio: findKey(row, ["precio carta", "precio", "sugerido"]),
      costo: findKey(row, ["costo"]),
    };

    const name = k.etiqueta ? String(row[k.etiqueta]).trim() : "";
    const winery = k.bodega ? String(row[k.bodega]).trim() : "";
    if (!name || !winery) return; // skip silenciosamente filas sin datos clave

    const catRaw = k.cat ? String(row[k.cat]).trim().toUpperCase() : "";
    if (!VALID_WINE_CATEGORIES.includes(catRaw as ParsedWine["category"])) {
      errors.push({ row: idx + 2, message: `Vino: categoría inválida (${catRaw}) en "${name}"` });
      return;
    }

    rows.push({
      name,
      winery,
      category: catRaw as ParsedWine["category"],
      varietal: k.cepa && nonEmpty(row[k.cepa]) ? String(row[k.cepa]).trim() : null,
      zone: k.region && nonEmpty(row[k.region]) ? String(row[k.region]).trim() : "Sin región",
      vintage: k.añada ? toInt(row[k.añada]) : null,
      price: k.precio ? toInt(row[k.precio]) : null,
      cost: k.costo ? toInt(row[k.costo]) : null,
      fichaUrl: k.ficha && nonEmpty(row[k.ficha]) ? String(row[k.ficha]).trim() : null,
    });
  });

  return { rows, errors };
}

// ---------------- TRAGOS ----------------
const DRINK_CATEGORY_MAP: Record<string, ParsedDrink["category"]> = {
  vermuth: "VERMUTH",
  vermut: "VERMUTH",
  clasicos: "CLASICO",
  clásicos: "CLASICO",
  "de autor": "AUTOR",
  autor: "AUTOR",
  cervezas: "CERVEZA",
  cerveza: "CERVEZA",
  whisky: "WHISKY",
  whiskys: "WHISKY",
  whiskies: "WHISKY",
  whiskey: "WHISKY",
  whiskeys: "WHISKY",
  sours: "SOUR",
  sour: "SOUR",
  "sin alcohol": "SIN_ALCOHOL",
  cafeteria: "CAFETERIA",
  cafetería: "CAFETERIA",
};

export function parseDrinksSheet(sheet: XLSX.WorkSheet): {
  rows: ParsedDrink[];
  errors: ImportResult["errors"];
} {
  const rows: ParsedDrink[] = [];
  const errors: ImportResult["errors"] = [];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  // Estructura:
  // col 0: subcategoría (solo en primera fila del grupo, fill-down)
  // col 1: nombre
  // col 2: descripción / ingredientes (para AUTOR son varios renglones bajo el mismo nombre)
  // col 3: precio (solo en primera fila del trago)
  // col 4: foto
  // col 5/6: cantidad / unidad de medida (solo recetario, ignoramos)

  let currentCategory: ParsedDrink["category"] | null = null;
  let currentDrink: ParsedDrink | null = null;
  let currentIngredients: string[] = [];

  const flush = () => {
    if (currentDrink) {
      if (currentDrink.category === "AUTOR" || currentDrink.category === "SOUR") {
        const desc = currentIngredients.filter(Boolean).join(", ");
        currentDrink.description = desc || null;
      } else {
        currentDrink.description = null;
      }
      rows.push(currentDrink);
    }
    currentDrink = null;
    currentIngredients = [];
  };

  for (let i = 1; i < grid.length; i++) {
    const r = grid[i];
    if (!r) continue;

    const catCell = String(r[0] ?? "").trim();
    const name = String(r[1] ?? "").trim();
    const desc = String(r[2] ?? "").trim();
    const price = toInt(r[3]);

    // Cambio de subcategoría
    if (catCell) {
      const key = catCell.toLowerCase().trim();
      const mapped = DRINK_CATEGORY_MAP[key];
      if (mapped) currentCategory = mapped;
      else errors.push({ row: i + 1, message: `Trago: subcategoría desconocida "${catCell}"` });
    }

    // Fila vacía → cierra el trago actual
    if (!catCell && !name && !desc && price === null) {
      flush();
      continue;
    }

    // Nuevo trago: tiene nombre
    if (name) {
      flush();
      if (!currentCategory) {
        errors.push({ row: i + 1, message: `Trago "${name}" sin subcategoría previa` });
        continue;
      }
      currentDrink = {
        name,
        category: currentCategory,
        description: null,
        price,
      };
      if (desc) currentIngredients.push(desc);
    } else if (currentDrink && desc) {
      // ingrediente extra del trago actual (relevante solo para AUTOR)
      currentIngredients.push(desc);
    }
  }
  flush();

  return { rows, errors };
}

// ---------------- PLATOS ----------------
type DishSection = {
  category: ParsedDish["category"];
  nameCol: number;
  priceCol: number;
  ingredientCol: number;
};

const DISH_SECTIONS: DishSection[] = [
  { category: "FRIO", nameCol: 0, priceCol: 1, ingredientCol: 2 },
  { category: "CALIENTE", nameCol: 6, priceCol: 7, ingredientCol: 8 },
  { category: "POSTRE", nameCol: 12, priceCol: 13, ingredientCol: 14 },
  { category: "PRINCIPAL", nameCol: 18, priceCol: 19, ingredientCol: 20 },
];

export function parseDishesSheet(sheet: XLSX.WorkSheet): {
  rows: ParsedDish[];
  errors: ImportResult["errors"];
} {
  const rows: ParsedDish[] = [];
  const errors: ImportResult["errors"] = [];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  for (const section of DISH_SECTIONS) {
    let currentSubSection: string | null = null;
    let currentDish: ParsedDish | null = null;
    let currentIngredients: string[] = [];

    const flush = () => {
      if (currentDish) {
        const desc = currentIngredients.filter(Boolean).join(", ");
        currentDish.description = desc || null;
        rows.push(currentDish);
      }
      currentDish = null;
      currentIngredients = [];
    };

    // empezamos en 2 (fila 0 = título, fila 1 = "VALOR CARTA")
    for (let i = 2; i < grid.length; i++) {
      const r = grid[i];
      if (!r) continue;
      const name = String(r[section.nameCol] ?? "").trim();
      const price = toInt(r[section.priceCol]);
      const ingredient = String(r[section.ingredientCol] ?? "").trim();

      if (!name && !ingredient && price === null) continue;

      if (name && price !== null) {
        // nuevo plato real
        flush();
        currentDish = {
          name,
          category: section.category,
          subSection: currentSubSection,
          description: null,
          price,
        };
        if (ingredient) currentIngredients.push(ingredient);
      } else if (name && price === null) {
        // header de sub-sección (ej. "Conservas caseras", "Untables caseros", "Tablitas")
        flush();
        currentSubSection = name;
      } else if (currentDish && ingredient) {
        currentIngredients.push(ingredient);
      }
    }
    flush();
  }

  return { rows, errors };
}

// ---------------- ENTRYPOINT ----------------
export function parseExcelAll(buffer: ArrayBuffer): FullImportResult {
  const workbook = XLSX.read(buffer, { type: "array" });

  const wineSheet = findSheet(workbook, ["vino"]);
  const drinkSheet = findSheet(workbook, ["trago", "bebida"]);
  const dishSheet = findSheet(workbook, ["plato"]);

  return {
    wines: wineSheet
      ? parseWinesSheet(wineSheet)
      : { rows: [], errors: [{ row: 0, message: "No se encontró la hoja de Vinos" }] },
    drinks: drinkSheet
      ? parseDrinksSheet(drinkSheet)
      : { rows: [], errors: [{ row: 0, message: "No se encontró la hoja de Tragos" }] },
    dishes: dishSheet
      ? parseDishesSheet(dishSheet)
      : { rows: [], errors: [{ row: 0, message: "No se encontró la hoja de Platos" }] },
  };
}

// Compat: el endpoint actual usa parseExcel; lo dejamos como wrapper
export function parseExcel(buffer: ArrayBuffer): {
  rows: RawRow[];
  errors: ImportResult["errors"];
} {
  const { wines } = parseExcelAll(buffer);
  return {
    rows: wines.rows.map((w) => ({ ...w })),
    errors: wines.errors,
  };
        }
