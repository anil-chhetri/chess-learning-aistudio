export const STORAGE_KEYS = {
  LAST_OPENING: 'lastOpening',
  LAST_VARIATION: 'lastVariation',
  MISTAKES_BY_VARIATION: 'mistakesByVariation',
} as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PersistedTrainerProgress {
  lastOpening: string | null;
  lastVariation: string | null;
  mistakesByVariation: Record<string, number>;
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

export function loadTrainerProgress(
  storage: StorageLike | null = getDefaultStorage(),
): PersistedTrainerProgress {
  if (!storage) {
    return {
      lastOpening: null,
      lastVariation: null,
      mistakesByVariation: {},
    };
  }

  try {
    const lastOpening = storage.getItem(STORAGE_KEYS.LAST_OPENING) || null;
    const lastVariation = storage.getItem(STORAGE_KEYS.LAST_VARIATION) || null;
    const rawMistakes = storage.getItem(STORAGE_KEYS.MISTAKES_BY_VARIATION);

    let mistakesByVariation: Record<string, number> = {};
    if (rawMistakes) {
      const parsed: unknown = JSON.parse(rawMistakes);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const sanitized: Record<string, number> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
            sanitized[k] = Math.floor(v);
          }
        }
        mistakesByVariation = sanitized;
      }
    }

    return {
      lastOpening,
      lastVariation,
      mistakesByVariation,
    };
  } catch {
    return {
      lastOpening: null,
      lastVariation: null,
      mistakesByVariation: {},
    };
  }
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
