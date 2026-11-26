# PLAN - Task 2.1: Manifest Generation via GitHub Actions

## 1. Goal
Generate `public/manifest.json` automatically via GitHub Actions whenever `public/lines/**` changes, without infinite CI loops or stale Pages caches.

## 2. Inputs & Outputs
- Input: `.md` files inside `public/lines/`.
- Output: Deterministic `public/manifest.json` (`{ "files": ["lines/..."] }`) committed with `[skip ci]` by `.github/workflows/build-manifest.yml` and also refreshed during `deploy-pages.yml`.

## 3. Steps
1. Implement deterministic `scripts/build-manifest.mjs` scanning `public/lines/*.md` sorted alphabetically.
2. Add `build-manifest` script to `package.json`.
3. Create `.github/workflows/build-manifest.yml` triggered on `push` to `main` (`paths: ['public/lines/**']`) committing `public/manifest.json` with `[skip ci]`.
4. Also invoke `npm run build-manifest` inside `.github/workflows/deploy-pages.yml` before `npm run build` so `[skip ci]` commits never leave `dist/manifest.json` stale on Pages.

## 4. Files I Will Touch
- Create: `scripts/build-manifest.mjs`, `.github/workflows/build-manifest.yml`, `public/manifest.json`
- Edit: `package.json`, `.github/workflows/deploy-pages.yml`

## 5. Edge Cases
- Unchanged manifest: workflow exits 0 without creating an empty commit.
- Infinite CI loop: `[skip ci]` + `paths: ['public/lines/**']` prevents self-retriggering.

## 6. How I Will Prove It Works
- `npm run build-manifest` generates `public/manifest.json` matching `public/lines/*.md`.
- Automated test in `tests/manifest-and-loader.test.mjs` verifies generated manifest matches disk.

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved.
