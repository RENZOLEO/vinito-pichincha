"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Editor inline de stock numérico.
 * Disponible para ADMIN1 y ADMIN2 (ambos pueden ajustar stock manualmente).
 * Cuando stock llega a 0, el API auto-deshabilita el vino.
 */
export function StockEditor({ wineId, initial }: { wineId: number; initial: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(next: number) {
    if (next < 0 || isNaN(next)) {
      setError("número inválido");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/wines", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: wineId, stock: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error" }));
      setError(err.error ?? "Error");
      setValue(String(initial));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => {
          const n = Math.max(0, parseInt(value || "0") - 1);
          setValue(String(n));
          save(n);
        }}
        disabled={saving || parseInt(value || "0") <= 0}
        className="w-6 h-6 rounded border border-vinito-black/20 hover:bg-vinito-black/5 disabled:opacity-30 text-sm leading-none"
        title="Restar 1 (sin registrar venta)"
      >
        −
      </button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const n = parseInt(value || "0");
          if (n !== initial) save(n);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        disabled={saving}
        className="w-12 text-center border border-vinito-black/20 rounded py-0.5 text-sm"
        title={error || "Editá y Enter/Tab para guardar"}
      />
      <button
        onClick={() => {
          const n = parseInt(value || "0") + 1;
          setValue(String(n));
          save(n);
        }}
        disabled={saving}
        className="w-6 h-6 rounded border border-vinito-black/20 hover:bg-vinito-black/5 disabled:opacity-30 text-sm leading-none"
        title="Sumar 1"
      >
        +
      </button>
      {error && <span className="text-[10px] text-vinito-red ml-1">{error}</span>}
    </div>
  );
}
