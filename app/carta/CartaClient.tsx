"use client";

import { useState, useCallback, useMemo } from "react";
import type { WineListItem } from "@/lib/types";
import { SearchBar } from "@/components/carta/SearchBar";
import { CategoryChips } from "@/components/carta/CategoryChips";
import { FilterBar } from "@/components/carta/FilterBar";
import { WineGrid } from "@/components/carta/WineGrid";
import { WineModal } from "@/components/carta/WineModal";
import { SectionTabs, type Section } from "@/components/carta/SectionTabs";
import { DrinksSection } from "@/components/carta/DrinksSection";
import { DishesSection } from "@/components/carta/DishesSection";

type ZoneInfo = { zone: string; category: string };
type VarietalInfo = { varietal: string | null; category: string };

type Props = {
  initialWines: WineListItem[];
  initialTotal: number;
  zones: ZoneInfo[];
  varietals: VarietalInfo[];
  initialSection?: Section;
};

export function CartaClient({ initialWines, initialTotal, zones, varietals, initialSection = "VINOS" }: Props) {
  const [section, setSection] = useState<Section>(initialSection);
  const [wines, setWines] = useState(initialWines);
  const [total, setTotal] = useState(initialTotal);
  const [category, setCategory] = useState("TINTO");
  const [zone, setZone] = useState<string | null>(null);
  const [varietal, setVarietal] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalWine, setModalWine] = useState<WineListItem | null>(null);
  const [loading, setLoading] = useState(false);

  const availableZones = useMemo(
    () => [...new Set(zones.filter((z) => z.category === category).map((z) => z.zone))].sort(),
    [zones, category]
  );

  const availableVarietals = useMemo(
    () =>
      [...new Set(
        varietals.filter((v) => v.category === category && v.varietal).map((v) => v.varietal!)
      )].sort(),
    [varietals, category]
  );

  const fetchWines = useCallback(
    async (cat: string, z: string | null, v: string | null, s: string) => {
      setLoading(true);
      const params = new URLSearchParams({ category: cat });
      if (z) params.set("zone", z);
      if (v) params.set("varietal", v);
      if (s) params.set("search", s);

      const res = await fetch(`/api/wines?${params}`);
      const data = await res.json();
      setWines(data.wines);
      setTotal(data.total);
      setLoading(false);
    },
    []
  );

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    setZone(null);
    setVarietal(null);
    fetchWines(cat, null, null, search);
  }

  function handleZoneChange(z: string | null) {
    setZone(z);
    fetchWines(category, z, varietal, search);
  }

  function handleVarietalChange(v: string | null) {
    setVarietal(v);
    fetchWines(category, zone, v, search);
  }

  function handleSearch(s: string) {
    setSearch(s);
    fetchWines(category, zone, varietal, s);
  }

  return (
    <div className="max-w-md mx-auto min-h-screen">
      <SectionTabs active={section} onChange={setSection} />

      {section === "VINOS" ? (
        <>
          <SearchBar value={search} onChange={handleSearch} />
          <CategoryChips active={category} onChange={handleCategoryChange} />
          <FilterBar
            category={category}
            availableZones={availableZones}
            availableVarietals={availableVarietals}
            activeZone={zone}
            activeVarietal={varietal}
            onZoneChange={handleZoneChange}
            onVarietalChange={handleVarietalChange}
            totalResults={total}
          />
          <div className={loading ? "opacity-50 transition-opacity" : ""}>
            <WineGrid wines={wines} onViewFicha={setModalWine} />
          </div>
          <WineModal wine={modalWine} onClose={() => setModalWine(null)} />
        </>
      ) : section === "TRAGOS" ? (
        <DrinksSection />
      ) : (
        <DishesSection />
      )}
    </div>
  );
}
