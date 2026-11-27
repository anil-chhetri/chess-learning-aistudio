import { calculateAccuracy } from '../lib/drill.ts';

interface ProgressHeaderProps {
  drillIndex: number;
  totalMoves: number;
  correctMoves: number;
  mistakes: number;
}

export function ProgressHeader({
  drillIndex,
  totalMoves,
  correctMoves,
  mistakes,
}: ProgressHeaderProps) {
  const progressPct =
    totalMoves > 0
      ? Math.min(100, Math.round((drillIndex / totalMoves) * 100))
      : 0;
  const accuracy = calculateAccuracy(correctMoves, mistakes);

  return (
    <section
      aria-label="Drill progress"
      className="w-full bg-neutral-50 border border-neutral-200 rounded-[10px] px-3 py-1.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 ds-text-meta font-mono-tabular"
    >
      <span className="font-semibold text-neutral-900 shrink-0">
        Move {drillIndex} of {totalMoves}
      </span>

      <div
        role="progressbar"
        aria-valuenow={drillIndex}
        aria-valuemin={0}
        aria-valuemax={totalMoves}
        aria-label={`Progress ${progressPct}%`}
        className="flex-1 min-w-[80px] h-1.5 bg-neutral-200 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-primary-500 transition-all duration-200"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="font-semibold text-neutral-700">
          Accuracy: {accuracy}%
        </span>
        <span
          className={`font-semibold ${
            mistakes > 0 ? 'text-error' : 'text-success'
          }`}
        >
          Mistakes: {mistakes}
        </span>
      </div>
    </section>
  );
}
