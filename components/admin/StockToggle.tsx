"use client";

import { useState } from "react";

type Props = { wineId: number; initial: boolean };

export function StockToggle({ wineId, initial }: Props) {
  const [available, setAvailable] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const res = await fetch("/api/admin/wines", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: wineId, available: !available }),
    });
    if (res.ok) setAvailable(!available);
    setSaving(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`w-10 h-5 rounded-full relative transition-colors ${
        available ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          available ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}
