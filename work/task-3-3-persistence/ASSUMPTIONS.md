# ASSUMPTIONS - Task 3.3: Persistence

| # | Assumption | Why I Made It | What Happens If It's Wrong |
|---|------------|---------------|----------------------------|
| A1 | `localStorage` keys are `lastOpening`, `lastVariation`, `mistakesByVariation` | Project Plan §5 Task 3.3 | Exact key names match the specification |
| A2 | Variation keys use `${openingPath}::${variationName}` | Prevents collision if two openings both contain a `"Classical"` variation | Uniquely identifies each variation across files |
| A3 | `localStorage` may be unavailable or throw in restricted contexts | Private browsing / Node test runner | All read/write calls guard with `try/catch` and injectable `StorageLike` |
