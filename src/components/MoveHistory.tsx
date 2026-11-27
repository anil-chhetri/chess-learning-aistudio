import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MovePair {
  moveNumber: number;
  white: string;
  black: string | null;
}

interface MoveHistoryProps {
  history: string[];
  pinned: boolean;
  onToggle: () => void;
}

const HOVER_CLOSE_DELAY_MS = 140;

function groupHistoryIntoPairs(history: string[]): MovePair[] {
  const pairs: MovePair[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] ?? null,
    });
  }
  return pairs;
}

export function MoveHistory({ history, pinned, onToggle }: MoveHistoryProps) {
  const movePairs = groupHistoryIntoPairs(history);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [peeking, setPeeking] = useState(false);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setPeeking(false);
    }, HOVER_CLOSE_DELAY_MS);
  }, [cancelScheduledClose]);

  useEffect(() => {
    return () => {
      cancelScheduledClose();
    };
  }, [cancelScheduledClose]);

  useEffect(() => {
    if (pinned) {
      cancelScheduledClose();
      setPeeking(false);
    }
  }, [pinned, cancelScheduledClose]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [history.length, pinned, peeking]);

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (pinned || event.pointerType !== 'mouse') return;
    cancelScheduledClose();
    setPeeking(true);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (pinned || event.pointerType !== 'mouse') return;
    scheduleClose();
  };

  const handlePinOpen = () => {
    cancelScheduledClose();
    setPeeking(false);
    onToggle();
  };

  const renderMovePairs = () => (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap flex items-center gap-3 font-mono-tabular ds-text-meta py-0.5"
    >
      {movePairs.length === 0 ? (
        <span className="text-neutral-500 font-sans">
          Play the opening move to begin
        </span>
      ) : (
        movePairs.map((pair, idx) => {
          const isLastPair = idx === movePairs.length - 1;
          return (
            <span
              key={pair.moveNumber}
              className="inline-flex items-center gap-1 shrink-0"
            >
              <span className="text-neutral-500">{pair.moveNumber}.</span>
              <span
                className={
                  isLastPair && pair.black === null
                    ? 'font-semibold text-primary-700'
                    : 'text-neutral-900'
                }
              >
                {pair.white}
              </span>
              {pair.black !== null && (
                <span
                  className={
                    isLastPair
                      ? 'font-semibold text-primary-700'
                      : 'text-neutral-900'
                  }
                >
                  {pair.black}
                </span>
              )}
            </span>
          );
        })
      )}
    </div>
  );

  if (pinned) {
    return (
      <section
        aria-label="Move History"
        className="w-full min-h-[34px] px-3 py-1 rounded-[10px] border border-neutral-200 bg-neutral-50 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Hide move history"
          title="Click to collapse move history"
          className="ds-text-label text-neutral-600 hover:text-neutral-900 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-700 rounded"
        >
          Moves
        </button>

        {renderMovePairs()}

        <button
          type="button"
          onClick={onToggle}
          aria-label="Hide move history"
          title="Hide move history"
          className="p-0.5 text-neutral-500 hover:text-neutral-900 rounded-[6px] hover:bg-neutral-200/60 shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary-700"
        >
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </section>
    );
  }

  return (
    <div
      className="relative w-full h-3.5 flex items-center"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <button
        type="button"
        onClick={handlePinOpen}
        aria-label="Show move history"
        aria-expanded={peeking}
        title="Hover to preview moves or click to keep visible"
        className="group w-full h-3.5 flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-700 rounded"
      >
        <span className="h-[2px] flex-1 rounded-full bg-neutral-200 group-hover:bg-primary-600 transition-colors" />
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold leading-none text-neutral-500 group-hover:text-primary-800 transition-colors shrink-0">
          <ChevronUp className="w-3 h-3" aria-hidden="true" />
          <span>Moves</span>
        </span>
        <span className="h-[2px] flex-1 rounded-full bg-neutral-200 group-hover:bg-primary-600 transition-colors" />
      </button>

      {peeking && (
        <section
          aria-label="Move History preview"
          onClick={handlePinOpen}
          className="absolute bottom-0 left-0 right-0 z-30 min-h-[38px] px-3 py-1 rounded-[10px] border border-primary-600/50 bg-white/95 backdrop-blur-xs shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <span className="ds-text-label text-primary-900 shrink-0">Moves</span>
          {renderMovePairs()}
          <span className="p-0.5 text-primary-700 shrink-0" aria-hidden="true">
            <ChevronUp className="w-4 h-4" />
          </span>
        </section>
      )}
    </div>
  );
}
