"use client";

import { useRef, useEffect } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleInput(raw: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(raw), 300);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="px-4 pb-2">
      <div className="flex items-center gap-2 bg-white border border-vinito-black rounded-full px-4 py-2.5">
        <span className="text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscá un vino, bodega…"
          defaultValue={value}
          onChange={(e) => handleInput(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
        {value && (
          <button
            onClick={() => { if (inputRef.current) inputRef.current.value = ""; onChange(""); }}
            className="text-gray-400 text-xs"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
