# ASSUMPTIONS - Task 1.2: Parser & Validator

| # | Assumption | Why I Made It | What Happens If It's Wrong |
|---|------------|---------------|----------------------------|
| A1 | `playerColor` values are strictly lowercase `white` or `black` | `OPENING_FORMAT.md` §2 rule 3 | Parser reports an error in `errors[]` instead of silently lowercasing |
| A2 | Moves inside `moves` blocks contain SAN tokens without move numbers | `OPENING_FORMAT.md` §2 rule 7 | Parser flags move numbers (`1.`) with an explicit error message |
| A3 | Both `## Name` and `## Variation: Name` headings may appear across sample files | Reconciling Project Plan §3.1 and Developer Guide §2.1 | Parser accepts both forms cleanly while reserving `## Notes` for opening notes |
| A4 | Max 20 variations per file and max 40 plies per variation | `OPENING_FORMAT.md` §2 rule 8 | Parser/validator records clear limit error without crashing UI |
