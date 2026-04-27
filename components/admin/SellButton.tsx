"use client";

import { useState } from "react";

type Props = {
  wineId: number;
  initialStock: number;
  wineName: string;
};

export function SellButton({ wineId, initialStock, wineName }: Props) {
  const [stock, setStock] = useState(initialStock);
  const [selling, setSelling] = useState(false);

  async function handleSell() {
    if (stock <= 0) return;
    setSelling(true);

    const res = await fetch("/api/admin/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wineId, quantity: 1 }),
    });

    if (res.ok) {
      const data = await res.json();
      setStock(data.newStock);
    } else {
      const err = await res.json();
      alert(err.error ?? "Error al registrar venta");
    }
    setSelling(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-sm ${stock === 0 ? "text-vinito-red" : ""}`}>{stock}</span>
      <button
        onClick={handleSell}
        disabled={selling || stock === 0}
        className="text-[9px] bg-vinito-red text-vinito-cream px-2 py-1 rounded-full font-bold uppercase tracking-wide disabled:opacity-30 hover:opacity-80 transition-opacity"
        title={`Vender 1 unidad de ${wineName}`}
      >
        −1
      </button>
    </div>
  );
}
