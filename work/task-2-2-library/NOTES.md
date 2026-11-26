# NOTES - Task 2.2: Load & Display Openings

## Decisions Made
- Isolated fetch/parse pipeline in `src/lib/loader.ts` with an injectable `fetchFn` parameter so Node's built-in test runner tests real `manifest.json` + `.md` parsing + 404 failure paths deterministically without browser mocks.
- Loading a variation onto the board automatically sets board orientation to `variation.playerColor` (e.g., Black on bottom for Sicilian Defense and King's Indian Defense, White on bottom for Queen's Gambit).

## Things I Tried & Rejected
- Hiding the Opening Library whenever any single file has errors: rejected because users should still be able to study all valid openings while seeing the red error banner for the broken file.
