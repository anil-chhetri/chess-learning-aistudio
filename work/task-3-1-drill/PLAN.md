# PLAN - Task 3.1: Two-Level Selection & Drill State Machine

## 1. Goal
Allow users to pick an opening and click any variation card to drill that exact line from start to completion via an explicit state machine (`IDLE`, `USER_TURN`, `OPPONENT_TURN`, `VARIATION_COMPLETE`) with board locking and FEN snapshot rollback on mistakes.

## 2. Inputs & Outputs
- Input: Selected opening path + `ParsedVariation`, user board moves `(from, to, promotion?)`, and `700ms` opponent reply timer.
- Output: Pure `DrillState` transitions (`src/lib/drill.ts`) updating FEN, move history, `drillIndex`, `mistakes`, and `wrongSquare`.

## 3. Steps
1. Define `DRILL_STATES` and pure transition functions in `src/lib/drill.ts`.
2. Update `OpeningList.tsx` to render two-level selection: Opening -> Variation cards (`Name`, `ECO`, `playerColor`, `plies`, recorded mistakes).
3. Update `ChessBoard.tsx` with `locked` prop so clicks are ignored during `OPPONENT_TURN` and `VARIATION_COMPLETE`.
4. Snapshot FEN before every user move; restore snapshot and flash target square red on wrong SAN move.
5. Auto-play opponent replies after `OPPONENT_DELAY_MS = 700`ms, clearing timers cleanly on variation switch or reset.

## 3b. State Table
| From | Event | To | Side effects |
|------|-------|----|--------------|
| `IDLE` | `startVariationDrill` (White) | `USER_TURN` | Reset FEN, orientation = white, `drillIndex = 0` |
| `IDLE` | `startVariationDrill` (Black) | `OPPONENT_TURN` | Reset FEN, orientation = black, lock board, schedule 700ms reply |
| `USER_TURN` | Wrong SAN move | `USER_TURN` | Restore FEN snapshot, `mistakes++`, flash `wrongSquare` 650ms |
| `USER_TURN` | Correct SAN move (more moves left) | `OPPONENT_TURN` | Advance `drillIndex`, clear hints, schedule 700ms reply |
| `USER_TURN` | Correct SAN move (final move) | `VARIATION_COMPLETE` | Advance `drillIndex`, lock board, play completion tone |
| `OPPONENT_TURN` | User clicks board | `OPPONENT_TURN` | Ignored (board locked) |
| `OPPONENT_TURN` | 700ms timer fires (more moves left) | `USER_TURN` | Play opponent SAN move, `drillIndex++` |
| `OPPONENT_TURN` | 700ms timer fires (final move) | `VARIATION_COMPLETE` | Play opponent SAN move, `drillIndex++`, lock board |
| `VARIATION_COMPLETE` | `Reset` / `Auto-Loop` / `Practice All` | `USER_TURN` or `OPPONENT_TURN` | Restart variation or load next variation |

## 4. Files I Will Touch
- Create: `src/lib/drill.ts`, `tests/drill.test.mjs`
- Edit: `src/components/ChessBoard.tsx`, `src/components/OpeningList.tsx`, `src/lib/sound.ts`, `src/App.tsx`

## 5. Edge Cases
- Clicking board during `OPPONENT_TURN` or `VARIATION_COMPLETE` -> ignored completely.
- Switching variations mid-timer -> cancels pending timeout so stale replies never fire.
- Invalid variation -> card disabled; `startVariationDrill` returns `IDLE` safely.

## 6. How I Will Prove It Works
- `npm test` (`tests/drill.test.mjs` tests 1–4 covering White & Black 6-move variations, FEN rollback, and board lock).

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved.
