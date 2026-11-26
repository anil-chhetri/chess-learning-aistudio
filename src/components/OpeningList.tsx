import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { getVariationKey } from '../lib/drill.ts';
import type { LoadedOpeningEntry } from '../lib/loader.ts';
import type { ParsedVariation } from '../lib/parser.ts';

interface OpeningListProps {
  loading: boolean;
  openings: LoadedOpeningEntry[];
  selectedOpeningPath: string | null;
  selectedVariationName: string | null;
  mistakesByVariation: Record<string, number>;
  onSelectOpening: (openingPath: string) => void;
  onStartVariationDrill: (openingPath: string, variation: ParsedVariation) => void;
}

export function OpeningList({
  loading,
  openings,
  selectedOpeningPath,
  selectedVariationName,
  mistakesByVariation,
  onSelectOpening,
  onStartVariationDrill,
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

                {/* Variation Cards inside active opening */}
                {isOpeningSelected && (
                  <div className="mt-2 pl-2 space-y-1.5">
                    {parsed.variations.map((variation) => {
                      const isVarSelected =
                        variation.name === selectedVariationName;
                      const varKey = getVariationKey(entry.path, variation.name);
                      const recordedMistakes = mistakesByVariation[varKey] ?? 0;

                      return (
                        <button
                          key={variation.name}
                          type="button"
                          disabled={!variation.valid}
                          onClick={() =>
                            onStartVariationDrill(entry.path, variation)
                          }
                          aria-current={isVarSelected ? 'true' : undefined}
                          className={`w-full text-left rounded-md px-3 py-2.5 border transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isVarSelected
                              ? 'bg-[#EBF2ED] border-[#B6D0BF] text-zinc-950'
                              : 'bg-[#FAF9F6] border-[#ECEAE3] hover:bg-[#F1EFE9] text-zinc-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-semibold truncate">
                              {variation.name}
                            </span>
                            <span className="text-[11px] font-mono-tabular font-medium text-zinc-600 shrink-0 capitalize">
                              {variation.valid
                                ? variation.playerColor || 'white'
                                : 'Invalid'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 mt-1">
                            <span className="font-mono-tabular">
                              {variation.eco || 'No ECO'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              {variation.moves.length} plies
                            </span>
                            {recordedMistakes > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono-tabular text-amber-800">
                                  {recordedMistakes}{' '}
                                  {recordedMistakes === 1 ? 'mistake' : 'mistakes'}
                                </span>
                              </>
                            )}
                          </div>
                        </button>
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
          Pick an opening, then select any variation card to start drilling
          that exact line.
        </span>
      </p>
    </aside>
  );
}
