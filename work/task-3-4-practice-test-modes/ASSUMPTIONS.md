# ASSUMPTIONS - Task 3.4: Practice and Test Session Modes

1. Practice mode defaults as the active session on load so new learners immediately see the move direction arrow, and can switch to Test mode with one click right above the board.
2. Placing the Practice/Test segmented control inside the board stage card (above the drill status bar) preserves the 3-zone Top Bar navigation structure.
3. Wrong-move detection and mistake tracking remain active in Practice mode so accidental clicks still snapshot-restore safely and nudge the learner back to the arrow (`Follow arrow · Play <SAN>`).
4. In Test mode, clicking `Hint` now renders the same directional SVG arrow alongside the source/target highlights for that move, while keeping the move hidden until requested.
