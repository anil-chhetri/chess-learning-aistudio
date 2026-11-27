import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { structureStudyNotes } from '../lib/notesParser.ts';
import type { ParsedOpening, ParsedVariation } from '../lib/parser.ts';

interface NotesPanelProps {
  opening: ParsedOpening | null;
  selectedVariation: ParsedVariation | null;
  pinned?: boolean;
  onToggle?: () => void;
}

const HOVER_CLOSE_DELAY_MS = 140;

export function NotesPanel({
  opening,
  selectedVariation,
  pinned = true,
  onToggle,
}: NotesPanelProps) {
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const structured = structureStudyNotes(selectedVariation, opening?.notes);

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
    onToggle?.();
  };

  const renderNotesCard = (isOverlay: boolean) => (
    <section
      aria-labelledby={isOverlay ? 'notes-preview-heading' : 'notes-heading'}
      className={`w-full rounded-[10px] border p-3 space-y-2 ${
        isOverlay
          ? 'border-primary-600/50 bg-white/95 backdrop-blur-xs shadow-xl'
          : 'border-neutral-200 bg-neutral-50'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-1.5">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h2
            id={isOverlay ? 'notes-preview-heading' : 'notes-heading'}
            className="ds-text-body-bold text-neutral-900 shrink-0"
          >
            Study Notes
          </h2>
          {selectedVariation && (
            <span className="ds-text-meta text-neutral-600 truncate">
              {selectedVariation.name} ·{' '}
              <span className="capitalize">
                Playing {selectedVariation.playerColor || 'white'}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedVariation?.eco && (
            <span className="ds-text-meta font-mono-tabular text-neutral-500">
              ECO {selectedVariation.eco}
            </span>
          )}
          {(structured.hasMore || Boolean(structured.fullText)) && (
            <button
              type="button"
              onClick={() => setExpandedNotes((prev) => !prev)}
              aria-expanded={expandedNotes}
              className="inline-flex items-center gap-0.5 ds-text-meta font-semibold text-primary-700 hover:text-primary-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-700 rounded"
            >
              <span>{expandedNotes ? 'Less' : 'More'}</span>
              {expandedNotes ? (
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          )}
          {onToggle && (
            <button
              type="button"
              onClick={isOverlay ? handlePinOpen : onToggle}
              aria-label={isOverlay ? 'Keep study notes open' : 'Hide study notes'}
              title={isOverlay ? 'Pin study notes open' : 'Hide study notes'}
              className="p-0.5 text-neutral-500 hover:text-neutral-900 rounded-[6px] hover:bg-neutral-200/60 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary-700"
            >
              {isOverlay ? (
                <ChevronUp className="w-4 h-4 text-primary-700" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div className="min-w-0">
          <dt className="ds-text-label text-primary-900">Idea</dt>
          <dd
            className={`ds-text-meta text-neutral-700 mt-0.5 ${
              expandedNotes ? '' : 'line-clamp-2'
            }`}
          >
            {structured.idea}
          </dd>
        </div>

        <div className="min-w-0">
          <dt className="ds-text-label text-primary-900">Plan</dt>
          <dd
            className={`ds-text-meta text-neutral-700 mt-0.5 ${
              expandedNotes ? '' : 'line-clamp-2'
            }`}
          >
            {structured.plan}
          </dd>
        </div>

        <div className="min-w-0">
          <dt className="ds-text-label text-amber-800">Watch Out</dt>
          <dd
            className={`ds-text-meta text-neutral-700 mt-0.5 ${
              expandedNotes ? '' : 'line-clamp-2'
            }`}
          >
            {structured.watchOut}
          </dd>
        </div>
      </dl>

      {expandedNotes && structured.fullText && (
        <p className="ds-text-meta text-neutral-600 pt-1.5 border-t border-neutral-200 leading-relaxed">
          {structured.fullText}
        </p>
      )}
    </section>
  );

  if (pinned) {
    return renderNotesCard(false);
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
        aria-label="Show study notes"
        aria-expanded={peeking}
        title="Hover to preview study notes or click to keep visible"
        className="group w-full h-3.5 flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-700 rounded"
      >
        <span className="h-[2px] flex-1 rounded-full bg-neutral-200 group-hover:bg-primary-600 transition-colors" />
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold leading-none text-neutral-500 group-hover:text-primary-800 transition-colors shrink-0">
          <ChevronUp className="w-3 h-3" aria-hidden="true" />
          <span>Study Notes</span>
        </span>
        <span className="h-[2px] flex-1 rounded-full bg-neutral-200 group-hover:bg-primary-600 transition-colors" />
      </button>

      {peeking && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          {renderNotesCard(true)}
        </div>
      )}
    </div>
  );
}
