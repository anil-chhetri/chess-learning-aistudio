# TEST-REPORT - UX Sprint 1: Make The Core Loop Usable

## Automated Tests
Command: `npm run build-manifest && npm run validate-content && npm test && npm run lint && npm run build`

```
Generated public/manifest.json with 4 opening files.
PASS italian-gambit.md: "Italian Gambit" (6 variations, 0 errors)
PASS kings-indian.md: "King's Indian Defense" (3 variations, 0 errors)
PASS queens-gambit.md: "Queen's Gambit" (3 variations, 0 errors)
PASS sicilian-defense.md: "Sicilian Defense" (3 variations, 0 errors)

ok 10 - 10. Sprint 1: calculateAccuracy and repeated wrong-move feedback behave per spec
ok 11 - 11. Sprint 1: formatVariationDisplay and filterOpeningsByQuery isolate move text and filter Greco to 1 result
# tests 24
# suites 3
# pass 24
# fail 0

> react-example@0.0.0 lint
> tsc --noEmit

> react-example@0.0.0 build
> vite build
✓ built in 790ms
```
