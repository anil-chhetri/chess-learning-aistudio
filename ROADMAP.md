# Roadmap — Chess Opening Trainer

| ID | Phase | Goal | Acceptance Criteria | Status | Depends On |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1.1-scaffold` | Phase 1 | Responsive 3-column layout shell (Opening List \| Board \| Notes), mobile vertical stack, clean console | Live URL loads, responsive down to 375px, 0 console errors | Done | — |
| `1.2-parser` | Phase 1 | Pure Markdown parser + `chess.js` move validator + automated unit tests | Passes all required happy & broken-path tests; `queens-gambit.md` parses with 0 errors | Done | `1.1-scaffold` |
| `1.3-board` | Phase 1 | Interactive CSS Grid chessboard with bundled Staunton SVGs, click-to-move, legal/capture highlights, move history, and keyboard accessibility | Click piece highlights legal moves (green) & captures (red); illegal clicks ignored; board updates, history updates, turn flips; works on mobile tap | Done | `1.1-scaffold`, `1.2-parser` |
| `2.1-manifest` | Phase 2 | Auto-generate `manifest.json` via GitHub Actions on `lines/**` changes | Pushing a `.md` file updates `manifest.json` with `[skip ci]` | Planned | `1.2-parser` |
| `2.2-library` | Phase 2 | Fetch `manifest.json` (`no-store`) and load multiple openings with error banner | 3+ sample openings load and display; broken files show clear error banner | Planned | `2.1-manifest` |
| `3.1-drill` | Phase 3 | Variation drill state machine (`IDLE`, `USER_TURN`, `OPPONENT_TURN`, `VARIATION_COMPLETE`) | Drill completes as White & Black; board locked during opponent reply | Planned | `1.2-parser`, `1.3-board` |
| `3.2-controls` | Phase 3 | Coaching controls (Hint, Reset, Auto-Loop, Practice All) + mistakes/progress | Hint highlights source + target; Practice All cycles `1..N` | Planned | `3.1-drill` |
| `3.3-persistence` | Phase 3 | Persist `lastOpening`, `lastVariation`, `mistakesByVariation` in `localStorage` | Page refresh restores active variation and mistake counts | Planned | `3.2-controls` |
