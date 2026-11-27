# PLAN - UX Sprint 2: Make It Feel Like A Trainer

## 1. Goal
Deliver all four Sprint 2 UX tasks:
- 2.1 Mastery status badge (`New`, `Learning`, `Mastered`) on every variation and mastery % per opening, persisted in `localStorage`.
- 2.2 Structured Study Notes (`Idea`, `Plan`, `Watch Out`) clamped to 1 line each by default with an expandable `Read more` toggle.
- 2.3 `CompletionModal` (`Line Complete!`, Accuracy %, elapsed Time, Moves, and `Practice Again`, `Next Line`, `Back to Library` actions).
- 2.4 Practice vs Test toggle tooltips and labels (`Practice: See hints & arrows` / `Test: No help, scored`) with Test mode disabling both arrows and the `Hint` button.

## 2. Files Created / Modified
- Created: `src/lib/mastery.ts`, `src/lib/notesParser.ts`, `src/components/StatusBadge.tsx`, `src/components/CompletionModal.tsx`
- Updated: `src/lib/storage.ts`, `src/components/BoardToolbar.tsx`, `src/components/OpeningList.tsx`, `src/components/NotesPanel.tsx`, `src/App.tsx`, `tests/drill.test.mjs`, `ROADMAP.md`
