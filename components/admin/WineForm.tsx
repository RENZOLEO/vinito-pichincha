"use client";

import { useState, useEffect } from "react";

export type WineFormValues = {
  id?: number;
  name: string;
  winery: string;
  category: "TINTO" | "BLANCO" | "ROSADO" | "NARANJO" | "ESPUMANTE";
  varietal: string;
  zone: string;
  subZone: string;
  vintage: string; // input type=number → string para permitir vacío
  alcohol: string;
  aging: string;
  servingTemp: string;
  pairing: string;
  tastingNote: string;
  price: string;
  cost: string;
  stock: string;
  fichaUrl: string;
  available: boolean;
};

const EMPTY: WineFormValues = {
  name: "",
  winery: "",
  category: "TINTO",
  varietal: "",
  zone: "",
  subZone: "",
  vintage: "",
  alcohol: "",
  aging: "",
  servingTemp: "",
  pairing: "",
  tastingNote: "",
  price: "",
  cost: "",
  stock: "1",
  fichaUrl: "",
  available: true,
};

const CATEGORIES: WineFormValues["category"][] = [
  "TINTO",
  "BLANCO",
  "ROSADO",
  "NARANJO",
  "ESPUMANTE",
];

type Props = {
  open: boolean;
  initial?: Partial<WineFormValues> | null;
  onClose: () => void;
  onSaved: () => void;
};

export function WineForm({ open, initial, onClose, onSaved }: Props) {
  const [values, setValues] = useState<WineFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = typeof initial?.id === "number";

  useEffect(() => {
    if (open) {
      setError("");
      setValues({ ...EMPTY, ...(initial ?? {}) } as WineFormValues);
    }
  }, [open, initial]);

  if (!open) return null;

  function set<K extends keyof WineFormValues>(key: K, val: WineFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validación mínima en cliente
    if (!values.name.trim()) return setError("Nombre es obligatorio");
    if (!values.winery.trim()) return setError("Bodega es obligatoria");
    if (!values.zone.trim()) return setError("Zona es obligatoria");

    const payload = {
      ...(isEdit ? { id: values.id } : {}),
      name: values.name.trim(),
      winery: values.winery.trim(),
      category: values.category,
      varietal: values.varietal.trim() || null,
      zone: values.zone.trim(),
      subZone: values.subZone.trim() || null,
      vintage: values.vintage ? parseInt(values.vintage) : null,
      alcohol: values.alcohol ? parseFloat(values.alcohol) : null,
      aging: values.aging.trim() || null,
      servingTemp: values.servingTemp.trim() || null,
      pairing: values.pairing.trim() || null,
      tastingNote: values.tastingNote.trim() || null,
      price: values.price ? parseInt(values.price) : null,
      cost: values.cost ? parseInt(values.cost) : null,
      stock: values.stock ? parseInt(values.stock) : 0,
      fichaUrl: values.fichaUrl.trim() || null,
      available: values.available,
    };

    setSaving(true);
    const res = await fetch("/api/admin/wines", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error" }));
      setError(err.error ?? "Error al guardar");
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-vinito-red">
            {isEdit ? "Editar vino" : "Nuevo vino"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-vinito-black/40 hover:text-vinito-black text-xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-vinito-red/10 text-vinito-red text-xs p-2 rounded mb-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Nombre *" className="col-span-2">
            <input
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              required
            />
          </Field>

          <Field label="Bodega *">
            <input
              value={values.winery}
              onChange={(e) => set("winery", e.target.value)}
              className={inputCls}
              required
            />
          </Field>

          <Field label="Categoría *">
            <select
              value={values.category}
              onChange={(e) =>
                set("category", e.target.value as WineFormValues["category"])
              }
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Cepa">
            <input
              value={values.varietal}
              onChange={(e) => set("varietal", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Zona *">
            <input
              value={values.zone}
              onChange={(e) => set("zone", e.target.value)}
              className={inputCls}
              required
            />
          </Field>

          <Field label="Subzona">
            <input
              value={values.subZone}
              onChange={(e) => set("subZone", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Añada">
            <input
              type="number"
              value={values.vintage}
              onChange={(e) => set("vintage", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Alcohol %">
            <input
              type="number"
              step="0.1"
              value={values.alcohol}
              onChange={(e) => set("alcohol", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Precio venta $">
            <input
              type="number"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Costo $ (para valorización)">
            <input
              type="number"
              value={values.cost}
              onChange={(e) => set("cost", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Stock (unidades)">
            <input
              type="number"
              min="0"
              value={values.stock}
              onChange={(e) => set("stock", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="URL ficha técnica" className="col-span-2">
            <input
              type="url"
              value={values.fichaUrl}
              onChange={(e) => set("fichaUrl", e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
          </Field>

          <Field label="Crianza">
            <input
              value={values.aging}
              onChange={(e) => set("aging", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Temp. servicio">
            <input
              value={values.servingTemp}
              onChange={(e) => set("servingTemp", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Maridaje" className="col-span-2">
            <textarea
              value={values.pairing}
              onChange={(e) => set("pairing", e.target.value)}
              className={inputCls}
              rows={2}
            />
          </Field>

          <Field label="Nota de cata" className="col-span-2">
            <textarea
              value={values.tastingNote}
              onChange={(e) => set("tastingNote", e.target.value)}
              className={inputCls}
              rows={3}
            />
          </Field>

          <label className="col-span-2 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={values.available}
              onChange={(e) => set("available", e.target.checked)}
            />
            Disponible en la carta
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-vinito-black/60 hover:text-vinito-black"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-vinito-red text-vinito-cream rounded font-bold uppercase tracking-wide disabled:opacity-50"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full border border-vinito-black/20 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-vinito-red";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-wide text-vinito-black/50 mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}
