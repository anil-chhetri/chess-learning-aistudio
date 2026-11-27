import type { ParsedVariation } from './parser.ts';
import { getVariationKey } from './drill.ts';

export const MASTERY_ACCURACY_THRESHOLD = 80;
export const MASTERY_REQUIRED_COMPLETIONS = 2;

export type MasteryStatus = 'new' | 'learning' | 'mastered';

export interface VariationStats {
  attempts: number;
  completions: number;
  highAccuracyCompletions: number;
  bestAccuracy: number | null;
  lastPracticedAt: number | null;
}

export function createEmptyVariationStats(): VariationStats {
  return {
    attempts: 0,
    completions: 0,
    highAccuracyCompletions: 0,
    bestAccuracy: null,
    lastPracticedAt: null,
  };
}

export function getVariationStatus(
  stats?: VariationStats | null,
): MasteryStatus {
  if (!stats || (stats.attempts === 0 && stats.completions === 0)) {
    return 'new';
  }
  if (stats.highAccuracyCompletions >= MASTERY_REQUIRED_COMPLETIONS) {
    return 'mastered';
  }
  return 'learning';
}

export function recordVariationAttempt(
  prev: VariationStats | undefined,
  timestamp = Date.now(),
): VariationStats {
  const base = prev ?? createEmptyVariationStats();
  return {
    ...base,
    attempts: base.attempts + 1,
    lastPracticedAt: timestamp,
  };
}

export function recordVariationCompletion(
  prev: VariationStats | undefined,
  accuracy: number,
  timestamp = Date.now(),
): VariationStats {
  const base = prev ?? createEmptyVariationStats();
  const clampedAccuracy = Math.max(0, Math.min(100, Math.round(accuracy)));
  const qualifiesForMastery = clampedAccuracy >= MASTERY_ACCURACY_THRESHOLD;

  return {
    attempts: Math.max(1, base.attempts),
    completions: base.completions + 1,
    highAccuracyCompletions:
      base.highAccuracyCompletions + (qualifiesForMastery ? 1 : 0),
    bestAccuracy:
      base.bestAccuracy === null
        ? clampedAccuracy
        : Math.max(base.bestAccuracy, clampedAccuracy),
    lastPracticedAt: timestamp,
  };
}

export interface OpeningMasterySummary {
  masteredCount: number;
  totalValid: number;
  masteryPct: number;
  status: MasteryStatus;
}

export function getOpeningMasterySummary(
  openingPath: string,
  variations: ParsedVariation[],
  statsByVariation: Record<string, VariationStats>,
): OpeningMasterySummary {
  const validVars = variations.filter((v) => v.valid);
  const totalValid = validVars.length;
  if (totalValid === 0) {
    return {
      masteredCount: 0,
      totalValid: 0,
      masteryPct: 0,
      status: 'new',
    };
  }

  let masteredCount = 0;
  let learningCount = 0;

  for (const variation of validVars) {
    const key = getVariationKey(openingPath, variation.name);
    const status = getVariationStatus(statsByVariation[key]);
    if (status === 'mastered') masteredCount += 1;
    else if (status === 'learning') learningCount += 1;
  }

  const masteryPct = Math.round((masteredCount / totalValid) * 100);
  const status: MasteryStatus =
    masteredCount === totalValid
      ? 'mastered'
      : masteredCount > 0 || learningCount > 0
        ? 'learning'
        : 'new';

  return {
    masteredCount,
    totalValid,
    masteryPct,
    status,
  };
}
