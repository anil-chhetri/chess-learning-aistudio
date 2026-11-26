import { useCallback, useEffect, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ArrowUpDown, RotateCcw, Undo2, Volume2, VolumeX } from 'lucide-react';
import { ChessBoard } from './components/ChessBoard.tsx';
import { FormatSpecView } from './components/FormatSpecView.tsx';
import { NotesPanel } from './components/NotesPanel.tsx';
import { OpeningList } from './components/OpeningList.tsx';
import { ParserLab } from './components/ParserLab.tsx';
import type { ParsedOpening, ParsedVariation, PlayerColor } from './lib/parser.ts';
import { playMoveSound } from './lib/sound.ts';
import { parseAndValidateOpening } from './lib/validate.ts';

type AppTab = 'board' | 'parser' | 'spec';

interface BoardState {
  fen: string;
  history: string[];
  lastMove: { from: Square; to: Square } | null;
  orientation: PlayerColor;
  activeLineLabel: string | null;
}

const INITIAL_FEN = new Chess().fen();

function createInitialBoardState(orientation: PlayerColor = 'white'): BoardState {
  return {
    fen: INITIAL_FEN,
    history: [],
    lastMove: null,
    orientation,
    activeLineLabel: null,
  };
}

function getGameStatusInfo(fen: string): {
  turnLabel: string;
  turnColor: 'w' | 'b';
  detailLabel: string | null;
  isGameOver: boolean;
} {
  const chess = new Chess(fen);
  const turnColor = chess.turn();
  const sideName = turnColor === 'w' ? 'White' : 'Black';

  if (chess.isCheckmate()) {
    const winner = turnColor === 'w' ? 'Black' : 'White';
    return {
      turnLabel: `Checkmate · ${winner} wins`,
      turnColor,
      detailLabel: 'Game over',
      isGameOver: true,
    };
  }
  if (chess.isStalemate()) {
    return {
      turnLabel: 'Stalemate · Draw',
      turnColor,
      detailLabel: 'Game over',
      isGameOver: true,
    };
  }
  if (chess.isDraw()) {
    return {
      turnLabel: 'Draw',
      turnColor,
      detailLabel: 'Insufficient material or repetition',
      isGameOver: true,
    };
  }
  if (chess.inCheck()) {
    return {
      turnLabel: `${sideName} to move · Check`,
      turnColor,
      detailLabel: null,
      isGameOver: false,
    };
  }
  return {
    turnLabel: `${sideName} to move`,
    turnColor,
    detailLabel: null,
    isGameOver: false,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('board');
  const [loadingOpening, setLoadingOpening] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [opening, setOpening] = useState<ParsedOpening | null>(null);
  const [selectedVariationName, setSelectedVariationName] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardState>(() => createInitialBoardState('white'));
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialOpening() {
      setLoadingOpening(true);
      setLoadError(null);
      try {
        const response = await fetch('lines/queens-gambit.md', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(
            `Could not fetch lines/queens-gambit.md (HTTP ${response.status}).`,
          );
        }
        const text = await response.text();
        if (cancelled) return;
        const validated = parseAndValidateOpening(text);
        setRawMarkdown(text);
        setOpening(validated);
        const firstValid = validated.variations.find((v) => v.valid) ?? null;
        if (firstValid) {
          setSelectedVariationName(firstValid.name);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Unable to load opening Markdown file.',
        );
      } finally {
        if (!cancelled) {
          setLoadingOpening(false);
        }
      }
    }

    loadInitialOpening();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedVariation =
    opening?.variations.find((v) => v.name === selectedVariationName) ?? null;

  const handleMakeMove = useCallback(
    (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
      setBoard((prev) => {
        const chess = new Chess(prev.fen);
        // Re-apply full history when possible? Actually chess.js move from FEN works cleanly;
        // we maintain prev.history as our single source of truth for algebraic SAN history.
        try {
          const move = chess.move({
            from,
            to,
            promotion: promotion ?? 'q',
          });
          if (!move) return prev;

          if (chess.isGameOver()) {
            playMoveSound('end', muted);
          } else if (chess.inCheck()) {
            playMoveSound('check', muted);
          } else if (move.isCapture() || move.isEnPassant()) {
            playMoveSound('capture', muted);
          } else {
            playMoveSound('move', muted);
          }

          return {
            ...prev,
            fen: chess.fen(),
            history: [...prev.history, move.san],
            lastMove: { from: move.from, to: move.to },
          };
        } catch {
          return prev;
        }
      });
    },
    [muted],
  );

  const handleUndoMove = useCallback(() => {
    setBoard((prev) => {
      if (prev.history.length === 0) return prev;
      const nextHistory = prev.history.slice(0, -1);
      const replay = new Chess();
      let lastMove: { from: Square; to: Square } | null = null;
      for (const san of nextHistory) {
        const applied = replay.move(san);
        lastMove = { from: applied.from, to: applied.to };
      }
      return {
        ...prev,
        fen: replay.fen(),
        history: nextHistory,
        lastMove,
      };
    });
  }, []);

  const handleResetBoard = useCallback(() => {
    setBoard((prev) => createInitialBoardState(prev.orientation));
    setActiveTab('board');
  }, []);

  const handleFlipBoard = useCallback(() => {
    setBoard((prev) => ({
      ...prev,
      orientation: prev.orientation === 'white' ? 'black' : 'white',
    }));
  }, []);

  const handleSelectVariation = useCallback((variation: ParsedVariation) => {
    setSelectedVariationName(variation.name);
  }, []);

  const handleLoadVariationOnBoard = useCallback((variation: ParsedVariation) => {
    if (!variation.valid || variation.moves.length === 0) return;
    const replay = new Chess();
    const played: string[] = [];
    let lastMove: { from: Square; to: Square } | null = null;

    for (const san of variation.moves) {
      try {
        const m = replay.move(san);
        played.push(m.san);
        lastMove = { from: m.from, to: m.to };
      } catch {
        break;
      }
    }

    setBoard({
      fen: replay.fen(),
      history: played,
      lastMove,
      orientation: variation.playerColor === 'black' ? 'black' : 'white',
      activeLineLabel: variation.name,
    });
  }, []);

  const status = getGameStatusInfo(board.fen);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F0] text-zinc-900 overflow-x-hidden">
      {/* Three-Zone Top Bar */}
      <header className="bg-white border-b border-[#E2E0D8]">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
          <a
            href="#board"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('board');
            }}
            className="font-display text-base sm:text-xl font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B5E3A]"
          >
            Chess Opening Trainer
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 lg:gap-7"
          >
            <button
              type="button"
              onClick={() => setActiveTab('board')}
              className={`py-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B5E3A] ${
                activeTab === 'board'
                  ? 'border-[#1B5E3A] text-zinc-950'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parser')}
              className={`py-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B5E3A] ${
                activeTab === 'parser'
                  ? 'border-[#1B5E3A] text-zinc-950'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Parser Lab
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spec')}
              className={`py-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B5E3A] ${
                activeTab === 'spec'
                  ? 'border-[#1B5E3A] text-zinc-950'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Format Spec
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleResetBoard}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#154A2D] rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
            >
              Reset Board
            </button>
          </div>
        </div>
      </header>

      {/* Mobile View Switcher */}
      <div className="md:hidden bg-white border-b border-[#E2E0D8] px-4 py-2 flex items-center gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('board')}
          className={`py-1 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'board'
              ? 'border-[#1B5E3A] text-zinc-950'
              : 'border-transparent text-zinc-600'
          }`}
        >
          Board
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parser')}
          className={`py-1 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'parser'
              ? 'border-[#1B5E3A] text-zinc-950'
              : 'border-transparent text-zinc-600'
          }`}
        >
          Parser Lab
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('spec')}
          className={`py-1 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'spec'
              ? 'border-[#1B5E3A] text-zinc-950'
              : 'border-transparent text-zinc-600'
          }`}
        >
          Format Spec
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[300px_minmax(0,1fr)_340px] 2xl:grid-cols-[340px_minmax(0,1fr)_380px] gap-5 lg:gap-6 items-start xl:items-stretch">
            {/* Board Stage: Top on mobile, left on tablet/split-pane, center on wide desktop */}
            <section
              aria-label="Interactive Chessboard"
              className="min-w-0 md:col-start-1 md:row-start-1 md:row-span-2 xl:col-start-2 xl:row-start-1 xl:row-span-1 flex flex-col items-center justify-start xl:justify-center bg-white border border-[#E2E0D8] rounded-lg p-3.5 sm:p-5 lg:p-6"
            >
              <div className="w-full max-w-[min(92vw,600px)] flex flex-col gap-3">
                {/* Turn & Board Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7F6F2] border border-[#E2E0D8] rounded-lg px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`w-4 h-4 rounded-sm border border-zinc-800 shrink-0 ${
                        status.turnColor === 'w' ? 'bg-white' : 'bg-zinc-900'
                      }`}
                    />
                    <span className="text-sm font-semibold text-zinc-900 truncate">
                      {status.turnLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleUndoMove}
                      disabled={board.history.length === 0}
                      aria-label="Undo last move"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-[#EDEAD9] disabled:opacity-45 disabled:pointer-events-none border border-[#E2E0D8] rounded-md transition-colors whitespace-nowrap min-h-[36px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
                    >
                      <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={handleFlipBoard}
                      aria-label="Flip board orientation"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-[#EDEAD9] border border-[#E2E0D8] rounded-md transition-colors whitespace-nowrap min-h-[36px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                      Flip
                    </button>
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? 'Unmute move sounds' : 'Mute move sounds'}
                      aria-pressed={!muted}
                      className="inline-flex items-center justify-center p-2 text-zinc-700 bg-white hover:bg-[#EDEAD9] border border-[#E2E0D8] rounded-md transition-colors min-h-[36px] min-w-[36px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
                    >
                      {muted ? (
                        <VolumeX className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetBoard}
                      aria-label="Reset board to starting position"
                      className="inline-flex items-center justify-center p-2 text-zinc-700 bg-white hover:bg-[#EDEAD9] border border-[#E2E0D8] rounded-md transition-colors min-h-[36px] min-w-[36px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Chessboard */}
                <ChessBoard
                  fen={board.fen}
                  orientation={board.orientation}
                  lastMove={board.lastMove}
                  onMakeMove={handleMakeMove}
                />

                {/* Quiet Board Legend */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 px-1">
                  <span>
                    Click or tap a piece to highlight legal moves and captures.
                  </span>
                  <span className="font-mono-tabular">
                    Orientation: {board.orientation === 'white' ? 'White' : 'Black'}
                  </span>
                </div>
              </div>
            </section>

            {/* Opening List: Below board on mobile, top-right on tablet/split-pane, left on desktop */}
            <div className="min-w-0 md:col-start-2 md:row-start-1 xl:col-start-1 xl:row-start-1">
              <OpeningList
                loading={loadingOpening}
                loadError={loadError}
                opening={opening}
                selectedVariationName={selectedVariationName}
                onSelectVariation={handleSelectVariation}
                onLoadVariationOnBoard={handleLoadVariationOnBoard}
              />
            </div>

            {/* Notes & Move History: Bottom on mobile, bottom-right on tablet/split-pane, right on desktop */}
            <div className="min-w-0 md:col-start-2 md:row-start-2 xl:col-start-3 xl:row-start-1">
              <NotesPanel
                opening={opening}
                selectedVariation={selectedVariation}
                history={board.history}
                fen={board.fen}
                activeLineLabel={board.activeLineLabel}
              />
            </div>
          </div>
        )}

        {activeTab === 'parser' && <ParserLab initialMarkdown={rawMarkdown} />}

        {activeTab === 'spec' && <FormatSpecView />}
      </main>
    </div>
  );
}
