# PLAN - UX Sprint 1: Make The Core Loop Usable

## 1. Goal
Deliver all four Sprint 1 UX improvements using the Design System tokens (`src/styles/tokens.css`) and modular component architecture:
- 1.1 Prominent 48px `TurnBanner` above board with Practice (`Your Move: Play <SAN>`), Test (`Your Move`), `Correct!` green pulse (600ms auto-advance), and `Not quite, try again` red shake + `Mistakes + 1`.
- 1.2 Non-truncated 3-line variation cards in `OpeningList` + debounced (200ms) Search input.
- 1.3 `ProgressHeader` replacing `"Move 0 / 29"` with Progress Bar, `Move X of Y`, `Accuracy: Z%`, and `Mistakes: N`.
- 1.4 Move FEN + Copy out of the right panel into a `...` menu in `BoardToolbar`, promoting `MoveHistory` and `Study Notes` in the right panel.

## 2. Files Created / Modified
- Created: `src/styles/tokens.css`, `src/lib/variationDisplay.ts`, `src/components/Button.tsx`, `src/components/TurnBanner.tsx`, `src/components/BoardToolbar.tsx`, `src/components/ProgressHeader.tsx`, `src/components/MoveHistory.tsx`
- Updated: `src/index.css`, `src/lib/drill.ts`, `src/components/ChessBoard.tsx`, `src/components/OpeningList.tsx`, `src/components/NotesPanel.tsx`, `src/App.tsx`, `tests/drill.test.mjs`, `ROADMAP.md`
