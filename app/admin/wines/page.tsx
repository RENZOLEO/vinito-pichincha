import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { WinesTable } from "./WinesTable";

export default async function AdminWinesPage() {
  const session = await getSession();
  const role = ((session?.user as { role?: "ADMIN1" | "ADMIN2" } | undefined)?.role) ?? "ADMIN2";

  const wines = await prisma.wine.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-vinito-red mb-6">Vinos ({wines.length})</h1>
      <WinesTable wines={JSON.parse(JSON.stringify(wines))} role={role} />
    </div>
  );
}
