Here is your final, buildable plan. Copy this whole thing into your `README.md` or `PLAN.md` — this is the version with no guessing left.

---

# Chess Opening Trainer — Final Project Plan

## 1. What You Are Building

A free, no-backend web app hosted on GitHub Pages.

You write openings in simple Markdown files. The app turns them into interactive drills.

**User Flow:**
`Open App` -> `Pick Opening (e.g. Queen's Gambit)` -> `Pick Variation (e.g. Accepted)` -> `Drill that exact line` -> `Get Hints / See Notes` -> `Practice All Variations` -> `Continue vs Engine`

**Non-Goals for MVP:** No login, no database, no spaced repetition algorithm, no drag-and-drop, no full PGN support. Those are later.

## 2. Tech Stack — Locked

| Layer            | Choice                                                | Why                                                  |
| :--------------- | :---------------------------------------------------- | :--------------------------------------------------- |
| Hosting          | GitHub Pages from `main` branch                       | Free, no backend                                     |
| Rules            | `chess.js`                                            | Validates all moves, castling, en passant, checkmate |
| Board UI         | Custom CSS Grid + bundled SVG pieces in `/assets/`    | No jQuery, no unmaintained `chessboard.js`           |
| Content          | Markdown files in `/lines/`                           | Human-readable                                       |
| Indexing         | GitHub Actions -> `manifest.json`                     | GitHub Pages can't list files                        |
| Engine (M4 only) | Single-threaded Stockfish WASM vendored in `/engine/` | Avoids CORS / SharedArrayBuffer issues               |
| Interaction      | Click-to-move ONLY for MVP                            | Drag is polish, not core                             |

## 3. The Content Contract — This Is Law

If a file doesn't follow this, the parser rejects that variation, shows an error, and never crashes the app.

### 3.1 Example File: `/lines/queens-gambit.md`

````markdown
---
title: Queen's Gambit
playerColor: white
tags: [d4, gambit, closed]
---

## Accepted

eco: D20
playerColor: white

Black accepts the gambit pawn. Our plan is not to win it back
immediately, but to develop quickly and control the center with
e4. Don't play Qxc4 too early — Black will develop with tempo.

```moves
d4 d5 c4 dxc4 e3 Nf6 Bxc4 e6 Nf3 c5 O-O Nc6
```
````

## Declined

eco: D06

Black declines the pawn and keeps the center solid. This is the
most common response at club level. We keep pressure with Nc3 and
play for e4 later.

```moves
d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6
```

## Slav Defense

eco: D10
playerColor: white

Black defends with c6 to support d5 without blocking the bishop.
This is very solid. We should avoid early e4.

```moves
d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O Nbd7
```

`````

### 3.2 The 5 Rules

1.  **One file = One opening.** Never put two openings in one file.
2.  **One `##` = One variation.** Never use `##` for anything else.
3.  **One ````moves` block per variation.** Need a second line? Make a second `##`.
4.  **No move numbers inside ```moves.** Write `d4 d5`, not `1. d4 d5`.
5.  **Order is always:** `## Name` -> `eco:` / `playerColor:` -> Notes -> ````moves`.

### 3.3 Parser Output Contract

`parseOpeningMarkdown(rawText)` must ALWAYS return this shape:

```js
{
  title: "Queen's Gambit",
  playerColor: "white",
  tags: ["d4", "gambit"],
  variations: [
    {
      name: "Accepted",
      eco: "D20",
      playerColor: "white", // inherited or overridden
      notes: "Black accepts...",
      moves: ["d4", "d5", "c4", "dxc4"]
    }
  ],
  errors: [] // e.g. ["Variation 'Declined': Move 'e9' is illegal"]
}
`````

## 4. File Structure

```
/index.html
/style.css
/app.js
/parser.js          // parseOpeningMarkdown() lives here, pure logic
/engine-worker.js   // M4 only
/assets/
  /pieces/         // wP.svg, bP.svg, wN.svg... etc. Bundled, no CDN
/lines/
  queens-gambit.md
  sicilian.md
manifest.json      // Auto-generated, DO NOT edit by hand
.github/workflows/build-manifest.yml
```

## 5. Full Task Plan

### Phase 1: Foundation — Goal: See a board, make a legal move

#### Task 1.1: Repo + GitHub Pages Pipeline

- **Problem:** Need a live URL before any chess logic.
- **Do:** Create repo with `index.html`, `style.css`, `app.js`. Enable Pages from `main` branch.
- **Layout:** 3 columns: Left = Opening List | Center = Board | Right = Notes. On mobile, stack vertically. Board size = `min(92vw, 560px)`.
- **Don't Do:** Any chess logic.
- **Done When:** Live URL loads, layout is responsive, 0 console errors.

#### Task 1.2: Parser + Tests (Do This BEFORE The Board)

- **Problem:** Board needs data. Parser gives it data.
- **Do:** Build `parser.js` as a hand-written, single-pass, line-based state machine.
- **States:** `FRONTMATTER` -> `VARIATION_META` -> `NOTES` -> `MOVES`
- **Logic:**
  1. Split file on `\n`
  2. On `## `, finish previous variation, start new one
  3. On `eco:` / `playerColor:`, save to current variation
  4. On ``moves`, collect moves until closing ``
  5. On finish: If `playerColor` missing, inherit from file. Validate each move with `chess.js`. If illegal, push to `errors[]` and disable that variation.
- **Tests (Must Have):** 1) Inherits playerColor, 2) Overrides playerColor, 3) Illegal move -> goes to errors, 4) Missing moves block -> error, 5) Empty file -> error.
- **Done When:** `queens-gambit.md` parses with 0 errors in console.

#### Task 1.3: Board + Legal Moves

- **Problem:** Need visual feedback for legal chess.
- **Do:** Custom CSS Grid board. `chess.js` for rules. Click-to-move only.
- **Done When:**
  1. Click piece -> legal squares highlight (green = move, red = capture)
  2. Click illegal square -> nothing happens
  3. Click legal square -> board updates, move history updates, turn flips
  4. Works on mobile with tap, no drag

### Phase 2: Content Pipeline — Goal: Write a .md file, see it in the app

#### Task 2.1: Manifest Generation via GitHub Actions

- **Problem:** Static hosting can't list files in `/lines/` at runtime.
- **Do:** Create `.github/workflows/build-manifest.yml`
- **Rules:** Only run when `lines/**` changes. Commit message must include `[skip ci]` to prevent infinite loop.
- **App Rule:** `fetch('manifest.json', { cache: 'no-store' })` to avoid GitHub Pages caching stale data.
- **Done When:** Add new `.md` file, push, refresh live site, new opening appears without touching `app.js`.

#### Task 2.2: Load & Display Openings

- **Do:** On load, `app.js` fetches `manifest.json`, then fetches each `.md` file, runs `parseOpeningMarkdown`, populates left panel.
- **Error UI:** If manifest 404s or a file fails to parse, show a red banner: "Failed to load X. Check console." Never show a blank page.
- **Done When:** 3 sample files (e.g., Queen's Gambit, Sicilian, King's Indian) all load and show in list.

### Phase 3: Trainer MVP — Goal: THIS IS THE PRODUCT. SHIP THIS.

#### Task 3.1: Two-Level Selection + Drill State Machine

- **Problem:** User needs to drill ONE variation in isolation.
- **Do:** Build as a state machine, not `if` statements.
- **States:** `IDLE` -> `USER_TURN` -> `OPPONENT_TURN` (auto-play after 700ms) -> `VARIATION_COMPLETE` -> `IDLE`
- **Flow:**
  1. Click Opening -> Show Variation Cards (Name + ECO + Color badge)
  2. Click Variation -> Reset board to start, orientation = `variation.playerColor`, `drillIndex = 0`, `mistakes = 0`
  3. If it's opponent's turn, lock board, auto-play after 700ms
  4. User move: Snapshot FEN before move. If move != expected move at `drillIndex`, restore FEN, flash square red, `mistakes++`. If correct, `drillIndex++`.
  5. When `drillIndex == moves.length`, go to `VARIATION_COMPLETE`
- **Done When:** You can complete a 6-move variation as White AND as Black with zero state bugs, including clicking during opponent auto-play (should be ignored).

#### Task 3.2: Coaching Controls

- **Do:** 4 buttons only:
  1. **Hint:** Highlight BOTH source + target square of expected move
  2. **Reset:** Restart current variation instantly
  3. **Auto-Loop:** On complete, wait 1.5s, restart same variation
  4. **Practice All:** On complete, wait 1.5s, start next variation `1..N`
- **Do:** Right panel shows `variation.notes` + `eco` + `mistakes` count + progress `Move 4 / 12`
- **Done When:** You can press Hint -> Reset -> Practice All and finish all variations in a file without refreshing.

#### Task 3.3: Persistence

- **Do:** `localStorage` save: `lastOpening`, `lastVariation`, `mistakesByVariation`
- **Done When:** Refresh page -> returns to same variation, mistake count still there.

**>>> STOP AND SHIP M3 HERE <<<**
Your MVP is live. Do not start M4 until M3 is live and tested by you for 2 days.

### Phase 4: Engine Sparring — Post-MVP

#### Task 4.1: Stockfish Web Worker

- **Problem:** Need engine without freezing UI and without GitHub Pages header issues.
- **Do:** Vendor single-threaded Stockfish WASM files into `/engine/`. Do NOT load from CDN.
- **Do:** Create `engine-worker.js` that implements UCI: `uci` -> `isready` -> `position fen ...` -> `go` -> parse `bestmove`.
- **Interface:** `postMessage({ fen, skill: 5 })` -> `onmessage({ bestmove: "e2e4" })`
- **Don't Do:** Depth control. Use `Skill Level 0-10` — users understand it.
- **Done When:** Passing any FEN returns a legal `bestmove` in <2s without freezing board animations.

#### Task 4.2: Continue vs Engine Mode

- **Do:** Button appears at `VARIATION_COMPLETE` AND during drill: "Continue vs Engine"
- **Logic:** On click, exit drill mode. Engine plays opposite color of `playerColor`. If it's engine's turn, engine moves immediately. If it's user's turn, wait for user. Stop on checkmate / stalemate / manual Reset.
- **Done When:** Finish a variation, click Continue, play 10 moves vs engine, reach checkmate, press Reset to go back to drill mode.

## 6. Milestone Overview

| Milestone                | Tasks         | Ship Criteria                                               |
| :----------------------- | :------------ | :---------------------------------------------------------- |
| **M1: Board & Parser**   | 1.1, 1.2, 1.3 | Live site, click-to-move works, parser passes 5 tests       |
| **M2: Content Pipeline** | 2.1, 2.2      | New `.md` file appears in app after push                    |
| **M3: Trainer MVP**      | 3.1, 3.2, 3.3 | Pick Opening -> Variation -> Drill to completion with Hints |
| **M4: Engine**           | 4.1, 4.2      | Continue any variation vs Stockfish                         |

## 7. Build Order — Do NOT Build In Numerical Order

**Week 1:** 1.1 -> 1.2 (Parser) -> 1.3 (Board) -> 2.1 (Manifest)
**Week 2:** 2.2 -> 3.1 -> 3.2 -> 3.3 -> **SHIP M3**
**Week 3+:** 4.1 -> 4.2

Why parser before board? If you build the board first, you'll build a free-play board and have to rewrite it for scripted drills.

## 8. Risks & How This Plan Fixes Them

1.  **Parser breaks on bad file** -> Fixed: `errors[]` array, bad variation disabled, others still work.
2.  **Manifest infinite loop** -> Fixed: `[skip ci]` + `paths: ['lines/**']`.
3.  **Stale content on GitHub Pages** -> Fixed: `cache: 'no-store'`.
4.  **Wrong move corrupts state** -> Fixed: Snapshot FEN before move, restore on wrong move.
5.  **Stockfish CORS / WASM fails** -> Fixed: Vendor files in `/engine/`, single-threaded only.
6.  **User clicks during auto-play** -> Fixed: Board locked in `OPPONENT_TURN` state.

---

This is now a complete, unambiguous plan. The next step is code.

Do you want me to give you the complete `parser.js` file next — the full working code for `parseOpeningMarkdown` with all the tests — so you can start Task 1.2 immediately?
