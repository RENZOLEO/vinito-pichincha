import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * Snapshots de valorización. Solo ADMIN1.
 * - POST: toma un snapshot del estado actual de stock y lo persiste.
 * - GET:  lista los snapshots históricos (orden descendente).
 */

export async function POST() {
  const auth = await requireAuth("ADMIN1");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const wines = await prisma.wine.findMany({
    select: {
      category: true,
      zone: true,
      winery: true,
      stock: true,
      price: true,
      cost: true,
    },
  });

  type Bucket = { units: number; costValue: number; priceValue: number };
  const empty = (): Bucket => ({ units: 0, costValue: 0, priceValue: 0 });

  let totalUnits = 0;
  let totalCostValue = 0;
  let totalPriceValue = 0;
  let wineCount = 0;

  const byCat: Record<string, Bucket> = {};
  const byZone: Record<string, Bucket> = {};
  const byWinery: Record<string, Bucket> = {};

  for (const w of wines) {
    const pv = (w.price ?? 0) * w.stock;
    const cv = (w.cost ?? 0) * w.stock;
    totalUnits += w.stock;
    totalCostValue += cv;
    totalPriceValue += pv;
    if (w.stock > 0) wineCount += 1;

    const push = (b: Record<string, Bucket>, k: string) => {
      if (!b[k]) b[k] = empty();
      b[k].units += w.stock;
      b[k].costValue += cv;
      b[k].priceValue += pv;
    };
    push(byCat, w.category);
    push(byZone, w.zone);
    push(byWinery, w.winery);
  }

  const snap = await prisma.valuationSnapshot.create({
    data: {
      totalUnits,
      totalCostValue,
      totalPriceValue,
      wineCount,
      byCategoryJson: JSON.stringify(byCat),
      byZoneJson: JSON.stringify(byZone),
      byWineryJson: JSON.stringify(byWinery),
    },
  });

  return NextResponse.json(snap, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth("ADMIN1");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const limit = Math.min(365, parseInt(request.nextUrl.searchParams.get("limit") ?? "90"));

  const rows = await prisma.valuationSnapshot.findMany({
    orderBy: { takenAt: "desc" },
    take: limit,
  });

  return NextResponse.json(rows);
}
