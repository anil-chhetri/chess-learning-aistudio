# PLAN - Task 3.4: Practice and Test Session Modes

## 1. Goal
Add a Practice vs Test session switcher above the board so learners can study unfamiliar lines with automatic move-direction arrows and SAN cues in Practice mode, or recall moves from memory in Test mode with the existing drill behavior and on-demand Hint button.

## 2. Inputs & Outputs
- Input: Current `DrillState`, `boardOrientation`, and user-selected `sessionMode` (`'practice' | 'test'`).
- Output:
  - `computeGuidedMove(state)` in `src/lib/drill.ts` returning `{ san, from, to }` during `USER_TURN`.
  - `getSquareCenter` and `getArrowGeometry` in `src/lib/boardGeometry.ts` computing `800x800` SVG coordinates adjusted for White/Black board orientation.
  - Directional SVG arrow overlay and source/target square highlights on `ChessBoard` during Practice `USER_TURN` (and on Test `Hint` clicks).
  - Practice/Test segmented control and guided status banner in `src/App.tsx`.

## 3. Steps
1. Export `computeGuidedMove(state)` from `src/lib/drill.ts` and share its resolution logic with `computeHintSquares`.
2. Create pure `src/lib/boardGeometry.ts` to map algebraic squares to `800x800` SVG coordinates for both White and Black orientations.
3. Add `arrowMove` prop and pointer-events-none SVG arrow overlay to `src/components/ChessBoard.tsx` inside the 8x8 board container below the promotion modal.
4. Add `sessionMode` (`'practice' | 'test'`) segmented switcher above the status bar in `src/App.tsx`, displaying `Practice · Play <SAN> (<from> → <to>)` and automatic arrows in Practice mode while keeping Test mode identical to the existing drill.
5. Add unit tests for `computeGuidedMove` and `getArrowGeometry` in `tests/drill.test.mjs`.

## 4. Files I Will Touch
- Create: `src/lib/boardGeometry.ts`, `work/task-3-4-practice-test-modes/{PLAN,ASSUMPTIONS,NOTES,TEST-REPORT}.md`
- Edit: `src/lib/drill.ts`, `src/components/ChessBoard.tsx`, `src/App.tsx`, `tests/drill.test.mjs`, `ROADMAP.md`

## 5. Edge Cases
- Board flipped (`orientation === 'black'`): SVG arrow coordinates invert horizontally and vertically so the arrow still connects the exact origin and destination squares.
- `OPPONENT_TURN` or `VARIATION_COMPLETE`: `computeGuidedMove` returns `null`, hiding any arrow while the opponent replies or after completion.
- Switching from Practice to Test mid-drill: clears any transient `hintSquares` so Test mode never leaks the automatic Practice hint.

## 6. How I Will Prove It Works
- `npm test` (`tests/drill.test.mjs` tests 8–9) + `npm run validate-content` + `npm run lint` + `npm run build`.

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved.
