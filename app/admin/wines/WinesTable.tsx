"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StockToggle } from "@/components/admin/StockToggle";
import { SellButton } from "@/components/admin/SellButton";
import { StockEditor } from "@/components/admin/StockEditor";
import { WineForm, type WineFormValues } from "@/components/admin/WineForm";

type Wine = {
  id: number;
  name: string;
  winery: string;
  category: string;
  varietal: string | null;
  zone: string;
  subZone: string | null;
  vintage: number | null;
  alcohol: number | null;
  aging: string | null;
  servingTemp: string | null;
  pairing: string | null;
  tastingNote: string | null;
  fichaUrl: string | null;
  price: number | null;
  cost: number | null;
  stock: number;
  available: boolean;
};

type SortKey =
  | "name"
  | "winery"
  | "category"
  | "varietal"
  | "zone"
  | "price"
  | "stock"
  | "available";
type SortDir = "asc" | "desc";
type Role = "ADMIN1" | "ADMIN2";

export function WinesTable({
  wines,
  role = "ADMIN2",
}: {
  wines: Wine[];
  role?: Role;
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterVarietal, setFilterVarietal] = useState("");
  const [filterAvailable, setFilterAvailable] = useState("");
  const [stockMin, setStockMin] = useState("");
  const [stockMax, setStockMax] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<WineFormValues> | null>(null);

  const categories = useMemo(
    () => [...new Set(wines.map((w) => w.category))].sort(),
    [wines]
  );
  const zones = useMemo(
    () => [...new Set(wines.map((w) => w.zone))].sort(),
    [wines]
  );
  const varietals = useMemo(
    () => [...new Set(wines.map((w) => w.varietal).filter(Boolean) as string[])].sort(),
    [wines]
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let result = wines;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.winery.toLowerCase().includes(q) ||
          (w.varietal && w.varietal.toLowerCase().includes(q))
      );
    }
    if (filterCategory) result = result.filter((w) => w.category === filterCategory);
    if (filterZone) result = result.filter((w) => w.zone === filterZone);
    if (filterVarietal) result = result.filter((w) => w.varietal === filterVarietal);
    if (filterAvailable === "si") result = result.filter((w) => w.available);
    if (filterAvailable === "no") result = result.filter((w) => !w.available);

    // Rango de stock
    const minN = stockMin !== "" ? parseInt(stockMin) : null;
    const maxN = stockMax !== "" ? parseInt(stockMax) : null;
    if (minN !== null && !isNaN(minN)) result = result.filter((w) => w.stock >= minN);
    if (maxN !== null && !isNaN(maxN)) result = result.filter((w) => w.stock <= maxN);

    result = [...result].sort((a, b) => {
      const valA = a[sortKey] ?? "";
      const valB = b[sortKey] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
      if (typeof valA === "boolean" && typeof valB === "boolean") {
        return sortDir === "asc"
          ? valA === valB ? 0 : valA ? -1 : 1
          : valA === valB ? 0 : valA ? 1 : -1;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }, [
    wines,
    search,
    filterCategory,
    filterZone,
    filterVarietal,
    filterAvailable,
    stockMin,
    stockMax,
    sortKey,
    sortDir,
  ]);

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(w: Wine) {
    setEditing({
      id: w.id,
      name: w.name,
      winery: w.winery,
      category: w.category as WineFormValues["category"],
      varietal: w.varietal ?? "",
      zone: w.zone,
      subZone: w.subZone ?? "",
      vintage: w.vintage != null ? String(w.vintage) : "",
      alcohol: w.alcohol != null ? String(w.alcohol) : "",
      aging: w.aging ?? "",
      servingTemp: w.servingTemp ?? "",
      pairing: w.pairing ?? "",
      tastingNote: w.tastingNote ?? "",
      price: w.price != null ? String(w.price) : "",
      cost: w.cost != null ? String(w.cost) : "",
      stock: String(w.stock),
      fichaUrl: w.fichaUrl ?? "",
      available: w.available,
    });
    setFormOpen(true);
  }

  async function handleDelete(w: Wine) {
    if (!confirm(`¿Eliminar "${w.name}" (${w.winery})? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/wines?id=${w.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error" }));
      alert(err.error ?? "Error al eliminar");
      return;
    }
    router.refresh();
  }

  function exportCsv() {
    const headers = [
      "id",
      "name",
      "winery",
      "category",
      "varietal",
      "zone",
      "subZone",
      "vintage",
      "price",
      "stock",
      "available",
    ];
    const rows = filtered.map((w) =>
      [
        w.id,
        w.name,
        w.winery,
        w.category,
        w.varietal ?? "",
        w.zone,
        w.subZone ?? "",
        w.vintage ?? "",
        w.price ?? "",
        w.stock,
        w.available ? "si" : "no",
      ]
        .map((v) => {
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vinos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isAdmin1 = role === "ADMIN1";

  return (
    <div>
      {/* Toolbar superior (OWNER) */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Buscar nombre, bodega, cepa…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-vinito-black/20 rounded px-3 py-1.5 text-sm flex-1 min-w-[200px]"
        />
        <button
          onClick={exportCsv}
          className="text-xs px-3 py-1.5 border border-vinito-black/20 rounded hover:bg-vinito-black/5"
          title="Exportar la vista filtrada a CSV"
        >
          ⬇ CSV
        </button>
        {isAdmin1 && (
          <button
            onClick={openNew}
            className="text-xs px-3 py-1.5 bg-vinito-red text-vinito-cream rounded font-bold uppercase tracking-wide"
          >
            + Nuevo vino
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-2">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-vinito-black/20 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
          className="border border-vinito-black/20 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Todas las zonas</option>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <select
          value={filterVarietal}
          onChange={(e) => setFilterVarietal(e.target.value)}
          className="border border-vinito-black/20 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Todas las cepas</option>
          {varietals.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filterAvailable}
          onChange={(e) => setFilterAvailable(e.target.value)}
          className="border border-vinito-black/20 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Disponibilidad</option>
          <option value="si">Disponible</option>
          <option value="no">No disponible</option>
        </select>

        {/* Rango stock */}
        <div className="flex items-center gap-1 border border-vinito-black/20 rounded px-2 py-1 text-xs">
          <span className="text-vinito-black/50">Stock</span>
          <input
            type="number"
            min="0"
            placeholder="min"
            value={stockMin}
            onChange={(e) => setStockMin(e.target.value)}
            className="w-14 outline-none"
          />
          <span className="text-vinito-black/30">–</span>
          <input
            type="number"
            min="0"
            placeholder="max"
            value={stockMax}
            onChange={(e) => setStockMax(e.target.value)}
            className="w-14 outline-none"
          />
        </div>

        {(search ||
          filterCategory ||
          filterZone ||
          filterVarietal ||
          filterAvailable ||
          stockMin ||
          stockMax) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterCategory("");
              setFilterZone("");
              setFilterVarietal("");
              setFilterAvailable("");
              setStockMin("");
              setStockMax("");
            }}
            className="text-xs px-2 py-1 text-vinito-black/50 hover:text-vinito-red"
          >
            Limpiar
          </button>
        )}
      </div>

      <p className="text-xs text-vinito-black/50 mb-2">
        {filtered.length} de {wines.length} vinos
      </p>

      {/* Table */}
      <div className="bg-white rounded-lg border border-vinito-black/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-vinito-black/10 text-left">
              <Th sortKey="name" active={sortKey} dir={sortDir} onClick={handleSort}>
                Nombre
              </Th>
              <Th sortKey="winery" active={sortKey} dir={sortDir} onClick={handleSort}>
                Bodega
              </Th>
              <Th sortKey="category" active={sortKey} dir={sortDir} onClick={handleSort}>
                Cat.
              </Th>
              <Th sortKey="varietal" active={sortKey} dir={sortDir} onClick={handleSort}>
                Cepa
              </Th>
              <Th sortKey="zone" active={sortKey} dir={sortDir} onClick={handleSort}>
                Zona
              </Th>
              <Th sortKey="price" active={sortKey} dir={sortDir} onClick={handleSort}>
                Precio
              </Th>
              <Th sortKey="stock" active={sortKey} dir={sortDir} onClick={handleSort}>
                Unidades
              </Th>
              <Th sortKey="available" active={sortKey} dir={sortDir} onClick={handleSort}>
                Disponible
              </Th>
              {isAdmin1 && (
                <th className="px-3 py-2 text-[10px] uppercase tracking-wide text-vinito-black/50">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr
                key={w.id}
                className={`border-b border-vinito-black/5 hover:bg-vinito-cream/50 ${
                  !w.available ? "opacity-50" : ""
                }`}
              >
                <td className="px-3 py-2 font-medium">{w.name}</td>
                <td className="px-3 py-2 text-vinito-black/60">{w.winery}</td>
                <td className="px-3 py-2 text-[10px] uppercase">{w.category}</td>
                <td className="px-3 py-2 text-vinito-black/60">{w.varietal ?? "—"}</td>
                <td className="px-3 py-2 text-vinito-black/60">{w.subZone ?? w.zone}</td>
                <td className="px-3 py-2 font-bold text-vinito-red">
                  {w.price ? `$${w.price.toLocaleString("es-AR")}` : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <StockEditor wineId={w.id} initial={w.stock} />
                    <SellButton wineId={w.id} initialStock={w.stock} wineName={w.name} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <StockToggle wineId={w.id} initial={w.available} />
                </td>
                {isAdmin1 && (
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(w)}
                        className="text-[10px] px-2 py-1 border border-vinito-black/20 rounded hover:bg-vinito-black/5"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(w)}
                        className="text-[10px] px-2 py-1 border border-vinito-red/40 text-vinito-red rounded hover:bg-vinito-red/10"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <WineForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}

function Th({
  children,
  sortKey,
  active,
  dir,
  onClick,
}: {
  children: React.ReactNode;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const arrow = active === sortKey ? (dir === "asc" ? " ▲" : " ▼") : "";
  return (
    <th
      onClick={() => onClick(sortKey)}
      className="px-3 py-2 text-[10px] uppercase tracking-wide text-vinito-black/50 cursor-pointer hover:text-vinito-red select-none"
    >
      {children}
      {arrow}
    </th>
  );
}
