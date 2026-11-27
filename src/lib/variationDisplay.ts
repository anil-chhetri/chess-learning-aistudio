import type { LoadedOpeningEntry } from './loader.ts';
import type { ParsedVariation } from './parser.ts';

export interface VariationCardDisplay {
  primaryLabel: string;
  nickname: string;
}

const MOVE_NOTATION_RE = /(\d+\.{1,3}\s*[A-Za-z0-9+=#-]+(?:\s+\d+\.{1,3}\s*[A-Za-z0-9+=#-]+)*)/;

/**
 * Formats a variation title into non-truncated Line 1 (move or name) + Line 2 (nickname/meta).
 * Example: "Bishop Captures: 4...Bxd4 (Greco / Exchange Line)"
 *   -> primaryLabel: "4... Bxd4"
 *   -> nickname: "Bishop Captures · Greco / Exchange Line"
 */
export function formatVariationDisplay(
  variation: ParsedVariation,
): VariationCardDisplay {
  const rawName = variation.name.trim();
  const moveMatch = rawName.match(MOVE_NOTATION_RE);

  if (moveMatch) {
    const rawMove = moveMatch[1].replace(/(\d+\.{1,3})(\S)/g, '$1 $2').trim();
    const matchIndex = moveMatch.index ?? 0;
    const before = rawName
      .slice(0, matchIndex)
      .replace(/[:\-–—\s]+$/g, '')
      .trim();
    const afterRaw = rawName.slice(matchIndex + moveMatch[0].length).trim();
    const after = afterRaw.replace(/^\((.+)\)$/, '$1').trim();

    const parts = [before, after].filter(Boolean);
    const fallbackMeta = variation.eco
      ? `ECO ${variation.eco}`
      : variation.playerColor || 'white';

    return {
      primaryLabel: rawMove,
      nickname: parts.length > 0 ? parts.join(' · ') : fallbackMeta,
    };
  }

  const colorLabel =
    (variation.playerColor || 'white') === 'black' ? 'Black' : 'White';
  const fallbackNick = variation.eco
    ? `ECO ${variation.eco} · ${colorLabel}`
    : colorLabel;

  return {
    primaryLabel: rawName,
    nickname: fallbackNick,
  };
}

export interface FilteredOpeningGroup {
  entry: LoadedOpeningEntry;
  variations: ParsedVariation[];
}

/**
 * Filters openings and their variations by a search string (case-insensitive).
 * If the opening title or tags match, all variations in that opening remain visible.
 * Otherwise, only matching variations are returned.
 */
export function filterOpeningsByQuery(
  openings: LoadedOpeningEntry[],
  rawQuery: string,
): FilteredOpeningGroup[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return openings.map((entry) => ({
      entry,
      variations: entry.parsed.variations,
    }));
  }

  const groups: FilteredOpeningGroup[] = [];

  for (const entry of openings) {
    const { parsed } = entry;
    const openingMatches =
      parsed.title.toLowerCase().includes(query) ||
      parsed.tags.some((tag) => tag.toLowerCase().includes(query));

    if (openingMatches) {
      groups.push({ entry, variations: parsed.variations });
      continue;
    }

    const matchingVariations = parsed.variations.filter((variation) => {
      const formatted = formatVariationDisplay(variation);
      return (
        variation.name.toLowerCase().includes(query) ||
        variation.eco.toLowerCase().includes(query) ||
        formatted.primaryLabel.toLowerCase().includes(query) ||
        formatted.nickname.toLowerCase().includes(query)
      );
    });

    if (matchingVariations.length > 0) {
      groups.push({ entry, variations: matchingVariations });
    }
  }

  return groups;
}
