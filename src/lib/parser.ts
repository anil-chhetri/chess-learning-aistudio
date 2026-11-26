export const SUPPORTED_FORMAT_VERSION = 1;
export const MAX_VARIATIONS_PER_FILE = 20;
export const MAX_PLIES_PER_VARIATION = 40;

const VALID_COLORS = new Set<string>(['white', 'black']);
const ALLOWED_FRONTMATTER_KEYS = new Set<string>([
  'formatVersion',
  'title',
  'playerColor',
  'tags',
]);
const MOVE_NUMBER_PATTERN = /^\d+\.+$/;
const INLINE_MOVE_NUMBER_PATTERN = /^\d+\./;

export type PlayerColor = 'white' | 'black';

export const ParseState = {
  INIT: 'INIT',
  FRONTMATTER: 'FRONTMATTER',
  OPENING_BODY: 'OPENING_BODY',
  OPENING_NOTES: 'OPENING_NOTES',
  VARIATION_META: 'VARIATION_META',
  NOTES: 'NOTES',
  MOVES: 'MOVES',
} as const;

export type ParseState = (typeof ParseState)[keyof typeof ParseState];

export interface ParsedVariation {
  name: string;
  eco: string;
  playerColor: PlayerColor | '';
  notes: string;
  moves: string[];
  hasMovesBlock: boolean;
  valid: boolean;
  errors: string[];
}

export interface ParsedOpening {
  formatVersion: number;
  title: string;
  playerColor: PlayerColor | '';
  tags: string[];
  notes: string;
  variations: ParsedVariation[];
  errors: string[];
}

interface WorkingVariation {
  name: string;
  eco: string;
  playerColor: PlayerColor | '';
  notesLines: string[];
  moves: string[];
  hasMovesBlock: boolean;
  errors: string[];
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseTags(rawValue: string): string[] {
  const trimmed = rawValue.trim();
  if (!trimmed) return [];
  const inner =
    trimmed.startsWith('[') && trimmed.endsWith(']')
      ? trimmed.slice(1, -1)
      : trimmed;
  return inner
    .split(',')
    .map((tag) => stripQuotes(tag))
    .filter((tag) => tag.length > 0);
}

/**
 * Pure, single-pass line-based state machine that converts opening Markdown
 * into structured data without touching the DOM or throwing exceptions.
 */
export function parseOpeningMarkdown(rawText: string): ParsedOpening {
  const result: ParsedOpening = {
    formatVersion: SUPPORTED_FORMAT_VERSION,
    title: '',
    playerColor: '',
    tags: [],
    notes: '',
    variations: [],
    errors: [],
  };

  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    result.errors.push('Opening file is empty.');
    return result;
  }

  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  let state: ParseState = ParseState.INIT;
  let seenFrontmatter = false;
  let hasInvalidFileColor = false;
  const openingNotesLines: string[] = [];
  const seenVariationNames = new Set<string>();
  let current: WorkingVariation | null = null;

  const finalizeVariation = () => {
    if (!current) return;

    const varErrors = [...current.errors];
    let resolvedColor: PlayerColor | '' = current.playerColor;

    if (!resolvedColor) {
      resolvedColor = result.playerColor;
    }

    if (!resolvedColor || !VALID_COLORS.has(resolvedColor)) {
      varErrors.push(
        `Variation "${current.name}": missing valid playerColor ("white" or "black").`,
      );
    }

    if (!current.hasMovesBlock) {
      varErrors.push(
        `Variation "${current.name}": missing \`\`\`moves\`\`\` block.`,
      );
    } else if (current.moves.length === 0) {
      varErrors.push(
        `Variation "${current.name}": \`\`\`moves\`\`\` block is empty.`,
      );
    } else if (current.moves.length > MAX_PLIES_PER_VARIATION) {
      varErrors.push(
        `Variation "${current.name}": exceeds maximum of ${MAX_PLIES_PER_VARIATION} plies (${current.moves.length}).`,
      );
    }

    for (const err of varErrors) {
      result.errors.push(err);
    }

    result.variations.push({
      name: current.name,
      eco: current.eco,
      playerColor: resolvedColor,
      notes: current.notesLines.join('\n').trim(),
      moves: current.moves,
      hasMovesBlock: current.hasMovesBlock,
      valid: varErrors.length === 0,
      errors: varErrors,
    });

    current = null;
  };

  const startVariation = (headingText: string) => {
    const rawName = headingText.startsWith('Variation:')
      ? headingText.slice('Variation:'.length).trim()
      : headingText.trim();

    const varName = rawName || `Untitled Variation ${result.variations.length + 1}`;
    const varErrors: string[] = [];

    if (!rawName) {
      varErrors.push('Variation heading "##" is missing a name.');
    } else if (seenVariationNames.has(rawName)) {
      varErrors.push(`Duplicate variation name "${rawName}".`);
    } else {
      seenVariationNames.add(rawName);
    }

    current = {
      name: varName,
      eco: '',
      playerColor: '',
      notesLines: [],
      moves: [],
      hasMovesBlock: false,
      errors: varErrors,
    };
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (state === ParseState.INIT) {
      if (line === '') continue;
      if (line === '---') {
        seenFrontmatter = true;
        state = ParseState.FRONTMATTER;
        continue;
      }
      result.errors.push('Missing YAML frontmatter block starting with ---.');
      state = ParseState.OPENING_BODY;
      // Fall through to handle this line in OPENING_BODY
    }

    if (state === ParseState.FRONTMATTER) {
      if (line === '---') {
        if (!result.title) {
          result.errors.push('Frontmatter is missing required "title".');
        }
        if (!result.playerColor && !hasInvalidFileColor) {
          result.errors.push(
            'Frontmatter is missing required "playerColor" ("white" or "black").',
          );
        }
        state = ParseState.OPENING_BODY;
        continue;
      }

      if (line === '') continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) {
        result.errors.push(`Invalid frontmatter line: "${line}".`);
        continue;
      }

      const key = line.slice(0, colonIdx).trim();
      const rawVal = line.slice(colonIdx + 1).trim();

      if (!ALLOWED_FRONTMATTER_KEYS.has(key)) {
        result.errors.push(`Unknown frontmatter key "${key}".`);
        continue;
      }

      if (key === 'title') {
        result.title = stripQuotes(rawVal);
      } else if (key === 'playerColor') {
        const cleanColor = stripQuotes(rawVal);
        if (VALID_COLORS.has(cleanColor)) {
          result.playerColor = cleanColor as PlayerColor;
        } else {
          hasInvalidFileColor = true;
          result.errors.push(
            `Invalid file-level playerColor "${cleanColor}": expected lowercase "white" or "black".`,
          );
        }
      } else if (key === 'formatVersion') {
        const parsedVersion = Number(rawVal);
        if (!Number.isInteger(parsedVersion) || parsedVersion !== SUPPORTED_FORMAT_VERSION) {
          result.errors.push(
            `Unsupported formatVersion "${rawVal}": expected ${SUPPORTED_FORMAT_VERSION}.`,
          );
        } else {
          result.formatVersion = parsedVersion;
        }
      } else if (key === 'tags') {
        result.tags = parseTags(rawVal);
      }
      continue;
    }

    if (state === ParseState.MOVES) {
      if (line === '```') {
        if (current) {
          current.hasMovesBlock = true;
        }
        state = ParseState.OPENING_BODY;
        continue;
      }

      if (line === '') continue;

      const tokens = line.split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        if (MOVE_NUMBER_PATTERN.test(token) || INLINE_MOVE_NUMBER_PATTERN.test(token)) {
          if (current) {
            current.errors.push(
              `Variation "${current.name}": move numbers are not allowed inside moves block ("${token}").`,
            );
          }
          continue;
        }
        if (current) {
          current.moves.push(token);
        }
      }
      continue;
    }

    // Check for variation or opening-notes heading in any non-FRONTMATTER / non-MOVES state
    if (line.startsWith('## ')) {
      finalizeVariation();
      const heading = line.slice(3).trim();
      if (heading === 'Notes') {
        state = ParseState.OPENING_NOTES;
      } else {
        startVariation(heading);
        state = ParseState.VARIATION_META;
      }
      continue;
    }

    if (line === '##' || line === '##Variation:') {
      finalizeVariation();
      startVariation('');
      state = ParseState.VARIATION_META;
      continue;
    }

    if (state === ParseState.OPENING_NOTES) {
      openingNotesLines.push(line);
      continue;
    }

    if (state === ParseState.VARIATION_META && current) {
      if (line === '') continue;

      if (line === '```moves') {
        state = ParseState.MOVES;
        continue;
      }

      if (line.startsWith('eco:')) {
        current.eco = stripQuotes(line.slice(4));
        continue;
      }

      if (line.startsWith('playerColor:')) {
        const cleanColor = stripQuotes(line.slice('playerColor:'.length));
        if (VALID_COLORS.has(cleanColor)) {
          current.playerColor = cleanColor as PlayerColor;
        } else {
          current.errors.push(
            `Variation "${current.name}": invalid playerColor "${cleanColor}": expected lowercase "white" or "black".`,
          );
        }
        continue;
      }

      // First prose line transitions from VARIATION_META to NOTES
      state = ParseState.NOTES;
      current.notesLines.push(line);
      continue;
    }

    if (state === ParseState.NOTES && current) {
      if (line === '```moves') {
        state = ParseState.MOVES;
        continue;
      }
      current.notesLines.push(line);
      continue;
    }

    if (state === ParseState.OPENING_BODY) {
      if (line === '') continue;
      if (line === '```moves') {
        result.errors.push('Found ```moves block outside of any variation heading.');
        // Consume until closing fence so we don't misparse lines
        current = {
          name: 'Orphan Moves Block',
          eco: '',
          playerColor: result.playerColor,
          notesLines: [],
          moves: [],
          hasMovesBlock: false,
          errors: ['Found ```moves block outside of any variation heading.'],
        };
        state = ParseState.MOVES;
      }
    }
  }

  if (state === ParseState.FRONTMATTER && seenFrontmatter) {
    result.errors.push('Unclosed frontmatter block (missing closing ---).');
  }

  if (state === ParseState.MOVES && current) {
    current.errors.push(
      `Variation "${current.name}": unclosed \`\`\`moves\`\`\` block.`,
    );
  }

  finalizeVariation();
  result.notes = openingNotesLines.join('\n').trim();

  if (result.variations.length === 0) {
    result.errors.push('No variations found in opening file.');
  } else if (result.variations.length > MAX_VARIATIONS_PER_FILE) {
    result.errors.push(
      `File has ${result.variations.length} variations; maximum allowed is ${MAX_VARIATIONS_PER_FILE}.`,
    );
  }

  return result;
}
