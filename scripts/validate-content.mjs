import fs from 'node:fs';
import path from 'node:path';
import { parseAndValidateOpening } from '../src/lib/validate.ts';

const linesDir = path.resolve(process.cwd(), 'public/lines');

if (!fs.existsSync(linesDir)) {
  console.error(`Content directory not found: ${linesDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(linesDir)
  .filter((name) => name.endsWith('.md'))
  .sort();

if (files.length === 0) {
  console.error('No .md files found in public/lines/.');
  process.exit(1);
}

let hasErrors = false;

for (const file of files) {
  const fullPath = path.join(linesDir, file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const parsed = parseAndValidateOpening(raw);

  if (parsed.errors.length > 0) {
    hasErrors = true;
    console.error(`FAIL ${file}:`);
    for (const err of parsed.errors) {
      console.error(`  - ${err}`);
    }
  } else {
    console.log(
      `PASS ${file}: "${parsed.title}" (${parsed.variations.length} variations, 0 errors)`,
    );
  }
}

if (hasErrors) {
  process.exit(1);
}
