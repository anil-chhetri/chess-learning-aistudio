import { Chess } from 'chess.js';
import {
  MAX_VARIATIONS_PER_FILE,
  parseOpeningMarkdown,
  type ParsedOpening,
  type ParsedVariation,
} from './parser.ts';

/**
 * Pure validator that replays every variation's SAN moves using chess.js.
 * Invalid variations are marked valid=false and their errors are recorded,
 * without crashing or disabling valid variations in the same file.
 */
export function validateOpening(parsed: ParsedOpening): ParsedOpening {
  const errors = [...parsed.errors];
  const validatedVariations: ParsedVariation[] = [];

  if (parsed.variations.length > MAX_VARIATIONS_PER_FILE) {
    const limitMsg = `File has ${parsed.variations.length} variations; maximum allowed is ${MAX_VARIATIONS_PER_FILE}.`;
    if (!errors.includes(limitMsg)) {
      errors.push(limitMsg);
    }
  }

  for (const variation of parsed.variations) {
    const varErrors = [...variation.errors];

    if (variation.hasMovesBlock && variation.moves.length > 0) {
      const chess = new Chess();
      for (let i = 0; i < variation.moves.length; i += 1) {
        const token = variation.moves[i];
        const ply = i + 1;
        try {
          chess.move(token);
        } catch {
          const moveErr = `Variation "${variation.name}": move ${ply} (${token}) is not legal`;
          varErrors.push(moveErr);
          errors.push(moveErr);
          break;
        }
      }
    }

    validatedVariations.push({
      ...variation,
      valid: variation.valid && varErrors.length === 0,
      errors: varErrors,
    });
  }

  return {
    ...parsed,
    variations: validatedVariations,
    errors,
  };
}

/**
 * Convenience helper combining pure Markdown parsing and chess.js move validation.
 */
export function parseAndValidateOpening(rawText: string): ParsedOpening {
  const parsed = parseOpeningMarkdown(rawText);
  return validateOpening(parsed);
}
