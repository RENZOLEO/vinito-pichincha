import { prisma } from "@/lib/prisma";
import { Header } from "@/components/carta/Header";
import { CartaClient } from "./CartaClient";
import type { Section } from "@/components/carta/SectionTabs";

const SECTION_MAP: Record<string, Section> = {
  vinos: "VINOS",
  tragos: "TRAGOS",
  platos: "PLATOS",
  menu: "PLATOS",
};

type SearchParams = Promise<{ s?: string }>;

export default async function CartaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const initialSection: Section = (sp?.s && SECTION_MAP[sp.s.toLowerCase()]) || "VINOS";

  const [wines, total, zones, varietals] = await Promise.all([
    prisma.wine.findMany({
      where: { available: true, category: "TINTO" },
      select: {
        id: true, name: true, winery: true, category: true,
        varietal: true, zone: true, subZone: true, vintage: true,
        price: true, fichaUrl: true,
      },
      orderBy: { name: "asc" },
      take: 30,
    }),
    prisma.wine.count({ where: { available: true, category: "TINTO" } }),
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
        initialWines={wines}
        initialTotal={total}
        zones={zones}
        varietals={varietals}
        initialSection={initialSection}
      />
    </main>
  );
}
