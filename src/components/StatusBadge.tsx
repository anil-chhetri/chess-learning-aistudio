import type { MasteryStatus } from '../lib/mastery.ts';

interface StatusBadgeProps {
  status: MasteryStatus;
}

const STATUS_CONFIG: Record<
  MasteryStatus,
  { label: string; containerClass: string; dotClass: string }
> = {
  new: {
    label: 'New',
    containerClass: 'bg-neutral-100 text-neutral-700',
    dotClass: 'bg-neutral-500',
  },
  learning: {
    label: 'Learning',
    containerClass: 'bg-accent-100 text-amber-800',
    dotClass: 'bg-accent-500',
  },
  mastered: {
    label: 'Mastered',
    containerClass: 'bg-[#DCFCE7] text-green-800',
    dotClass: 'bg-success',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[20px] px-2 rounded-[12px] ds-text-label whitespace-nowrap shrink-0 ${cfg.containerClass}`}
    >
      <span
        aria-hidden="true"
        className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotClass}`}
      />
      <span>{cfg.label}</span>
    </span>
  );
}
