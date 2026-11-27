import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Search,
  X,
} from 'lucide-react';
import { getVariationKey } from '../lib/drill.ts';
import type { LoadedOpeningEntry } from '../lib/loader.ts';
import {
  getOpeningMasterySummary,
  getVariationStatus,
  type VariationStats,
} from '../lib/mastery.ts';
import type { ParsedVariation } from '../lib/parser.ts';
import {
  filterOpeningsByQuery,
  formatVariationDisplay,
} from '../lib/variationDisplay.ts';
import { StatusBadge } from './StatusBadge.tsx';

interface OpeningListProps {
  loading: boolean;
  openings: LoadedOpeningEntry[];
  selectedOpeningPath: string | null;
  selectedVariationName: string | null;
  mistakesByVariation: Record<string, number>;
  variationStats: Record<string, VariationStats>;
  onSelectOpening: (openingPath: string) => void;
  onStartVariationDrill: (
    openingPath: string,
    variation: ParsedVariation,
  ) => void;
  onHide?: () => void;
}

const SEARCH_DEBOUNCE_MS = 200;

export function OpeningList({
  loading,
  openings,
  selectedOpeningPath,
  selectedVariationName,
  mistakesByVariation,
  variationStats,
  onSelectOpening,
  onStartVariationDrill,
  onHide,
}: OpeningListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filteredGroups = useMemo(
    () => filterOpeningsByQuery(openings, debouncedQuery),
    [openings, debouncedQuery],
  );

  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <aside
      aria-label="Opening Library"
      className="bg-white border border-neutral-200 rounded-[12px] shadow-sm p-4 flex flex-col gap-3 h-full"
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <h2 className="ds-text-heading text-neutral-900">Opening Library</h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="ds-text-meta font-mono-tabular text-neutral-500">
            {openings.length} {openings.length === 1 ? 'opening' : 'openings'}
          </span>
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              aria-label="Hide opening library"
              title="Hide opening library"
              className="p-1 text-neutral-500 hover:text-neutral-900 rounded-[6px] hover:bg-neutral-100 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary-700"
            >
              <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input (debounced 200ms) */}
      <div className="relative">
        <Search
          className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search opening or variation..."
          aria-label="Search openings and variations"
          className="w-full h-[40px] pl-9 pr-8 ds-text-body text-neutral-900 placeholder:text-neutral-500 bg-neutral-50 border border-neutral-300 rounded-[10px] focus:bg-white focus:outline-2 focus:outline-primary-700"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setDebouncedQuery('');
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-900 rounded focus-visible:outline-2 focus-visible:outline-primary-700"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {loading && (
        <div className="py-6 ds-text-body text-neutral-500">
          Loading opening lines...
        </div>
      )}

      {!loading && openings.length === 0 && (
        <div className="py-6 ds-text-body text-neutral-500">
          No openings available. Check that manifest.json and lines/*.md exist.
        </div>
      )}

      {!loading && openings.length > 0 && filteredGroups.length === 0 && (
        <div className="py-6 ds-text-body text-neutral-500">
          No matching openings or variations for "{debouncedQuery.trim()}".
        </div>
      )}

      {!loading && filteredGroups.length > 0 && (
        <div className="flex flex-col divide-y divide-neutral-200 border-b border-neutral-200">
          {filteredGroups.map(({ entry, variations }) => {
            const { parsed } = entry;
            const isOpeningExpanded =
              isSearching || entry.path === selectedOpeningPath;
            const summary = getOpeningMasterySummary(
              entry.path,
              parsed.variations,
              variationStats,
            );

            return (
              <div key={entry.path} className="py-3 first:pt-1">
                <button
                  type="button"
                  aria-expanded={isOpeningExpanded}
                  onClick={() => onSelectOpening(entry.path)}
                  className={`w-full text-left rounded-[10px] px-3 py-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-700 ${
                    isOpeningExpanded
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'hover:bg-neutral-50 text-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="ds-text-heading text-neutral-900">
                      {parsed.title || entry.path}
                    </span>
                    {isOpeningExpanded ? (
                      <ChevronDown
                        className="w-4 h-4 text-neutral-500 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronRight
                        className="w-4 h-4 text-neutral-500 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 ds-text-meta text-neutral-500 mt-1">
                    <span className="capitalize">
                      {parsed.playerColor || 'unset'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {summary.totalValid}{' '}
                      {summary.totalValid === 1 ? 'line' : 'lines'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {summary.masteryPct}% mastered
                    </span>
                  </div>
                </button>

                {/* Non-truncated 3-line variation rows with Status Badge */}
                {isOpeningExpanded && (
                  <div className="mt-2 divide-y divide-neutral-200 border-t border-neutral-200">
                    {variations.map((variation) => {
                      const isVarSelected =
                        entry.path === selectedOpeningPath &&
                        variation.name === selectedVariationName;
                      const varKey = getVariationKey(entry.path, variation.name);
                      const recordedMistakes = mistakesByVariation[varKey] ?? 0;
                      const stats = variationStats[varKey];
                      const status = getVariationStatus(stats);
                      const display = formatVariationDisplay(variation);

                      return (
                        <button
                          key={variation.name}
                          type="button"
                          disabled={!variation.valid}
                          onClick={() =>
                            onStartVariationDrill(entry.path, variation)
                          }
                          aria-current={isVarSelected ? 'true' : undefined}
                          className={`w-full text-left px-3 py-3 transition-colors min-h-[44px] cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isVarSelected
                              ? 'bg-primary-100/70 text-neutral-900'
                              : 'hover:bg-neutral-50 text-neutral-900'
                          }`}
                        >
                          {/* Line 1: Bold move/name + Mastery Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="ds-text-body-bold text-neutral-900 whitespace-normal break-words">
                              {display.primaryLabel}
                            </span>
                            {variation.valid && <StatusBadge status={status} />}
                          </div>

                          {/* Line 2: Regular grey nickname / context */}
                          <div className="ds-text-meta text-neutral-500 mt-0.5 whitespace-normal break-words">
                            {display.nickname}
                          </div>

                          {/* Line 3: Moves count & recorded mistakes */}
                          <div className="flex flex-wrap items-center gap-1.5 ds-text-meta font-mono-tabular text-neutral-500 mt-1">
                            <span>
                              {variation.valid
                                ? `${variation.moves.length} moves`
                                : 'Invalid line'}
                            </span>
                            {recordedMistakes > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-error font-semibold">
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

      <p className="ds-text-meta text-neutral-500 leading-relaxed flex items-start gap-2 mt-auto pt-1">
        <BookOpen
          className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neutral-500"
          aria-hidden="true"
        />
        <span>
          Complete any line twice with ≥80% accuracy to earn Mastered status.
        </span>
      </p>
    </aside>
  );
}
