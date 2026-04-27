"use client";

const CATEGORIES_WITH_VARIETAL = ["TINTO", "BLANCO"];

type Props = {
  category: string;
  availableZones: string[];
  availableVarietals: string[];
  activeZone: string | null;
  activeVarietal: string | null;
  onZoneChange: (zone: string | null) => void;
  onVarietalChange: (varietal: string | null) => void;
  totalResults: number;
};

export function FilterBar({
  category,
  availableZones,
  availableVarietals,
  activeZone,
  activeVarietal,
  onZoneChange,
  onVarietalChange,
  totalResults,
}: Props) {
  const showVarietal = CATEGORIES_WITH_VARIETAL.includes(category);

  return (
    <div className="px-4 pb-1">
      {/* Zone row */}
      {availableZones.length > 0 && (
        <div className="flex items-center gap-1 mb-1.5 overflow-x-auto scrollbar-hide">
          <span className="text-[9px] tracking-[1.5px] uppercase text-vinito-black/50 font-bold min-w-[32px] shrink-0">
            Zona
          </span>
          {availableZones.map((zone) => (
            <button
              key={zone}
              onClick={() => onZoneChange(activeZone === zone ? null : zone)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap shrink-0 transition-colors ${
                activeZone === zone
                  ? "bg-vinito-blue text-vinito-cream"
                  : "bg-transparent text-vinito-blue border border-vinito-blue"
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      )}

      {/* Varietal row */}
      {showVarietal && availableVarietals.length > 0 && (
        <div className="flex items-center gap-1 mb-1.5 overflow-x-auto scrollbar-hide">
          <span className="text-[9px] tracking-[1.5px] uppercase text-vinito-black/50 font-bold min-w-[32px] shrink-0">
            Cepa
          </span>
          {availableVarietals.map((v) => (
            <button
              key={v}
              onClick={() => onVarietalChange(activeVarietal === v ? null : v)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap shrink-0 transition-colors ${
                activeVarietal === v
                  ? "bg-vinito-red text-vinito-cream"
                  : "bg-transparent text-vinito-red border border-vinito-red"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-vinito-black/60 pb-2">
        {totalResults} vinos encontrados
      </p>
    </div>
  );
}
