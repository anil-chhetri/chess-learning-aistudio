# PLAN - Task 1.1: Repo & Responsive Layout Shell

## 1. Goal
Deliver a responsive 3-column layout shell (Opening Library | Chessboard | Notes & History) with mobile vertical stacking and zero console errors.

## 2. Inputs & Outputs
- Input: Static assets, bundled piece SVGs (`public/assets/pieces/*.svg`), and typography configuration.
- Output: Responsive React + Vite + Tailwind UI shell at port 3000 with 3-zone top bar (`Board`, `Parser Lab`, `Format Spec`, `Reset Board`).

## 3. Steps
1. Configure `metadata.json`, `index.html`, and `src/index.css` with Fraunces, Plus Jakarta Sans, and JetBrains Mono.
2. Bundle 12 Staunton SVG pieces under `public/assets/pieces/`.
3. Implement 3-column grid (`lg:grid-cols-[290px_minmax(0,1fr)_320px]`) collapsing to vertical stack on mobile with `min(92vw, 560px)` board container.

## 4. Files I Will Touch
- Create: `public/assets/pieces/*.svg`, `src/components/OpeningList.tsx`, `src/components/NotesPanel.tsx`, `src/components/FormatSpecView.tsx`, `README.md`, `ROADMAP.md`
- Edit: `index.html`, `metadata.json`, `src/index.css`, `src/App.tsx`

## 5. Edge Cases
- Narrow mobile viewports (375px width) stack columns cleanly without horizontal overflow.
- Loading, empty, and error states rendered cleanly when content is missing or invalid.

## 6. How I Will Prove It Works
- `npm run build` and `npm run lint` succeed with 0 errors.

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved.
