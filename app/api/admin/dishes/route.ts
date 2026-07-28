import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/admin/dishes
 * Body: { name: string, category: "FRIO" | "CALIENTE" | "PRINCIPAL" | "POSTRE", subSection?: string | null,
 *          description?: string | null, price?: number | null }
 *
 * Crea un nuevo plato. Disponible para ADMIN1 y ADMIN2.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as {
    name?: string;
    category?: "FRIO" | "CALIENTE" | "PRINCIPAL" | "POSTRE";
    subSection?: string | null;
    description?: string | null;
    price?: number | null;
  };
  const { name, category, subSection, description, price } = body;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!category || !["FRIO", "CALIENTE", "PRINCIPAL", "POSTRE"].includes(category)) {
    return NextResponse.json({ error: "valid category required" }, { status: 400 });
  }

  const dish = await prisma.dish.create({
    data: {
      name,
      category,
      subSection: subSection ?? null,
      description: description ?? null,
      price: price ?? null,
    },
  });
  return NextResponse.json(dish, { status: 201 });
}

/**
 * PATCH /api/admin/dishes
 * Body: { id: number, available: boolean }
 *
 * Toggle de disponibilidad de un plato. Disponible para ADMIN1 y ADMIN2.
 * (Para CRUD completo —crear/editar/eliminar— sumamos POST/DELETE en otra iteración.)
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as { id?: number; available?: boolean };
  const { id, available } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (typeof available !== "boolean") {
    return NextResponse.json({ error: "available required" }, { status: 400 });
  }

  const dish = await prisma.dish.update({ where: { id }, data: { available } });
  return NextResponse.json(dish);
}
