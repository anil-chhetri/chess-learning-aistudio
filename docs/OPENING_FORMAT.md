# Opening File Format Specification (`formatVersion: 1`)

This document is the content contract for all opening files in `/public/lines/`. `src/lib/parser.ts` and `src/lib/validate.ts` enforce every rule below.

## 1. Anatomy of an Opening File

````markdown
---
formatVersion: 1
title: Queen's Gambit
playerColor: white
tags: [d4, gambit, closed]
---

## Notes
Optional opening summary shown above the variation list.

## Accepted

eco: D20
playerColor: white

Black accepts the gambit pawn. Develop quickly and control the center.

```moves
d4 d5 c4 dxc4 e3 Nf6 Bxc4 e6 Nf3 c5 O-O Nc6
```
````

## 2. Rules

1. **One file = One opening.** Never put two openings in one file.
2. **Frontmatter (required):** `title` (string), `playerColor` (`white` or `black`), optional `formatVersion` (integer `1`), optional `tags` (`[tag1, tag2]`). Unknown keys produce an error.
3. **`playerColor` is exact lowercase:** `white` or `black` only. Never silently lowercased.
4. **Variations:** One `## <Name>` or `## Variation: <Name>` heading per variation (except `## Notes`, which holds opening-level notes). Variation names must be unique within the file.
5. **Order inside a variation:** `## Name` -> `eco:` / `playerColor:` -> Notes -> ```` ```moves ```` block.
6. **Inheritance:** A variation may override `playerColor`; if omitted, it inherits the file-level `playerColor`.
7. **Moves block:** Standard Algebraic Notation (SAN) only, whitespace-separated, **no move numbers** (`1.` is forbidden), no comments, no NAGs.
8. **Limits:** Max 20 variations per file. No move limit per variation — add as many plies as needed as long as all moves are legal SAN.
9. **Encoding & filenames:** UTF-8, LF line endings, lowercase kebab-case filename (`queens-gambit.md`).

## 3. Error Policy

- The parser never throws. All structural or legality problems are returned in `errors[]`.
- Invalid variations are marked `valid: false` so valid variations in the same file continue to work.
