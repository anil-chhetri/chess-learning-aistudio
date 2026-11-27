import { useEffect } from 'react';
import { Award, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { calculateAccuracy } from '../lib/drill.ts';
import type { MasteryStatus } from '../lib/mastery.ts';
import { Button } from './Button.tsx';
import { StatusBadge } from './StatusBadge.tsx';

interface CompletionModalProps {
  open: boolean;
  openingTitle: string;
  variationName: string;
  totalMoves: number;
  correctMoves: number;
  mistakes: number;
  elapsedSeconds: number;
  masteryStatus: MasteryStatus;
  highAccuracyCompletions: number;
  hasNextLine: boolean;
  onPracticeAgain: () => void;
  onNextLine: () => void;
  onBackToLibrary: () => void;
}

function formatDuration(seconds: number): string {
  const safe = Math.max(1, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CompletionModal({
  open,
  openingTitle,
  variationName,
  totalMoves,
  correctMoves,
  mistakes,
  elapsedSeconds,
  masteryStatus,
  highAccuracyCompletions,
  hasNextLine,
  onPracticeAgain,
  onNextLine,
  onBackToLibrary,
}: CompletionModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBackToLibrary();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onBackToLibrary]);

  if (!open) return null;

  const accuracy = calculateAccuracy(correctMoves, mistakes);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
    >
      <div className="bg-white border border-neutral-200 rounded-[12px] shadow-md p-6 w-full max-w-md space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="w-5 h-5 text-success shrink-0"
                aria-hidden="true"
              />
              <h2
                id="completion-modal-title"
                className="font-display ds-text-display text-neutral-900"
              >
                Line Complete!
              </h2>
            </div>
            <p className="ds-text-body text-neutral-500">
              {openingTitle} · {variationName}
            </p>
          </div>
          <StatusBadge status={masteryStatus} />
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-3 gap-3 bg-neutral-50 border border-neutral-200 rounded-[12px] p-4">
          <div>
            <div className="ds-text-meta text-neutral-500">Accuracy</div>
            <div className="ds-text-display font-mono-tabular text-neutral-900">
              {accuracy}%
            </div>
          </div>
          <div>
            <div className="ds-text-meta text-neutral-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              Time
            </div>
            <div className="ds-text-display font-mono-tabular text-neutral-900">
              {formatDuration(elapsedSeconds)}
            </div>
          </div>
          <div>
            <div className="ds-text-meta text-neutral-500">Moves</div>
            <div className="ds-text-display font-mono-tabular text-neutral-900">
              {totalMoves}/{totalMoves}
            </div>
          </div>
        </div>

        {/* Mastery Progress Note */}
        <div className="flex items-center gap-2 ds-text-body text-neutral-700 bg-primary-50 border border-primary-100 rounded-[10px] px-3 py-2.5">
          <Award
            className="w-4 h-4 text-primary-700 shrink-0"
            aria-hidden="true"
          />
          <span>
            {masteryStatus === 'mastered'
              ? 'Mastered! You completed this line with ≥80% accuracy twice.'
              : accuracy >= 80
                ? `${highAccuracyCompletions}/2 high-accuracy completions toward Mastered.`
                : 'Complete with ≥80% accuracy twice to earn Mastered status.'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={onPracticeAgain}
            className="flex-1"
            aria-label="Practice Again"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Practice Again
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onNextLine}
            disabled={!hasNextLine}
            className="flex-1"
            aria-label="Next Line"
          >
            Next Line
          </Button>
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLibrary}
            aria-label="Back to Library"
          >
            Back to Library
          </Button>
        </div>
      </div>
    </div>
  );
}
