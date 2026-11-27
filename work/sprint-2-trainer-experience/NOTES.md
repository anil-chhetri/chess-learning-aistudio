# NOTES - UX Sprint 2: Make It Feel Like A Trainer

## Implementation Notes
- `src/lib/mastery.ts` and `src/lib/notesParser.ts` are pure TypeScript modules with zero DOM dependencies so Node 22 native test runner (`node --test`) validates both state transitions and all 4 opening `.md` files directly.
- `storage.ts` sanitizes persisted `variationStats` defensively on load so partial or corrupted `localStorage` entries never crash the UI.
- `CompletionModal` supports `Escape` dismissal (`Back to Library`) and tracks per-run elapsed time without running a per-second `setInterval` during play.
