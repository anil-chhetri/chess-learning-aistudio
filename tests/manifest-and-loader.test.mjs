import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { generateManifestData } from '../scripts/build-manifest.mjs';
import { loadOpeningsFromManifest } from '../src/lib/loader.ts';

describe('Phase 2: Manifest & Content Pipeline Loader', () => {
  it('1. generateManifestData matches public/manifest.json and includes core sample openings', () => {
    const linesDir = path.resolve(process.cwd(), 'public/lines');
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    const generated = generateManifestData(linesDir);
    const onDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.deepEqual(generated, onDisk);
    assert.ok(generated.files.length >= 3);
    assert.ok(generated.files.includes('lines/kings-indian.md'));
    assert.ok(generated.files.includes('lines/queens-gambit.md'));
    assert.ok(generated.files.includes('lines/sicilian-defense.md'));
    assert.deepEqual([...generated.files], [...generated.files].sort());
  });

  it('2. loadOpeningsFromManifest fetches manifest.json and all listed openings with cache: no-store', async () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const manifest = JSON.parse(
      fs.readFileSync(path.join(publicDir, 'manifest.json'), 'utf8'),
    );
    const fetchCalls = [];

    const mockFetch = async (input, init) => {
      fetchCalls.push({ input, cache: init?.cache });
      const target = path.join(publicDir, input);
      if (!fs.existsSync(target)) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
          json: async () => ({}),
        };
      }
      const content = fs.readFileSync(target, 'utf8');
      return {
        ok: true,
        status: 200,
        text: async () => content,
        json: async () => JSON.parse(content),
      };
    };

    const result = await loadOpeningsFromManifest(mockFetch);
    assert.deepEqual(result.errors, []);
    assert.equal(result.openings.length, manifest.files.length);
    const loadedTitles = result.openings.map((o) => o.parsed.title);
    assert.ok(loadedTitles.includes("King's Indian Defense"));
    assert.ok(loadedTitles.includes("Queen's Gambit"));
    assert.ok(loadedTitles.includes('Sicilian Defense'));
    assert.ok(fetchCalls.every((c) => c.cache === 'no-store'));
  });

  it('3. returns readable error when manifest.json 404s without crashing', async () => {
    const originalError = console.error;
    console.error = () => {};
    try {
      const result = await loadOpeningsFromManifest(async () => ({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
        json: async () => ({}),
      }));

      assert.equal(result.openings.length, 0);
      assert.deepEqual(result.errors, ['Failed to load manifest.json. Check console.']);
    } finally {
      console.error = originalError;
    }
  });

  it('4. reports failed file error while still loading valid openings', async () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const originalError = console.error;
    console.error = () => {};

    try {
      const mockFetch = async (input) => {
        if (input === 'manifest.json') {
          return {
            ok: true,
            status: 200,
            text: async () => '',
            json: async () => ({
              files: ['lines/queens-gambit.md', 'lines/missing-file.md'],
            }),
          };
        }
        const target = path.join(publicDir, input);
        if (!fs.existsSync(target)) {
          return {
            ok: false,
            status: 404,
            text: async () => 'Not Found',
            json: async () => ({}),
          };
        }
        const content = fs.readFileSync(target, 'utf8');
        return {
          ok: true,
          status: 200,
          text: async () => content,
          json: async () => JSON.parse(content),
        };
      };

      const result = await loadOpeningsFromManifest(mockFetch);
      assert.equal(result.openings.length, 1);
      assert.equal(result.openings[0].parsed.title, "Queen's Gambit");
      assert.deepEqual(result.errors, [
        'Failed to load lines/missing-file.md. Check console.',
      ]);
    } finally {
      console.error = originalError;
    }
  });
});
