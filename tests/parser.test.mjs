import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { parseOpeningMarkdown } from '../src/lib/parser.ts';
import { parseAndValidateOpening } from '../src/lib/validate.ts';

describe('Task 1.2: Opening Markdown Parser & Validator', () => {
  it('1. inherits playerColor from frontmatter when variation omits it', () => {
    const md = `---
formatVersion: 1
title: Ruy Lopez
playerColor: white
---

## Morphy Defense

eco: C78

Main line against a6.

\`\`\`moves
e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6
\`\`\`
`;
    const result = parseAndValidateOpening(md);
    assert.equal(result.errors.length, 0);
    assert.equal(result.variations.length, 1);
    assert.equal(result.variations[0].playerColor, 'white');
    assert.equal(result.variations[0].eco, 'C78');
    assert.equal(result.variations[0].valid, true);
    assert.deepEqual(result.variations[0].moves, [
      'e4',
      'e5',
      'Nf3',
      'Nc6',
      'Bb5',
      'a6',
      'Ba4',
      'Nf6',
    ]);
  });

  it('2. allows variation-level playerColor to override file-level playerColor', () => {
    const md = `---
formatVersion: 1
title: Queen's Gambit
playerColor: white
---

## Variation: Queen's Gambit Declined
playerColor: black
\`\`\`moves
d4 d5 c4 e6
\`\`\`
`;
    const result = parseAndValidateOpening(md);
    assert.equal(result.errors.length, 0);
    assert.equal(result.variations.length, 1);
    assert.equal(result.variations[0].name, "Queen's Gambit Declined");
    assert.equal(result.variations[0].playerColor, 'black');
    assert.equal(result.variations[0].valid, true);
  });

  it('3. records illegal move in errors[] and disables only the broken variation', () => {
    const md = `---
formatVersion: 1
title: Broken Gambit
playerColor: white
---

## Bad Line
eco: D00
\`\`\`moves
d4 d5 e9
\`\`\`

## Good Line
eco: D01
\`\`\`moves
d4 d5 c4
\`\`\`
`;
    const result = parseAndValidateOpening(md);
    assert.ok(result.errors.some((err) => err.includes('Bad Line') && err.includes('e9')));
    assert.equal(result.variations[0].valid, false);
    assert.equal(result.variations[1].valid, true);
  });

  it('4. records an error when a variation is missing its moves block', () => {
    const md = `---
formatVersion: 1
title: Incomplete Opening
playerColor: white
---

## Missing Moves
eco: A00

No code block was provided here.
`;
    const result = parseAndValidateOpening(md);
    assert.ok(result.errors.some((err) => err.includes('missing') && err.includes('moves')));
    assert.equal(result.variations[0].valid, false);
  });

  it('5. records an error on empty file without throwing', () => {
    const result = parseAndValidateOpening('   \n  ');
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some((err) => err.toLowerCase().includes('empty')));
    assert.equal(result.variations.length, 0);
  });

  it('6. rejects uppercase playerColor instead of silently lowercasing', () => {
    const md = `---
formatVersion: 1
title: Case Check
playerColor: White
---

## Line One
\`\`\`moves
e4 e5
\`\`\`
`;
    const result = parseOpeningMarkdown(md);
    assert.ok(result.errors.some((err) => err.includes('playerColor') && err.includes('White')));
  });

  it('7. rejects move numbers inside moves block and unknown frontmatter keys', () => {
    const md = `---
formatVersion: 1
title: Numbered Moves
playerColor: white
author: Unknown
---

## Line One
\`\`\`moves
1. e4 e5 2. Nf3
\`\`\`
`;
    const result = parseOpeningMarkdown(md);
    assert.ok(result.errors.some((err) => err.includes('Unknown frontmatter key "author"')));
    assert.ok(result.errors.some((err) => err.includes('move numbers are not allowed')));
  });

  it('8. parses public/lines/queens-gambit.md with 0 errors', () => {
    const filePath = path.resolve(process.cwd(), 'public/lines/queens-gambit.md');
    const raw = fs.readFileSync(filePath, 'utf8');
    const result = parseAndValidateOpening(raw);
    assert.deepEqual(result.errors, []);
    assert.equal(result.title, "Queen's Gambit");
    assert.equal(result.playerColor, 'white');
    assert.deepEqual(result.tags, ['d4', 'gambit', 'closed']);
    assert.equal(result.variations.length, 3);
    assert.ok(result.variations.every((v) => v.valid));
  });
});
