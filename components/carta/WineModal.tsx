"use client";

import type { WineListItem } from "@/lib/types";

type Props = {
  wine: WineListItem | null;
  onClose: () => void;
};

function toEmbedUrl(driveUrl: string): string {
  // Convert Google Drive share URL to embeddable preview URL
  // From: https://drive.google.com/file/d/XXXX/view?usp=sharing
  // To:   https://drive.google.com/file/d/XXXX/preview
  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return driveUrl;
}

export function WineModal({ wine, onClose }: Props) {
  if (!wine || !wine.fichaUrl) return null;

  const embedUrl = toEmbedUrl(wine.fichaUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-vinito-cream rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-vinito-red text-vinito-cream px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-base font-bold truncate">{wine.name}</h2>
            <p className="text-[10px] opacity-80 truncate">
              {wine.winery}{wine.varietal ? ` · ${wine.varietal}` : ""}{wine.vintage ? ` · ${wine.vintage}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-xl ml-3 opacity-70 hover:opacity-100 shrink-0">✕</button>
        </div>

        {/* Embedded PDF */}
        <div className="flex-1 min-h-0">
          <iframe
            src={embedUrl}
            className="w-full h-[75vh] border-0"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
