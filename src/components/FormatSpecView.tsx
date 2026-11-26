const EXAMPLE_OPENING_MD = `---
formatVersion: 1
title: Queen's Gambit
playerColor: white
tags: [d4, gambit, closed]
---

## Accepted

eco: D20
playerColor: white

Black accepts the gambit pawn. Develop quickly and contest the center with e4.

\`\`\`moves
d4 d5 c4 dxc4 e3 Nf6 Bxc4 e6 Nf3 c5 O-O Nc6
\`\`\``;

const CONTRACT_RULES = [
  {
    title: '01. One file equals one opening',
    detail:
      'Keep each opening in its own lowercase kebab-case Markdown file under lines/. Never combine two openings into one file.',
  },
  {
    title: '02. One ## heading equals one variation',
    detail:
      'Use ## <Variation Name> or ## Variation: <Name> strictly for playable variations (except ## Notes for opening-level prose).',
  },
  {
    title: '03. One moves block per variation',
    detail:
      'Every variation must include exactly one ```moves fenced block. Need an alternative branch? Create another ## variation.',
  },
  {
    title: '04. Standard Algebraic Notation without move numbers',
    detail:
      'Write "d4 d5 c4 dxc4" separated by spaces or line breaks. Never include move numbers like "1. d4" or annotations.',
  },
  {
    title: '05. Strict section order and lowercase color',
    detail:
      'Follow Heading -> eco:/playerColor: -> Notes -> ```moves. playerColor must be exact lowercase "white" or "black".',
  },
];

export function FormatSpecView() {
  return (
    <section aria-label="Opening Format Specification" className="max-w-6xl mx-auto">
      <div className="bg-white border border-[#E2E0D8] rounded-lg p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#ECEAE3] pb-4">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Content Contract Specification
          </h2>
          <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">
            Openings are authored as plain Markdown files. Invalid variations
            are isolated in errors[] without crashing the trainer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">
              The Five Rules
            </h3>
            <ol className="space-y-3.5">
              {CONTRACT_RULES.map((rule) => (
                <li
                  key={rule.title}
                  className="border-b border-[#F1EFE9] pb-3 last:border-b-0 last:pb-0"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {rule.title}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    {rule.detail}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Reference Template
            </h3>
            <pre className="font-mono-tabular text-xs leading-relaxed p-4 rounded-md border border-[#E2E0D8] bg-[#F7F6F2] text-zinc-800 overflow-x-auto">
              {EXAMPLE_OPENING_MD}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
