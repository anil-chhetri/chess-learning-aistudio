import type { VariationStats } from './mastery.ts';

export const STORAGE_KEYS = {
  LAST_OPENING: 'lastOpening',
  LAST_VARIATION: 'lastVariation',
  MISTAKES_BY_VARIATION: 'mistakesByVariation',
  VARIATION_STATS: 'variationStats',
} as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PersistedTrainerProgress {
  lastOpening: string | null;
  lastVariation: string | null;
  mistakesByVariation: Record<string, number>;
  variationStats: Record<string, VariationStats>;
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function sanitizeMistakes(raw: string | null): Record<string, number> {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  const sanitized: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      sanitized[k] = Math.floor(v);
    }
  }
  return sanitized;
}

function sanitizeVariationStats(
  raw: string | null,
): Record<string, VariationStats> {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  const sanitized: Record<string, VariationStats> = {};
  for (const [key, val] of Object.entries(parsed)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
    const record = val as Record<string, unknown>;
    const attempts =
      typeof record.attempts === 'number' && Number.isFinite(record.attempts)
        ? Math.max(0, Math.floor(record.attempts))
        : 0;
    const completions =
      typeof record.completions === 'number' &&
      Number.isFinite(record.completions)
        ? Math.max(0, Math.floor(record.completions))
        : 0;
    const highAccuracyCompletions =
      typeof record.highAccuracyCompletions === 'number' &&
      Number.isFinite(record.highAccuracyCompletions)
        ? Math.max(0, Math.floor(record.highAccuracyCompletions))
        : 0;
    const bestAccuracy =
      typeof record.bestAccuracy === 'number' &&
      Number.isFinite(record.bestAccuracy)
        ? Math.max(0, Math.min(100, Math.round(record.bestAccuracy)))
        : null;
    const lastPracticedAt =
      typeof record.lastPracticedAt === 'number' &&
      Number.isFinite(record.lastPracticedAt)
        ? record.lastPracticedAt
        : null;

    sanitized[key] = {
      attempts,
      completions,
      highAccuracyCompletions,
      bestAccuracy,
      lastPracticedAt,
    };
  }
  return sanitized;
}

export function loadTrainerProgress(
  storage: StorageLike | null = getDefaultStorage(),
): PersistedTrainerProgress {
  if (!storage) {
    return {
      lastOpening: null,
      lastVariation: null,
      mistakesByVariation: {},
      variationStats: {},
    };
  }

  let lastOpening: string | null = null;
  let lastVariation: string | null = null;
  let mistakesByVariation: Record<string, number> = {};
  let variationStats: Record<string, VariationStats> = {};

  try {
    lastOpening = storage.getItem(STORAGE_KEYS.LAST_OPENING) || null;
    lastVariation = storage.getItem(STORAGE_KEYS.LAST_VARIATION) || null;
  } catch {
    // Ignore read failure
  }

  try {
    mistakesByVariation = sanitizeMistakes(
      storage.getItem(STORAGE_KEYS.MISTAKES_BY_VARIATION),
    );
  } catch {
    mistakesByVariation = {};
  }

  try {
    variationStats = sanitizeVariationStats(
      storage.getItem(STORAGE_KEYS.VARIATION_STATS),
    );
  } catch {
    variationStats = {};
  }

  return {
    lastOpening,
    lastVariation,
    mistakesByVariation,
    variationStats,
  };
}

export function saveLastSelection(
  openingPath: string,
  variationName: string,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.LAST_OPENING, openingPath);
    storage.setItem(STORAGE_KEYS.LAST_VARIATION, variationName);
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function saveMistakesByVariation(
  mistakesByVariation: Record<string, number>,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      STORAGE_KEYS.MISTAKES_BY_VARIATION,
      JSON.stringify(mistakesByVariation),
    );
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function saveVariationStats(
  variationStats: Record<string, VariationStats>,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      STORAGE_KEYS.VARIATION_STATS,
      JSON.stringify(variationStats),
    );
  } catch {
    // Ignore storage quota / private mode errors
  }
}
