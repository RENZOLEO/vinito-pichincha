"use client";

export type Section = "VINOS" | "TRAGOS" | "PLATOS";

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "VINOS", label: "Vinos", icon: "🍷" },
  { key: "TRAGOS", label: "Bebidas", icon: "🍸" },
  { key: "PLATOS", label: "Menú", icon: "🍽️" },
];

type Props = {
  active: Section;
  onChange: (s: Section) => void;
};

export function SectionTabs({ active, onChange }: Props) {
  return (
    <div className="px-4 pt-4 pb-3 sticky top-0 z-20 bg-vinito-cream">
      <div className="grid grid-cols-3 gap-2">
        {SECTIONS.map(({ key, label, icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-colors ${
                isActive
                  ? "bg-vinito-red text-vinito-cream border-vinito-red shadow-sm"
                  : "bg-white text-vinito-black border-vinito-black/20 hover:border-vinito-black"
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-[2px]">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
