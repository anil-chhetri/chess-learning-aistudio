# NOTES - Task 2.1: Manifest Generation via GitHub Actions

## Decisions Made
- Made `public/manifest.json` deterministic (`{ "files": [...] }`, sorted lexicographically) without `generatedAt` timestamps so re-running `npm run build-manifest` produces zero diff when no `.md` files changed.
- Added `npm run build-manifest` inside `deploy-pages.yml` as well as `build-manifest.yml` so pushing a new `.md` file updates both the committed `public/manifest.json` (with `[skip ci]`) and the deployed `dist/manifest.json` on the same push.

## Things I Tried & Rejected
- Adding a `generatedAt` timestamp to `manifest.json`: rejected because it causes noisy commits on manual `workflow_dispatch` runs when nothing changed.
