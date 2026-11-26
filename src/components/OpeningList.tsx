import { BookOpen, ChevronDown, ChevronRight, Play } from 'lucide-react';
import type { LoadedOpeningEntry } from '../lib/loader.ts';
import type { ParsedVariation } from '../lib/parser.ts';

interface OpeningListProps {
  loading: boolean;
  openings: LoadedOpeningEntry[];
  selectedOpeningPath: string | null;
  selectedVariationName: string | null;
  onSelectOpening: (openingPath: string) => void;
  onSelectVariation: (openingPath: string, variation: ParsedVariation) => void;
  onLoadVariationOnBoard: (variation: ParsedVariation) => void;
}

export function OpeningList({
  loading,
  openings,
  selectedOpeningPath,
  selectedVariationName,
  onSelectOpening,
  onSelectVariation,
  onLoadVariationOnBoard,
}: OpeningListProps) {
  return (
    <aside
      aria-label="Opening Library"
      className="bg-white border border-[#E2E0D8] rounded-lg p-5 flex flex-col gap-4 h-full"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#ECEAE3] pb-3">
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
          Opening Library
        </h2>
        <span className="text-xs font-mono-tabular text-zinc-500">
          {openings.length} {openings.length === 1 ? 'opening' : 'openings'}
        </span>
      </div>

      {loading && (
        <div className="py-6 text-sm text-zinc-600">
          Loading opening lines...
        </div>
      )}

      {!loading && openings.length === 0 && (
        <div className="py-6 text-sm text-zinc-600">
          No openings available. Check that manifest.json and lines/*.md exist.
        </div>
      )}

      {!loading && openings.length > 0 && (
        <div className="flex flex-col divide-y divide-[#ECEAE3] border-b border-[#ECEAE3]">
          {openings.map((entry) => {
            const { parsed } = entry;
            const isOpeningSelected = entry.path === selectedOpeningPath;
            const validCount = parsed.variations.filter((v) => v.valid).length;

            return (
              <div key={entry.path} className="py-3 first:pt-1">
                <button
                  type="button"
                  aria-expanded={isOpeningSelected}
                  onClick={() => onSelectOpening(entry.path)}
                  className={`w-full text-left rounded-md px-2.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-800 ${
                    isOpeningSelected
                      ? 'bg-[#F5F4F0] text-zinc-950'
                      : 'hover:bg-[#FAF9F6] text-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">
                      {parsed.title || entry.path}
                    </span>
                    {isOpeningSelected ? (
                      <ChevronDown
                        className="w-4 h-4 text-zinc-500 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronRight
                        className="w-4 h-4 text-zinc-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 mt-1">
                    <span className="capitalize">
                      {parsed.playerColor || 'unset'}
                    </span>
                    {parsed.tags.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[140px]">
                          {parsed.tags.join(', ')}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {validCount} {validCount === 1 ? 'line' : 'lines'}
                    </span>
                  </div>
                </button>

                {/* Variations inside active opening */}
                {isOpeningSelected && (
                  <div className="mt-2 pl-2 space-y-1.5">
                    {parsed.variations.map((variation) => {
                      const isVarSelected =
                        variation.name === selectedVariationName;
                      return (
                        <div
                          key={variation.name}
                          className="rounded-md transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => onSelectVariation(entry.path, variation)}
                            aria-current={isVarSelected ? 'true' : undefined}
                            className={`w-full text-left rounded-md px-2.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-800 ${
                              isVarSelected
                                ? 'bg-[#EBF2ED] text-zinc-950'
                                : 'hover:bg-[#F7F6F2] text-zinc-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs sm:text-sm font-medium truncate">
                                {variation.name}
                              </span>
                              {!variation.valid && (
                                <span className="text-xs font-medium text-red-700 shrink-0">
                                  Invalid
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
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

                          {isVarSelected && variation.valid && (
                            <div className="mt-1.5 px-2.5 pb-1">
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
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-zinc-500 leading-relaxed flex items-start gap-2 mt-auto pt-1">
        <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-400" aria-hidden="true" />
        <span>
          Openings are loaded dynamically from manifest.json. Pick any opening
          and variation to inspect notes or replay its moves.
        </span>
      </p>
    </aside>
  );
}
