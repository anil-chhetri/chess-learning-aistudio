# PLAN - Task 3.3: Persistence

## 1. Goal
Persist `lastOpening`, `lastVariation`, and `mistakesByVariation` in `localStorage` so refreshing the page returns to the same opening and variation with its recorded mistake count intact.

## 2. Inputs & Outputs
- Input: Opening path, variation name, and per-variation mistake counts.
- Output: Safe `localStorage` read/write helpers in `src/lib/storage.ts` hydrated on mount in `src/App.tsx`.

## 3. Steps
1. Implement `loadTrainerProgress`, `saveLastSelection`, and `saveMistakesByVariation` in `src/lib/storage.ts`.
2. Key `mistakesByVariation` by `${openingPath}::${variationName}` so identically named variations in different openings do not collide.
3. On app mount after loading `manifest.json`, restore `lastOpening`, `lastVariation`, and `mistakesByVariation[key]`.
4. Save updates immediately whenever selection changes, a mistake occurs, or Reset clears mistakes for that variation.

## 4. Files I Will Touch
- Create: `src/lib/storage.ts`
- Edit: `src/App.tsx`, `src/components/OpeningList.tsx`, `tests/drill.test.mjs`

## 5. Edge Cases
- Corrupted JSON in `localStorage` -> falls back safely to empty `mistakesByVariation` without crashing.
- Previously saved opening or variation deleted from `/lines/` -> falls back gracefully to the first available valid opening/variation.

## 6. How I Will Prove It Works
- `npm test` (`tests/drill.test.mjs` test 7) + `npm run lint` + `npm run build`.

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved.
