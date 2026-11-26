# NOTES - Task 3.3: Persistence

## Decisions Made
- Injected `StorageLike` into `src/lib/storage.ts` so persistence logic and corrupted-JSON recovery are unit-tested directly under Node without browser DOM globals.
- Stored `mistakesByVariation` on every wrong move and cleared the entry for the active variation when the user explicitly clicks `Reset` or when `Auto-Loop`/`Practice All` starts a fresh run.
