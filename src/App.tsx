import { useCallback, useEffect, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import {
  AlertCircle,
  Layers,
  Lightbulb,
  Repeat,
} from 'lucide-react';
import { BoardToolbar } from './components/BoardToolbar.tsx';
import { Button } from './components/Button.tsx';
import { ChessBoard } from './components/ChessBoard.tsx';
import { CompletionModal } from './components/CompletionModal.tsx';
import { FormatSpecView } from './components/FormatSpecView.tsx';
import { MoveHistory } from './components/MoveHistory.tsx';
import { NotesPanel } from './components/NotesPanel.tsx';
import { OpeningList } from './components/OpeningList.tsx';
import { ParserLab } from './components/ParserLab.tsx';
import { ProgressHeader } from './components/ProgressHeader.tsx';
import { SidePeekHandle } from './components/SidePeekHandle.tsx';
import { TurnBanner, type SessionMode } from './components/TurnBanner.tsx';
import {
  applyOpponentDrillMove,
  applyUserDrillMove,
  calculateAccuracy,
  computeGuidedMove,
  computeHintSquares,
  CORRECT_FEEDBACK_MS,
  createIdleDrillState,
  DRILL_STATES,
  getNextPracticeVariation,
  getVariationKey,
  LOOP_DELAY_MS,
  OPPONENT_DELAY_MS,
  startVariationDrill,
  WRONG_FLASH_MS,
  type DrillState,
} from './lib/drill.ts';
import {
  loadOpeningsFromManifest,
  type LoadedOpeningEntry,
} from './lib/loader.ts';
import {
  getVariationStatus,
  recordVariationAttempt,
  recordVariationCompletion,
  type VariationStats,
} from './lib/mastery.ts';
import type { ParsedVariation, PlayerColor } from './lib/parser.ts';
import { playMoveSound } from './lib/sound.ts';
import {
  loadTrainerProgress,
  saveLastSelection,
  saveMistakesByVariation,
  saveVariationStats,
} from './lib/storage.ts';

type AppTab = 'board' | 'parser' | 'spec';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('board');
  const [sessionMode, setSessionMode] = useState<SessionMode>('test');
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
  const [variationStats, setVariationStats] = useState<
    Record<string, VariationStats>
  >(() => loadTrainerProgress().variationStats);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [completionElapsedSec, setCompletionElapsedSec] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showMoves, setShowMoves] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  const opponentTimerRef = useRef<number | null>(null);
  const loopTimerRef = useRef<number | null>(null);
  const wrongFlashTimerRef = useRef<number | null>(null);
  const correctFeedbackTimerRef = useRef<number | null>(null);
  const drillStartMsRef = useRef<number>(Date.now());
  const attemptRecordedRef = useRef<boolean>(false);
  const completionRecordedRef = useRef<boolean>(false);
  const libraryContainerRef = useRef<HTMLDivElement | null>(null);

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
    if (correctFeedbackTimerRef.current !== null) {
      window.clearTimeout(correctFeedbackTimerRef.current);
      correctFeedbackTimerRef.current = null;
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
      setCompletionDismissed(false);
      setOrientationOverride(null);
      setSelectedOpeningPath(openingPath);
      drillStartMsRef.current = Date.now();
      attemptRecordedRef.current = false;
      completionRecordedRef.current = false;
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
      setVariationStats(saved.variationStats);

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
          drillStartMsRef.current = Date.now();
          attemptRecordedRef.current = false;
          completionRecordedRef.current = false;
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

  // Opponent auto-play after 600ms when status === OPPONENT_TURN
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

  // Record completion & elapsed time once when VARIATION_COMPLETE is reached
  useEffect(() => {
    if (
      drill.status !== DRILL_STATES.VARIATION_COMPLETE ||
      !drill.openingPath ||
      !drill.variation ||
      completionRecordedRef.current
    ) {
      return;
    }

    completionRecordedRef.current = true;
    const elapsedSec = Math.max(
      1,
      Math.round((Date.now() - drillStartMsRef.current) / 1000),
    );
    setCompletionElapsedSec(elapsedSec);

    const varKey = getVariationKey(drill.openingPath, drill.variation.name);
    const accuracy = calculateAccuracy(drill.correctMoves, drill.mistakes);

    setVariationStats((prev) => {
      const updated = {
        ...prev,
        [varKey]: recordVariationCompletion(prev[varKey], accuracy),
      };
      saveVariationStats(updated);
      return updated;
    });
  }, [
    drill.status,
    drill.openingPath,
    drill.variation,
    drill.correctMoves,
    drill.mistakes,
  ]);

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

        if (
          !attemptRecordedRef.current &&
          prev.openingPath &&
          prev.variation
        ) {
          attemptRecordedRef.current = true;
          const varKey = getVariationKey(prev.openingPath, prev.variation.name);
          setVariationStats((prevStats) => {
            const nextStats = {
              ...prevStats,
              [varKey]: recordVariationAttempt(prevStats[varKey]),
            };
            saveVariationStats(nextStats);
            return nextStats;
          });
        }

        if (outcome.result === 'correct') {
          if (wrongFlashTimerRef.current !== null) {
            window.clearTimeout(wrongFlashTimerRef.current);
            wrongFlashTimerRef.current = null;
          }
          if (correctFeedbackTimerRef.current !== null) {
            window.clearTimeout(correctFeedbackTimerRef.current);
          }
          correctFeedbackTimerRef.current = window.setTimeout(() => {
            correctFeedbackTimerRef.current = null;
            setDrill((curr) =>
              curr.feedback === 'correct' ? { ...curr, feedback: null } : curr,
            );
          }, CORRECT_FEEDBACK_MS);
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
              curr.wrongSquare || curr.feedback === 'wrong'
                ? { ...curr, wrongSquare: null, feedback: null }
                : curr,
            );
          }, WRONG_FLASH_MS);
        }

        return outcome.state;
      });
    },
    [muted],
  );

  const handleHint = useCallback(() => {
    if (sessionMode !== 'practice') return;
    setDrill((prev) => {
      const hint = computeHintSquares(prev);
      if (!hint) return prev;
      return { ...prev, hintSquares: hint };
    });
  }, [sessionMode]);

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
      const current =
        prev ?? (activeVariation?.playerColor === 'black' ? 'black' : 'white');
      return current === 'white' ? 'black' : 'white';
    });
  }, [activeVariation]);

  const handleToggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  const handleChangeSessionMode = useCallback((mode: SessionMode) => {
    setSessionMode(mode);
    if (mode === 'test') {
      setDrill((prev) =>
        prev.hintSquares ? { ...prev, hintSquares: null } : prev,
      );
    }
  }, []);

  const activeOpeningEntry = openings.find((o) => o.path === drill.openingPath);
  const nextLineInOpening =
    activeOpeningEntry && drill.variation
      ? getNextPracticeVariation(
          activeOpeningEntry.parsed.variations,
          drill.variation.name,
        )
      : null;

  const handleNextLine = useCallback(() => {
    if (!drill.openingPath || !nextLineInOpening) return;
    const nextKey = getVariationKey(drill.openingPath, nextLineInOpening.name);
    setMistakesByVariation((prev) => {
      const next = { ...prev, [nextKey]: 0 };
      saveMistakesByVariation(next);
      return next;
    });
    beginVariationDrill(drill.openingPath, nextLineInOpening, 0);
  }, [drill.openingPath, nextLineInOpening, beginVariationDrill]);

  const handleToggleLibrary = useCallback(() => {
    setShowLibrary((prev) => !prev);
  }, []);

  const handleToggleMoves = useCallback(() => {
    setShowMoves((prev) => !prev);
  }, []);

  const handleToggleNotes = useCallback(() => {
    setShowNotes((prev) => !prev);
  }, []);

  const handleBackToLibrary = useCallback(() => {
    setCompletionDismissed(true);
    setShowLibrary(true);
    window.requestAnimationFrame(() => {
      libraryContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  const guidedMove =
    sessionMode === 'practice' ? computeGuidedMove(drill) : null;
  const activeHintSquares =
    sessionMode === 'practice' && guidedMove
      ? { from: guidedMove.from, to: guidedMove.to }
      : null;
  const activeArrowMove =
    sessionMode === 'practice' && guidedMove
      ? { from: guidedMove.from, to: guidedMove.to }
      : null;
  const boardLocked = drill.status !== DRILL_STATES.USER_TURN;
  const canHint =
    drill.status === DRILL_STATES.USER_TURN && sessionMode === 'practice';
  const canReset = Boolean(drill.variation);

  const activeVarKey =
    drill.openingPath && drill.variation
      ? getVariationKey(drill.openingPath, drill.variation.name)
      : null;
  const activeVarStats = activeVarKey ? variationStats[activeVarKey] : undefined;
  const showCompletionModal =
    drill.status === DRILL_STATES.VARIATION_COMPLETE &&
    !autoLoop &&
    !practiceAll &&
    !completionDismissed &&
    Boolean(drill.variation);

  const boardGridClass = showLibrary
    ? 'grid-cols-1 md:grid-cols-[276px_minmax(0,1fr)] xl:grid-cols-[296px_minmax(0,1fr)]'
    : 'grid-cols-1';

  const isFocusMode = !showLibrary;
  const boardStageWidthClass = isFocusMode
    ? showMoves
      ? 'board-stage-focus'
      : 'board-stage-focus-nomoves'
    : showMoves
      ? 'board-stage-with-library'
      : 'board-stage-with-library-nomoves';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 overflow-x-hidden">
      {/* Three-Zone Top Bar */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4 sm:gap-8">
          <a
            href="#board"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('board');
            }}
            className="font-display ds-text-heading tracking-tight text-neutral-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700"
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
              className={`py-1 ds-text-body-bold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700 ${
                activeTab === 'board'
                  ? 'border-primary-700 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parser')}
              className={`py-1 ds-text-body-bold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700 ${
                activeTab === 'parser'
                  ? 'border-primary-700 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Parser Lab
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spec')}
              className={`py-1 ds-text-body-bold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700 ${
                activeTab === 'spec'
                  ? 'border-primary-700 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Format Spec
            </button>
          </nav>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleResetDrill}
              disabled={!canReset}
              aria-label="Reset drill"
            >
              Reset Drill
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile View Switcher */}
      <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-2 flex items-center gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('board')}
          className={`py-1 ds-text-label border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'board'
              ? 'border-primary-700 text-neutral-900'
              : 'border-transparent text-neutral-500'
          }`}
        >
          Board
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parser')}
          className={`py-1 ds-text-label border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'parser'
              ? 'border-primary-700 text-neutral-900'
              : 'border-transparent text-neutral-500'
          }`}
        >
          Parser Lab
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('spec')}
          className={`py-1 ds-text-label border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'spec'
              ? 'border-primary-700 text-neutral-900'
              : 'border-transparent text-neutral-500'
          }`}
        >
          Format Spec
        </button>
      </div>

      {/* Main Content */}
      <main
        className={`flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4 ${
          activeTab === 'board' && isFocusMode ? 'py-2' : 'py-4'
        }`}
      >
        {/* Content Pipeline Error Banner */}
        {loadErrors.length > 0 && (
          <div
            role="alert"
            className="bg-red-50 border border-red-300 text-error rounded-[12px] p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="ds-text-body space-y-1">
              {loadErrors.map((errMsg, idx) => (
                <p key={idx} className="font-semibold">
                  {errMsg}
                </p>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className={`grid ${boardGridClass} gap-4 xl:gap-5 items-start`}>
            {/* Opening List with Mastery Status Badges (Left Sidebar, Hideable + Side Arrow Peek/Open) */}
            {showLibrary ? (
              <div ref={libraryContainerRef} className="min-w-0 order-2 md:order-1">
                <OpeningList
                  loading={loadingOpenings}
                  openings={openings}
                  selectedOpeningPath={selectedOpeningPath}
                  selectedVariationName={activeVariation?.name ?? null}
                  mistakesByVariation={mistakesByVariation}
                  variationStats={variationStats}
                  onSelectOpening={handleSelectOpening}
                  onStartVariationDrill={handleStartVariationDrill}
                  onHide={handleToggleLibrary}
                />
              </div>
            ) : (
              <SidePeekHandle
                side="left"
                label="Opening Library"
                onOpen={handleToggleLibrary}
              >
                <OpeningList
                  loading={loadingOpenings}
                  openings={openings}
                  selectedOpeningPath={selectedOpeningPath}
                  selectedVariationName={activeVariation?.name ?? null}
                  mistakesByVariation={mistakesByVariation}
                  variationStats={variationStats}
                  onSelectOpening={handleSelectOpening}
                  onStartVariationDrill={handleStartVariationDrill}
                />
              </SidePeekHandle>
            )}

            {/* Enlarged Board Stage with Progress at Top and Moves + Study Notes at Bottom */}
            <section
              aria-label="Interactive Drill Chessboard"
              className={`min-w-0 order-1 ${
                showLibrary ? 'md:order-2' : ''
              } flex flex-col items-center justify-start bg-white border border-neutral-200 rounded-[12px] shadow-sm ${
                isFocusMode ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'
              }`}
            >
              <div className={`${boardStageWidthClass} flex flex-col gap-2`}>
                {/* Compact Progress Strip at Top */}
                {activeVariation && drill.status !== DRILL_STATES.IDLE && (
                  <ProgressHeader
                    drillIndex={drill.drillIndex}
                    totalMoves={activeVariation.moves.length}
                    correctMoves={drill.correctMoves}
                    mistakes={drill.mistakes}
                  />
                )}

                {/* Board Toolbar with Mode Toggle (Test default / Practice), Flip, Reset, Sound, and ... Menu (FEN) */}
                <BoardToolbar
                  sessionMode={sessionMode}
                  muted={muted}
                  fen={drill.fen}
                  canReset={canReset}
                  onChangeSessionMode={handleChangeSessionMode}
                  onFlipBoard={handleFlipBoard}
                  onResetDrill={handleResetDrill}
                  onToggleMute={handleToggleMute}
                />

                {/* Turn Banner */}
                <TurnBanner
                  drill={drill}
                  sessionMode={sessionMode}
                  guidedMove={guidedMove}
                  practiceAllComplete={practiceAllComplete}
                />

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

                {/* Horizontal Move History (Thin hover/click bar when hidden) */}
                <MoveHistory
                  history={drill.history}
                  pinned={showMoves}
                  onToggle={handleToggleMoves}
                />

                {/* 3 Coaching Controls: Hint, Auto-Loop, Practice All */}
                <div
                  role="group"
                  aria-label="Coaching controls"
                  className="grid grid-cols-3 gap-2"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleHint}
                    disabled={!canHint}
                    aria-label="Show hint"
                    title={
                      sessionMode === 'test'
                        ? 'Test: Hints are disabled'
                        : 'Practice: Highlight next move'
                    }
                  >
                    <Lightbulb
                      className="w-4 h-4 text-accent-500"
                      aria-hidden="true"
                    />
                    Hint
                  </Button>

                  <Button
                    variant={autoLoop ? 'primary' : 'secondary'}
                    size="sm"
                    aria-pressed={autoLoop}
                    aria-label="Toggle auto-loop"
                    onClick={handleToggleAutoLoop}
                  >
                    <Repeat className="w-4 h-4" aria-hidden="true" />
                    Auto-Loop
                  </Button>

                  <Button
                    variant={practiceAll ? 'primary' : 'secondary'}
                    size="sm"
                    aria-pressed={practiceAll}
                    aria-label="Toggle practice all variations"
                    onClick={handleTogglePracticeAll}
                  >
                    <Layers className="w-4 h-4" aria-hidden="true" />
                    Practice All
                  </Button>
                </div>

                {/* Structured Study Notes at Bottom (Thin hover/click bar when hidden) */}
                <NotesPanel
                  opening={selectedOpening}
                  selectedVariation={activeVariation}
                  pinned={showNotes}
                  onToggle={handleToggleNotes}
                />
              </div>
            </section>
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

      {/* Sprint 2.3 Line Completion Modal */}
      {drill.variation && (
        <CompletionModal
          open={showCompletionModal}
          openingTitle={activeOpeningEntry?.parsed.title ?? ''}
          variationName={drill.variation.name}
          totalMoves={drill.variation.moves.length}
          correctMoves={drill.correctMoves}
          mistakes={drill.mistakes}
          elapsedSeconds={completionElapsedSec}
          masteryStatus={getVariationStatus(activeVarStats)}
          highAccuracyCompletions={activeVarStats?.highAccuracyCompletions ?? 0}
          hasNextLine={Boolean(nextLineInOpening)}
          onPracticeAgain={handleResetDrill}
          onNextLine={handleNextLine}
          onBackToLibrary={handleBackToLibrary}
        />
      )}
    </div>
  );
}
