# TEST-REPORT - Task 1.1: Repo, GitHub Pages Pipeline & Responsive Layout Shell

## Automated Checks
Command: `npm test && npm run validate-content && npm run lint && npm run build`

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

> react-example@0.0.0 lint
> tsc --noEmit

> react-example@0.0.0 build
> vite build

dist/index.html                   1.29 kB │ gzip:   0.57 kB
dist/assets/index-Bv1nsYSQ.css   25.70 kB │ gzip:   5.97 kB
dist/assets/index-ABTPFnnT.js   514.69 kB │ gzip: 153.73 kB
✓ built in 670ms
```

## GitHub Pages & Responsive Verification
- Verified `dist/index.html` emits relative asset URLs (`./assets/index-*.js`, `./assets/index-*.css`).
- Verified `.github/workflows/deploy-pages.yml` builds `dist/` with `--legacy-peer-deps` and deploys via `actions/deploy-pages@v4`.
- Responsive layout verified across mobile (`< 768px` vertical stack), tablet/split-pane (`768px–1279px` 2-column layout), and wide desktop (`1280px+` 3-column equal-height layout).
