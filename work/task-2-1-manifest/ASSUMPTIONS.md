# ASSUMPTIONS - Task 2.1: Manifest Generation via GitHub Actions

| # | Assumption | Why I Made It | What Happens If It's Wrong |
|---|------------|---------------|----------------------------|
| A1 | All runtime opening Markdown files live under `public/lines/` | Vite serves `public/` at site root (`lines/*.md`) and copies it into `dist/lines/*.md` | `build-manifest.mjs` accepts custom paths for testing; workflow watches `public/lines/**` |
| A2 | Committing `public/manifest.json` with `[skip ci]` suppresses `deploy-pages.yml` on that commit | GitHub Actions skips all workflows on `[skip ci]` | `deploy-pages.yml` runs `npm run build-manifest` itself prior to `npm run build`, guaranteeing fresh `dist/manifest.json` |
| A3 | Manifest omits volatile timestamps | Deterministic JSON avoids unnecessary git diffs | Diff checks (`git diff --quiet`) stay accurate |
