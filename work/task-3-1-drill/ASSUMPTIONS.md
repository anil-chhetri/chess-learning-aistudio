# ASSUMPTIONS - Task 3.1: Two-Level Selection & Drill State Machine

| # | Assumption | Why I Made It | What Happens If It's Wrong |
|---|------------|---------------|----------------------------|
| A1 | `OPPONENT_DELAY_MS` is `700`ms | Project Plan §5 Task 3.1 ("auto-play after 700ms") | Single named constant in `src/lib/drill.ts` can be tuned in one place |
| A2 | Clicking a variation starts drilling immediately | Project Plan §5 Task 3.1 flow ("Click Variation -> Reset board to start...") | Keeps two-level selection effortless without extra start buttons |
| A3 | User move matching compares `chess.js` normalized SAN (`playedMove.san === expectedSan`) | Handles castling (`O-O`), captures (`dxc4`), check `+` consistently | `validate.ts` already verified all line tokens via `chess.js` |
