# PLAN - Task 1.3: Board + Legal Moves

## 1. Goal
Render an interactive 8x8 CSS Grid chessboard using bundled SVG pieces and `chess.js` rules with click-to-move legal/capture highlights, move history updates, and full keyboard accessibility.

## 2. Inputs & Outputs
- Input: Current FEN, board orientation (`white` | `black`), last move squares, user click/tap/keyboard selection.
- Output: Legal move callback `(from, to, promotion?)`, updated FEN, algebraic SAN move history, and turn flip.

## 3. Steps
1. Render 8x8 CSS Grid sized `min(92vw, 560px)` with rank/file coordinates.
2. On piece click of active side, compute `chess.moves({ square, verbose: true })`.
3. Highlight legal quiet moves (green dot + ring) and captures (red outer ring).
4. Ignore illegal clicks cleanly; execute legal moves (including pawn promotion picker, castling, en passant).
5. Support keyboard grid navigation (Arrow keys, Enter/Space, Escape) and ARIA labels on every square.

## 4. Files I Will Touch
- Create: `src/components/ChessBoard.tsx`, `src/lib/sound.ts`
- Edit: `src/App.tsx`, `src/components/NotesPanel.tsx`

## 5. Edge Cases
- Pawn promotion prompts user for Queen/Rook/Bishop/Knight.
- En passant captures are detected via `move.isEnPassant()` and highlighted as captures.
- Checkmate / Stalemate / Draw lock further board clicks cleanly with status banner.

## 6. How I Will Prove It Works
- TypeScript lint (`npm run lint`) and Vite build (`npm run build`) pass cleanly.

## 7. Review
- Reviewed against Developer Guide §9 checklist on 2026-11-26: Approved.
