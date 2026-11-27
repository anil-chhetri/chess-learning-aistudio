Perfect — this is where most teams fail. Design without a Developer Guide = 5 developers building 5 different apps.

Here is the complete **Developer Guide + Design System** for this project. Copy this into your repo as `DESIGN_SYSTEM.md` + `CONTRIBUTING.md`. Everyone must follow it.

### Part 1: Design Tokens — The Single Source of Truth

Never hardcode colors, spacing, or font sizes. Always use tokens.

#### 1.1 Colors

We use **1 Primary + 1 Accent + Neutrals**. No other colors allowed without design approval.

**Primary — Chess Green**
- `primary-900`: #0F5132 — Headers, active states
- `primary-700`: #166534 — Primary buttons, selected opening
- `primary-500`: #1A7F4B — Main CTA, progress bar, correct move
- `primary-100`: #D9EAD3 — Selected background, light highlight
- `primary-50`: #F0F7F0 — Page background for trainer

**Accent — Amber (Hint / Warning)**
- `accent-500`: #F59E0B — Hint arrow, Learning status, Warning
- `accent-100`: #FEF3C7 — Hint background

**Semantic**
- `success`: #15803D — Correct move, Mastered
- `error`: #DC2626 — Wrong move, Mistakes
- `info`: #2563EB — Links, FEN copy feedback

**Neutrals — Use these for 90% of UI**
- `neutral-900`: #111827 — Headings
- `neutral-700`: #374151 — Body text
- `neutral-500`: #6B7280 — Secondary / Meta text
- `neutral-300`: #D1D5DB — Borders
- `neutral-200`: #E5E7EB — Card borders, dividers
- `neutral-100`: #F3F4F6 — Hover, disabled background
- `neutral-50`: #F9FAFB — App background
- `white`: #FFFFFF — Cards

**Board Colors (Do NOT change)**
- `board-light`: #EBECD0
- `board-dark`: #739552
- `board-highlight`: #F6F669 (last move)
- `board-arrow`: #F59E0B with 80% opacity

> **Rule:** If you need a new color, you are doing it wrong. Ask design first.

#### 1.2 Typography

Font: **Inter** (fallback: system-ui). Load only 400, 500, 600, 700.

| Token | Size | Weight | Use |
| :--- | :--- | :--- | :--- |
| `text-display` | 20px / 28px | 700 | Page title: "Italian Game" |
| `text-heading` | 16px / 24px | 600 | Opening Name, Section Title |
| `text-body` | 14px / 20px | 400 | Study Notes, Descriptions |
| `text-body-bold` | 14px / 20px | 600 | Variation Move: `4... Bxd4` |
| `text-meta` | 12px / 16px | 400 | `12 moves · Mastered` |
| `text-label` | 12px / 16px | 600 | Buttons, Uppercase labels |

**Rule:** Never use `font-size: 13px` or `15px`. Only tokens above.

#### 1.3 Spacing & Radius

Spacing scale (4px base): `4, 8, 12, 16, 24, 32`

- Card padding: `16px` always
- Gap between cards: `12px`
- Gap between sections: `24px`
- Button height: `40px` (primary), `32px` (small)
- Button radius: `10px`
- Card radius: `12px`
- Board radius: `8px`
- Input radius: `10px`

**Rule:** If you use `margin: 13px`, it's a bug.

#### 1.4 Shadows

- `shadow-sm`: Cards — `0 1px 2px rgba(0,0,0,0.05)`
- `shadow-md`: Board, Modals — `0 4px 12px rgba(0,0,0,0.08)`
- No other shadows.

### Part 2: Component Rules

Build these once, reuse everywhere. Do NOT create a new button style per screen.

**1. Button**
- `ButtonPrimary`: Green bg, white text, 40px height. Use for: `Next Line`, `Practice Again`
- `ButtonSecondary`: White bg, 1px neutral-300 border, neutral-900 text. Use for: `Hint`, `Reset`
- `ButtonGhost`: No border, neutral-500 text. Use for: `Flip`, `Sound`
- `ButtonDanger`: Red text only. Use for: `Reset Drill` confirmation.

**2. Status Badge**
- `New`: Grey bg, grey text
- `Learning`: Amber bg (#FEF3C7), amber-800 text
- `Mastered`: Green bg (#DCFCE7), green-800 text
- Always 20px height, 12px radius pill, 12px font.

**3. Opening Card**
Structure must be:
```
[Status Dot] Opening Name (16px Bold)
             Color Badge + Moves + Mastery %
[Variation List]
```
Never put variation inside a nested card with different radius.

**4. Turn Banner**
Must be above board, full width, 48px height.
- Practice: `Your Move: Play e4` + Hint icon
- Test: `Your Move` only
- Correct: Green bg + `Correct!`
- Wrong: Red bg + `Try again`

### Part 3: Code Best Practices — Maintainable & Optimized

This is non-negotiable for all developers.

#### 3.1 Folder Structure

```
/src
  /components  // Reusable UI only: Button, Card, Badge, Board
  /features    // Business logic: /trainer, /library, /progress
  /hooks       // useTrainer, useKeyboardShortcuts
  /lib         // chess.js logic, fen utils, constants
  /styles      // tokens.css, no component CSS here
  /types       // TypeScript types
```

**Rule:** A component in `/components` must NEVER import from `/features`. Features can import components, not reverse.

#### 3.2 Naming

- Files: `PascalCase.tsx` for components, `camelCase.ts` for utils
- Variables: `isLoading`, `hasError`, `currentMoveIndex` — not `x`, `data`, `tmp`
- Functions: `handleMove()`, `getNextMove()`, `calculateAccuracy()` — verb + noun
- Constants: `UPPER_SNAKE_CASE` — `MAX_MOVES = 29`, `BOARD_SIZE = 640`

#### 3.3 Component Rules (Clean Code)

1.  **One component = One job.** `TrainerBoard` renders board. `MoveHistory` renders list. Don't put history logic inside board.
2.  **Max 150 lines per file.** If longer, split it.
3.  **No magic numbers.** `if (move === 29)` is banned. Use `if (move === TOTAL_MOVES)`.
4.  **No prop drilling > 2 levels.** Use Context or Zustand for trainer state: `currentLine`, `currentMoveIndex`, `mistakes`, `mode`.
5.  **Early returns.** Don't nest if-else 4 levels deep.
```ts
// BAD
if (move) { if (isCorrect) { ... } }

// GOOD
if (!move) return;
if (!isCorrect) return handleWrongMove();
return handleCorrectMove();
```

#### 3.4 State Management

- Local UI state: `useState` (modal open, tab selected)
- Trainer state: `Zustand` or `Context` — single source: `useTrainerStore`
- Server data: `React Query` — never `useEffect` + `fetch` manually
- Never store derived state: Don't store `accuracy` in state. Calculate it: `accuracy = correct / (correct + mistakes)`

#### 3.5 Performance — Optimized Code

This is a chess trainer, it must feel instant.

1.  **Memoize board:** Board re-renders on every move. Wrap `ChessBoard` in `React.memo`. Use `useMemo` for legal moves.
2.  **No re-render storm:** Don't put `MoveHistory` inside `Board` component. Separate them so history update doesn't re-render board.
3.  **Debounce search:** Library search must be debounced 200ms.
4.  **Lazy load:** `StudyNotes` and `FEN` panel load after board. Board is priority.
5.  **No inline functions in JSX for heavy components:** Define handlers outside render.
6.  **Images:** No images > 100KB. Use SVG for icons, never PNG for icons.
7.  **Bundle:** No `import * from 'chess.js'` if you only need 2 functions. Tree-shake.

#### 3.6 Accessibility & Testing

- Every button must have `aria-label`: `aria-label="Flip board"`
- Board squares must be keyboard navigable.
- Color alone never conveys meaning: Status must be Dot + Text, not Dot only.
- Every PR must include:
  - Unit test for logic: `calculateAccuracy()`, `getStatus()`
  - E2E test for core flow: Pick line -> Play 1 correct move -> Progress updates
- Test file naming: `ComponentName.test.tsx` next to component.


### Part 4: How We Enforce This

1.  **ESLint:** Ban hardcoded hex colors (`#...`) outside `tokens.css`. Ban `font-size` outside tokens.
2.  **Prettier:** 2 spaces, single quotes, 80 char line.
3.  **Code Review Checklist:** Reviewer checks: Tokens used? Component <150 lines? No magic numbers? Memoized?
