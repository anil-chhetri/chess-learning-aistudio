import { AlertCircle, CheckCircle2, Clock, Lightbulb } from 'lucide-react';
import {
  DRILL_STATES,
  type DrillState,
  type GuidedMoveInfo,
} from '../lib/drill.ts';

export type SessionMode = 'practice' | 'test';

interface TurnBannerProps {
  drill: DrillState;
  sessionMode: SessionMode;
  guidedMove: GuidedMoveInfo | null;
  practiceAllComplete: boolean;
}

export function TurnBanner({
  drill,
  sessionMode,
  guidedMove,
  practiceAllComplete,
}: TurnBannerProps) {
  const variationColor = drill.variation?.playerColor === 'black' ? 'b' : 'w';
  const sideLabel = variationColor === 'w' ? 'White' : 'Black';

  if (drill.feedback === 'wrong' || drill.wrongSquare) {
    return (
      <div
        key={`wrong-${drill.wrongAttemptSeq}`}
        role="status"
        aria-live="polite"
        className="w-full min-h-[38px] px-3.5 py-1.5 rounded-[10px] border border-red-300 bg-red-50 text-error flex items-center justify-between gap-3 animate-banner-shake"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="ds-text-body-bold truncate">
            Not quite, try again
          </span>
        </div>
        {sessionMode === 'practice' && guidedMove && (
          <span className="ds-text-meta font-semibold shrink-0">
            Play {guidedMove.san}
          </span>
        )}
      </div>
    );
  }

  if (drill.feedback === 'correct') {
    return (
      <div
        key={`correct-${drill.drillIndex}`}
        role="status"
        aria-live="polite"
        className="w-full min-h-[38px] px-3.5 py-1.5 rounded-[10px] border border-primary-500 bg-primary-100 text-primary-900 flex items-center justify-between gap-3 animate-banner-pulse"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
          <span className="ds-text-body-bold">Correct!</span>
        </div>
        <span className="ds-text-meta font-medium text-primary-900 shrink-0">
          {drill.status === DRILL_STATES.OPPONENT_TURN
            ? 'Opponent replying...'
            : 'Line complete'}
        </span>
      </div>
    );
  }

  if (drill.status === DRILL_STATES.USER_TURN) {
    const isPractice = sessionMode === 'practice';
    return (
      <div
        role="status"
        aria-live="polite"
        className={`w-full min-h-[38px] px-3.5 py-1.5 rounded-[10px] border flex items-center justify-between gap-3 ${
          isPractice
            ? 'border-primary-500/40 bg-primary-50 text-primary-900'
            : 'border-neutral-200 bg-neutral-100 text-neutral-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isPractice ? (
            <Lightbulb
              className="w-5 h-5 text-accent-500 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-sm border border-neutral-900 shrink-0 ${
                variationColor === 'w' ? 'bg-white' : 'bg-neutral-900'
              }`}
            />
          )}
          <span className="ds-text-body-bold truncate">
            {isPractice && guidedMove
              ? `Your Move: Play ${guidedMove.san}`
              : 'Your Move'}
          </span>
        </div>
        <span className="ds-text-meta text-neutral-500 shrink-0">
          Playing {sideLabel}
        </span>
      </div>
    );
  }

  if (drill.status === DRILL_STATES.OPPONENT_TURN) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full min-h-[38px] px-3.5 py-1.5 rounded-[10px] border border-neutral-200 bg-neutral-100 text-neutral-700 flex items-center gap-2.5"
      >
        <Clock className="w-4 h-4 text-neutral-500 shrink-0" aria-hidden="true" />
        <span className="ds-text-body-bold">Opponent playing reply...</span>
      </div>
    );
  }

  if (drill.status === DRILL_STATES.VARIATION_COMPLETE) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full min-h-[38px] px-3.5 py-1.5 rounded-[10px] border border-primary-500/40 bg-primary-100 text-primary-900 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
          <span className="ds-text-body-bold">
            {practiceAllComplete ? 'All variations complete!' : 'Line complete!'}
          </span>
        </div>
        <span className="ds-text-meta font-medium shrink-0">
          {drill.mistakes} {drill.mistakes === 1 ? 'mistake' : 'mistakes'}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="w-full min-h-[38px] px-3.5 py-1.5 rounded-[10px] border border-neutral-200 bg-neutral-100 text-neutral-700 flex items-center"
    >
      <span className="ds-text-body">Select a variation to begin drilling</span>
    </div>
  );
}
