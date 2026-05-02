"use client";

import { useMemo, useState } from "react";
import { DishToggle } from "@/components/admin/DishToggle";

type Dish = {
  id: number;
  name: string;
  category: "FRIO" | "CALIENTE" | "POSTRE";
  subSection: string | null;
  description: string | null;
  price: number | null;
  available: boolean;
};

type SortKey = "name" | "category" | "subSection" | "price" | "available";
type SortDir = "asc" | "desc";

const CATEGORY_LABELS: Record<Dish["category"], string> = {
  FRIO: "Fríos",
  CALIENTE: "Calientes",
  POSTRE: "Postres",
};

export function DishesTable({ dishes }: { dishes: Dish[] }) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSubSection, setFilterSubSection] = useState<string>("");
  const [filterAvailable, setFilterAvailable] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const subSections = useMemo(
    () =>
      [...new Set(dishes.map((d) => d.subSection).filter(Boolean) as string[])].sort(),
    [dishes]
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let result = dishes;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.subSection && d.subSection.toLowerCase().includes(q))
      );
    }
    if (filterCategory) result = result.filter((d) => d.category === filterCategory);
    if (filterSubSection) result = result.filter((d) => d.subSection === filterSubSection);
    if (filterAvailable === "si") result = result.filter((d) => d.available);
    if (filterAvailable === "no") result = result.filter((d) => !d.available);

    result = [...result].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (typeof va === "boolean" && typeof vb === "boolean") {
        return sortDir === "asc"
          ? va === vb ? 0 : va ? -1 : 1
          : va === vb ? 0 : va ? 1 : -1;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });

    return result;
  }, [dishes, search, filterCategory, filterSubSection, filterAvailable, sortKey, sortDir]);

  const arrow = (k: SortKey) =>
    sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const totalDisponibles = dishes.filter((d) => d.available).length;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          placeholder="Buscar nombre, descripción, subsección…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-vinito-black/20 rounded px-3 py-1.5 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-vinito-black/20 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {subSections.length > 0 && (
          <select
            value={filterSubSection}
            onChange={(e) => setFilterSubSection(e.target.value)}
            className="border border-vinito-black/20 rounded px-2 py-1.5 text-sm"
          >
            <option value="">Todas las subsecciones</option>
            {subSections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        <select
          value={filterAvailable}
          onChange={(e) => setFilterAvailable(e.target.value)}
          className="border border-vinito-black/20 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Disponibilidad</option>
          <option value="si">Disponible</option>
          <option value="no">No disponible</option>
        </select>
        {(search || filterCategory || filterSubSection || filterAvailable) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterCategory("");
              setFilterSubSection("");
              setFilterAvailable("");
            }}
            className="text-xs px-2 py-1 text-vinito-black/50 hover:text-vinito-red"
          >
            Limpiar
          </button>
        )}
      </div>

      <p className="text-xs text-vinito-black/50 mb-2">
        {filtered.length} de {dishes.length} platos · {totalDisponibles} disponibles
      </p>

      <div className="bg-white rounded-lg border border-vinito-black/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-vinito-black/10 text-left">
              <Th k="name" sortKey={sortKey} dir={sortDir} onSort={handleSort}>
                Nombre
              </Th>
              <Th k="category" sortKey={sortKey} dir={sortDir} onSort={handleSort}>
                Categoría
              </Th>
              <Th k="subSection" sortKey={sortKey} dir={sortDir} onSort={handleSort}>
                Subsección
              </Th>
              <Th k="price" sortKey={sortKey} dir={sortDir} onSort={handleSort}>
                Precio
              </Th>
              <Th k="available" sortKey={sortKey} dir={sortDir} onSort={handleSort}>
                Disponible
              </Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.id}
                className={`border-b border-vinito-black/5 hover:bg-vinito-cream/50 ${
                  !d.available ? "opacity-50" : ""
                }`}
              >
                <td className="px-3 py-2">
                  <div className="font-medium">{d.name}</div>
                  {d.description && (
                    <div className="text-[11px] text-vinito-black/50 line-clamp-2">
                      {d.description}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-[10px] uppercase tracking-wide">
                  {CATEGORY_LABELS[d.category]}
                </td>
                <td className="px-3 py-2 text-vinito-black/60">{d.subSection ?? "—"}</td>
                <td className="px-3 py-2 font-bold text-vinito-red">
                  {d.price ? `$${d.price.toLocaleString("es-AR")}` : "—"}
                </td>
                <td className="px-3 py-2">
                  <DishToggle dishId={d.id} initial={d.available} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-vinito-black/40 text-sm">
                  No hay platos que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Suprimir el warning visual (`useMemo` para el cabezal)
function Th({
  children,
  k,
  sortKey,
  dir,
  onSort,
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
      className="px-3 py-2 text-[10px] uppercase tracking-wide text-vinito-black/50 cursor-pointer hover:text-vinito-red select-none"
    >
      {children}
      {arrow}
    </th>
  );
}
