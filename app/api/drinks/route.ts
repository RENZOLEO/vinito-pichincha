import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const search = params.get("search");

  const where: Prisma.DrinkWhereInput = { available: true };
  if (category) where.category = category as Prisma.EnumDrinkCategoryFilter["equals"];
  if (search) {
    where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
  }

  const drinks = await prisma.drink.findMany({
    where,
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      price: true,
      imageUrl: true,
    },
    orderBy: [{ category: "asc" }, { price: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ drinks, total: drinks.length });
}
