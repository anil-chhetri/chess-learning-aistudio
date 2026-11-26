# NOTES - Task 3.2: Coaching Controls

## Decisions Made
- Strictly limited the coaching control bar to the 4 specified buttons (`Hint`, `Reset`, `Auto-Loop`, `Practice All`) with `min-h-[44px]` touch targets.
- Highlighted both the origin square (amber ring) and destination square (sky ring + dot on empty squares) when `Hint` is pressed so hints remain legible on both light and dark squares.

## Things I Tried & Rejected
- Adding an Undo Move button inside the drill coaching bar: rejected because the drill requires exact line memory (`Reset` + `Hint` cover recovery cleanly, and Task 3.2 explicitly specifies 4 coaching buttons only).
