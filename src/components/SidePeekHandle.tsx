import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidePeekHandleProps {
  side: 'left' | 'right';
  label: string;
  onOpen: () => void;
  children: ReactNode;
}

const HOVER_CLOSE_DELAY_MS = 140;

export function SidePeekHandle({
  side,
  label,
  onOpen,
  children,
}: SidePeekHandleProps) {
  const [peeking, setPeeking] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

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
    if (!peeking) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelScheduledClose();
        setPeeking(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [peeking, cancelScheduledClose]);

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    cancelScheduledClose();
    setPeeking(true);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    scheduleClose();
  };

  const handlePinOpen = () => {
    cancelScheduledClose();
    setPeeking(false);
    onOpen();
  };

  const isLeft = side === 'left';

  return (
    <>
      <button
        type="button"
        onClick={handlePinOpen}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        aria-label={`Open ${label}`}
        aria-expanded={peeking}
        title={`Hover to preview or click to open ${label}`}
        className={`fixed top-1/2 -translate-y-1/2 z-40 w-6 h-16 flex items-center justify-center bg-white/95 backdrop-blur-xs border border-neutral-300 text-neutral-700 shadow-md transition-colors cursor-pointer hover:bg-primary-50 hover:text-primary-900 hover:border-primary-700 focus-visible:outline-2 focus-visible:outline-primary-700 ${
          isLeft
            ? 'left-0 rounded-r-[10px] border-l-0'
            : 'right-0 rounded-l-[10px] border-r-0'
        }`}
      >
        {isLeft ? (
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        ) : (
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        )}
      </button>

      {peeking && (
        <div
          role="region"
          aria-label={`${label} preview`}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          className={`fixed top-14 bottom-3 z-40 w-[280px] xl:w-[300px] max-w-[calc(100vw-36px)] overflow-y-auto rounded-[12px] border border-neutral-200 bg-white shadow-xl [&>aside]:h-auto [&>aside]:min-h-full [&>aside]:border-0 [&>aside]:shadow-none ${
            isLeft ? 'left-6' : 'right-6'
          }`}
        >
          {children}
        </div>
      )}
    </>
  );
}
