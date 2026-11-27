# NOTES - UX Sprint 1: Make The Core Loop Usable

## Implementation Notes
- Wrapped `ChessBoard` in `React.memo` and decoupled `MoveHistory`, `ProgressHeader`, `BoardToolbar`, and `TurnBanner` into dedicated components so history/progress updates never cause unnecessary board work.
- `TurnBanner` uses compositor-only CSS keyframes (`transform` and `opacity`) and respects `@media (prefers-reduced-motion: reduce)`.
- `formatVariationDisplay` splits variation names containing move notation (e.g., `Bishop Captures: 4...Bxd4 (Greco / Exchange Line)`) into bold Line 1 (`4... Bxd4`) and grey Line 2 (`Bishop Captures · Greco / Exchange Line`) with full word wrapping and zero `"..."` truncation.
