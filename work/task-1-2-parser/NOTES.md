# NOTES - Task 1.2: Parser & Validator

## Decisions Made
- Kept `src/lib/parser.ts` strictly pure (no DOM, no `fetch`, no `chess.js` import) and placed `chess.js` move replay inside `src/lib/validate.ts`.
- Used an erasable `const ParseState = { ... } as const` object instead of a TypeScript `enum` so Node 22 (`node --test tests/*.test.mjs`) executes the TypeScript modules directly with zero transpiler step.
- Supported both `## <Name>` and `## Variation: <Name>` variation headings while reserving `## Notes` for opening-level notes, reconciling both spec examples cleanly.

## Things I Tried & Rejected
- TypeScript `enum ParseState`: rejected because Node 22 strip-types mode throws `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` on enums.
- `node --test tests/` without a glob: rejected because Node 22 attempts to resolve `tests/index.js` unless passed `tests/*.test.mjs`.
