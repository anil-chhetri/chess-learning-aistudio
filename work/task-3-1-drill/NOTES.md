# NOTES - Task 3.1: Two-Level Selection & Drill State Machine

## Decisions Made
- Placed the entire drill state machine in pure TypeScript (`src/lib/drill.ts`) with zero DOM or React dependencies so all transitions, FEN snapshot rollbacks, and board-lock invariants run directly in `node --test`.
- Kept `clearPendingTimers()` centralized in `App.tsx` so switching openings/variations or clicking Reset always cancels pending `700ms`, `650ms`, and `1500ms` timers.

## Things I Tried & Rejected
- Storing drill progress flags across multiple React booleans (`isWaitingOpponent`, `isComplete`, `isLocked`): rejected per Developer Guide §1.4 in favor of a single `DrillState` object with `DRILL_STATES`.
