import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wineId, quantity = 1 } = await request.json();
  if (!wineId) return NextResponse.json({ error: "wineId required" }, { status: 400 });

  const wine = await prisma.wine.findUnique({ where: { id: wineId } });
  if (!wine) return NextResponse.json({ error: "Wine not found" }, { status: 404 });

  if (wine.stock < quantity) {
    return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
  }

  const newStock = wine.stock - quantity;

  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: {
        wineId,
        userId: token.userId as number,
        quantity,
        unitPrice: wine.price,
        total: wine.price ? wine.price * quantity : null,
      },
    }),
    prisma.wine.update({
      where: { id: wineId },
      data: {
        stock: newStock,
        available: newStock > 0,
      },
    }),
  ]);

  return NextResponse.json({ sale, newStock });
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const days = parseInt(params.get("days") ?? "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: since } },
    include: { wine: { select: { name: true, winery: true, category: true, varietal: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sales);
}
