# ASSUMPTIONS - UX Sprint 1: Make The Core Loop Usable

1. Kept the app's existing configured display/body/mono fonts (`Fraunces`, `Plus Jakarta Sans`, `JetBrains Mono`) while applying the UX Developer Guide type scale (`20px`, `16px`, `14px`, `12px`), spacing, radii, and palette tokens (`#1A7F4B`, `#F59E0B`, `#EBECD0`, `#739552`, `#F6F669`).
2. `Accuracy %` is derived dynamically via `calculateAccuracy(correctMoves, mistakes)` and defaults to `100%` before the first attempt.
3. Included the debounced (200ms) Search bar in `OpeningList` in Sprint 1 so Sprint 1.2's `"Search 'Greco' filters to 1 result"` testable criterion works immediately.
