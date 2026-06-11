import { prisma } from "@/lib/prisma";
import { DrinksTable } from "./DrinksTable";

export default async function AdminDrinksPage() {
  const drinks = await prisma.drink.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-vinito-red mb-6">
        Tragos ({drinks.length})
      </h1>
      <DrinksTable drinks={JSON.parse(JSON.stringify(drinks))} />
    </div>
  );
}
