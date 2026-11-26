# PLAN - Task 3.2: Coaching Controls & Right Panel Progress

## 1. Goal
Add the four coaching buttons (`Hint`, `Reset`, `Auto-Loop`, `Practice All`) and display variation notes, ECO code, mistake count, and `Move X / Y` progress in the right panel.

## 2. Inputs & Outputs
- Input: Active `DrillState`, `autoLoop` toggle, `practiceAll` toggle, and opening variations list.
- Output: Dual-square hint highlights (`from` + `to`), instant drill reset, `1500ms` auto-loop/practice-all transitions, and live `Move X / Y` + `Mistakes: N` HUD.

## 3. Steps
1. Implement `computeHintSquares()` and `getNextPracticeVariation()` in `src/lib/drill.ts`.
2. Render source + target hint highlights in `ChessBoard.tsx` (amber origin + sky target).
3. Render the 4 coaching buttons (`Hint`, `Reset`, `Auto-Loop`, `Practice All`) in `App.tsx`, keeping `Auto-Loop` and `Practice All` mutually exclusive.
4. Update `NotesPanel.tsx` to display `Move X / Y`, `Mistakes: N`, progress bar, `ECO`, and `variation.notes`.

## 4. Files I Will Touch
- Edit: `src/lib/drill.ts`, `src/components/ChessBoard.tsx`, `src/components/NotesPanel.tsx`, `src/App.tsx`, `tests/drill.test.mjs`

## 5. Edge Cases
- Clicking Hint during `OPPONENT_TURN` -> disabled (`computeHintSquares` returns `null`).
- Finishing the final valid variation in `Practice All` -> displays `"All variations complete!"` instead of looping endlessly.

## 6. How I Will Prove It Works
- `npm test` (`tests/drill.test.mjs` tests 5–6) + `npm run lint` + `npm run build`.

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved.
