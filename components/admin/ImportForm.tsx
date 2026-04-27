"use client";

import { useState, useRef } from "react";

type SectionResult = {
  added: number;
  updated: number;
  deleted: number;
  errors: { row: number; message: string }[];
};

type FullResult = {
  wines: SectionResult;
  drinks: SectionResult;
  dishes: SectionResult;
};

type DriveResponse = {
  ok: boolean;
  source?: string;
  result?: FullResult;
  error?: string;
};

function ResultBlock({ title, r }: { title: string; r: SectionResult }) {
  return (
    <div className="border border-vinito-black/10 rounded-md p-3">
      <p className="font-bold text-xs uppercase tracking-wide mb-1">{title}</p>
      <p className="text-xs">✅ Agregados: {r.added}</p>
      <p className="text-xs">🔄 Actualizados: {r.updated}</p>
      {r.deleted > 0 ? <p className="text-xs">🗑️ Eliminados: {r.deleted}</p> : null}
      {r.errors.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-vinito-red font-bold cursor-pointer">
            ❌ {r.errors.length} errores
          </summary>
          <ul className="mt-1 text-[11px] text-vinito-red space-y-0.5">
            {r.errors.slice(0, 20).map((e, i) => (
              <li key={i}>Fila {e.row}: {e.message}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"upsert" | "replace" | "sync">("sync");
  const [result, setResult] = useState<FullResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveSource, setDriveSource] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setDriveError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    const res = await fetch("/api/admin/import", { method: "POST", body: formData });
    const data: FullResult = await res.json();
    setResult(data);
    setLoading(false);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDriveSync() {
    setDriveLoading(true);
    setResult(null);
    setDriveError(null);
    setDriveSource(null);

    const res = await fetch("/api/admin/sync-drive", { method: "POST" });
    const data: DriveResponse = await res.json();
    if (!data.ok) {
      setDriveError(data.error ?? "Error desconocido");
    } else {
      setResult(data.result ?? null);
      setDriveSource(data.source ?? null);
    }
    setDriveLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* SYNC DRIVE */}
      <div className="bg-white p-6 rounded-lg border border-vinito-black/10">
        <h2 className="font-bold text-sm uppercase tracking-wide mb-2">Sincronizar desde Google Drive</h2>
        <p className="text-sm text-vinito-black/60 mb-4">
          Trae el Excel del Google Sheet configurado en <code className="bg-vinito-cream px-1 rounded text-xs">DRIVE_SHEET_URL</code> y
          actualiza vinos, tragos y platos. Lo que no esté en el Sheet se elimina.
          <br />
          <span className="text-xs text-vinito-black/50">
            Requisito: el Sheet debe estar compartido como &ldquo;Cualquiera con el link puede ver&rdquo;.
          </span>
        </p>

        <button
          onClick={handleDriveSync}
          disabled={driveLoading}
          className="bg-vinito-black text-vinito-cream px-6 py-2 rounded-full text-sm font-bold tracking-wide disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {driveLoading ? "Sincronizando…" : "Sincronizar ahora"}
        </button>

        {driveSource && (
          <p className="text-xs text-vinito-black/50 mt-3">Fuente: {driveSource}</p>
        )}
        {driveError && (
          <p className="text-sm text-vinito-red mt-3 bg-vinito-red/10 p-3 rounded">{driveError}</p>
        )}
      </div>

      {/* UPLOAD MANUAL */}
      <div className="bg-white p-6 rounded-lg border border-vinito-black/10">
        <h2 className="font-bold text-sm uppercase tracking-wide mb-4">Subir Excel manualmente</h2>
        <p className="text-sm text-vinito-black/60 mb-4">
          Subí un archivo .xlsx con las hojas <strong>Vinos</strong>, <strong>Tragos</strong> y <strong>Platos</strong>.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm mb-4"
        />

        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={mode === "sync"} onChange={() => setMode("sync")} />
            Sincronizar (recomendado)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={mode === "upsert"} onChange={() => setMode("upsert")} />
            Solo agregar / actualizar
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />
            Reemplazar todo
          </label>
        </div>

        <button
          onClick={handleFileImport}
          disabled={!file || loading}
          className="bg-vinito-red text-vinito-cream px-6 py-2 rounded-full text-sm font-bold tracking-wide disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? "Importando…" : "Importar"}
        </button>
      </div>

      {/* RESULTADO */}
      {result && (
        <div className="bg-vinito-cream p-4 rounded-lg space-y-2">
          <p className="font-bold mb-2">Resultado</p>
          <div className="grid md:grid-cols-3 gap-3">
            <ResultBlock title="Vinos" r={result.wines} />
            <ResultBlock title="Tragos" r={result.drinks} />
            <ResultBlock title="Platos" r={result.dishes} />
          </div>
        </div>
      )}
    </div>
  );
}
