"use client";

const CATEGORIES = [
  { key: "TODOS", label: "Todos" },
  { key: "TINTO", label: "Tintos" },
  { key: "BLANCO", label: "Blancos" },
  { key: "ROSADO", label: "Rosados" },
  { key: "NARANJO", label: "Naranjos" },
  { key: "ESPUMANTE", label: "Espumantes" },
];

type Props = {
  active: string;
  onChange: (category: string) => void;
};

export function CategoryChips({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
      {CATEGORIES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap border transition-colors ${
            active === key
              ? "bg-vinito-black text-vinito-cream border-vinito-black"
              : "bg-transparent text-vinito-black border-vinito-black"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
