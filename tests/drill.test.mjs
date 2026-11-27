import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Chess } from 'chess.js';
import { describe, it } from 'node:test';
import {
  getArrowGeometry,
  getSquareCenter,
} from '../src/lib/boardGeometry.ts';
import {
  applyOpponentDrillMove,
  applyUserDrillMove,
  calculateAccuracy,
  computeGuidedMove,
  computeHintSquares,
  DRILL_STATES,
  getNextPracticeVariation,
  startVariationDrill,
} from '../src/lib/drill.ts';
import {
  getOpeningMasterySummary,
  getVariationStatus,
  recordVariationAttempt,
  recordVariationCompletion,
} from '../src/lib/mastery.ts';
import { structureStudyNotes } from '../src/lib/notesParser.ts';
import { parseOpeningMarkdown } from '../src/lib/parser.ts';
import {
  loadTrainerProgress,
  saveLastSelection,
  saveMistakesByVariation,
  saveVariationStats,
} from '../src/lib/storage.ts';
import {
  filterOpeningsByQuery,
  formatVariationDisplay,
} from '../src/lib/variationDisplay.ts';

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

  it('10. Sprint 1: calculateAccuracy and repeated wrong-move feedback behave per spec', () => {
    assert.equal(calculateAccuracy(0, 0), 100);
    assert.equal(calculateAccuracy(5, 0), 100);
    assert.equal(calculateAccuracy(5, 1), 83);
    assert.equal(calculateAccuracy(0, 3), 0);

    let state = startVariationDrill('lines/italian-gambit.md', WHITE_SIX_PLY, 0);
    const initialFen = state.fen;

    for (let i = 1; i <= 3; i += 1) {
      const wrong = applyUserDrillMove(state, 'e2', 'e4');
      assert.equal(wrong.result, 'wrong');
      state = wrong.state;
      assert.equal(state.mistakes, i);
      assert.equal(state.drillIndex, 0);
      assert.equal(state.fen, initialFen);
      assert.equal(state.feedback, 'wrong');
      assert.equal(state.wrongAttemptSeq, i);
    }

    const correct = applyUserDrillMove(state, 'd2', 'd4');
    assert.equal(correct.result, 'correct');
    assert.equal(correct.state.drillIndex, 1);
    assert.equal(correct.state.correctMoves, 1);
    assert.equal(correct.state.feedback, 'correct');

    const afterReply = applyOpponentDrillMove(correct.state);
    assert.equal(afterReply.state.feedback, null);
    assert.equal(afterReply.state.drillIndex, 2);
  });

  it('11. Sprint 1: formatVariationDisplay and filterOpeningsByQuery isolate move text and filter Greco to 1 result', () => {
    const grecoVar = {
      name: 'Bishop Captures: 4...Bxd4 (Greco / Exchange Line)',
      eco: 'C50',
      playerColor: 'white',
      notes: '',
      moves: ['e4', 'e5'],
      hasMovesBlock: true,
      valid: true,
      errors: [],
    };
    const otherVar = {
      name: 'Declined: 4...Bb6 (Safe Retreat)',
      eco: 'C50',
      playerColor: 'white',
      notes: '',
      moves: ['e4', 'e5'],
      hasMovesBlock: true,
      valid: true,
      errors: [],
    };

    const display = formatVariationDisplay(grecoVar);
    assert.equal(display.primaryLabel, '4... Bxd4');
    assert.equal(display.nickname, 'Bishop Captures · Greco / Exchange Line');

    const mockOpenings = [
      {
        path: 'lines/italian-gambit.md',
        rawMarkdown: '',
        parsed: {
          formatVersion: 1,
          title: 'Italian Gambit',
          playerColor: 'white',
          tags: ['e4', 'gambit'],
          notes: '',
          variations: [grecoVar, otherVar],
          errors: [],
        },
      },
      {
        path: 'lines/sicilian-defense.md',
        rawMarkdown: '',
        parsed: {
          formatVersion: 1,
          title: 'Sicilian Defense',
          playerColor: 'black',
          tags: ['c5'],
          notes: '',
          variations: [BLACK_SIX_PLY],
          errors: [],
        },
      },
    ];

    const filtered = filterOpeningsByQuery(mockOpenings, 'Greco');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].variations.length, 1);
    assert.equal(filtered[0].variations[0].name, grecoVar.name);
  });

  it('12. Sprint 2: variation status transitions New -> Learning -> Mastered (>=80% twice) and persists', () => {
    assert.equal(getVariationStatus(undefined), 'new');

    let stats = recordVariationAttempt(undefined, 1000);
    assert.equal(getVariationStatus(stats), 'learning');

    // Completed with 75% twice -> stays Learning
    stats = recordVariationCompletion(stats, 75, 2000);
    stats = recordVariationCompletion(stats, 75, 3000);
    assert.equal(getVariationStatus(stats), 'learning');

    // Completed with 90% once -> still Learning
    stats = recordVariationCompletion(stats, 90, 4000);
    assert.equal(getVariationStatus(stats), 'learning');

    // Completed with 90% twice -> Mastered
    stats = recordVariationCompletion(stats, 90, 5000);
    assert.equal(getVariationStatus(stats), 'mastered');
    assert.equal(stats.bestAccuracy, 90);

    const summary = getOpeningMasterySummary(
      'lines/queens-gambit.md',
      [WHITE_SIX_PLY],
      { 'lines/queens-gambit.md::Accepted Short': stats },
    );
    assert.equal(summary.masteryPct, 100);
    assert.equal(summary.status, 'mastered');

    // Storage round-trip
    const store = new Map();
    const mockStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
    };
    saveVariationStats({ 'lines/queens-gambit.md::Accepted Short': stats }, mockStorage);
    const restored = loadTrainerProgress(mockStorage);
    assert.equal(
      getVariationStatus(restored.variationStats['lines/queens-gambit.md::Accepted Short']),
      'mastered',
    );
  });

  it('13. Sprint 2: structureStudyNotes populates Idea and Plan for every variation across all opening files', () => {
    const linesDir = path.resolve(process.cwd(), 'public/lines');
    const files = fs.readdirSync(linesDir).filter((f) => f.endsWith('.md'));
    assert.ok(files.length >= 4);

    for (const file of files) {
      const raw = fs.readFileSync(path.join(linesDir, file), 'utf8');
      const parsed = parseOpeningMarkdown(raw);
      for (const variation of parsed.variations) {
        const structured = structureStudyNotes(variation, parsed.notes);
        assert.ok(structured.idea.trim().length > 0, `${file} / ${variation.name} missing Idea`);
        assert.ok(structured.plan.trim().length > 0, `${file} / ${variation.name} missing Plan`);
        assert.ok(structured.watchOut.trim().length > 0, `${file} / ${variation.name} missing Watch Out`);
      }
    }

    const explicit = structureStudyNotes({
      ...WHITE_SIX_PLY,
      notes: 'Idea: Control d5.\nPlan: Castle kingside.\nWatch Out: Avoid early Qa4+.',
    });
    assert.equal(explicit.idea, 'Control d5.');
    assert.equal(explicit.plan, 'Castle kingside.');
    assert.equal(explicit.watchOut, 'Avoid early Qa4+.');
  });
});
