# Chess Opening Trainer

A static, browser-only chess opening trainer that turns human-readable Markdown files into interactive board studies. Hosted on GitHub Pages with zero backend or database.

---

## Quick Start (Local Development)

```bash
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000` in your browser.

### Useful Commands

| Command | What It Does |
| :--- | :--- |
| `npm run dev` | Start the local Vite dev server on port 3000 |
| `npm run build-manifest` | Scan `public/lines/*.md` and regenerate `public/manifest.json` |
| `npm run validate-content` | Parse and replay every `.md` file in `public/lines/` using `chess.js` |
| `npm test` | Run all parser, validator, and manifest-loader unit tests |
| `npm run lint` | Run TypeScript typechecking (`tsc --noEmit`) |
| `npm run build` | Build the static production site into `dist/` |

---

## Built-In App Views (Board, Parser Lab & Format Spec)

The top navigation bar provides three views:

1. **Board** — The main three-column study workspace (**Opening Library**, interactive legal-move **Chessboard**, and **Study Notes / Move History / FEN**). Select any opening and variation, read its notes, click **Load Line on Board** to replay its moves, or play moves manually to inspect legal targets and captures.
2. **Parser Lab** — A live in-browser sandbox for testing the Markdown parser (`src/lib/parser.ts`) and `chess.js` move validator (`src/lib/validate.ts`). You can:
   - Click any loaded opening (such as **Queen's Gambit**, **Sicilian Defense**, or **King's Indian Defense**) to inspect its raw Markdown and parsed JSON output.
   - Click the 5 built-in test presets (**1. Inherits playerColor**, **2. Overrides playerColor**, **3. Illegal Move Error**, **4. Missing Moves Block**, **5. Empty File**) to see how the parser handles valid files and isolates broken variations into `errors[]` without crashing.
   - Paste or type your own custom opening Markdown into the editor to verify `0 errors` and check move legality before committing a new `.md` file.
3. **Format Spec** — An in-app quick reference showing **The Five Rules** of the opening content contract alongside a ready-to-copy reference Markdown template so you can author new openings without leaving the app.

---

## What To Do After Adding a New Markdown File to `public/lines/`

> **Important folder note:** Opening Markdown files live in **`public/lines/`** (Vite serves them at `/lines/...` in the app and copies them into `dist/lines/` during build). Never edit `public/manifest.json` by hand — it is generated automatically.

### A. If You Are Testing Locally (Before Pushing)

Right after saving a new file such as `public/lines/ruy-lopez.md`, run:

```bash
npm run validate-content
npm run build-manifest
```

1. **`npm run validate-content`** checks your frontmatter, formatting, and every chess move's legality with `chess.js`. If there is a typo (for example `Nf6` instead of `Nc6`), it tells you the exact variation and move number.
2. **`npm run build-manifest`** updates `public/manifest.json` so your local dev server (`npm run dev`) knows the new file exists.
3. Refresh `http://localhost:3000` in your browser — your new opening will appear in the **Opening Library** panel immediately.

### B. If You Are Publishing to GitHub Pages (Push to `main`)

1. Commit and push your new `.md` file in `public/lines/` to `main` (you can also push an updated `public/manifest.json`, or leave it to GitHub Actions).
2. Two GitHub Actions workflows run automatically:
   - **`Build Opening Manifest` (`.github/workflows/build-manifest.yml`)** watches `public/lines/**`, regenerates `public/manifest.json`, and commits it back with `[skip ci]` so it never loops.
   - **`Deploy to GitHub Pages` (`.github/workflows/deploy-pages.yml`)** runs `npm run lint`, `npm test`, `npm run build-manifest`, `npm run validate-content`, builds `dist/`, and deploys the updated site to GitHub Pages.
3. Wait ~1–2 minutes for the **Actions** tab run to turn green.
4. Open your live site and do a hard refresh (`Ctrl + Shift + R` on Windows/Linux, `Cmd + Shift + R` on Mac) if your browser cached an older copy.

---

## Four Ways to Add Other Openings

Choose whichever workflow fits how you want to edit content:

### Way 1: Draft & Verify Live in the In-App **Parser Lab** (No Code Setup Needed)

Best for checking syntax and move legality before creating a file:

1. Open the app and click **Parser Lab** in the top navigation bar.
2. Paste or edit opening Markdown in the left editor (or start from one of the existing openings).
3. Watch the right-hand panel in real time:
   - Green **`Valid (N variations, 0 errors)`** means every variation, tag, ECO code, and move is legal.
   - Red **`errors[]`** pinpoints the exact mistake (e.g., illegal move, missing `moves` block, or uppercase `playerColor`).
4. Copy the verified Markdown and save it into `public/lines/<opening-name>.md` using Way 2 or Way 3 below.

### Way 2: Add Directly on GitHub.com (Zero Local Tools Needed)

Best for quickly adding an opening from any browser:

1. Open your repository on GitHub and navigate into `public/lines/`.
2. Click **Add file → Create new file**.
3. Name the file using lowercase kebab-case ending in `.md` (for example, `public/lines/london-system.md`).
4. Paste your opening Markdown (templates below).
5. Click **Commit changes...** directly to `main`.
6. GitHub Actions automatically validates your file, updates `public/manifest.json`, rebuilds `dist/`, and publishes to GitHub Pages.

> **Tip:** If your file contains an illegal move, the **Deploy to GitHub Pages** action will fail on `npm run validate-content` so broken lines are caught before overwriting your live site.

### Way 3: Local Editor + Git CLI (Recommended for Multiple Lines)

Best when authoring several openings or testing lines on the board before publishing:

1. Create a new lowercase kebab-case file in `public/lines/`, e.g. `public/lines/caro-kann.md`.
2. Validate content and regenerate the local manifest:
   ```bash
   npm run validate-content
   npm run build-manifest
   npm test
   ```
3. Run `npm run dev`, open `http://localhost:3000`, select your opening, and click **Load Line on Board** on each variation to verify board orientation and move order visually.
4. Commit and push to `main`:
   ```bash
   git add public/lines/caro-kann.md public/manifest.json
   git commit -m "feat(content): add Caro-Kann Defense lines"
   git push origin main
   ```

### Way 4: Pull Request Workflow (Safe Team / Review Flow)

Best when collaborating with others or reviewing openings before they go live:

1. Create a feature branch:
   ```bash
   git checkout -b add-french-defense
   ```
2. Add `public/lines/french-defense.md` and run:
   ```bash
   npm run build-manifest
   npm run validate-content
   npm test
   ```
3. Commit and push the branch, then open a Pull Request against `main`.
4. Merge once checks pass; merging to `main` triggers **Deploy to GitHub Pages** automatically.

---

## Opening Markdown Format & Templates

The full specification lives in [`docs/OPENING_FORMAT.md`](docs/OPENING_FORMAT.md). Follow these five rules:

1. **One file = One opening.** Never put two unrelated openings in one `.md` file.
2. **File naming:** Lowercase kebab-case only, no spaces (`queens-gambit.md`, never `Queen's Gambit.md`).
3. **Exact lowercase `playerColor`:** Must be `white` or `black` (never `White` or `WHITE`).
4. **No move numbers inside `moves`:** Write `e4 e5 Nf3 Nc6`, never `1. e4 e5 2. Nf3 Nc6`.
5. **Section order inside each variation:** `## Variation Name` → optional `eco:` / `playerColor:` → study notes → ```` ```moves ```` block.

### Template 1: Standard Opening for White

````markdown
---
formatVersion: 1
title: Italian Game
playerColor: white
tags: [e4, open-game, classical]
---

## Notes
A classical open game targeting Black's vulnerable f7 square while fighting for central control with c3 and d4.

## Giuoco Piano

eco: C50

Develop the bishop to c4, castle early, and prepare c3 followed by d4.

```moves
e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+
```

## Two Knights Defense

eco: C55

Black counterattacks e4 immediately with ...Nf6 instead of ...Bc5.

```moves
e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O
```
````

### Template 2: Opening for Black (With Optional Per-Variation Override)

````markdown
---
formatVersion: 1
title: Caro-Kann Defense
playerColor: black
tags: [e4, c6, solid]
---

## Notes
Black prepares ...d5 with 1...c6 so the light-squared bishop can develop outside the pawn chain.

## Classical Variation

eco: B18

Trade pawns on e4, develop the bishop to f5 before playing ...e6, and keep a rock-solid structure.

```moves
e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6
```

## Advance Variation (White Perspective Study)

eco: B12
playerColor: white

Use a variation-level `playerColor` override whenever you want a specific line oriented from the opposite side.

```moves
e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3
```
````

### Common Mistakes Caught by the Validator

| Mistake | Example | Fix |
| :--- | :--- | :--- |
| Move numbers inside `moves` | `1. d4 d5` | Remove numbers: `d4 d5` |
| Capitalized `playerColor` | `playerColor: White` | Use exact lowercase: `playerColor: white` |
| Unknown frontmatter key | `author: Alex` | Allowed keys are `formatVersion`, `title`, `playerColor`, `tags` |
| Illegal or mistyped SAN move | `Bxc5` when bishop can't reach c5 | Fix SAN notation (e.g., `Bb5`, `O-O`, `Nxd4`) |
| Missing `moves` block | Notes under `## Line` without ```` ```moves ```` | Add a fenced ```` ```moves ... ``` ```` block |
| More than 20 variations or 40 plies | 45-ply line | Keep ≤ 20 variations/file and ≤ 40 plies/variation |

---

## Deploying to GitHub Pages

1. Push this repository to GitHub on the `main` branch.
2. Open your repository **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Every push to `main` (or manual run from the **Actions** tab) runs tests, builds `dist/`, and publishes to `https://<username>.github.io/<repo-name>/`.
