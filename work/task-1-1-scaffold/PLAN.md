# PLAN - Task 1.1: Repo, GitHub Pages Pipeline & Responsive Layout Shell

## 1. Goal
Deliver a responsive layout shell (Opening Library | Chessboard | Notes & History) with automated GitHub Pages deployment from `dist/` and zero console errors across mobile, tablet/split-pane, and wide desktop viewports.

## 2. Inputs & Outputs
- Input: Static assets, bundled piece SVGs (`public/assets/pieces/*.svg`), and Vite/TypeScript build configuration.
- Output: Responsive React + Vite + Tailwind UI shell (`dist/` built via `.github/workflows/deploy-pages.yml`) with a 3-zone top bar (`Board`, `Parser Lab`, `Format Spec`, `Reset Board`) and mobile view switcher.

## 3. Steps
1. Configure `metadata.json`, `index.html`, and `src/index.css` with Fraunces, Plus Jakarta Sans, and JetBrains Mono.
2. Bundle 12 Staunton SVG pieces under `public/assets/pieces/`.
3. Implement responsive grid in `src/App.tsx`:
   - Mobile (`< 768px`): 1-column stack (Board -> Opening Library -> Notes) + mobile tab bar.
   - Tablet / Split-Pane (`768px–1279px`): 2-column layout (Board left, Opening Library + Notes stacked right).
   - Desktop (`1280px+`): 3-column layout (`Opening Library | Board | Notes & History`) stretched to equal height inside `max-w-[1680px]`.
4. Set `base: './'` in `vite.config.ts` so relative assets work on any GitHub Pages subpath.
5. Add `.github/workflows/deploy-pages.yml` to run lint, unit tests, content validation, `vite build`, and publish `dist/` via `actions/deploy-pages@v4`.

## 4. Files I Will Touch
- Create: `public/assets/pieces/*.svg`, `src/components/OpeningList.tsx`, `src/components/NotesPanel.tsx`, `src/components/FormatSpecView.tsx`, `.github/workflows/deploy-pages.yml`, `README.md`, `ROADMAP.md`
- Edit: `index.html`, `metadata.json`, `src/index.css`, `src/App.tsx`, `vite.config.ts`, `package.json`

## 5. Edge Cases
- Narrow mobile viewports (`375px`): hide desktop nav in header and render dedicated mobile tab bar to prevent horizontal overflow.
- Split-pane preview windows (`768px–1279px`): switch to 2 columns instead of squeezing a 3-column grid so the board never overlaps sidebars.
- Missing `package-lock.json` (workspace uses `bun.lock`) and `vite@8.4.0` `peerOptional esbuild` mismatch: CI avoids `cache: npm` and runs `npm install --legacy-peer-deps`.
- Loading, empty, and error states rendered cleanly when content is missing or invalid.

## 6. How I Will Prove It Works
- `npm run lint`, `npm test`, `npm run validate-content`, and `npm run build` pass with exit code 0.
- `dist/index.html` emits relative `./assets/...` URLs.
- GitHub Actions `Deploy to GitHub Pages` workflow builds and deploys cleanly.

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved. Updated after Phase 1 wrap-up to capture GitHub Pages pipeline and responsive 1/2/3-column breakpoint refinements.
