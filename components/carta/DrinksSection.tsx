"use client";

import { useEffect, useMemo, useState } from "react";

type Drink = {
  id: number;
  name: string;
  category: "VERMUTH" | "CLASICO" | "AUTOR" | "WHISKY" | "SOUR" | "CERVEZA" | "SIN_ALCOHOL" | "CAFETERIA";
  description: string | null;
  price: number | null;
  imageUrl: string | null;
};

const CATEGORIES: { key: Drink["category"]; label: string }[] = [
  { key: "VERMUTH", label: "Vermouth" },
  { key: "CLASICO", label: "Clásicos" },
  { key: "AUTOR", label: "De autor" },
  { key: "WHISKY", label: "Whisky" },
  { key: "SOUR", label: "Sours" },
  { key: "CERVEZA", label: "Cervezas" },
  { key: "SIN_ALCOHOL", label: "Sin alcohol" },
  { key: "CAFETERIA", label: "Cafetería" },
];

function formatPrice(price: number | null): string {
  if (price === null || price === 0) return "—";
  return `$${price.toLocaleString("es-AR")}`;
}

export function DrinksSection() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [active, setActive] = useState<Drink["category"]>("VERMUTH");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/drinks")
      .then((r) => r.json())
      .then((data) => {
        setDrinks(data.drinks);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(
    () => drinks.filter((d) => d.category === active),
    [drinks, active]
  );

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

      {loading ? (
        <div className="text-center py-10 text-vinito-black/60 text-sm">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-vinito-black/60 text-sm">
          No hay tragos en esta categoría.
        </div>
      ) : (
        <ul className="px-4 py-2 divide-y divide-vinito-black/10">
          {filtered.map((d) => (
            <li key={d.id} className="py-3 flex gap-3 items-start">
              {d.imageUrl ? (
                <img
                  src={d.imageUrl}
                  alt={d.name}
                  className="w-16 h-16 object-cover rounded shrink-0"
                />
              ) : null}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 items-baseline">
                  <h3 className="font-bold text-sm capitalize text-vinito-black">{d.name}</h3>
                  <span className="text-sm font-bold text-vinito-red whitespace-nowrap">
                    {formatPrice(d.price)}
                  </span>
                </div>
                {(d.category === "AUTOR" || d.category === "SOUR") && d.description ? (
                  <p className="text-xs text-vinito-black/70 mt-1 leading-snug">
                    {d.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
