import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const search = params.get("search");

  const where: Prisma.DishWhereInput = { available: true };
  if (category) where.category = category as Prisma.EnumDishCategoryFilter["equals"];
  if (search) {
    where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
  }

  const dishes = await prisma.dish.findMany({
    where,
    select: {
      id: true,
      name: true,
      category: true,
      subSection: true,
      description: true,
      price: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ dishes, total: dishes.length });
}
