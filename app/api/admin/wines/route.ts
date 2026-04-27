import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const VALID_CATEGORIES = ["TINTO", "BLANCO", "ROSADO", "NARANJO", "ESPUMANTE"];

type PatchBody = {
  id?: number;
  available?: boolean;
  stock?: number;
  // Campos ADMIN1 (edición completa)
  price?: number | null;
  cost?: number | null;
  name?: string;
  winery?: string;
  category?: string;
  varietal?: string | null;
  zone?: string;
  subZone?: string | null;
  vintage?: number | null;
  alcohol?: number | null;
  aging?: string | null;
  servingTemp?: string | null;
  pairing?: string | null;
  tastingNote?: string | null;
  fichaUrl?: string | null;
};

// ---------- PATCH: actualizar ----------
// STAFF: solo `available`.
// OWNER: cualquier campo parcial.
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as PatchBody;
  const { id, available, price, cost, stock } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // ADMIN2: toggle available + editar stock. NO price, NO cost, NO otros campos.
  if (auth.role === "ADMIN2") {
    const adminOnlyFields = [
      price,
      cost,
      body.name,
      body.winery,
      body.category,
      body.varietal,
      body.zone,
      body.subZone,
      body.vintage,
      body.alcohol,
      body.aging,
      body.servingTemp,
      body.pairing,
      body.tastingNote,
      body.fichaUrl,
    ];
    const attemptsForbidden = adminOnlyFields.some((v) => v !== undefined);
    if (attemptsForbidden) {
      return NextResponse.json(
        { error: "ADMIN2 solo puede tocar stock y disponibilidad" },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = {};
    if (typeof available === "boolean") data.available = available;
    if (typeof stock === "number") {
      if (stock < 0) {
        return NextResponse.json({ error: "stock no puede ser negativo" }, { status: 400 });
      }
      data.stock = stock;
      if (stock === 0) data.available = false;
      if (stock > 0 && available === undefined) data.available = true;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }
    const wine = await prisma.wine.update({ where: { id }, data });
    return NextResponse.json(wine);
  }

  // ADMIN1: todo.
  const data: Record<string, unknown> = {};

  // Toggles y numéricos rápidos
  if (typeof available === "boolean") data.available = available;
  if (typeof price === "number") data.price = price;
  if (price === null) data.price = null;
  if (typeof cost === "number") data.cost = cost;
  if (cost === null) data.cost = null;
  if (typeof stock === "number") {
    data.stock = stock;
    if (stock === 0) data.available = false;
    if (stock > 0 && available === undefined) data.available = true;
  }

  // Edición completa OWNER
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.winery === "string" && body.winery.trim()) data.winery = body.winery.trim();
  if (typeof body.category === "string") {
    const cat = body.category.trim().toUpperCase();
    if (!VALID_CATEGORIES.includes(cat)) {
      return NextResponse.json({ error: "category inválida" }, { status: 400 });
    }
    data.category = cat;
  }
  if (body.varietal !== undefined) data.varietal = body.varietal?.toString().trim() || null;
  if (typeof body.zone === "string" && body.zone.trim()) data.zone = body.zone.trim();
  if (body.subZone !== undefined) data.subZone = body.subZone?.toString().trim() || null;
  if (body.vintage !== undefined) data.vintage = typeof body.vintage === "number" ? body.vintage : null;
  if (body.alcohol !== undefined) data.alcohol = typeof body.alcohol === "number" ? body.alcohol : null;
  if (body.aging !== undefined) data.aging = body.aging?.toString().trim() || null;
  if (body.servingTemp !== undefined) data.servingTemp = body.servingTemp?.toString().trim() || null;
  if (body.pairing !== undefined) data.pairing = body.pairing?.toString().trim() || null;
  if (body.tastingNote !== undefined) data.tastingNote = body.tastingNote?.toString().trim() || null;
  if (body.fichaUrl !== undefined) data.fichaUrl = body.fichaUrl?.toString().trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const wine = await prisma.wine.update({ where: { id }, data });
  return NextResponse.json(wine);
}

// ---------- POST: crear vino (OWNER) ----------
type CreateBody = {
  name?: string;
  winery?: string;
  category?: string;
  varietal?: string | null;
  zone?: string;
  subZone?: string | null;
  vintage?: number | null;
  alcohol?: number | null;
  aging?: string | null;
  servingTemp?: string | null;
  pairing?: string | null;
  tastingNote?: string | null;
  price?: number | null;
  cost?: number | null;
  stock?: number;
  fichaUrl?: string | null;
  available?: boolean;
};

export async function POST(request: NextRequest) {
  const auth = await requireAuth("ADMIN1");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as CreateBody;

  const name = body.name?.trim();
  const winery = body.winery?.trim();
  const category = body.category?.trim().toUpperCase();
  const zone = body.zone?.trim();

  if (!name) return NextResponse.json({ error: "name es obligatorio" }, { status: 400 });
  if (!winery) return NextResponse.json({ error: "winery es obligatorio" }, { status: 400 });
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category debe ser uno de: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!zone) return NextResponse.json({ error: "zone es obligatorio" }, { status: 400 });

  const stock = typeof body.stock === "number" && body.stock >= 0 ? body.stock : 1;

  const data: Prisma.WineCreateInput = {
    name,
    winery,
    category: category as Prisma.WineCreateInput["category"],
    varietal: body.varietal?.trim() || null,
    zone,
    subZone: body.subZone?.trim() || null,
    vintage: typeof body.vintage === "number" ? body.vintage : null,
    alcohol: typeof body.alcohol === "number" ? body.alcohol : null,
    aging: body.aging?.trim() || null,
    servingTemp: body.servingTemp?.trim() || null,
    pairing: body.pairing?.trim() || null,
    tastingNote: body.tastingNote?.trim() || null,
    price: typeof body.price === "number" ? body.price : null,
    cost: typeof body.cost === "number" ? body.cost : null,
    stock,
    fichaUrl: body.fichaUrl?.trim() || null,
    available: typeof body.available === "boolean" ? body.available : stock > 0,
  };

  const wine = await prisma.wine.create({ data });
  return NextResponse.json(wine, { status: 201 });
}

// ---------- DELETE: eliminar vino (OWNER) ----------
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth("ADMIN1");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? parseInt(idParam) : NaN;
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "id required (query param)" }, { status: 400 });
  }

  // Si tiene ventas, Prisma fallaría por la FK. Informar claramente.
  const salesCount = await prisma.sale.count({ where: { wineId: id } });
  if (salesCount > 0) {
    return NextResponse.json(
      {
        error: `No se puede eliminar: el vino tiene ${salesCount} venta(s) registrada(s). Usá "deshabilitar" para ocultarlo de la carta.`,
      },
      { status: 409 }
    );
  }

  await prisma.wine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
