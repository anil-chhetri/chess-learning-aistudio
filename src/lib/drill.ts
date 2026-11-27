import { Chess, type Square } from 'chess.js';
import type { ParsedVariation } from './parser.ts';

export const OPPONENT_DELAY_MS = 600;
export const CORRECT_FEEDBACK_MS = 600;
export const LOOP_DELAY_MS = 1500;
export const WRONG_FLASH_MS = 900;

export const DRILL_STATES = {
  IDLE: 'IDLE',
  USER_TURN: 'USER_TURN',
  OPPONENT_TURN: 'OPPONENT_TURN',
  VARIATION_COMPLETE: 'VARIATION_COMPLETE',
} as const;

export type DrillStatus = (typeof DRILL_STATES)[keyof typeof DRILL_STATES];
export type DrillFeedback = 'correct' | 'wrong' | null;

export interface HintSquares {
  from: Square;
  to: Square;
}

export interface DrillState {
  status: DrillStatus;
  openingPath: string | null;
  variation: ParsedVariation | null;
  fen: string;
  history: string[];
  lastMove: { from: Square; to: Square } | null;
  drillIndex: number;
  correctMoves: number;
  mistakes: number;
  hintSquares: HintSquares | null;
  wrongSquare: Square | null;
  feedback: DrillFeedback;
  wrongAttemptSeq: number;
}

export interface UserMoveOutcome {
  state: DrillState;
  result: 'correct' | 'wrong' | 'ignored';
  soundType: 'move' | 'capture' | 'check' | 'end' | 'wrong' | null;
}

const INITIAL_FEN = new Chess().fen();

export function getVariationKey(openingPath: string, variationName: string): string {
  return `${openingPath}::${variationName}`;
}

/**
 * Computes rounded accuracy percentage from correct moves and wrong attempts.
 * Returns 100 when no attempts have been recorded yet.
 */
export function calculateAccuracy(correctMoves: number, mistakes: number): number {
  const safeCorrect = Math.max(0, correctMoves);
  const safeMistakes = Math.max(0, mistakes);
  const totalAttempts = safeCorrect + safeMistakes;
  if (totalAttempts === 0) return 100;
  return Math.round((safeCorrect / totalAttempts) * 100);
}

export function createIdleDrillState(): DrillState {
  return {
    status: DRILL_STATES.IDLE,
    openingPath: null,
    variation: null,
    fen: INITIAL_FEN,
    history: [],
    lastMove: null,
    drillIndex: 0,
    correctMoves: 0,
    mistakes: 0,
    hintSquares: null,
    wrongSquare: null,
    feedback: null,
    wrongAttemptSeq: 0,
  };
}

function getSideColor(chess: Chess): 'white' | 'black' {
  return chess.turn() === 'w' ? 'white' : 'black';
}

export function startVariationDrill(
  openingPath: string,
  variation: ParsedVariation,
  initialMistakes = 0,
): DrillState {
  if (!variation.valid || variation.moves.length === 0) {
    return createIdleDrillState();
  }

  const chess = new Chess();
  const playerColor = variation.playerColor === 'black' ? 'black' : 'white';
  const nextStatus =
    getSideColor(chess) === playerColor
      ? DRILL_STATES.USER_TURN
      : DRILL_STATES.OPPONENT_TURN;

  return {
    status: nextStatus,
    openingPath,
    variation,
    fen: INITIAL_FEN,
    history: [],
    lastMove: null,
    drillIndex: 0,
    correctMoves: 0,
    mistakes: Math.max(0, initialMistakes),
    hintSquares: null,
    wrongSquare: null,
    feedback: null,
    wrongAttemptSeq: 0,
  };
}

export function applyUserDrillMove(
  state: DrillState,
  from: Square,
  to: Square,
  promotion: 'q' | 'r' | 'b' | 'n' = 'q',
): UserMoveOutcome {
  // Board is locked unless it is explicitly USER_TURN
  if (state.status !== DRILL_STATES.USER_TURN || !state.variation) {
    return { state, result: 'ignored', soundType: null };
  }

  const expectedSan = state.variation.moves[state.drillIndex];
  if (!expectedSan) {
    return { state, result: 'ignored', soundType: null };
  }

  // Snapshot FEN before attempting move so wrong moves never corrupt board state
  const fenSnapshot = state.fen;
  const chess = new Chess(fenSnapshot);

  let playedMove;
  try {
    playedMove = chess.move({ from, to, promotion });
  } catch {
    return { state, result: 'ignored', soundType: null };
  }

  if (!playedMove) {
    return { state, result: 'ignored', soundType: null };
  }

  if (playedMove.san !== expectedSan) {
    return {
      state: {
        ...state,
        fen: fenSnapshot,
        mistakes: state.mistakes + 1,
        wrongSquare: to,
        feedback: 'wrong',
        wrongAttemptSeq: state.wrongAttemptSeq + 1,
      },
      result: 'wrong',
      soundType: 'wrong',
    };
  }

  const nextIndex = state.drillIndex + 1;
  const isComplete = nextIndex >= state.variation.moves.length;
  const playerColor = state.variation.playerColor === 'black' ? 'black' : 'white';
  const nextStatus = isComplete
    ? DRILL_STATES.VARIATION_COMPLETE
    : getSideColor(chess) === playerColor
      ? DRILL_STATES.USER_TURN
      : DRILL_STATES.OPPONENT_TURN;

  let soundType: UserMoveOutcome['soundType'] = 'move';
  if (isComplete || chess.isGameOver()) {
    soundType = 'end';
  } else if (chess.inCheck()) {
    soundType = 'check';
  } else if (playedMove.isCapture() || playedMove.isEnPassant()) {
    soundType = 'capture';
  }

  return {
    state: {
      ...state,
      status: nextStatus,
      fen: chess.fen(),
      history: [...state.history, playedMove.san],
      lastMove: { from: playedMove.from, to: playedMove.to },
      drillIndex: nextIndex,
      correctMoves: state.correctMoves + 1,
      hintSquares: null,
      wrongSquare: null,
      feedback: 'correct',
    },
    result: 'correct',
    soundType,
  };
}

export function applyOpponentDrillMove(state: DrillState): {
  state: DrillState;
  soundType: 'move' | 'capture' | 'check' | 'end' | null;
} {
  if (state.status !== DRILL_STATES.OPPONENT_TURN || !state.variation) {
    return { state, soundType: null };
  }

  const expectedSan = state.variation.moves[state.drillIndex];
  if (!expectedSan) {
    return {
      state: {
        ...state,
        status: DRILL_STATES.VARIATION_COMPLETE,
        feedback: null,
      },
      soundType: null,
    };
  }

  const chess = new Chess(state.fen);
  const move = chess.move(expectedSan);
  const nextIndex = state.drillIndex + 1;
  const isComplete = nextIndex >= state.variation.moves.length;
  const playerColor = state.variation.playerColor === 'black' ? 'black' : 'white';
  const nextStatus = isComplete
    ? DRILL_STATES.VARIATION_COMPLETE
    : getSideColor(chess) === playerColor
      ? DRILL_STATES.USER_TURN
      : DRILL_STATES.OPPONENT_TURN;

  let soundType: 'move' | 'capture' | 'check' | 'end' = 'move';
  if (isComplete || chess.isGameOver()) {
    soundType = 'end';
  } else if (chess.inCheck()) {
    soundType = 'check';
  } else if (move.isCapture() || move.isEnPassant()) {
    soundType = 'capture';
  }

  return {
    state: {
      ...state,
      status: nextStatus,
      fen: chess.fen(),
      history: [...state.history, move.san],
      lastMove: { from: move.from, to: move.to },
      drillIndex: nextIndex,
      hintSquares: null,
      wrongSquare: null,
      feedback: null,
    },
    soundType,
  };
}

export interface GuidedMoveInfo {
  san: string;
  from: Square;
  to: Square;
}

export function computeGuidedMove(state: DrillState): GuidedMoveInfo | null {
  if (state.status !== DRILL_STATES.USER_TURN || !state.variation) {
    return null;
  }

  const expectedSan = state.variation.moves[state.drillIndex];
  if (!expectedSan) return null;

  try {
    const chess = new Chess(state.fen);
    const move = chess.move(expectedSan);
    return { san: move.san, from: move.from, to: move.to };
  } catch {
    return null;
  }
}

export function computeHintSquares(state: DrillState): HintSquares | null {
  const guided = computeGuidedMove(state);
  if (!guided) return null;
  return { from: guided.from, to: guided.to };
}

export function getNextPracticeVariation(
  variations: ParsedVariation[],
  currentVariationName: string | null,
): ParsedVariation | null {
  const validVariations = variations.filter(
    (v) => v.valid && v.moves.length > 0,
  );
  if (validVariations.length === 0) return null;
  if (!currentVariationName) return validVariations[0];

  const idx = validVariations.findIndex((v) => v.name === currentVariationName);
  if (idx === -1) return validVariations[0];
  if (idx + 1 >= validVariations.length) return null;
  return validVariations[idx + 1];
}
