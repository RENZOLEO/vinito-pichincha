import type { WineListItem } from "@/lib/types";

type Props = {
  wine: WineListItem;
  onViewFicha: (wine: WineListItem) => void;
};

export function WineCard({ wine, onViewFicha }: Props) {
  return (
    <div className="bg-vinito-cream border border-vinito-black rounded-md p-2 flex flex-col min-h-[120px]">
      {/* Varietal label */}
      {wine.varietal && (
        <span className="text-[9px] tracking-[1.5px] uppercase text-vinito-red font-bold">
          {wine.varietal}
        </span>
      )}

      {/* Wine name */}
      <h3 className="font-serif text-sm font-bold leading-tight mt-0.5 truncate">
        {wine.name}
      </h3>

      {/* Winery + vintage */}
      <p className="font-serif text-[10px] italic text-vinito-black/60 mt-0.5 truncate">
        {wine.winery}{wine.vintage ? ` · ${wine.vintage}` : ""}
      </p>

      {/* Zone tag */}
      <span className="inline-block self-start bg-vinito-blue text-vinito-cream text-[8px] px-1.5 py-px rounded-full mt-1.5 tracking-wide uppercase font-bold">
        {wine.subZone ?? wine.zone}
      </span>

      {/* Bottom row: ficha button + price */}
      <div className="flex items-center justify-between mt-1">
        {wine.fichaUrl ? (
          <button
            onClick={() => onViewFicha(wine)}
            className="text-[8px] tracking-[1px] uppercase font-extrabold text-vinito-red border border-vinito-red rounded-full px-2 py-0.5 hover:bg-vinito-red hover:text-vinito-cream transition-colors"
          >
            Ver ficha
          </button>
        ) : (
          <span />
        )}
        {wine.price ? (
          <span className="text-sm font-bold text-vinito-red whitespace-nowrap">
            ${wine.price.toLocaleString("es-AR")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
