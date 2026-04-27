import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/admin/stats
 *   ?from=YYYY-MM-DD          (opcional, default: hoy - 30d)
 *   ?to=YYYY-MM-DD            (opcional, default: hoy)
 *   ?days=N                   (atajo legacy — si viene, ignora from/to y usa últimos N días)
 *   ?category=TINTO           (opcional, filtra ventas y wines por categoría)
 *   ?lowStock=3               (umbral "poco stock" — default 3)
 *   ?highStock=20             (umbral "mucho stock" — default 20)
 *
 * Solo OWNER.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth("ADMIN1");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const params = request.nextUrl.searchParams;
  const daysParam = params.get("days");
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const category = params.get("category");
  const lowStockThreshold = parseInt(params.get("lowStock") ?? "3");
  const highStockThreshold = parseInt(params.get("highStock") ?? "20");

  // Resolver rango de fechas
  let from: Date;
  let to: Date;

  if (daysParam) {
    const days = parseInt(daysParam);
    to = new Date();
    from = new Date();
    from.setDate(from.getDate() - days);
  } else {
    to = toParam ? new Date(`${toParam}T23:59:59`) : new Date();
    from = fromParam ? new Date(`${fromParam}T00:00:00`) : new Date(to.getTime() - 30 * 86400000);
  }

  const saleWhere = {
    createdAt: { gte: from, lte: to },
    ...(category ? { wine: { category: category as never } } : {}),
  };

  // Todas las ventas del período (las usamos para varios cálculos)
  const allSales = await prisma.sale.findMany({
    where: saleWhere,
    select: {
      quantity: true,
      total: true,
      createdAt: true,
      wineId: true,
      wine: {
        select: {
          id: true,
          name: true,
          winery: true,
          category: true,
          varietal: true,
          stock: true,
        },
      },
    },
  });

  // Agregados por vino (manual, más flexible que groupBy)
  const perWine = new Map<
    number,
    { wineId: number; qty: number; revenue: number; wine: (typeof allSales)[number]["wine"] }
  >();
  for (const s of allSales) {
    if (!s.wine) continue;
    const curr = perWine.get(s.wineId) ?? {
      wineId: s.wineId,
      qty: 0,
      revenue: 0,
      wine: s.wine,
    };
    curr.qty += s.quantity;
    curr.revenue += s.total ?? 0;
    perWine.set(s.wineId, curr);
  }

  const topSelling = [...perWine.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)
    .map((v) => ({ wineId: v.wineId, qty: v.qty, revenue: v.revenue, wine: v.wine }));

  const leastSelling = [...perWine.values()]
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 10)
    .map((v) => ({ wineId: v.wineId, qty: v.qty, revenue: v.revenue, wine: v.wine }));

  // Sales by day
  const salesByDay: Record<string, { count: number; revenue: number }> = {};
  for (const s of allSales) {
    const day = s.createdAt.toISOString().slice(0, 10);
    if (!salesByDay[day]) salesByDay[day] = { count: 0, revenue: 0 };
    salesByDay[day].count += s.quantity;
    salesByDay[day].revenue += s.total ?? 0;
  }

  // Sales by category (agregado desde allSales, sin SQL raw)
  const byCat: Record<string, { qty: number; revenue: number }> = {};
  for (const s of allSales) {
    const cat = s.wine?.category ?? "—";
    if (!byCat[cat]) byCat[cat] = { qty: 0, revenue: 0 };
    byCat[cat].qty += s.quantity;
    byCat[cat].revenue += s.total ?? 0;
  }
  const salesByCategory = Object.entries(byCat)
    .map(([cat, v]) => ({ category: cat, total_qty: v.qty, total_revenue: v.revenue }))
    .sort((a, b) => b.total_qty - a.total_qty);

  // Rotación: para TODOS los vinos (o filtrados por categoría)
  const wineWhere = category ? { category: category as never } : {};
  const allWines = await prisma.wine.findMany({
    where: wineWhere,
    select: {
      id: true,
      name: true,
      winery: true,
      category: true,
      varietal: true,
      zone: true,
      stock: true,
      price: true,
      cost: true,
      available: true,
    },
  });

  const rotation = allWines.map((w) => {
    const sold = perWine.get(w.id)?.qty ?? 0;
    const totalAtStart = w.stock + sold;
    const rotationRate = totalAtStart > 0 ? sold / totalAtStart : 0;
    return {
      wineId: w.id,
      name: w.name,
      winery: w.winery,
      category: w.category,
      varietal: w.varietal,
      zone: w.zone,
      currentStock: w.stock,
      sold,
      rotationRate: Math.round(rotationRate * 10000) / 100,
      available: w.available,
      price: w.price,
      cost: w.cost,
      stockValueAtPrice: (w.price ?? 0) * w.stock,
      stockValueAtCost: (w.cost ?? 0) * w.stock,
    };
  });

  // ---------- Valorización de mercadería ----------
  type Bucket = { units: number; priceValue: number; costValue: number; wineCount: number };
  const emptyBucket = (): Bucket => ({ units: 0, priceValue: 0, costValue: 0, wineCount: 0 });

  const valuationTotal: Bucket = emptyBucket();
  const byValCategory: Record<string, Bucket> = {};
  const byValZone: Record<string, Bucket> = {};
  const byValWinery: Record<string, Bucket> = {};

  for (const w of allWines) {
    const pv = (w.price ?? 0) * w.stock;
    const cv = (w.cost ?? 0) * w.stock;

    valuationTotal.units += w.stock;
    valuationTotal.priceValue += pv;
    valuationTotal.costValue += cv;
    if (w.stock > 0) valuationTotal.wineCount += 1;

    const push = (bucket: Record<string, Bucket>, key: string) => {
      if (!bucket[key]) bucket[key] = emptyBucket();
      bucket[key].units += w.stock;
      bucket[key].priceValue += pv;
      bucket[key].costValue += cv;
      if (w.stock > 0) bucket[key].wineCount += 1;
    };
    push(byValCategory, w.category);
    push(byValZone, w.zone);
    push(byValWinery, w.winery);
  }

  const margin = valuationTotal.priceValue - valuationTotal.costValue;
  const marginPct = valuationTotal.costValue > 0
    ? Math.round((margin / valuationTotal.costValue) * 10000) / 100
    : 0;
  const winesWithoutCost = allWines.filter((w) => w.cost == null && w.stock > 0).length;

  const valuation = {
    total: valuationTotal,
    margin,
    marginPct,
    winesWithoutCost,
    byCategory: Object.entries(byValCategory)
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.priceValue - a.priceValue),
    byZone: Object.entries(byValZone)
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.priceValue - a.priceValue),
    byWinery: Object.entries(byValWinery)
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.priceValue - a.priceValue),
  };

  // Stock bajo / alto (post-thresholds)
  const lowStock = rotation.filter((r) => r.currentStock <= lowStockThreshold);
  const highStock = rotation.filter((r) => r.currentStock >= highStockThreshold);

  const totalSales = allSales.reduce((acc, s) => acc + s.quantity, 0);
  const totalRevenue = allSales.reduce((acc, s) => acc + (s.total ?? 0), 0);
  const uniqueWinesSold = perWine.size;

  return NextResponse.json({
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      fromDate: from.toISOString().slice(0, 10),
      toDate: to.toISOString().slice(0, 10),
    },
    filters: { category, lowStockThreshold, highStockThreshold },
    totals: {
      sales: totalSales,
      revenue: totalRevenue,
      uniqueWinesSold,
      wineCount: allWines.length,
    },
    topSelling,
    leastSelling,
    salesByDay,
    salesByCategory,
    rotation,
    lowStock,
    highStock,
    valuation,
  });
}
