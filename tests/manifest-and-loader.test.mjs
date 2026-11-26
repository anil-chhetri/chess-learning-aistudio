import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { generateManifestData } from '../scripts/build-manifest.mjs';
import { loadOpeningsFromManifest } from '../src/lib/loader.ts';

describe('Phase 2: Manifest & Content Pipeline Loader', () => {
  it('1. generateManifestData matches public/manifest.json and includes all 3 sample openings', () => {
    const linesDir = path.resolve(process.cwd(), 'public/lines');
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    const generated = generateManifestData(linesDir);
    const onDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.deepEqual(generated, onDisk);
    assert.deepEqual(generated.files, [
      'lines/kings-indian.md',
      'lines/queens-gambit.md',
      'lines/sicilian-defense.md',
    ]);
  });

  it('2. loadOpeningsFromManifest fetches manifest.json and all 3 openings with cache: no-store', async () => {
    const publicDir = path.resolve(process.cwd(), 'public');
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
    assert.equal(result.openings.length, 3);
    assert.deepEqual(
      result.openings.map((o) => o.parsed.title),
      ["King's Indian Defense", "Queen's Gambit", 'Sicilian Defense'],
    );
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
