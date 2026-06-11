"use client";
import { useMemo, useState } from "react";
import { DrinkToggle } from "@/components/admin/DrinkToggle";

type Drink = {
  id: number;
  name: string;
  category: "VERMUTH" | "CLASICO" | "AUTOR" | "WHISKY" | "CERVEZA" | "SIN_ALCOHOL" | "CAFETERIA";
  description: string | null;
  price: number | null;
  available: boolean;
};

type SortKey = "name" | "category" | "price" | "available";
type SortDir = "asc" | "desc";

const CATEGORY_LABELS: Record<Drink["category"], string> = {
  VERMUTH: "Vermuth",
  CLASICO: "Clásico",
  AUTOR: "Autor",
  WHISKY: "Whisky",
  CERVEZA: "Cerveza",
  SIN_ALCOHOL: "Sin alcohol",
  CAFETERIA: "Cafetería",
};

export function DrinksTable({ drinks }: { drinks: Drink[] }) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterAvailable, setFilterAvailable] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    let result = drinks;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }
    if (filterCategory) result = result.filter((d) => d.category === filterCategory);
    if (filterAvailable === "si") result = result.filter((d) => d.available);
    if (filterAvailable === "no") result = result.filter((d) => !d.available);
    result = [...result].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      if (typeof va === "number" && typeof vb === "number")
        return sortDir === "asc" ? va - vb : vb - va;
      if (typeof va === "boolean" && typeof vb === "boolean")
        return sortDir === "asc"
          ? va === vb ? 0 : va ? -1 : 1
          : va === vb ? 0 : va ? 1 : -1;
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return result;
  }, [drinks, search, filterCategory, filterAvailable, sortKey, sortDir]);

  const arrow = (k: SortKey) => sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : "";
  const totalDisponibles = drinks.filter((d) => d.available).length;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          placeholder="Buscar nombre, descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-vinito-black/20 rounded px-3 py-1.5 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-vinito-black/20 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={filterAvailable}
          onChange={(e) => setFilterAvailable(e.target.value)}
          className="border border-vinito-black/20 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Disponibilidad</option>
          <option value="si">Disponibles</option>
          <option value="no">No disponibles</option>
        </select>
      </div>

      <p className="text-sm text-vinito-black/50 mb-3">
        {filtered.length} de {drinks.length} tragos · {totalDisponibles} disponibles
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-vinito-black/10">
              <Th k="name" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Nombre</Th>
              <Th k="category" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Categoría</Th>
              <th className="px-3 py-2 text-[10px] uppercase tracking-wide text-vinito-black/50 text-left">Descripción</th>
              <Th k="price" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Precio</Th>
              <Th k="available" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Disponible</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.id}
                className={`border-b border-vinito-black/5 hover:bg-vinito-black/[0.02] ${
                  !d.available ? "opacity-50" : ""
                }`}
              >
                <td className="px-3 py-2 font-medium">{d.name}</td>
                <td className="px-3 py-2 text-vinito-black/60 uppercase text-xs tracking-wide">
                  {CATEGORY_LABELS[d.category]}
                </td>
                <td className="px-3 py-2 text-vinito-black/50 text-xs">{d.description ?? "—"}</td>
                <td className="px-3 py-2 text-vinito-red font-medium">
                  {d.price ? `$${d.price.toLocaleString("es-AR")}` : "—"}
                </td>
                <td className="px-3 py-2">
                  <DrinkToggle drinkId={d.id} initial={d.available} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-vinito-black/40 text-sm">
                  No hay tragos que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children, k, sortKey, dir, onSort,
}: {
  children: React.ReactNode;
  k: SortKey;
  sortKey: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const arrow = sortKey === k ? (dir === "asc" ? " ▲" : " ▼") : "";
  return (
    <th
      onClick={() => onSort(k)}
      className="px-3 py-2 text-[10px] uppercase tracking-wide text-vinito-black/50 cursor-pointer hover:text-vinito-red select-none text-left"
    >
      {children}{arrow}
    </th>
  );
}
