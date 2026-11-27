import type { ParsedVariation } from './parser.ts';

export interface StructuredStudyNotes {
  idea: string;
  plan: string;
  watchOut: string;
  fullText: string;
  hasMore: boolean;
}

const CAUTION_RE =
  /\b(don't|do not|avoid|watch|careful|without|prevent|passive|trap|fire|target|early|never|under|overextend|caution)\b/i;

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/`/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Converts either explicitly labeled (`Idea:`, `Plan:`, `Watch Out:`) or free-text
 * variation notes into concise structured Idea / Plan / Watch Out sections.
 * Guarantees Idea and Plan are always populated for every variation.
 */
export function structureStudyNotes(
  variation: ParsedVariation | null,
  openingNotes = '',
): StructuredStudyNotes {
  const rawNotes = (variation?.notes || openingNotes || '').trim();
  const cleanFull = rawNotes.replace(/`/g, '').trim();

  if (!variation) {
    return {
      idea: cleanFull || 'Pick an opening variation to study its core idea.',
      plan: 'Follow the main move sequence and pay attention to piece coordination.',
      watchOut: 'Avoid unforced pawn weaknesses before completing development.',
      fullText: cleanFull,
      hasMore: cleanFull.length > 80,
    };
  }

  // 1. Check for explicit Idea: / Plan: / Watch Out: labels
  const lines = rawNotes
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let explicitIdea = '';
  let explicitPlan = '';
  let explicitWatchOut = '';
  const extraLines: string[] = [];

  for (const line of lines) {
    if (/^idea\s*:/i.test(line)) {
      explicitIdea = line.replace(/^idea\s*:/i, '').trim();
    } else if (/^plan\s*:/i.test(line)) {
      explicitPlan = line.replace(/^plan\s*:/i, '').trim();
    } else if (/^watch\s*out\s*:/i.test(line)) {
      explicitWatchOut = line.replace(/^watch\s*out\s*:/i, '').trim();
    } else {
      extraLines.push(line.replace(/`/g, '').trim());
    }
  }

  if (explicitIdea || explicitPlan || explicitWatchOut) {
    const idea =
      explicitIdea ||
      `Contest the center cleanly in the ${variation.name} line.`;
    const plan =
      explicitPlan ||
      `Develop pieces harmoniously along ${variation.moves.slice(0, 6).join(' ')}.`;
    const watchOut =
      explicitWatchOut ||
      'Check opponent tactical replies before committing central pawns.';
    const extraText = extraLines.join(' ').trim();
    return {
      idea,
      plan,
      watchOut,
      fullText: extraText,
      hasMore:
        Boolean(extraText) ||
        idea.length > 68 ||
        plan.length > 68 ||
        watchOut.length > 68,
    };
  }

  // 2. Parse free-text prose deterministically into Idea, Plan, Watch Out
  const sentences = splitSentences(rawNotes);
  const openingSnippet = variation.moves.slice(0, 6).join(' ');
  const sideLabel = variation.playerColor === 'black' ? 'Black' : 'White';

  let idea =
    sentences[0] ||
    `${sideLabel} plays the ${variation.name} line (${openingSnippet}).`;

  // Split single long sentence on ';' or '—' if needed so Plan gets a distinct cue
  let plan = '';
  let watchOut = '';

  if (sentences.length >= 2) {
    const remaining = sentences.slice(1);
    const cautionIdx = remaining.findIndex((s) => CAUTION_RE.test(s));

    if (cautionIdx !== -1 && remaining.length >= 2) {
      watchOut = remaining[cautionIdx];
      plan = remaining.filter((_, i) => i !== cautionIdx).join(' ');
    } else {
      plan = remaining[0];
      watchOut =
        remaining.slice(1).join(' ') ||
        (CAUTION_RE.test(remaining[0]) ? remaining[0] : '');
    }
  } else if (sentences.length === 1) {
    const clauses = sentences[0]
      .split(/[;—]+|,\s+(?=(?:where|leading|allowing|aiming|preparing|while)\b)/i)
      .map((c) => c.trim())
      .filter(Boolean);
    if (clauses.length >= 2) {
      idea = clauses[0].endsWith('.') ? clauses[0] : `${clauses[0]}.`;
      plan = clauses.slice(1).join(' — ');
    }
  }

  if (!plan) {
    plan = `Follow the ${openingSnippet || variation.name} setup and develop toward the center.`;
  }

  if (!watchOut) {
    watchOut =
      variation.playerColor === 'black'
        ? 'Watch White central breaks and avoid falling behind in development.'
        : 'Watch opponent counterattacks against your king and unguarded center pawns.';
  }

  const hasMore =
    cleanFull.length > 90 ||
    idea.length > 68 ||
    plan.length > 68 ||
    watchOut.length > 68;

  return {
    idea,
    plan,
    watchOut,
    fullText: cleanFull,
    hasMore,
  };
}
