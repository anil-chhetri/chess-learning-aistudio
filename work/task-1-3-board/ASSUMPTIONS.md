# ASSUMPTIONS - Task 1.3: Board + Legal Moves

| # | Assumption | Why I Made It | What Happens If It's Wrong |
|---|------------|---------------|----------------------------|
| A1 | Interaction is click/tap-to-move only for Phase 1 | Project Plan §2 ("Click-to-move ONLY for MVP") | Drag-and-drop can be layered later without changing `onMakeMove` callback contract |
| A2 | Relative `assets/pieces/*.svg` paths resolve both locally and on GitHub Pages | Vite serves `public/` at `base: './'` root | Bundled local SVGs avoid CDN outages and work on repo subpaths |
| A3 | Board width is bounded by parent column (`w-full`) AND capped at `min(92vw, 600px)` | Viewport-only `92vw` overflows sidebars inside split-pane grids | Keeping `w-full` on `ChessBoard` ensures the grid always respects its container |
| A4 | Web Audio API may be blocked or unsupported in headless/restricted browsers | Browser autoplay policies | `playMoveSound` wraps `AudioContext` in `try/catch` and supports a mute toggle |
