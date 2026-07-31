import { prisma } from "@/lib/prisma";
import { Header } from "@/components/carta/Header";
import { CartaClient } from "./CartaClient";
import type { Section } from "@/components/carta/SectionTabs";

export const dynamic = "force-dynamic";

const SECTION_MAP: Record<string, Section> = {
  vinos: "VINOS",
  tragos: "TRAGOS",
  platos: "PLATOS",
  menu: "PLATOS",
};

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type SearchParams = Promise<{ s?: string }>;

export default async function CartaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const initialSection: Section = (sp?.s && SECTION_MAP[sp.s.toLowerCase()]) || "VINOS";

  const [wines, total, zones, varietals] = await Promise.all([
    prisma.wine.findMany({
      where: { available: true },
      select: {
        id: true, name: true, winery: true, category: true,
        varietal: true, zone: true, subZone: true, vintage: true,
        price: true, fichaUrl: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.wine.count({ where: { available: true } }),
    prisma.wine.findMany({
      where: { available: true },
      select: { zone: true, category: true },
      distinct: ["zone", "category"],
    }),
    prisma.wine.findMany({
      where: { available: true, varietal: { not: null } },
      select: { varietal: true, category: true },
      distinct: ["varietal", "category"],
    }),
  ]);

  return (
    <main className="min-h-screen bg-vinito-cream">
      <Header />
      <CartaClient
        initialWines={shuffle(wines)}
        initialTotal={total}
        zones={zones}
        varietals={varietals}
        initialSection={initialSection}
      />
    </main>
  );
}
