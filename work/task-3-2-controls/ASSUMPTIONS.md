# ASSUMPTIONS - Task 3.2: Coaching Controls

| # | Assumption | Why I Made It | What Happens If It's Wrong |
|---|------------|---------------|----------------------------|
| A1 | `LOOP_DELAY_MS` is `1500`ms for both `Auto-Loop` and `Practice All` | Project Plan §5 Task 3.2 ("wait 1.5s") | Single constant in `src/lib/drill.ts` |
| A2 | `Auto-Loop` and `Practice All` are mutually exclusive toggles | Enabling both simultaneously would create ambiguous post-completion behavior | Turning one ON automatically toggles the other OFF |
| A3 | `Practice All` stops after completing variation `N` with a completion message | Project Plan §5 Task 3.2 ("start next variation 1..N ... finish all variations in a file") | Users see `"All variations complete!"` when finishing the final line |
