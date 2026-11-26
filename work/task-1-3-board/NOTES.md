# NOTES - Task 1.3: Board + Legal Moves

## Decisions Made
- Changed the chessboard grid from a fixed `w-[min(92vw,640px)]` to `w-full aspect-square` inside a `w-full max-w-[min(92vw,600px)]` wrapper so the board scales proportionally to any window or split-pane width while staying crisp on desktop and large on mobile.
- Paired color cues with distinct geometry (centered filled dot for quiet moves, hollow outer ring for captures, non-color text for turn/check/mate) for color-blind accessibility.
- Added `flex-1` to the Move History section in `NotesPanel.tsx` so the right-hand card aligns cleanly with the full column height on desktop.

## Things I Tried & Rejected
- Using `w-[min(92vw,640px)]` directly on the board grid: rejected because `92vw` ignores parent CSS Grid track constraints in intermediate split-pane widths (`900px–1150px`), overflowing into adjacent panels.
