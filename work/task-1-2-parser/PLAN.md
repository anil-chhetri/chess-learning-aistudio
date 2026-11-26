# PLAN - Task 1.2: Parser & Validator

## 1. Goal
Parse Markdown opening files into structured variation data using a pure, single-pass line-based state machine and validate move legality with `chess.js` without throwing on malformed input.

## 2. Inputs & Outputs
- Input: Raw Markdown string following `/docs/OPENING_FORMAT.md`.
- Output: `{ formatVersion, title, playerColor, tags, notes, variations[], errors[] }`.

## 3. Steps
1. Split input on `\n` (normalizing `\r\n`).
2. Run state machine: `INIT` -> `FRONTMATTER` -> `OPENING_BODY` / `OPENING_NOTES` -> `VARIATION_META` -> `NOTES` -> `MOVES`.
3. Inherit `playerColor` from frontmatter when omitted; allow variation-level override.
4. Validate move tokens sequentially via `chess.js` in `src/lib/validate.ts`.
5. Record all structural or legality errors in `errors[]` and mark only invalid variations disabled (`valid: false`).

## 4. Files I Will Touch
- Create: `src/lib/parser.ts`, `src/lib/validate.ts`, `public/lines/queens-gambit.md`, `tests/parser.test.mjs`, `scripts/validate-content.mjs`, `docs/OPENING_FORMAT.md`, `src/components/ParserLab.tsx`

## 5. Edge Cases
- Empty file
- Missing `moves` block
- Illegal SAN move (disables broken variation only)
- Uppercase `playerColor` (rejected, not silently lowercased)
- Move numbers inside `moves` block and unknown frontmatter keys

## 6. How I Will Prove It Works
- `npm test` (`node --test tests/*.test.mjs`)
- `npm run validate-content` (`node scripts/validate-content.mjs`)

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved. Switched `ParseState` from TS `enum` to `const` object so Node 22 strip-types runs tests directly with zero transpiler overhead.
