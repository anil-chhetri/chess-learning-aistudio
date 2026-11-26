# PLAN - Task 2.2: Load & Display Openings

## 1. Goal
Fetch `manifest.json` (`cache: 'no-store'`), fetch and parse all listed `.md` openings (Queen's Gambit, Sicilian Defense, King's Indian Defense), populate the Opening Library panel, and show clear error banners without crashing on missing or invalid files.

## 2. Inputs & Outputs
- Input: `manifest.json` + `lines/*.md` fetched at runtime via `src/lib/loader.ts`.
- Output: `{ openings: LoadedOpeningEntry[], errors: string[] }` rendered in `OpeningList.tsx` and top-level alert banner in `App.tsx`.

## 3. Steps
1. Author `public/lines/sicilian-defense.md` and `public/lines/kings-indian.md` per `OPENING_FORMAT.md`.
2. Build pure `loadOpeningsFromManifest()` in `src/lib/loader.ts` using `fetch(..., { cache: 'no-store' })`.
3. Update `OpeningList.tsx` to display multiple expandable openings and their variations.
4. Wire `App.tsx` to load openings on mount, show `"Failed to load X. Check console."` banner on any fetch/parse failure, and sync `ParserLab.tsx` with all loaded files.

## 4. Files I Will Touch
- Create: `src/lib/loader.ts`, `public/lines/sicilian-defense.md`, `public/lines/kings-indian.md`, `tests/manifest-and-loader.test.mjs`
- Edit: `src/components/OpeningList.tsx`, `src/components/ParserLab.tsx`, `src/App.tsx`

## 5. Edge Cases
- `manifest.json` returns 404 or invalid JSON -> displays `"Failed to load manifest.json. Check console."` without blank page.
- Single `.md` file returns 404 or contains illegal moves -> displays `"Failed to load <file>. Check console."` while remaining valid openings load and function normally.

## 6. How I Will Prove It Works
- `npm test` (happy path + broken manifest + broken file tests)
- `npm run validate-content` (validates all 3 `.md` files)
- `npm run lint` and `npm run build`

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved.
