# NOTES - Task 3.4: Practice and Test Session Modes

## Design Notes
- Kept `src/lib/boardGeometry.ts` pure TypeScript with zero DOM or React dependencies so Node 22 native test runner (`node --test`) validates geometry math directly.
- Wrapped the 8x8 `role="grid"` inside a dedicated `relative w-full aspect-square` container in `ChessBoard.tsx` so the `<svg viewBox="0 0 800 800">` arrow overlay aligns 1:1 with the 8x8 squares while staying below the `z-30` pawn promotion dialog.
- Styled the arrow with a `#FFFBEB` outer halo and `#D97706` shaft/head so it remains high-contrast across both cream (`#EDEAD9`) and forest-green (`#527A5B`) squares without obscuring pieces.
- Disabled the `Hint` button in Practice mode with an explanatory `title` attribute because Practice mode already reveals the direction automatically.
