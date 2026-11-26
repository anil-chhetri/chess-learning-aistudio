import type { ParsedOpening } from './parser.ts';
import { parseAndValidateOpening } from './validate.ts';

export interface LoadedOpeningEntry {
  path: string;
  rawMarkdown: string;
  parsed: ParsedOpening;
}

export interface LoadOpeningsResult {
  openings: LoadedOpeningEntry[];
  errors: string[];
}

export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}>;

function normalizeManifestPaths(rawManifest: unknown): string[] | null {
  let list: unknown = null;
  if (Array.isArray(rawManifest)) {
    list = rawManifest;
  } else if (
    rawManifest &&
    typeof rawManifest === 'object' &&
    'files' in rawManifest &&
    Array.isArray((rawManifest as { files: unknown }).files)
  ) {
    list = (rawManifest as { files: unknown[] }).files;
  }

  if (!Array.isArray(list)) return null;

  return list
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.replace(/^\/+/, '').trim());
}

/**
 * Fetches manifest.json (no-store) and loads/validates every referenced .md file.
 * Never throws; returns partial successes alongside user-facing error strings.
 */
export async function loadOpeningsFromManifest(
  fetchFn: FetchLike = fetch,
): Promise<LoadOpeningsResult> {
  const errors: string[] = [];
  let filePaths: string[] | null = null;

  try {
    const manifestRes = await fetchFn('manifest.json', { cache: 'no-store' });
    if (!manifestRes.ok) {
      console.error(`Failed to load manifest.json (HTTP ${manifestRes.status}).`);
      return {
        openings: [],
        errors: ['Failed to load manifest.json. Check console.'],
      };
    }

    const rawManifest = await manifestRes.json();
    filePaths = normalizeManifestPaths(rawManifest);
    if (!filePaths || filePaths.length === 0) {
      console.error('manifest.json is missing a valid non-empty "files" array.');
      return {
        openings: [],
        errors: ['Failed to load manifest.json. Check console.'],
      };
    }
  } catch (err) {
    console.error('Error loading manifest.json:', err);
    return {
      openings: [],
      errors: ['Failed to load manifest.json. Check console.'],
    };
  }

  const settled = await Promise.all(
    filePaths.map(async (filePath): Promise<{ entry: LoadedOpeningEntry | null; error: string | null }> => {
      try {
        const res = await fetchFn(filePath, { cache: 'no-store' });
        if (!res.ok) {
          console.error(`Failed to fetch ${filePath} (HTTP ${res.status}).`);
          return {
            entry: null,
            error: `Failed to load ${filePath}. Check console.`,
          };
        }

        const rawMarkdown = await res.text();
        const parsed = parseAndValidateOpening(rawMarkdown);

        if (parsed.errors.length > 0) {
          console.error(`Validation errors in ${filePath}:`, parsed.errors);
          return {
            entry: parsed.variations.some((v) => v.valid)
              ? { path: filePath, rawMarkdown, parsed }
              : null,
            error: `Failed to load ${filePath}. Check console.`,
          };
        }

        return {
          entry: { path: filePath, rawMarkdown, parsed },
          error: null,
        };
      } catch (err) {
        console.error(`Error loading ${filePath}:`, err);
        return {
          entry: null,
          error: `Failed to load ${filePath}. Check console.`,
        };
      }
    }),
  );

  const openings: LoadedOpeningEntry[] = [];
  for (const item of settled) {
    if (item.error) errors.push(item.error);
    if (item.entry) openings.push(item.entry);
  }

  return { openings, errors };
}
