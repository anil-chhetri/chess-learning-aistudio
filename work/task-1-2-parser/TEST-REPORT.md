# TEST-REPORT - Task 1.2: Parser & Validator

## Automated Tests

Command: `npm test && npm run validate-content`

```
> react-example@0.0.0 test
> node --test tests/*.test.mjs

TAP version 13
ok 1 - 1. inherits playerColor from frontmatter when variation omits it
ok 2 - 2. allows variation-level playerColor to override file-level playerColor
ok 3 - 3. records illegal move in errors[] and disables only the broken variation
ok 4 - 4. records an error when a variation is missing its moves block
ok 5 - 5. records an error on empty file without throwing
ok 6 - 6. rejects uppercase playerColor instead of silently lowercasing
ok 7 - 7. rejects move numbers inside moves block and unknown frontmatter keys
ok 8 - 8. parses public/lines/queens-gambit.md with 0 errors
# tests 8
# suites 1
# pass 8
# fail 0

> react-example@0.0.0 validate-content
> node scripts/validate-content.mjs

PASS queens-gambit.md: "Queen's Gambit" (3 variations, 0 errors)
```
