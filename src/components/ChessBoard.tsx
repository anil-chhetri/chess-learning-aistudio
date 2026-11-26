import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import { getArrowGeometry } from '../lib/boardGeometry.ts';
import type { HintSquares } from '../lib/drill.ts';
import type { PlayerColor } from '../lib/parser.ts';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
const PROMOTION_PIECES: Array<{ type: 'q' | 'r' | 'b' | 'n'; label: string }> = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
];

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

interface ChessBoardProps {
  fen: string;
  orientation: PlayerColor;
  lastMove: { from: Square; to: Square } | null;
  locked?: boolean;
  hintSquares?: HintSquares | null;
  arrowMove?: { from: Square; to: Square } | null;
  wrongSquare?: Square | null;
  onMakeMove: (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => void;
}

interface PendingPromotion {
  from: Square;
  to: Square;
  color: 'w' | 'b';
}

function getPieceImagePath(color: 'w' | 'b', type: PieceSymbol): string {
  return `assets/pieces/${color}${type.toUpperCase()}.svg`;
}

export function ChessBoard({
  fen,
  orientation,
  lastMove,
  locked = false,
  hintSquares = null,
  arrowMove = null,
  wrongSquare = null,
  onMakeMove,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const squareRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Reset transient selection whenever FEN or lock state changes
  useEffect(() => {
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [fen, locked]);

  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const turn = chess.turn();
  const inCheck = chess.inCheck();

  const legalMovesForSelected = useMemo(() => {
    if (!selectedSquare || locked) return new Map<Square, Move[]>();
    const moves = chess.moves({ square: selectedSquare, verbose: true });
    const map = new Map<Square, Move[]>();
    for (const move of moves) {
      const existing = map.get(move.to) ?? [];
      existing.push(move);
      map.set(move.to, existing);
    }
    return map;
  }, [chess, selectedSquare, locked]);

  const displayedFiles = useMemo(
    () => (orientation === 'white' ? [...FILES] : [...FILES].reverse()),
    [orientation],
  );
  const displayedRanks = useMemo(
    () => (orientation === 'white' ? [...RANKS] : [...RANKS].reverse()),
    [orientation],
  );

  const arrow = useMemo(
    () =>
      arrowMove
        ? getArrowGeometry(arrowMove.from, arrowMove.to, orientation)
        : null,
    [arrowMove, orientation],
  );

  const boardSquares = useMemo(() => {
    const grid = chess.board();
    const items: Array<{
      square: Square;
      fileIndex: number;
      rankIndex: number;
      isLight: boolean;
      piece: { type: PieceSymbol; color: 'w' | 'b' } | null;
    }> = [];

    for (let rIdx = 0; rIdx < displayedRanks.length; rIdx += 1) {
      const rankChar = displayedRanks[rIdx];
      const boardRow = 8 - Number(rankChar);
      for (let fIdx = 0; fIdx < displayedFiles.length; fIdx += 1) {
        const fileChar = displayedFiles[fIdx];
        const boardCol = FILES.indexOf(fileChar);
        const square = `${fileChar}${rankChar}` as Square;
        const cell = grid[boardRow]?.[boardCol] ?? null;
        const isLight = (boardRow + boardCol) % 2 === 0;
        items.push({
          square,
          fileIndex: fIdx,
          rankIndex: rIdx,
          isLight,
          piece: cell ? { type: cell.type, color: cell.color } : null,
        });
      }
    }
    return items;
  }, [chess, displayedFiles, displayedRanks]);

  const handleSquareClick = (square: Square) => {
    if (locked || pendingPromotion || chess.isGameOver()) return;

    const targetMoves = legalMovesForSelected.get(square);
    if (selectedSquare && targetMoves && targetMoves.length > 0) {
      const isPromotion = targetMoves.some((m) => Boolean(m.promotion));
      if (isPromotion) {
        setPendingPromotion({
          from: selectedSquare,
          to: square,
          color: turn,
        });
        return;
      }
      setSelectedSquare(null);
      onMakeMove(selectedSquare, square);
      return;
    }

    const piece = chess.get(square);
    if (piece && piece.color === turn) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
      } else {
        setSelectedSquare(square);
      }
      return;
    }

    setSelectedSquare(null);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    fileIdx: number,
    rankIdx: number,
  ) => {
    let nextFileIdx = fileIdx;
    let nextRankIdx = rankIdx;

    if (event.key === 'ArrowRight') nextFileIdx = Math.min(7, fileIdx + 1);
    else if (event.key === 'ArrowLeft') nextFileIdx = Math.max(0, fileIdx - 1);
    else if (event.key === 'ArrowDown') nextRankIdx = Math.min(7, rankIdx + 1);
    else if (event.key === 'ArrowUp') nextRankIdx = Math.max(0, rankIdx - 1);
    else if (event.key === 'Escape') {
      setSelectedSquare(null);
      setPendingPromotion(null);
      return;
    } else {
      return;
    }

    event.preventDefault();
    const targetSquare = `${displayedFiles[nextFileIdx]}${displayedRanks[nextRankIdx]}`;
    squareRefs.current[targetSquare]?.focus();
  };

  return (
    <div className="relative select-none w-full">
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-[#27382C] shadow-sm bg-[#27382C]">
        <div
          role="grid"
          aria-label="Chessboard"
          aria-disabled={locked || undefined}
          className={`grid grid-cols-8 grid-rows-8 w-full h-full ${
            locked ? 'cursor-wait' : 'cursor-pointer'
          }`}
        >
        {boardSquares.map(({ square, fileIndex, rankIndex, isLight, piece }) => {
          const isSelected = selectedSquare === square;
          const legalCandidates = legalMovesForSelected.get(square);
          const isLegalTarget = Boolean(legalCandidates && legalCandidates.length > 0);
          const isCaptureTarget = Boolean(
            legalCandidates &&
              legalCandidates.some((m) => m.isCapture() || m.isEnPassant()),
          );
          const isLastMoveSquare =
            lastMove !== null &&
            (lastMove.from === square || lastMove.to === square);
          const isCheckedKing =
            inCheck && piece?.type === 'k' && piece.color === turn;
          const isHintFrom = hintSquares?.from === square;
          const isHintTo = hintSquares?.to === square;
          const isWrongFlash = wrongSquare === square;

          const showRankLabel = fileIndex === 0;
          const showFileLabel = rankIndex === 7;
          const rankChar = square[1];
          const fileChar = square[0];

          let squareColorClass = isLight ? 'bg-[#EDEAD9]' : 'bg-[#527A5B]';
          if (isSelected) {
            squareColorClass = isLight ? 'bg-[#D6E6B8]' : 'bg-[#3D6A46]';
          } else if (isLastMoveSquare) {
            squareColorClass = isLight ? 'bg-[#EAE2B2]' : 'bg-[#6A8C56]';
          }

          const coordTextClass = isLight ? 'text-[#44634C]' : 'text-[#EDEAD9]/90';

          const pieceLabel = piece
            ? `${piece.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece.type]}`
            : 'empty';
          const moveLabel = isCaptureTarget
            ? ', capture available'
            : isLegalTarget
              ? ', legal move'
              : isHintFrom || isHintTo
                ? ', hint square'
                : '';

          return (
            <button
              key={square}
              ref={(el) => {
                squareRefs.current[square] = el;
              }}
              type="button"
              onClick={() => handleSquareClick(square)}
              onKeyDown={(e) => handleKeyDown(e, fileIndex, rankIndex)}
              aria-label={`${square}, ${pieceLabel}${moveLabel}`}
              aria-pressed={isSelected}
              className={`relative flex items-center justify-center w-full h-full touch-manipulation transition-colors duration-100 focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900 ${squareColorClass}`}
            >
              {/* Checked King Radial Indicator */}
              {isCheckedKing && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle,rgba(220,38,38,0.72)_0%,rgba(220,38,38,0.28)_55%,transparent_75%)] pointer-events-none"
                />
              )}

              {/* Wrong Move Flash */}
              {isWrongFlash && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 z-20 bg-red-600/45 ring-3 ring-inset ring-red-700 pointer-events-none"
                />
              )}

              {/* Hint Highlights (Source & Target) */}
              {(isHintFrom || isHintTo) && (
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 z-15 pointer-events-none ${
                    isHintFrom
                      ? 'bg-amber-400/35 ring-3 ring-inset ring-amber-600'
                      : 'bg-sky-400/30 ring-3 ring-inset ring-sky-600'
                  }`}
                />
              )}

              {/* Selected Ring */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 ring-2 ring-inset ring-emerald-900/70 pointer-events-none"
                />
              )}

              {/* Rank Coordinate (left edge) */}
              {showRankLabel && (
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-semibold font-mono-tabular leading-none pointer-events-none ${coordTextClass}`}
                >
                  {rankChar}
                </span>
              )}

              {/* File Coordinate (bottom edge) */}
              {showFileLabel && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-semibold font-mono-tabular leading-none pointer-events-none ${coordTextClass}`}
                >
                  {fileChar}
                </span>
              )}

              {/* Piece SVG */}
              {piece && (
                <img
                  src={getPieceImagePath(piece.color, piece.type)}
                  alt={`${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[piece.type]}`}
                  draggable={false}
                  className="relative z-10 w-[84%] h-[84%] object-contain pointer-events-none transition-transform duration-150"
                />
              )}

              {/* Hint Target Dot when destination square is empty */}
              {isHintTo && !piece && !isLegalTarget && (
                <span
                  aria-hidden="true"
                  className="relative z-20 w-[26%] h-[26%] rounded-full bg-sky-600/80 ring-2 ring-white/70 pointer-events-none"
                />
              )}

              {/* Legal Quiet Move Indicator */}
              {isLegalTarget && !isCaptureTarget && (
                <span
                  aria-hidden="true"
                  className="relative z-20 w-[28%] h-[28%] rounded-full bg-emerald-700/75 ring-2 ring-emerald-950/25 pointer-events-none"
                />
              )}

              {/* Legal Capture Indicator */}
              {isCaptureTarget && (
                <span
                  aria-hidden="true"
                  className="absolute inset-[6%] z-20 rounded-full border-[3px] sm:border-4 border-red-600/85 bg-red-500/10 pointer-events-none"
                />
              )}
            </button>
          );
        })}
        </div>

        {/* Directional Move Arrow Overlay (Practice mode & Test hints) */}
        {arrow && (
          <svg
            viewBox="0 0 800 800"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[25] w-full h-full"
          >
            <g opacity="0.88">
              <line
                x1={arrow.x1}
                y1={arrow.y1}
                x2={arrow.shaftEndX}
                y2={arrow.shaftEndY}
                stroke="#FFFBEB"
                strokeWidth="22"
                strokeLinecap="round"
              />
              <polygon
                points={arrow.headPoints}
                fill="#D97706"
                stroke="#FFFBEB"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <line
                x1={arrow.x1}
                y1={arrow.y1}
                x2={arrow.shaftEndX}
                y2={arrow.shaftEndY}
                stroke="#D97706"
                strokeWidth="15"
                strokeLinecap="round"
              />
            </g>
          </svg>
        )}
      </div>

      {/* Inline Pawn Promotion Picker */}
      {pendingPromotion && (
        <div
          role="dialog"
          aria-label="Choose promotion piece"
          className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/45 rounded-lg p-4"
        >
          <div className="bg-white border border-[#E2E0D8] rounded-lg shadow-lg p-4 w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Promote pawn on {pendingPromotion.to}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPendingPromotion(null);
                  setSelectedSquare(null);
                }}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded focus-visible:outline-2 focus-visible:outline-zinc-900"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PROMOTION_PIECES.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  aria-label={`Promote to ${label}`}
                  onClick={() => {
                    const { from, to } = pendingPromotion;
                    setPendingPromotion(null);
                    setSelectedSquare(null);
                    onMakeMove(from, to, type);
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-md border border-[#E2E0D8] bg-[#F8F7F4] hover:bg-[#EDEAD9] transition-colors min-h-[56px] focus-visible:outline-2 focus-visible:outline-emerald-800"
                >
                  <img
                    src={getPieceImagePath(pendingPromotion.color, type)}
                    alt={label}
                    className="w-9 h-9 object-contain"
                  />
                  <span className="text-[11px] font-medium text-zinc-700 mt-1">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
