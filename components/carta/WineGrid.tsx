import type { WineListItem } from "@/lib/types";
import { WineCard } from "./WineCard";

type Props = {
  wines: WineListItem[];
  onViewFicha: (wine: WineListItem) => void;
};

export function WineGrid({ wines, onViewFicha }: Props) {
  if (wines.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="font-serif text-lg text-vinito-black/50">
          No encontramos vinos con esos filtros
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5 px-4 pb-6">
      {wines.map((wine) => (
        <WineCard key={wine.id} wine={wine} onViewFicha={onViewFicha} />
      ))}
    </div>
  );
}
