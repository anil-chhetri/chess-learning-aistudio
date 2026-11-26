import { useCallback, useEffect, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import {
  AlertCircle,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Compass,
  Layers,
  Lightbulb,
  Repeat,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChessBoard } from './components/ChessBoard.tsx';
import { FormatSpecView } from './components/FormatSpecView.tsx';
import { NotesPanel } from './components/NotesPanel.tsx';
import { OpeningList } from './components/OpeningList.tsx';
import { ParserLab } from './components/ParserLab.tsx';
import {
  applyOpponentDrillMove,
  applyUserDrillMove,
  computeGuidedMove,
  computeHintSquares,
  createIdleDrillState,
  DRILL_STATES,
  getNextPracticeVariation,
  getVariationKey,
  LOOP_DELAY_MS,
  OPPONENT_DELAY_MS,
  startVariationDrill,
  WRONG_FLASH_MS,
  type DrillState,
  type GuidedMoveInfo,
} from './lib/drill.ts';
import {
  loadOpeningsFromManifest,
  type LoadedOpeningEntry,
} from './lib/loader.ts';
import type { ParsedVariation, PlayerColor } from './lib/parser.ts';
import { playMoveSound } from './lib/sound.ts';
import {
  loadTrainerProgress,
  saveLastSelection,
  saveMistakesByVariation,
} from './lib/storage.ts';

type AppTab = 'board' | 'parser' | 'spec';
type SessionMode = 'practice' | 'test';

function getDrillStatusBanner(
  drill: DrillState,
  practiceAllComplete: boolean,
  sessionMode: SessionMode,
  guidedMove: GuidedMoveInfo | null,
): {
  label: string;
  tone: 'neutral' | 'turn' | 'wait' | 'wrong' | 'complete';
  colorSquare: 'w' | 'b';
} {
  const variationColor = drill.variation?.playerColor === 'black' ? 'b' : 'w';

  if (drill.wrongSquare) {
    return {
      label:
        sessionMode === 'practice' && guidedMove
          ? `Follow arrow · Play ${guidedMove.san} (${guidedMove.from} → ${guidedMove.to})`
          : 'Not the opening move — try again or use Hint',
      tone: 'wrong',
      colorSquare: variationColor,
    };
  }
  if (drill.status === DRILL_STATES.USER_TURN) {
    if (sessionMode === 'practice' && guidedMove) {
      return {
        label: `Practice · Play ${guidedMove.san} (${guidedMove.from} → ${guidedMove.to})`,
        tone: 'turn',
        colorSquare: variationColor,
      };
    }
    return {
      label: `Your turn (${variationColor === 'w' ? 'White' : 'Black'})`,
      tone: 'turn',
      colorSquare: variationColor,
    };
  }
  if (drill.status === DRILL_STATES.OPPONENT_TURN) {
    return {
      label: 'Opponent playing reply...',
      tone: 'wait',
      colorSquare: variationColor === 'w' ? 'b' : 'w',
    };
  }
  if (drill.status === DRILL_STATES.VARIATION_COMPLETE) {
    return {
      label: practiceAllComplete
        ? 'All variations complete!'
        : `Line complete · ${drill.mistakes} ${drill.mistakes === 1 ? 'mistake' : 'mistakes'}`,
      tone: 'complete',
      colorSquare: variationColor,
    };
  }
  return {
    label: 'Select a variation to begin drilling',
    tone: 'neutral',
    colorSquare: 'w',
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('board');
  const [sessionMode, setSessionMode] = useState<SessionMode>('practice');
  const [loadingOpenings, setLoadingOpenings] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [openings, setOpenings] = useState<LoadedOpeningEntry[]>([]);
  const [selectedOpeningPath, setSelectedOpeningPath] = useState<string | null>(
    null,
  );
  const [drill, setDrill] = useState<DrillState>(() => createIdleDrillState());
  const [orientationOverride, setOrientationOverride] =
    useState<PlayerColor | null>(null);
  const [autoLoop, setAutoLoop] = useState(false);
  const [practiceAll, setPracticeAll] = useState(false);
  const [practiceAllComplete, setPracticeAllComplete] = useState(false);
  const [mistakesByVariation, setMistakesByVariation] = useState<
    Record<string, number>
  >(() => loadTrainerProgress().mistakesByVariation);
  const [muted, setMuted] = useState(false);

  const opponentTimerRef = useRef<number | null>(null);
  const loopTimerRef = useRef<number | null>(null);
  const wrongFlashTimerRef = useRef<number | null>(null);

  const clearPendingTimers = useCallback(() => {
    if (opponentTimerRef.current !== null) {
      window.clearTimeout(opponentTimerRef.current);
      opponentTimerRef.current = null;
    }
    if (loopTimerRef.current !== null) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    if (wrongFlashTimerRef.current !== null) {
      window.clearTimeout(wrongFlashTimerRef.current);
      wrongFlashTimerRef.current = null;
    }
  }, []);

  const beginVariationDrill = useCallback(
    (
      openingPath: string,
      variation: ParsedVariation,
      initialMistakes = 0,
    ) => {
      clearPendingTimers();
      setPracticeAllComplete(false);
      setOrientationOverride(null);
      setSelectedOpeningPath(openingPath);
      saveLastSelection(openingPath, variation.name);
      setDrill(startVariationDrill(openingPath, variation, initialMistakes));
    },
    [clearPendingTimers],
  );

  // Hydrate library + restore localStorage progress on mount
  useEffect(() => {
    let cancelled = false;

    async function hydrateLibrary() {
      setLoadingOpenings(true);
      const result = await loadOpeningsFromManifest();
      if (cancelled) return;

      setOpenings(result.openings);
      setLoadErrors(result.errors);

      const saved = loadTrainerProgress();
      setMistakesByVariation(saved.mistakesByVariation);

      const matchedEntry =
        result.openings.find((o) => o.path === saved.lastOpening) ??
        result.openings[0] ??
        null;

      if (matchedEntry) {
        setSelectedOpeningPath(matchedEntry.path);
        const matchedVariation =
          matchedEntry.parsed.variations.find(
            (v) => v.valid && v.name === saved.lastVariation,
          ) ??
          matchedEntry.parsed.variations.find((v) => v.valid) ??
          null;

        if (matchedVariation) {
          const varKey = getVariationKey(
            matchedEntry.path,
            matchedVariation.name,
          );
          const restoredMistakes = saved.mistakesByVariation[varKey] ?? 0;
          saveLastSelection(matchedEntry.path, matchedVariation.name);
          setDrill(
            startVariationDrill(
              matchedEntry.path,
              matchedVariation,
              restoredMistakes,
            ),
          );
        }
      }

      setLoadingOpenings(false);
    }

    hydrateLibrary();
    return () => {
      cancelled = true;
      clearPendingTimers();
    };
  }, [clearPendingTimers]);

  // Opponent auto-play after 700ms when status === OPPONENT_TURN
  useEffect(() => {
    if (drill.status !== DRILL_STATES.OPPONENT_TURN) return;

    opponentTimerRef.current = window.setTimeout(() => {
      opponentTimerRef.current = null;
      setDrill((prev) => {
        const outcome = applyOpponentDrillMove(prev);
        if (outcome.soundType) {
          playMoveSound(outcome.soundType, muted);
        }
        return outcome.state;
      });
    }, OPPONENT_DELAY_MS);

    return () => {
      if (opponentTimerRef.current !== null) {
        window.clearTimeout(opponentTimerRef.current);
        opponentTimerRef.current = null;
      }
    };
  }, [drill.status, drill.drillIndex, drill.variation?.name, muted]);

  // Auto-Loop or Practice All transition after 1500ms on VARIATION_COMPLETE
  useEffect(() => {
    if (drill.status !== DRILL_STATES.VARIATION_COMPLETE || !drill.variation) {
      return;
    }
    if (!autoLoop && !practiceAll) return;

    loopTimerRef.current = window.setTimeout(() => {
      loopTimerRef.current = null;

      if (autoLoop && drill.openingPath && drill.variation) {
        const varKey = getVariationKey(drill.openingPath, drill.variation.name);
        setMistakesByVariation((prev) => {
          const next = { ...prev, [varKey]: 0 };
          saveMistakesByVariation(next);
          return next;
        });
        beginVariationDrill(drill.openingPath, drill.variation, 0);
        return;
      }

      if (practiceAll && drill.openingPath && drill.variation) {
        const activeEntry = openings.find((o) => o.path === drill.openingPath);
        const nextVar = activeEntry
          ? getNextPracticeVariation(
              activeEntry.parsed.variations,
              drill.variation.name,
            )
          : null;

        if (nextVar) {
          const nextKey = getVariationKey(drill.openingPath, nextVar.name);
          setMistakesByVariation((prev) => {
            const next = { ...prev, [nextKey]: 0 };
            saveMistakesByVariation(next);
            return next;
          });
          beginVariationDrill(drill.openingPath, nextVar, 0);
        } else {
          setPracticeAllComplete(true);
          setPracticeAll(false);
        }
      }
    }, LOOP_DELAY_MS);

    return () => {
      if (loopTimerRef.current !== null) {
        window.clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };
  }, [
    drill.status,
    drill.openingPath,
    drill.variation,
    autoLoop,
    practiceAll,
    openings,
    beginVariationDrill,
  ]);

  const selectedOpeningEntry =
    openings.find((entry) => entry.path === selectedOpeningPath) ?? null;
  const selectedOpening = selectedOpeningEntry?.parsed ?? null;
  const activeVariation = drill.variation;
  const boardOrientation: PlayerColor =
    orientationOverride ??
    (activeVariation?.playerColor === 'black' ? 'black' : 'white');

  const handleMakeMove = useCallback(
    (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
      setDrill((prev) => {
        const outcome = applyUserDrillMove(prev, from, to, promotion);
        if (outcome.result === 'ignored') return prev;

        if (outcome.soundType) {
          playMoveSound(outcome.soundType, muted);
        }

        if (outcome.result === 'wrong' && prev.openingPath && prev.variation) {
          const varKey = getVariationKey(prev.openingPath, prev.variation.name);
          const updatedMistakes = outcome.state.mistakes;
          setMistakesByVariation((prevMap) => {
            const nextMap = { ...prevMap, [varKey]: updatedMistakes };
            saveMistakesByVariation(nextMap);
            return nextMap;
          });

          if (wrongFlashTimerRef.current !== null) {
            window.clearTimeout(wrongFlashTimerRef.current);
          }
          wrongFlashTimerRef.current = window.setTimeout(() => {
            wrongFlashTimerRef.current = null;
            setDrill((curr) =>
              curr.wrongSquare ? { ...curr, wrongSquare: null } : curr,
            );
          }, WRONG_FLASH_MS);
        }

        return outcome.state;
      });
    },
    [muted],
  );

  const handleHint = useCallback(() => {
    setDrill((prev) => {
      const hint = computeHintSquares(prev);
      if (!hint) return prev;
      return { ...prev, hintSquares: hint };
    });
  }, []);

  const handleResetDrill = useCallback(() => {
    setActiveTab('board');
    if (drill.openingPath && drill.variation) {
      const varKey = getVariationKey(drill.openingPath, drill.variation.name);
      setMistakesByVariation((prev) => {
        const next = { ...prev, [varKey]: 0 };
        saveMistakesByVariation(next);
        return next;
      });
      beginVariationDrill(drill.openingPath, drill.variation, 0);
    }
  }, [drill.openingPath, drill.variation, beginVariationDrill]);

  const handleToggleAutoLoop = useCallback(() => {
    setAutoLoop((prev) => {
      const next = !prev;
      if (next) {
        setPracticeAll(false);
        setPracticeAllComplete(false);
      }
      return next;
    });
  }, []);

  const handleTogglePracticeAll = useCallback(() => {
    setPracticeAll((prev) => {
      const next = !prev;
      if (next) {
        setAutoLoop(false);
        setPracticeAllComplete(false);
      }
      return next;
    });
  }, []);

  const handleSelectOpening = useCallback(
    (openingPath: string) => {
      setSelectedOpeningPath(openingPath);
      const entry = openings.find((item) => item.path === openingPath);
      const firstValid = entry?.parsed.variations.find((v) => v.valid) ?? null;
      if (firstValid) {
        const varKey = getVariationKey(openingPath, firstValid.name);
        const restoredMistakes = mistakesByVariation[varKey] ?? 0;
        beginVariationDrill(openingPath, firstValid, restoredMistakes);
      }
    },
    [openings, mistakesByVariation, beginVariationDrill],
  );

  const handleStartVariationDrill = useCallback(
    (openingPath: string, variation: ParsedVariation) => {
      const varKey = getVariationKey(openingPath, variation.name);
      const restoredMistakes = mistakesByVariation[varKey] ?? 0;
      beginVariationDrill(openingPath, variation, restoredMistakes);
    },
    [mistakesByVariation, beginVariationDrill],
  );

  const handleFlipBoard = useCallback(() => {
    setOrientationOverride((prev) => {
      const current = prev ?? (activeVariation?.playerColor === 'black' ? 'black' : 'white');
      return current === 'white' ? 'black' : 'white';
    });
  }, [activeVariation]);

  const handleChangeSessionMode = useCallback((mode: SessionMode) => {
    setSessionMode(mode);
    if (mode === 'test') {
      setDrill((prev) => (prev.hintSquares ? { ...prev, hintSquares: null } : prev));
    }
  }, []);

  const guidedMove =
    sessionMode === 'practice' ? computeGuidedMove(drill) : null;
  const activeHintSquares = guidedMove
    ? { from: guidedMove.from, to: guidedMove.to }
    : drill.hintSquares;
  const activeArrowMove = guidedMove
    ? { from: guidedMove.from, to: guidedMove.to }
    : drill.hintSquares;
  const banner = getDrillStatusBanner(
    drill,
    practiceAllComplete,
    sessionMode,
    guidedMove,
  );
  const boardLocked = drill.status !== DRILL_STATES.USER_TURN;
  const canHint =
    drill.status === DRILL_STATES.USER_TURN && sessionMode === 'test';
  const canReset = Boolean(drill.variation);

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
              onClick={handleResetDrill}
              disabled={!canReset}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#154A2D] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
            >
              Reset Drill
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
      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        {/* Content Pipeline Error Banner */}
        {loadErrors.length > 0 && (
          <div
            role="alert"
            className="bg-red-50 border border-red-300 text-red-900 rounded-lg px-4 py-3 flex items-start gap-3"
          >
            <AlertCircle
              className="w-5 h-5 text-red-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-sm space-y-1">
              {loadErrors.map((errMsg, idx) => (
                <p key={idx} className="font-medium">
                  {errMsg}
                </p>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[300px_minmax(0,1fr)_340px] 2xl:grid-cols-[340px_minmax(0,1fr)_380px] gap-5 lg:gap-6 items-start xl:items-stretch">
            {/* Board Stage */}
            <section
              aria-label="Interactive Drill Chessboard"
              className="min-w-0 md:col-start-1 md:row-start-1 md:row-span-2 xl:col-start-2 xl:row-start-1 xl:row-span-1 flex flex-col items-center justify-start xl:justify-center bg-white border border-[#E2E0D8] rounded-lg p-3.5 sm:p-5 lg:p-6"
            >
              <div className="w-full max-w-[min(92vw,600px)] flex flex-col gap-3">
                {/* Session Mode Switcher (Practice = Guided, Test = Memory Recall) */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    role="group"
                    aria-label="Session mode"
                    className="inline-flex rounded-md border border-[#D8D5CB] bg-[#F7F6F2] p-0.5"
                  >
                    <button
                      type="button"
                      aria-pressed={sessionMode === 'practice'}
                      onClick={() => handleChangeSessionMode('practice')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors min-h-[36px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A] ${
                        sessionMode === 'practice'
                          ? 'bg-[#1B5E3A] text-white shadow-xs'
                          : 'text-zinc-700 hover:text-zinc-950'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                      Practice
                    </button>
                    <button
                      type="button"
                      aria-pressed={sessionMode === 'test'}
                      onClick={() => handleChangeSessionMode('test')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors min-h-[36px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A] ${
                        sessionMode === 'test'
                          ? 'bg-[#1B5E3A] text-white shadow-xs'
                          : 'text-zinc-700 hover:text-zinc-950'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      Test
                    </button>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {sessionMode === 'practice'
                      ? 'Shows move direction arrow so you can learn the line'
                      : 'Plays from memory with hints available on demand'}
                  </span>
                </div>

                {/* Drill Status & Utility Bar */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3.5 py-2.5 transition-colors ${
                    banner.tone === 'wrong'
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : banner.tone === 'complete'
                        ? 'bg-[#EBF2ED] border-[#9EC5AC] text-emerald-950'
                        : 'bg-[#F7F6F2] border-[#E2E0D8] text-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {banner.tone === 'complete' ? (
                      <CheckCircle2
                        className="w-4 h-4 text-[#1B5E3A] shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 rounded-sm border border-zinc-800 shrink-0 ${
                          banner.colorSquare === 'w' ? 'bg-white' : 'bg-zinc-900'
                        }`}
                      />
                    )}
                    <span className="text-sm font-semibold truncate">
                      {banner.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
                  </div>
                </div>

                {/* Chessboard */}
                <ChessBoard
                  fen={drill.fen}
                  orientation={boardOrientation}
                  lastMove={drill.lastMove}
                  locked={boardLocked}
                  hintSquares={activeHintSquares}
                  arrowMove={activeArrowMove}
                  wrongSquare={drill.wrongSquare}
                  onMakeMove={handleMakeMove}
                />

                {/* 4 Coaching Controls Only: Hint, Reset, Auto-Loop, Practice All */}
                <div
                  role="group"
                  aria-label="Coaching controls"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  <button
                    type="button"
                    onClick={handleHint}
                    disabled={!canHint}
                    title={
                      sessionMode === 'practice'
                        ? 'Direction is shown automatically in Practice mode'
                        : 'Show the next move'
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-800 bg-[#F7F6F2] hover:bg-[#EDEAD9] disabled:opacity-45 disabled:pointer-events-none border border-[#D8D5CB] rounded-md transition-colors whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600" aria-hidden="true" />
                    Hint
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDrill}
                    disabled={!canReset}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-800 bg-[#F7F6F2] hover:bg-[#EDEAD9] disabled:opacity-45 disabled:pointer-events-none border border-[#D8D5CB] rounded-md transition-colors whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    Reset
                  </button>

                  <button
                    type="button"
                    aria-pressed={autoLoop}
                    onClick={handleToggleAutoLoop}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold border rounded-md transition-colors whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A] ${
                      autoLoop
                        ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]'
                        : 'bg-[#F7F6F2] text-zinc-800 border-[#D8D5CB] hover:bg-[#EDEAD9]'
                    }`}
                  >
                    <Repeat className="w-4 h-4" aria-hidden="true" />
                    Auto-Loop
                  </button>

                  <button
                    type="button"
                    aria-pressed={practiceAll}
                    onClick={handleTogglePracticeAll}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold border rounded-md transition-colors whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A] ${
                      practiceAll
                        ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]'
                        : 'bg-[#F7F6F2] text-zinc-800 border-[#D8D5CB] hover:bg-[#EDEAD9]'
                    }`}
                  >
                    <Layers className="w-4 h-4" aria-hidden="true" />
                    Practice All
                  </button>
                </div>
              </div>
            </section>

            {/* Opening List */}
            <div className="min-w-0 md:col-start-2 md:row-start-1 xl:col-start-1 xl:row-start-1">
              <OpeningList
                loading={loadingOpenings}
                openings={openings}
                selectedOpeningPath={selectedOpeningPath}
                selectedVariationName={activeVariation?.name ?? null}
                mistakesByVariation={mistakesByVariation}
                onSelectOpening={handleSelectOpening}
                onStartVariationDrill={handleStartVariationDrill}
              />
            </div>

            {/* Notes & Move History */}
            <div className="min-w-0 md:col-start-2 md:row-start-2 xl:col-start-3 xl:row-start-1">
              <NotesPanel
                opening={selectedOpening}
                selectedVariation={activeVariation}
                drillStatus={drill.status}
                drillIndex={drill.drillIndex}
                mistakes={drill.mistakes}
                history={drill.history}
                fen={drill.fen}
              />
            </div>
          </div>
        )}

        {activeTab === 'parser' && (
          <ParserLab
            openings={openings.map((entry) => ({
              path: entry.path,
              title: entry.parsed.title || entry.path,
              rawMarkdown: entry.rawMarkdown,
            }))}
          />
        )}

        {activeTab === 'spec' && <FormatSpecView />}
      </main>
    </div>
  );
}
