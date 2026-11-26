import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseAndValidateOpening } from '../lib/validate.ts';

interface PresetCase {
  id: string;
  label: string;
  markdown: string;
}

const PRESET_CASES: PresetCase[] = [
  {
    id: 'inherits',
    label: '1. Inherits playerColor',
    markdown: `---
formatVersion: 1
title: Queen's Gambit
playerColor: white
tags: [d4, closed]
---

## Declined
eco: D06
Black keeps the center solid with e6.

\`\`\`moves
d4 d5 c4 e6 Nc3 Nf6
\`\`\``,
  },
  {
    id: 'overrides',
    label: '2. Overrides playerColor',
    markdown: `---
formatVersion: 1
title: Queen's Gambit
playerColor: white
---

## Variation: Orthodox Defense
playerColor: black
Defending from Black's perspective.

\`\`\`moves
d4 d5 c4 e6 Nc3 Nf6
\`\`\``,
  },
  {
    id: 'illegal',
    label: '3. Illegal Move Error',
    markdown: `---
formatVersion: 1
title: Broken Opening
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
\`\`\``,
  },
  {
    id: 'missing-moves',
    label: '4. Missing Moves Block',
    markdown: `---
formatVersion: 1
title: Incomplete Line
playerColor: white
---

## Missing Block
eco: A00
Notes without a moves fenced block.`,
  },
  {
    id: 'empty',
    label: '5. Empty File',
    markdown: '',
  },
];

interface ParserLabProps {
  openings: Array<{ path: string; title: string; rawMarkdown: string }>;
}

export function ParserLab({ openings }: ParserLabProps) {
  const [rawInput, setRawInput] = useState(
    openings[0]?.rawMarkdown || PRESET_CASES[0].markdown,
  );
  const [activePreset, setActivePreset] = useState<string>(
    openings[0]?.path || PRESET_CASES[0].id,
  );

  const parsed = useMemo(() => parseAndValidateOpening(rawInput), [rawInput]);

  return (
    <section aria-label="Markdown Parser Lab" className="space-y-6">
      <div className="bg-white border border-[#E2E0D8] rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#ECEAE3] pb-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Markdown Parser &amp; Legality Validator
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Test the pure single-pass state machine and chess.js move validator
              against loaded files or malformed opening Markdown.
            </p>
          </div>
        </div>

        {/* Preset Test Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {openings.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                setRawInput(item.rawMarkdown);
                setActivePreset(item.path);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 min-h-[36px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A] ${
                activePreset === item.path
                  ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]'
                  : 'bg-[#F7F6F2] text-zinc-700 border-[#E2E0D8] hover:bg-[#EDEAD9]'
              }`}
            >
              {item.title}
            </button>
          ))}
          {PRESET_CASES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setRawInput(preset.markdown);
                setActivePreset(preset.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 min-h-[36px] focus-visible:outline-2 focus-visible:outline-[#1B5E3A] ${
                activePreset === preset.id
                  ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]'
                  : 'bg-[#F7F6F2] text-zinc-700 border-[#E2E0D8] hover:bg-[#EDEAD9]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Two-column Editor & Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="markdown-input"
              className="text-xs font-semibold text-zinc-700"
            >
              Raw Opening Markdown
            </label>
            <textarea
              id="markdown-input"
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                setActivePreset('custom');
              }}
              spellCheck={false}
              rows={18}
              className="w-full font-mono-tabular text-xs leading-relaxed p-3.5 rounded-md border border-[#D8D5CB] bg-[#FAF9F6] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1B5E3A]"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">
                Parser Output Contract
              </span>
              {parsed.errors.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Valid ({parsed.variations.length} variations, 0 errors)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  {parsed.errors.length}{' '}
                  {parsed.errors.length === 1 ? 'error' : 'errors'} caught
                </span>
              )}
            </div>

            {parsed.errors.length > 0 && (
              <div
                role="alert"
                className="border border-red-300 bg-red-50 text-red-900 rounded-md p-3 text-xs space-y-1"
              >
                <p className="font-semibold">errors[]:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {parsed.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <pre className="w-full overflow-auto max-h-[380px] font-mono-tabular text-xs leading-relaxed p-3.5 rounded-md border border-[#E2E0D8] bg-[#F7F6F2] text-zinc-800">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
