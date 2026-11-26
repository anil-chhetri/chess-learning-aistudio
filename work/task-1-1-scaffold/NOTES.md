# NOTES - Task 1.1: Repo, GitHub Pages Pipeline & Responsive Layout Shell

## Decisions Made
- Kept the starter Vite + React + TypeScript + Tailwind stack instead of rewriting to plain unbundled HTML/JS so all workspace build/lint tools and Tailwind v4 work seamlessly, while configuring `base: './'` and GitHub Actions (`deploy-pages.yml`) so it still deploys as a 100% static GitHub Pages site.
- Added `--legacy-peer-deps` and removed `cache: npm` in `.github/workflows/deploy-pages.yml` because the repo ships `bun.lock` (no `package-lock.json`) and `vite@8.4.0` declares `peerOptional esbuild@"^0.27.0 || ^0.28.0"` against `package.json`'s `esbuild@^0.25.0`.
- Switched the grid from a single 3-column breakpoint at `1024px` (`lg:`) to a 3-tier layout:
  1. `< 768px`: 1-column vertical stack + dedicated mobile view switcher below the top bar.
  2. `768px–1279px`: 2-column layout (board on left, library + notes stacked on right) so split-pane previews and tablets never crush the board.
  3. `1280px+`: 3-column layout (`max-w-[1680px]`, equal-height cards via `items-stretch`) so wide monitors have balanced density without empty margins.

## Things I Tried & Rejected
- Fixed `w-[min(92vw,640px)]` inside a `1024px` 3-column grid: rejected after preview testing showed `92vw` is relative to viewport width rather than the grid track width, causing the board to overflow into sidebars on ~1024px split windows.
- `npm ci` with `cache: npm` in GitHub Actions: rejected after CI failed with `Dependencies lock file is not found` (`bun.lock` is not supported by `setup-node`'s npm cache).
