import fs from 'node:fs';
import path from 'node:path';

export function generateManifestData(linesDir) {
  if (!fs.existsSync(linesDir)) {
    throw new Error(`Lines directory not found: ${linesDir}`);
  }

  const files = fs
    .readdirSync(linesDir)
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `lines/${name}`);

  return { files };
}

export function writeManifestFile(
  linesDir = path.resolve(process.cwd(), 'public/lines'),
  outFile = path.resolve(process.cwd(), 'public/manifest.json'),
) {
  const manifest = generateManifestData(linesDir);
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(outFile, serialized, 'utf8');
  return manifest;
}

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isMainModule) {
  const manifest = writeManifestFile();
  console.log(`Generated public/manifest.json with ${manifest.files.length} opening files.`);
}
