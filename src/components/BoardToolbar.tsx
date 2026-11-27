import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  BookOpen,
  Check,
  Compass,
  Copy,
  MoreHorizontal,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from './Button.tsx';
import type { SessionMode } from './TurnBanner.tsx';

interface BoardToolbarProps {
  sessionMode: SessionMode;
  muted: boolean;
  fen: string;
  canReset: boolean;
  onChangeSessionMode: (mode: SessionMode) => void;
  onFlipBoard: () => void;
  onResetDrill: () => void;
  onToggleMute: () => void;
}

export function BoardToolbar({
  sessionMode,
  muted,
  fen,
  canReset,
  onChangeSessionMode,
  onFlipBoard,
  onResetDrill,
  onToggleMute,
}: BoardToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedFen, setCopiedFen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

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
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          role="group"
          aria-label="Session mode"
          className="inline-flex rounded-[10px] border border-neutral-300 bg-neutral-100 p-0.5 shrink-0"
        >
          <button
            type="button"
            aria-pressed={sessionMode === 'test'}
            onClick={() => onChangeSessionMode('test')}
            title="Test: No help, scored"
            className={`inline-flex items-center gap-1.5 h-[30px] px-2.5 ds-text-label rounded-[8px] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-700 ${
              sessionMode === 'test'
                ? 'bg-primary-700 text-white shadow-xs'
                : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            Test
          </button>
          <button
            type="button"
            aria-pressed={sessionMode === 'practice'}
            onClick={() => onChangeSessionMode('practice')}
            title="Practice: See hints & arrows"
            className={`inline-flex items-center gap-1.5 h-[30px] px-2.5 ds-text-label rounded-[8px] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary-700 ${
              sessionMode === 'practice'
                ? 'bg-primary-700 text-white shadow-xs'
                : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            Practice
          </button>
        </div>

        <span className="hidden sm:inline ds-text-meta text-neutral-500 truncate">
          {sessionMode === 'test'
            ? 'No help, scored'
            : 'Hints & arrows on'}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onFlipBoard}
          aria-label="Flip board"
        >
          <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
          Flip
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onResetDrill}
          disabled={!canReset}
          aria-label="Reset current variation"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          aria-pressed={!muted}
        >
          {muted ? (
            <VolumeX className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Volume2 className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>

        {/* Overflow ... Menu containing Position FEN + Copy */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="More board options"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          >
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>

          {menuOpen && (
            <div
              role="dialog"
              aria-label="Board utilities and FEN"
              className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-neutral-200 rounded-[12px] shadow-md p-4 z-40 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="ds-text-label text-neutral-700">
                  Position FEN
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyFen}
                  aria-label="Copy FEN"
                >
                  {copiedFen ? (
                    <>
                      <Check
                        className="w-3.5 h-3.5 text-success"
                        aria-hidden="true"
                      />
                      <span className="text-info">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy FEN</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="ds-text-meta font-mono-tabular text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-[8px] px-3 py-2 break-all select-all">
                {fen}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
