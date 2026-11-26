import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { DRILL_STATES, type DrillStatus } from '../lib/drill.ts';
import type { ParsedOpening, ParsedVariation } from '../lib/parser.ts';

interface MovePair {
  moveNumber: number;
  white: string;
  black: string | null;
}

interface NotesPanelProps {
  opening: ParsedOpening | null;
  selectedVariation: ParsedVariation | null;
  drillStatus: DrillStatus;
  drillIndex: number;
  mistakes: number;
  history: string[];
  fen: string;
}

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

export function NotesPanel({
  opening,
  selectedVariation,
  drillStatus,
  drillIndex,
  mistakes,
  history,
  fen,
}: NotesPanelProps) {
  const [copiedFen, setCopiedFen] = useState(false);
  const movePairs = groupHistoryIntoPairs(history);
  const totalMoves = selectedVariation?.moves.length ?? 0;
  const progressPct =
    totalMoves > 0 ? Math.min(100, Math.round((drillIndex / totalMoves) * 100)) : 0;

  const handleCopyFen = async () => {
    try {
      await navigator.clipboard.writeText(fen);
      setCopiedFen(true);
      window.setTimeout(() => setCopiedFen(false), 1600);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  return (
    <aside
      aria-label="Study Notes and Drill Progress"
      className="bg-white border border-[#E2E0D8] rounded-lg p-5 flex flex-col gap-5 h-full"
    >
      {/* Drill Progress & Mistakes */}
      {selectedVariation && drillStatus !== DRILL_STATES.IDLE && (
        <section
          aria-label="Drill progress"
          className="bg-[#F7F6F2] border border-[#E2E0D8] rounded-md p-3.5 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular">
            <span className="font-semibold text-zinc-900">
              Move {drillIndex} / {totalMoves}
            </span>
            <span
              className={`font-semibold ${
                mistakes > 0 ? 'text-red-700' : 'text-emerald-800'
              }`}
            >
              Mistakes: {mistakes}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={drillIndex}
            aria-valuemin={0}
            aria-valuemax={totalMoves}
            aria-label="Variation completion progress"
            className="w-full h-2 bg-[#E2E0D8] rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[#1B5E3A] transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>
      )}

      {/* Notes Section */}
      <section aria-labelledby="notes-heading">
        <div className="flex items-center justify-between gap-2 border-b border-[#ECEAE3] pb-3">
          <h2
            id="notes-heading"
            className="text-lg font-semibold text-zinc-900 tracking-tight"
          >
            Study Notes
          </h2>
          {selectedVariation?.eco && (
            <span className="text-xs font-mono-tabular text-zinc-600">
              ECO {selectedVariation.eco}
            </span>
          )}
        </div>

        {selectedVariation ? (
          <div className="mt-3 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-800">
                {selectedVariation.name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">
                Playing {selectedVariation.playerColor || 'white'}
              </span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {selectedVariation.notes ||
                'No study notes provided for this variation.'}
            </p>
          </div>
        ) : opening?.notes ? (
          <p className="mt-3 text-sm text-zinc-700 leading-relaxed">
            {opening.notes}
          </p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            Select a variation from the Opening Library to start drilling and
            view its strategic notes.
          </p>
        )}
      </section>

      {/* Move History Section */}
      <section
        aria-labelledby="history-heading"
        className="border-t border-[#ECEAE3] pt-4 flex-1 flex flex-col min-h-0"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3
            id="history-heading"
            className="text-sm font-semibold text-zinc-900"
          >
            Move History
          </h3>
          <span className="text-xs font-mono-tabular text-zinc-500">
            {history.length} {history.length === 1 ? 'ply' : 'plies'}
          </span>
        </div>

        {movePairs.length === 0 ? (
          <div className="flex-1 flex items-center text-xs text-zinc-500 bg-[#F7F6F2] border border-[#ECEAE3] rounded-md px-3.5 py-6">
            Play the opening move on the board to begin the drill.
          </div>
        ) : (
          <div className="flex-1 max-h-72 overflow-y-auto border border-[#ECEAE3] rounded-md">
            <table className="w-full text-xs font-mono-tabular">
              <thead className="bg-[#F7F6F2] text-zinc-500 border-b border-[#ECEAE3]">
                <tr>
                  <th className="py-1.5 px-2.5 text-left font-medium w-10">
                    #
                  </th>
                  <th className="py-1.5 px-2.5 text-left font-medium">White</th>
                  <th className="py-1.5 px-2.5 text-left font-medium">Black</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EFE9]">
                {movePairs.map((pair, idx) => {
                  const isLastPair = idx === movePairs.length - 1;
                  return (
                    <tr key={pair.moveNumber} className="hover:bg-[#FAF9F6]">
                      <td className="py-1.5 px-2.5 text-zinc-400">
                        {pair.moveNumber}.
                      </td>
                      <td
                        className={`py-1.5 px-2.5 ${
                          isLastPair && pair.black === null
                            ? 'font-semibold text-emerald-800'
                            : 'text-zinc-900'
                        }`}
                      >
                        {pair.white}
                      </td>
                      <td
                        className={`py-1.5 px-2.5 ${
                          isLastPair && pair.black !== null
                            ? 'font-semibold text-emerald-800'
                            : 'text-zinc-900'
                        }`}
                      >
                        {pair.black ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Current FEN */}
      <section aria-labelledby="fen-heading" className="border-t border-[#ECEAE3] pt-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h3 id="fen-heading" className="text-xs font-medium text-zinc-500">
            Position FEN
          </h3>
          <button
            type="button"
            onClick={handleCopyFen}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded transition-colors focus-visible:outline-2 focus-visible:outline-zinc-900"
          >
            {copiedFen ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] font-mono-tabular text-zinc-600 bg-[#F7F6F2] border border-[#ECEAE3] rounded-md px-2.5 py-2 break-all select-all">
          {fen}
        </p>
      </section>
    </aside>
  );
}
