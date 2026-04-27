import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { WinesResponse } from "@/lib/types";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const zone = params.get("zone");
  const varietal = params.get("varietal");
  const search = params.get("search");
  const page = Math.max(1, parseInt(params.get("page") ?? "1"));
  const limit = Math.min(60, Math.max(1, parseInt(params.get("limit") ?? "30")));

  const where: Prisma.WineWhereInput = { available: true };

  if (category) where.category = category as any;
  if (zone) where.zone = zone;
  if (varietal) where.varietal = varietal;
  if (search) {
    // Nota: en SQLite, `contains` usa `LIKE` que ya es case-insensitive por default
    // para ASCII. El flag `mode: "insensitive"` es exclusivo de Postgres/MongoDB
    // y rompe el type-check. Para acentos en SQLite habría que normalizar a app-level.
    where.OR = [
      { name: { contains: search } },
      { winery: { contains: search } },
      { varietal: { contains: search } },
    ];
  }

  const [wines, total] = await Promise.all([
    prisma.wine.findMany({
      where,
      select: {
        id: true, name: true, winery: true, category: true,
        varietal: true, zone: true, subZone: true, vintage: true,
        price: true, fichaUrl: true,
      },
      orderBy: [{ name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.wine.count({ where }),
  ]);

  const response: WinesResponse = { wines, total, page };
  return NextResponse.json(response);
}
