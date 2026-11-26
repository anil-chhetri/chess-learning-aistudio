import type { Square } from 'chess.js';
import type { PlayerColor } from './parser.ts';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const SQUARE_SIZE = 100;
const HALF_SQUARE = 50;
const HEAD_LENGTH = 26;
const HEAD_HALF_WIDTH = 16;

export interface ArrowGeometry {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  shaftEndX: number;
  shaftEndY: number;
  headPoints: string;
}

export function getSquareCenter(
  square: Square,
  orientation: PlayerColor,
): { x: number; y: number } {
  const fileIdx = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rankIdx = Number(square[1]) - 1;

  const col = orientation === 'white' ? fileIdx : 7 - fileIdx;
  const row = orientation === 'white' ? 7 - rankIdx : rankIdx;

  return {
    x: col * SQUARE_SIZE + HALF_SQUARE,
    y: row * SQUARE_SIZE + HALF_SQUARE,
  };
}

/**
 * Computes SVG coordinates (800x800 viewBox) for a directional move arrow
 * from source square center to destination square center.
 */
export function getArrowGeometry(
  from: Square,
  to: Square,
  orientation: PlayerColor,
): ArrowGeometry | null {
  if (from === to) return null;

  const start = getSquareCenter(from, orientation);
  const end = getSquareCenter(to, orientation);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return null;

  const ux = dx / length;
  const uy = dy / length;

  // Start slightly offset from center so origin piece stays legible
  const x1 = start.x + ux * 16;
  const y1 = start.y + uy * 16;

  // Stop tip slightly before destination edge/center
  const tipX = end.x - ux * 6;
  const tipY = end.y - uy * 6;

  const shaftEndX = tipX - ux * (HEAD_LENGTH - 4);
  const shaftEndY = tipY - uy * (HEAD_LENGTH - 4);

  const perpX = -uy;
  const perpY = ux;

  const baseX = tipX - ux * HEAD_LENGTH;
  const baseY = tipY - uy * HEAD_LENGTH;

  const leftX = baseX + perpX * HEAD_HALF_WIDTH;
  const leftY = baseY + perpY * HEAD_HALF_WIDTH;
  const rightX = baseX - perpX * HEAD_HALF_WIDTH;
  const rightY = baseY - perpY * HEAD_HALF_WIDTH;

  return {
    x1,
    y1,
    x2: tipX,
    y2: tipY,
    shaftEndX,
    shaftEndY,
    headPoints: `${tipX.toFixed(1)},${tipY.toFixed(1)} ${leftX.toFixed(1)},${leftY.toFixed(1)} ${rightX.toFixed(1)},${rightY.toFixed(1)}`,
  };
}
