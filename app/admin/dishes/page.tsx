import { prisma } from "@/lib/prisma";
import { DishesTable } from "./DishesTable";

export default async function AdminDishesPage() {
  const dishes = await prisma.dish.findMany({
    orderBy: [{ category: "asc" }, { subSection: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-vinito-red mb-6">Platos ({dishes.length})</h1>
      <DishesTable dishes={JSON.parse(JSON.stringify(dishes))} />
    </div>
  );
}
