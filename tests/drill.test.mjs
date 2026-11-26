import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { describe, it } from 'node:test';
import {
  getArrowGeometry,
  getSquareCenter,
} from '../src/lib/boardGeometry.ts';
import {
  applyOpponentDrillMove,
  applyUserDrillMove,
  computeGuidedMove,
  computeHintSquares,
  DRILL_STATES,
  getNextPracticeVariation,
  startVariationDrill,
} from '../src/lib/drill.ts';
import {
  loadTrainerProgress,
  saveLastSelection,
  saveMistakesByVariation,
} from '../src/lib/storage.ts';

const WHITE_SIX_PLY = {
  name: 'Accepted Short',
  eco: 'D20',
  playerColor: 'white',
  notes: 'Accepts c4 and develops.',
  moves: ['d4', 'd5', 'c4', 'dxc4', 'e3', 'Nf6'],
  hasMovesBlock: true,
  valid: true,
  errors: [],
};

const BLACK_SIX_PLY = {
  name: 'Sicilian Short',
  eco: 'B90',
  playerColor: 'black',
  notes: 'Plays c5 against e4.',
  moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4'],
  hasMovesBlock: true,
  valid: true,
  errors: [],
};

describe('Phase 3: Drill State Machine, Coaching Controls & Persistence', () => {
  it('1. completes a 6-move White variation from USER_TURN to VARIATION_COMPLETE', () => {
    let state = startVariationDrill('lines/queens-gambit.md', WHITE_SIX_PLY, 0);
    assert.equal(state.status, DRILL_STATES.USER_TURN);

    // Move 1 (White): d4
    let outcome = applyUserDrillMove(state, 'd2', 'd4');
    assert.equal(outcome.result, 'correct');
    state = outcome.state;
    assert.equal(state.status, DRILL_STATES.OPPONENT_TURN);
    assert.equal(state.drillIndex, 1);

    // Move 2 (Black auto-reply): d5
    state = applyOpponentDrillMove(state).state;
    assert.equal(state.status, DRILL_STATES.USER_TURN);
    assert.equal(state.drillIndex, 2);

    // Move 3 (White): c4
    outcome = applyUserDrillMove(state, 'c2', 'c4');
    assert.equal(outcome.result, 'correct');
    state = outcome.state;
    assert.equal(state.status, DRILL_STATES.OPPONENT_TURN);

    // Move 4 (Black auto-reply): dxc4
    state = applyOpponentDrillMove(state).state;
    assert.equal(state.status, DRILL_STATES.USER_TURN);

    // Move 5 (White): e3
    outcome = applyUserDrillMove(state, 'e2', 'e3');
    assert.equal(outcome.result, 'correct');
    state = outcome.state;
    assert.equal(state.status, DRILL_STATES.OPPONENT_TURN);

    // Move 6 (Black auto-reply): Nf6 -> VARIATION_COMPLETE
    state = applyOpponentDrillMove(state).state;
    assert.equal(state.status, DRILL_STATES.VARIATION_COMPLETE);
    assert.equal(state.drillIndex, 6);
    assert.equal(state.mistakes, 0);
  });

  it('2. completes a 6-move Black variation starting with OPPONENT_TURN', () => {
    let state = startVariationDrill('lines/sicilian-defense.md', BLACK_SIX_PLY, 0);
    assert.equal(state.status, DRILL_STATES.OPPONENT_TURN);

    // Opponent plays 1. e4
    state = applyOpponentDrillMove(state).state;
    assert.equal(state.status, DRILL_STATES.USER_TURN);
    assert.deepEqual(state.history, ['e4']);

    // User plays 1...c5
    state = applyUserDrillMove(state, 'c7', 'c5').state;
    assert.equal(state.status, DRILL_STATES.OPPONENT_TURN);

    // Opponent plays 2. Nf3
    state = applyOpponentDrillMove(state).state;
    assert.equal(state.status, DRILL_STATES.USER_TURN);

    // User plays 2...d6
    state = applyUserDrillMove(state, 'd7', 'd6').state;
    assert.equal(state.status, DRILL_STATES.OPPONENT_TURN);

    // Opponent plays 3. d4
    state = applyOpponentDrillMove(state).state;
    assert.equal(state.status, DRILL_STATES.USER_TURN);

    // User plays 3...cxd4 -> VARIATION_COMPLETE
    state = applyUserDrillMove(state, 'c5', 'd4').state;
    assert.equal(state.status, DRILL_STATES.VARIATION_COMPLETE);
    assert.equal(state.drillIndex, 6);
  });

  it('3. restores exact FEN snapshot and increments mistakes on wrong move', () => {
    const initial = startVariationDrill('lines/queens-gambit.md', WHITE_SIX_PLY, 0);
    const fenBefore = initial.fen;

    // Play legal chess move e4 instead of expected d4
    const outcome = applyUserDrillMove(initial, 'e2', 'e4');
    assert.equal(outcome.result, 'wrong');
    assert.equal(outcome.state.fen, fenBefore);
    assert.equal(outcome.state.mistakes, 1);
    assert.equal(outcome.state.drillIndex, 0);
    assert.equal(outcome.state.wrongSquare, 'e4');
    assert.equal(outcome.state.status, DRILL_STATES.USER_TURN);
    assert.deepEqual(new Chess(outcome.state.fen).history(), []);
  });

  it('4. ignores user clicks during OPPONENT_TURN and VARIATION_COMPLETE', () => {
    const blackDrill = startVariationDrill('lines/sicilian-defense.md', BLACK_SIX_PLY, 0);
    assert.equal(blackDrill.status, DRILL_STATES.OPPONENT_TURN);

    const ignoredOpponent = applyUserDrillMove(blackDrill, 'e2', 'e4');
    assert.equal(ignoredOpponent.result, 'ignored');
    assert.equal(ignoredOpponent.state, blackDrill);

    const completedState = {
      ...blackDrill,
      status: DRILL_STATES.VARIATION_COMPLETE,
      drillIndex: BLACK_SIX_PLY.moves.length,
    };
    const ignoredDone = applyUserDrillMove(completedState, 'e7', 'e5');
    assert.equal(ignoredDone.result, 'ignored');
  });

  it('5. computeHintSquares returns source+target in USER_TURN and null in OPPONENT_TURN', () => {
    const whiteDrill = startVariationDrill('lines/queens-gambit.md', WHITE_SIX_PLY, 0);
    assert.deepEqual(computeHintSquares(whiteDrill), { from: 'd2', to: 'd4' });

    const blackDrill = startVariationDrill('lines/sicilian-defense.md', BLACK_SIX_PLY, 0);
    assert.equal(computeHintSquares(blackDrill), null);
  });

  it('6. getNextPracticeVariation walks valid variations 1..N and skips invalid ones', () => {
    const list = [
      WHITE_SIX_PLY,
      { ...BLACK_SIX_PLY, name: 'Broken', valid: false },
      { ...BLACK_SIX_PLY, name: 'Third Valid', valid: true },
    ];

    const second = getNextPracticeVariation(list, WHITE_SIX_PLY.name);
    assert.equal(second?.name, 'Third Valid');
    const afterLast = getNextPracticeVariation(list, 'Third Valid');
    assert.equal(afterLast, null);
  });

  it('7. localStorage persistence saves and restores lastOpening, lastVariation, and mistakesByVariation', () => {
    const store = new Map();
    const mockStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
    };

    saveLastSelection('lines/queens-gambit.md', 'Accepted', mockStorage);
    saveMistakesByVariation({ 'lines/queens-gambit.md::Accepted': 3 }, mockStorage);

    const restored = loadTrainerProgress(mockStorage);
    assert.equal(restored.lastOpening, 'lines/queens-gambit.md');
    assert.equal(restored.lastVariation, 'Accepted');
    assert.deepEqual(restored.mistakesByVariation, {
      'lines/queens-gambit.md::Accepted': 3,
    });

    // Corrupted JSON resilience
    store.set('mistakesByVariation', '{bad-json');
    const safeFallback = loadTrainerProgress(mockStorage);
    assert.deepEqual(safeFallback.mistakesByVariation, {});
  });

  it('8. computeGuidedMove returns SAN and from/to squares during USER_TURN and null otherwise', () => {
    const whiteDrill = startVariationDrill('lines/queens-gambit.md', WHITE_SIX_PLY, 0);
    assert.deepEqual(computeGuidedMove(whiteDrill), {
      san: 'd4',
      from: 'd2',
      to: 'd4',
    });

    const afterD4 = applyUserDrillMove(whiteDrill, 'd2', 'd4').state;
    assert.equal(afterD4.status, DRILL_STATES.OPPONENT_TURN);
    assert.equal(computeGuidedMove(afterD4), null);

    const completedState = {
      ...whiteDrill,
      status: DRILL_STATES.VARIATION_COMPLETE,
      drillIndex: WHITE_SIX_PLY.moves.length,
    };
    assert.equal(computeGuidedMove(completedState), null);
  });

  it('9. getArrowGeometry computes orientation-aware coordinates and ignores zero-length arrows', () => {
    assert.deepEqual(getSquareCenter('a1', 'white'), { x: 50, y: 750 });
    assert.deepEqual(getSquareCenter('a1', 'black'), { x: 750, y: 50 });

    const whiteArrow = getArrowGeometry('d2', 'd4', 'white');
    assert.ok(whiteArrow);
    assert.ok(whiteArrow.y2 < whiteArrow.y1, 'White d2->d4 points upward');
    assert.equal(Math.round(whiteArrow.x1), 350);
    assert.equal(Math.round(whiteArrow.x2), 350);

    const blackArrow = getArrowGeometry('d2', 'd4', 'black');
    assert.ok(blackArrow);
    assert.ok(blackArrow.y2 > blackArrow.y1, 'Black-flipped d2->d4 points downward');
    assert.equal(Math.round(blackArrow.x1), 450);

    assert.equal(getArrowGeometry('e4', 'e4', 'white'), null);
  });
});
