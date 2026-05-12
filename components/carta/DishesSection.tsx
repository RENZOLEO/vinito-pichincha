"use client";

import { useEffect, useMemo, useState } from "react";

type Dish = {
  id: number;
  name: string;
  category: "FRIO" | "CALIENTE" | "POSTRE";
  subSection: string | null;
  description: string | null;
  price: number | null;
};

const CATEGORIES: { key: Dish["category"]; label: string }[] = [
  { key: "FRIO", label: "Platitos fríos" },
  { key: "CALIENTE", label: "Platitos calientes" },
  { key: "POSTRE", label: "Postres" },
];

function formatPrice(price: number | null): string {
  if (price === null || price === 0) return "—";
  return `$${price.toLocaleString("es-AR")}`;
}

export function DishesSection() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [active, setActive] = useState<Dish["category"]>("FRIO");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dishes")
      .then((r) => r.json())
      .then((data) => {
        setDishes(data.dishes);
        setLoading(false);
      });
  }, []);

  const grouped = useMemo(() => {
    const filtered = dishes.filter((d) => d.category === active);
    const groups = new Map<string, Dish[]>();
    for (const d of filtered) {
      const key = d.subSection ?? "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    }
    return Array.from(groups.entries());
  }, [dishes, active]);

  return (
    <div>
      <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap border transition-colors ${
              active === key
                ? "bg-vinito-black text-vinito-cream border-vinito-black"
                : "bg-transparent text-vinito-black border-vinito-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-2 pb-1">
        <p className="text-[11px] text-vinito-black/70 leading-snug">
          <span className="font-bold text-vinito-black">Servicio de mesa $4.000</span>
          <span className="text-vinito-black/60"> — incluye agua con/sin gas libre.</span>
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-vinito-black/60 text-sm">Cargando…</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-10 text-vinito-black/60 text-sm">
          No hay platos en esta categoría.
        </div>
      ) : (
        <div className="px-4 pb-6">
          {grouped.map(([sub, items]) => (
            <div key={sub} className="pt-3">
              {sub ? (
                <h2 className="font-display text-vinito-red text-sm tracking-[2px] uppercase pt-3 pb-1 border-b border-vinito-red/30">
                  {sub}
                </h2>
              ) : null}
              <ul className="divide-y divide-vinito-black/10">
                {items.map((d) => (
                  <li key={d.id} className="py-3">
                    <div className="flex justify-between gap-2 items-baseline">
                      <h3 className="font-bold text-sm text-vinito-black">{d.name}</h3>
                      <span className="text-sm font-bold text-vinito-red whitespace-nowrap">
                        {formatPrice(d.price)}
                      </span>
                    </div>
                    {d.description ? (
                      <p className="text-xs text-vinito-black/70 mt-1 leading-snug">
                        {d.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
