import { AlertCircle, BookOpen, Play } from 'lucide-react';
import type { ParsedOpening, ParsedVariation } from '../lib/parser.ts';

interface OpeningListProps {
  loading: boolean;
  loadError: string | null;
  opening: ParsedOpening | null;
  selectedVariationName: string | null;
  onSelectVariation: (variation: ParsedVariation) => void;
  onLoadVariationOnBoard: (variation: ParsedVariation) => void;
}

export function OpeningList({
  loading,
  loadError,
  opening,
  selectedVariationName,
  onSelectVariation,
  onLoadVariationOnBoard,
}: OpeningListProps) {
  return (
    <aside
      aria-label="Opening Library"
      className="bg-white border border-[#E2E0D8] rounded-lg p-5 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#ECEAE3] pb-3">
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
          Opening Library
        </h2>
        <span className="text-xs font-mono-tabular text-zinc-500">
          Phase 1
        </span>
      </div>

      {loading && (
        <div className="py-6 text-sm text-zinc-600">
          Loading opening lines...
        </div>
      )}

      {!loading && loadError && (
        <div
          role="alert"
          className="border border-red-300 bg-red-50 text-red-900 rounded-md p-3 text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Failed to load opening file</p>
            <p className="text-xs text-red-800 mt-1">{loadError}</p>
          </div>
        </div>
      )}

      {!loading && !loadError && !opening && (
        <div className="py-6 text-sm text-zinc-600">
          No openings loaded. Add a Markdown opening file in lines/.
        </div>
      )}

      {!loading && !loadError && opening && (
        <div className="flex flex-col gap-4">
          {/* Opening Header */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold text-zinc-900">
                {opening.title || 'Untitled Opening'}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 mt-1">
              <span className="capitalize">
                {opening.playerColor || 'unset'}
              </span>
              {opening.tags.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{opening.tags.join(', ')}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {opening.variations.length} variations
              </span>
            </div>
          </div>

          {/* Opening-level parser errors if any */}
          {opening.errors.length > 0 && (
            <div
              role="alert"
              className="border border-red-300 bg-red-50 text-red-900 rounded-md p-3 text-xs space-y-1"
            >
              <p className="font-semibold">Parser reported errors:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {opening.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Variations */}
          <div className="flex flex-col divide-y divide-[#ECEAE3] border-t border-b border-[#ECEAE3]">
            {opening.variations.map((variation) => {
              const isSelected = variation.name === selectedVariationName;
              return (
                <div key={variation.name} className="py-3 first:pt-2.5 last:pb-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectVariation(variation)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full text-left rounded-md px-2.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-800 ${
                      isSelected
                        ? 'bg-[#F0F4F1] text-zinc-950'
                        : 'hover:bg-[#F7F6F2] text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate">
                        {variation.name}
                      </span>
                      {!variation.valid && (
                        <span className="text-xs font-medium text-red-700 shrink-0">
                          Invalid
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                      <span className="font-mono-tabular">
                        {variation.eco || 'No ECO'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">
                        {variation.playerColor || 'unset'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {variation.moves.length} plies
                      </span>
                    </div>
                  </button>

                  {isSelected && variation.valid && (
                    <div className="mt-2 px-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onLoadVariationOnBoard(variation)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1B5E3A] hover:bg-[#154A2D] rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
                      >
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        Load Line on Board
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed flex items-start gap-2">
            <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-400" aria-hidden="true" />
            <span>
              Select any variation to read its study notes, or play freely on the
              board to test legal moves.
            </span>
          </p>
        </div>
      )}
    </aside>
  );
}
