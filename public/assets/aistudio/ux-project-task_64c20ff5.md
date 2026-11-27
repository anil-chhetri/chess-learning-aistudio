### Sprint 1: Make The Core Loop Usable
*Goal: User can pick a line, understand what to do, and get feedback.*

**1.1 Fix Board Instruction + Feedback**
- **Task:** Replace tiny "Practice · Play e4" text with a prominent Turn Banner above board.
- **States to build:**
  - `Your Move: Play e4` in Practice mode
  - `Your Move` only (no move shown) in Test mode
  - `Correct!` green pulse + auto-advance in 600ms
  - `Not quite, try again` red shake + Mistakes +1
- **Testable:** User plays wrong move 3 times -> Mistakes = 3, board does NOT advance, banner shows "Try again". User plays correct move -> Board advances, Move counter goes 0 -> 1.

**1.2 Fix Library Truncation**
- **Task:** Redesign left cards so variation names are never cut off mid-move.
- **Spec:** Line 1: `4... Bxd4` (bold), Line 2: Nickname `Greco Gambit` (regular, grey), Line 3: `12 moves · 3 stars`
- **Testable:** On 1280px width, all 7 Italian Gambit variations show full move text with no "..." truncation. Search "Greco" filters to 1 result.

**1.3 Fix Progress Header**
- **Task:** Replace "Move 0 / 29" text with Progress Bar + Counter.
- **Spec:** Bar shows 0/29, 15/29, 29/29. Label: `Move 1 of 29` + `Accuracy: 100%` + `Mistakes: 0`
- **Testable:** Play 5 correct moves -> Bar = 17% (5/29), Counter = "Move 5 of 29". Play 1 wrong then correct -> Accuracy = 83% (5/6).

**1.4 Move FEN Out of Prime Real Estate**
- **Task:** Move FEN + Copy button into a `...` menu in board toolbar. Replace that card with Move History list.
- **Testable:** Right panel no longer shows FEN by default. User can still find FEN in < 2 clicks via menu. Move History shows `1. e4` after first move.

### Sprint 2: Make It Feel Like A Trainer
*Goal: User knows what to learn next and why.*

**2.1 Add Status To Every Line**
- **Task:** Add status dot + label to each variation: `New` (grey), `Learning` (amber), `Mastered` (green).
- **Logic:** New = never attempted, Learning = attempted but <80% accuracy or not completed, Mastered = completed with >=80% accuracy twice.
- **Testable:** Fresh user sees all lines as `New`. Complete Italian Gambit with 90% accuracy twice -> Status flips to `Mastered`.

**2.2 Restructure Study Notes**
- **Task:** Change free text to structured format: `Idea` / `Plan` / `Watch Out`.
- **Spec:** Max 1 line per section, expandable "Read more" for details.
- **Testable:** Every opening variation has Idea + Plan filled. User can read Idea in < 5 seconds without scrolling.

**2.3 Add Completion State**
- **Task:** When Move = 29/29, show completion modal: `Line Complete!` + Accuracy + Time + Buttons: `Practice Again` / `Next Line` / `Back to Library`.
- **Testable:** Complete a line -> Modal appears within 500ms. Click `Next Line` -> Loads next variation in same opening, Move resets to 0.

**2.4 Add Practice vs Test Toggle Explanation**
- **Task:** Add tooltips + segmented control labels: `Practice: See hints & arrows` / `Test: No help, scored`.
- **Testable:** In Test mode, no arrow is shown, Hint button is disabled. In Practice mode, arrow + Hint are visible. 5/5 users in usability test can explain difference.

### Sprint 3: Make It Fast To Use
*Goal: Power users can fly through it.*

**3.1 Keyboard Shortcuts**
- **Task:** Add: `← / →` = Prev/Next move, `H` = Hint, `F` = Flip board, `R` = Reset drill.
- **Testable:** With keyboard only, user can complete 5 moves, get hint, flip board, and reset without touching mouse.

**3.2 Search + Filter Library**
- **Task:** Add Search input + Filters: Color (White/Black/All), Status (New/Learning/Mastered), Sort (Last Practiced / A-Z / Hardest).
- **Testable:** Search "Sicilian" returns 1 opening. Filter Status = Mastered returns only mastered lines. Filter persists after refresh.

**3.3 Clickable Move History**
- **Task:** Make each move in history clickable to jump to that position.
- **Spec:** Click `5. Nf3` -> Board shows position after Nf3, Move counter updates.
- **Testable:** Play 10 moves, click move 4 -> Board rewinds to move 4, banner shows correct next move for move 5.

### Sprint 4: Polish + Mobile
*Goal: It looks professional and works on phone.*

**4.1 Design System Cleanup**
- **Task:** Lock type scale, spacing, radius. One primary green (#1A7F4B), one accent amber (#F59E0B), neutrals only for rest.
- **Testable:** Visual QA: No two cards have different padding/radius. All buttons use same height (40px) and radius (10px). Passes contrast check AA.

**4.2 Mobile Layout**
- **Task:** < 900px: Stack order = Board -> Turn Banner -> Tabs [Notes | Moves | Library]. Library becomes bottom sheet.
- **Testable:** On iPhone 14 viewport (390px), board is full width, no horizontal scroll, user can switch to Library in 1 tap and pick a new line.

**4.3 Add Review Due**
- **Task:** Show `Review Due` badge on library for lines not practiced in 3+ days.
- **Testable:** Complete a line today, come back in 4 days (simulate date), badge appears. Practice it -> Badge clears.

