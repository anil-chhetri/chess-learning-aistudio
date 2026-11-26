# ASSUMPTIONS - Task 1.1: Repo, GitHub Pages Pipeline & Responsive Layout Shell

| # | Assumption | Why I Made It | What Happens If It's Wrong |
|---|------------|---------------|----------------------------|
| A1 | GitHub Pages serves from `dist/` built by GitHub Actions rather than raw `main` branch | Starter workspace uses Vite + React + TypeScript (`vite.config.ts`, `tsconfig.json`) | Workflow `.github/workflows/deploy-pages.yml` builds `dist/` automatically; repo Settings -> Pages must use Source = GitHub Actions |
| A2 | Repo may be hosted at `https://<user>.github.io/<repo>/` subpath | Standard project Pages URL structure | Setting `base: './'` in `vite.config.ts` and using relative `assets/...` and `lines/...` paths prevents 404s on subpaths |
| A3 | `package-lock.json` is absent in the starter repo (which uses `bun.lock`) | Observed in workspace root | Workflow avoids `cache: npm` and falls back to `npm install --legacy-peer-deps` |
| A4 | `vite@8.4.0` has an optional peer conflict with `esbuild@^0.25.0` under strict npm | Observed during GitHub Actions `npm install` (`ERESOLVE`) | Passing `--legacy-peer-deps` resolves `vite` cleanly without altering local workspace packages |
| A5 | Preview panes and tablets (`768px–1279px`) lack room for 3 side-by-side columns | Observed `lg:grid-cols-[310px_1fr_340px]` squeezing center column below board width | Using 2 columns (`md` to `xl`) and 3 columns (`xl+`) prevents horizontal overflow on every viewport |
