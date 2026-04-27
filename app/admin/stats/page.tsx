"use client";

/**
 * Dashboard de estadísticas (OWNER).
 * La protección server-side se hace en /api/admin/stats (403 si no OWNER).
 * El layout /admin oculta el link a STAFF.
 */
import { useState, useEffect, useMemo } from "react";

type RotationRow = {
  wineId: number;
  name: string;
  winery: string;
  category: string;
  varietal: string | null;
  zone: string;
  currentStock: number;
  sold: number;
  rotationRate: number;
  available: boolean;
  price: number | null;
  cost: number | null;
  stockValueAtPrice: number;
  stockValueAtCost: number;
};

type ValuationBucket = {
  key: string;
  units: number;
  priceValue: number;
  costValue: number;
  wineCount: number;
};

type Valuation = {
  total: { units: number; priceValue: number; costValue: number; wineCount: number };
  margin: number;
  marginPct: number;
  winesWithoutCost: number;
  byCategory: ValuationBucket[];
  byZone: ValuationBucket[];
  byWinery: ValuationBucket[];
};

type Snapshot = {
  id: number;
  takenAt: string;
  totalUnits: number;
  totalCostValue: number;
  totalPriceValue: number;
  wineCount: number;
};

type Stats = {
  period: { from: string; to: string; fromDate: string; toDate: string };
  filters: { category: string | null; lowStockThreshold: number; highStockThreshold: number };
  totals: { sales: number; revenue: number; uniqueWinesSold: number; wineCount: number };
  topSelling: {
    wineId: number;
    qty: number;
    revenue: number;
    wine: { name: string; winery: string; category: string } | null;
  }[];
  leastSelling: {
    wineId: number;
    qty: number;
    revenue: number;
    wine: { name: string; winery: string; category: string } | null;
  }[];
  salesByDay: Record<string, { count: number; revenue: number }>;
  salesByCategory: { category: string; total_qty: number; total_revenue: number }[];
  rotation: RotationRow[];
  lowStock: RotationRow[];
  highStock: RotationRow[];
  valuation: Valuation;
};

const CATEGORIES = ["TINTO", "BLANCO", "ROSADO", "NARANJO", "ESPUMANTE"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function StatsPage() {
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [category, setCategory] = useState("");
  const [lowStock, setLowStock] = useState(3);
  const [highStock, setHighStock] = useState(20);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Vista tabla rotación
  const [rotSort, setRotSort] = useState<keyof RotationRow>("sold");
  const [rotDir, setRotDir] = useState<"asc" | "desc">("desc");
  const [rotSearch, setRotSearch] = useState("");

  // Snapshots históricos
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapTaking, setSnapTaking] = useState(false);

  function loadSnapshots() {
    fetch(`/api/admin/valuation-snapshots?limit=90`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Snapshot[]) => setSnapshots(rows));
  }

  useEffect(() => {
    loadSnapshots();
  }, []);

  async function takeSnapshot() {
    setSnapTaking(true);
    const res = await fetch(`/api/admin/valuation-snapshots`, { method: "POST" });
    setSnapTaking(false);
    if (res.ok) loadSnapshots();
    else alert("Error al tomar snapshot");
  }

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      from,
      to,
      lowStock: String(lowStock),
      highStock: String(highStock),
    });
    if (category) params.set("category", category);

    fetch(`/api/admin/stats?${params}`)
      .then(async (r) => {
        if (r.status === 403) throw new Error("Solo el dueño puede ver estadísticas");
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data: Stats) => {
        setStats(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [from, to, category, lowStock, highStock]);

  function setQuickRange(days: number) {
    setFrom(daysAgoISO(days));
    setTo(todayISO());
  }

  const sortedRotation = useMemo(() => {
    if (!stats) return [];
    let rows = stats.rotation;
    if (rotSearch) {
      const q = rotSearch.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.winery.toLowerCase().includes(q) ||
          (r.varietal && r.varietal.toLowerCase().includes(q))
      );
    }
    return [...rows].sort((a, b) => {
      const va = a[rotSort];
      const vb = b[rotSort];
      if (typeof va === "number" && typeof vb === "number") {
        return rotDir === "asc" ? va - vb : vb - va;
      }
      const sa = String(va ?? "").toLowerCase();
      const sb = String(vb ?? "").toLowerCase();
      return rotDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [stats, rotSort, rotDir, rotSearch]);

  function toggleRotSort(k: keyof RotationRow) {
    if (rotSort === k) setRotDir(rotDir === "asc" ? "desc" : "asc");
    else {
      setRotSort(k);
      setRotDir("desc");
    }
  }

  function exportRotationCsv() {
    if (!stats) return;
    const headers = [
      "id",
      "nombre",
      "bodega",
      "categoria",
      "cepa",
      "zona",
      "stock_actual",
      "vendidas_periodo",
      "rotacion_pct",
      "disponible",
      "precio",
    ];
    const rows = sortedRotation.map((r) =>
      [
        r.wineId,
        r.name,
        r.winery,
        r.category,
        r.varietal ?? "",
        r.zone,
        r.currentStock,
        r.sold,
        r.rotationRate,
        r.available ? "si" : "no",
        r.price ?? "",
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
    a.download = `rotacion-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-vinito-red font-bold text-lg">{error}</p>
        <p className="text-sm text-vinito-black/50 mt-2">
          Iniciá sesión con una cuenta de dueño para acceder
        </p>
      </div>
    );
  }

  const sortedDays = stats
    ? Object.entries(stats.salesByDay).sort(([a], [b]) => a.localeCompare(b))
    : [];
  const maxDayCount = sortedDays.length
    ? Math.max(...sortedDays.map(([, v]) => v.count), 1)
    : 1;

  return (
    <div>
      <h1 className="font-display text-3xl text-vinito-red mb-4">Estadísticas</h1>

      {/* Controles personalizables */}
      <div className="bg-white rounded-lg border border-vinito-black/10 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-vinito-black/50 block mb-1">
              Desde
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-vinito-black/20 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-vinito-black/50 block mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-vinito-black/20 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex gap-1">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setQuickRange(d)}
                className="text-[10px] px-2 py-1 border border-vinito-black/20 rounded hover:bg-vinito-black/5"
              >
                {d}d
              </button>
            ))}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-vinito-black/50 block mb-1">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-vinito-black/20 rounded px-2 py-1 text-sm"
            >
              <option value="">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-vinito-black/50 block mb-1">
              Stock bajo ≤
            </label>
            <input
              type="number"
              min="0"
              value={lowStock}
              onChange={(e) => setLowStock(parseInt(e.target.value) || 0)}
              className="border border-vinito-black/20 rounded px-2 py-1 text-sm w-20"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-vinito-black/50 block mb-1">
              Stock alto ≥
            </label>
            <input
              type="number"
              min="0"
              value={highStock}
              onChange={(e) => setHighStock(parseInt(e.target.value) || 0)}
              className="border border-vinito-black/20 rounded px-2 py-1 text-sm w-20"
            />
          </div>
        </div>
      </div>

      {loading && !stats ? (
        <p className="text-center py-12 text-vinito-black/50">Cargando estadísticas...</p>
      ) : !stats ? null : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Kpi label="Botellas vendidas" value={stats.totals.sales} />
            <Kpi
              label="Facturación"
              value={`$${stats.totals.revenue.toLocaleString("es-AR")}`}
              color="green"
            />
            <Kpi
              label="Vinos distintos vendidos"
              value={`${stats.totals.uniqueWinesSold} / ${stats.totals.wineCount}`}
            />
            <Kpi label="Stock bajo" value={stats.lowStock.length} color="red" />
          </div>

          {/* Sales by category */}
          {stats.salesByCategory.length > 0 && (
            <div className="bg-white p-5 rounded-lg border border-vinito-black/10 mb-6">
              <h2 className="font-bold text-sm uppercase tracking-wide mb-3">
                Ventas por categoría
              </h2>
              <div className="space-y-2">
                {stats.salesByCategory.map((c) => (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wide w-24 text-vinito-black/50">
                      {c.category}
                    </span>
                    <div className="flex-1 bg-vinito-cream rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-vinito-red h-full rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max((c.total_qty / Math.max(stats.totals.sales, 1)) * 100, 8)}%`,
                        }}
                      >
                        <span className="text-[10px] font-bold text-vinito-cream">
                          {c.total_qty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top & Least */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg border border-vinito-black/10">
              <h2 className="font-bold text-sm uppercase tracking-wide mb-3 text-green-600">
                🏆 Más vendidos
              </h2>
              {stats.topSelling.length === 0 ? (
                <p className="text-sm text-vinito-black/40">Sin ventas en el período</p>
              ) : (
                <div className="space-y-2">
                  {stats.topSelling.map((s, i) => (
                    <div key={s.wineId} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-vinito-black/30 w-5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.wine?.name}</p>
                        <p className="text-[10px] text-vinito-black/50">{s.wine?.winery}</p>
                      </div>
                      <span className="text-sm font-bold text-vinito-red">{s.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-lg border border-vinito-black/10">
              <h2 className="font-bold text-sm uppercase tracking-wide mb-3 text-vinito-red">
                📉 Menos vendidos <span className="text-vinito-black/40">(con al menos 1 venta)</span>
              </h2>
              {stats.leastSelling.length === 0 ? (
                <p className="text-sm text-vinito-black/40">Sin ventas en el período</p>
              ) : (
                <div className="space-y-2">
                  {stats.leastSelling.map((s, i) => (
                    <div key={s.wineId} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-vinito-black/30 w-5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.wine?.name}</p>
                        <p className="text-[10px] text-vinito-black/50">{s.wine?.winery}</p>
                      </div>
                      <span className="text-sm font-bold text-vinito-black/40">{s.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sales by day chart */}
          {sortedDays.length > 0 && (
            <div className="bg-white p-5 rounded-lg border border-vinito-black/10 mb-6">
              <h2 className="font-bold text-sm uppercase tracking-wide mb-3">
                Ventas por día
              </h2>
              <div className="flex items-end gap-px h-40">
                {sortedDays.map(([day, data]) => (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center justify-end group relative"
                  >
                    <div
                      className="w-full bg-vinito-red rounded-t min-h-[2px] transition-all hover:bg-vinito-black"
                      style={{ height: `${(data.count / maxDayCount) * 100}%` }}
                    />
                    <div className="absolute bottom-full mb-1 bg-vinito-black text-vinito-cream text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                      {day.slice(5)}: {data.count} u · ${data.revenue.toLocaleString("es-AR")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-vinito-black/40">
                  {sortedDays[0]?.[0]?.slice(5)}
                </span>
                <span className="text-[9px] text-vinito-black/40">
                  {sortedDays[sortedDays.length - 1]?.[0]?.slice(5)}
                </span>
              </div>
            </div>
          )}

          {/* Stock crítico */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StockList
              title={`⚠ Stock bajo (≤ ${stats.filters.lowStockThreshold})`}
              rows={stats.lowStock}
              color="red"
              emptyLabel="Nada en stock bajo"
            />
            <StockList
              title={`📦 Stock alto (≥ ${stats.filters.highStockThreshold})`}
              rows={stats.highStock}
              color="gray"
              emptyLabel="Nada en stock alto"
            />
          </div>

          {/* Valorización de mercadería */}
          <ValuationPanel v={stats.valuation} />

          {/* Histórico de valorización */}
          <SnapshotsPanel
            snapshots={snapshots}
            onTake={takeSnapshot}
            taking={snapTaking}
          />

          {/* Tabla de rotación */}
          <div className="bg-white rounded-lg border border-vinito-black/10 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-vinito-black/10">
              <h2 className="font-bold text-sm uppercase tracking-wide">
                Rotación de stock
                <span className="text-[10px] font-normal text-vinito-black/40 ml-2">
                  (vendidas ÷ stock-inicial · período actual)
                </span>
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar…"
                  value={rotSearch}
                  onChange={(e) => setRotSearch(e.target.value)}
                  className="border border-vinito-black/20 rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={exportRotationCsv}
                  className="text-xs px-3 py-1 border border-vinito-black/20 rounded hover:bg-vinito-black/5"
                >
                  ⬇ CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-vinito-black/10 text-left">
                    <RotTh onClick={() => toggleRotSort("name")} active={rotSort === "name"} dir={rotDir}>
                      Vino
                    </RotTh>
                    <RotTh onClick={() => toggleRotSort("winery")} active={rotSort === "winery"} dir={rotDir}>
                      Bodega
                    </RotTh>
                    <RotTh onClick={() => toggleRotSort("category")} active={rotSort === "category"} dir={rotDir}>
                      Cat.
                    </RotTh>
                    <RotTh onClick={() => toggleRotSort("currentStock")} active={rotSort === "currentStock"} dir={rotDir}>
                      Stock
                    </RotTh>
                    <RotTh onClick={() => toggleRotSort("sold")} active={rotSort === "sold"} dir={rotDir}>
                      Vendidas
                    </RotTh>
                    <RotTh onClick={() => toggleRotSort("rotationRate")} active={rotSort === "rotationRate"} dir={rotDir}>
                      Rotación %
                    </RotTh>
                  </tr>
                </thead>
                <tbody>
                  {sortedRotation.slice(0, 100).map((r) => (
                    <tr key={r.wineId} className="border-b border-vinito-black/5 hover:bg-vinito-cream/50">
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-vinito-black/60">{r.winery}</td>
                      <td className="px-3 py-2 text-[10px] uppercase">{r.category}</td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            r.currentStock <= stats.filters.lowStockThreshold
                              ? "text-vinito-red font-bold"
                              : r.currentStock >= stats.filters.highStockThreshold
                                ? "text-vinito-black/40"
                                : ""
                          }
                        >
                          {r.currentStock}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold">{r.sold}</td>
                      <td className="px-3 py-2">
                        <RotBar pct={r.rotationRate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedRotation.length > 100 && (
                <p className="p-3 text-xs text-vinito-black/50 text-center">
                  Mostrando 100 de {sortedRotation.length}. Refiná con búsqueda o exportá el CSV.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ------- helpers UI -------

function Kpi({
  label,
  value,
  color = "black",
}: {
  label: string;
  value: string | number;
  color?: "black" | "green" | "red";
}) {
  const colorCls =
    color === "green"
      ? "text-green-600"
      : color === "red"
        ? "text-vinito-red"
        : "text-vinito-black";
  return (
    <div className="bg-white p-4 rounded-lg border border-vinito-black/10 text-center">
      <p className={`text-3xl font-bold ${colorCls}`}>{value}</p>
      <p className="text-xs uppercase tracking-wide text-vinito-black/50 mt-1">{label}</p>
    </div>
  );
}

function StockList({
  title,
  rows,
  emptyLabel,
  color,
}: {
  title: string;
  rows: RotationRow[];
  emptyLabel: string;
  color: "red" | "gray";
}) {
  const titleCls = color === "red" ? "text-vinito-red" : "text-vinito-black/60";
  return (
    <div className="bg-white p-5 rounded-lg border border-vinito-black/10">
      <h2 className={`font-bold text-sm uppercase tracking-wide mb-3 ${titleCls}`}>{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-vinito-black/40">{emptyLabel}</p>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {rows.slice(0, 30).map((r) => (
            <div key={r.wineId} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{r.name}</p>
                <p className="text-[10px] text-vinito-black/50">
                  {r.winery} · {r.category}
                </p>
              </div>
              <span className={`text-sm font-bold ${color === "red" ? "text-vinito-red" : ""}`}>
                {r.currentStock}
              </span>
            </div>
          ))}
          {rows.length > 30 && (
            <p className="text-[10px] text-vinito-black/40 text-center pt-1">
              +{rows.length - 30} más…
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RotTh({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
}) {
  return (
    <th
      onClick={onClick}
      className="px-3 py-2 text-[10px] uppercase tracking-wide text-vinito-black/50 cursor-pointer hover:text-vinito-red select-none"
    >
      {children}
      {active ? (dir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );
}

function RotBar({ pct }: { pct: number }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-vinito-cream rounded-full h-2 overflow-hidden min-w-[60px]">
        <div
          className="bg-vinito-red h-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-mono w-12 text-right">{clamped.toFixed(1)}%</span>
    </div>
  );
}

// ---------- Valorización ----------

function ValuationPanel({ v }: { v: Valuation }) {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
  return (
    <div className="bg-white rounded-lg border border-vinito-black/10 p-5 mb-6">
      <h2 className="font-bold text-sm uppercase tracking-wide mb-4">
        💰 Valorización de mercadería
      </h2>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="Unidades en stock" value={v.total.units} />
        <Kpi label="Valor a precio venta" value={fmt(v.total.priceValue)} color="green" />
        <Kpi label="Valor al costo" value={fmt(v.total.costValue)} />
        <Kpi
          label={`Margen proyectado ${v.marginPct > 0 ? `(${v.marginPct}%)` : ""}`}
          value={fmt(v.margin)}
          color={v.margin > 0 ? "green" : "red"}
        />
      </div>

      {v.winesWithoutCost > 0 && (
        <p className="text-xs text-vinito-red/80 bg-vinito-red/5 rounded p-2 mb-4">
          ⚠ Hay {v.winesWithoutCost} vino(s) con stock pero sin costo cargado. El margen
          está subestimado. Completá el campo &quot;Costo&quot; al editar los vinos.
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 text-xs">
        <ValuationBreakdown title="Por categoría" rows={v.byCategory} />
        <ValuationBreakdown title="Por zona" rows={v.byZone} />
        <ValuationBreakdown title="Por bodega (top 15)" rows={v.byWinery.slice(0, 15)} />
      </div>
    </div>
  );
}

function ValuationBreakdown({ title, rows }: { title: string; rows: ValuationBucket[] }) {
  const maxPV = Math.max(1, ...rows.map((r) => r.priceValue));
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
  return (
    <div>
      <h3 className="font-bold uppercase tracking-wide text-vinito-black/60 mb-2 text-[10px]">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-vinito-black/40">Sin datos</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => (
            <div key={r.key}>
              <div className="flex justify-between gap-2">
                <span className="truncate" title={r.key}>
                  {r.key}
                </span>
                <span className="font-bold">{fmt(r.priceValue)}</span>
              </div>
              <div className="bg-vinito-cream rounded-full h-1 overflow-hidden">
                <div
                  className="bg-vinito-red h-full"
                  style={{ width: `${(r.priceValue / maxPV) * 100}%` }}
                />
              </div>
              <div className="text-[9px] text-vinito-black/40">
                {r.units} u · {r.wineCount} etiquetas · costo {fmt(r.costValue)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Snapshots históricos ----------

function SnapshotsPanel({
  snapshots,
  onTake,
  taking,
}: {
  snapshots: Snapshot[];
  onTake: () => void;
  taking: boolean;
}) {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

  // Orden cronológico para el gráfico
  const series = [...snapshots].reverse();
  const maxVal = Math.max(1, ...series.map((s) => s.totalPriceValue));

  function exportCsv() {
    if (snapshots.length === 0) return;
    const headers = [
      "takenAt",
      "totalUnits",
      "totalCostValue",
      "totalPriceValue",
      "wineCount",
    ];
    const rows = snapshots.map((s) =>
      [s.takenAt, s.totalUnits, s.totalCostValue, s.totalPriceValue, s.wineCount].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `valorizacion-historico-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-lg border border-vinito-black/10 p-5 mb-6">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="font-bold text-sm uppercase tracking-wide">
          📈 Histórico de valorización
          <span className="text-[10px] font-normal text-vinito-black/40 ml-2">
            ({snapshots.length} snapshot{snapshots.length === 1 ? "" : "s"})
          </span>
        </h2>
        <div className="flex gap-2">
          {snapshots.length > 0 && (
            <button
              onClick={exportCsv}
              className="text-xs px-3 py-1 border border-vinito-black/20 rounded hover:bg-vinito-black/5"
            >
              ⬇ CSV
            </button>
          )}
          <button
            onClick={onTake}
            disabled={taking}
            className="text-xs px-3 py-1 bg-vinito-red text-vinito-cream rounded font-bold uppercase tracking-wide disabled:opacity-50"
          >
            {taking ? "Tomando…" : "📸 Tomar snapshot ahora"}
          </button>
        </div>
      </div>

      {series.length === 0 ? (
        <p className="text-sm text-vinito-black/40">
          Aún no hay snapshots. Tomá uno para empezar a acumular histórico de valor de
          stock. Recomendado: 1 por día o por semana.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-px h-32 mb-2">
            {series.map((s) => (
              <div
                key={s.id}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                <div
                  className="w-full bg-vinito-red rounded-t min-h-[2px] transition-all hover:bg-vinito-black"
                  style={{ height: `${(s.totalPriceValue / maxVal) * 100}%` }}
                />
                <div className="absolute bottom-full mb-1 bg-vinito-black text-vinito-cream text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                  {s.takenAt.slice(0, 10)} · {fmt(s.totalPriceValue)} · {s.totalUnits}u
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[9px] text-vinito-black/40 mb-3">
            <span>{series[0]?.takenAt.slice(0, 10)}</span>
            <span>{series[series.length - 1]?.takenAt.slice(0, 10)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-vinito-black/10">
                  <th className="px-2 py-1 text-[10px] uppercase text-vinito-black/50">Fecha</th>
                  <th className="px-2 py-1 text-[10px] uppercase text-vinito-black/50">Unidades</th>
                  <th className="px-2 py-1 text-[10px] uppercase text-vinito-black/50">Etiquetas</th>
                  <th className="px-2 py-1 text-[10px] uppercase text-vinito-black/50">A costo</th>
                  <th className="px-2 py-1 text-[10px] uppercase text-vinito-black/50">A precio</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b border-vinito-black/5">
                    <td className="px-2 py-1">{s.takenAt.slice(0, 10)}</td>
                    <td className="px-2 py-1">{s.totalUnits}</td>
                    <td className="px-2 py-1">{s.wineCount}</td>
                    <td className="px-2 py-1">{fmt(s.totalCostValue)}</td>
                    <td className="px-2 py-1 font-bold text-vinito-red">
                      {fmt(s.totalPriceValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {snapshots.length > 10 && (
              <p className="text-[10px] text-vinito-black/40 mt-1">
                Mostrando 10 de {snapshots.length}. Exportá CSV para el listado completo.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
