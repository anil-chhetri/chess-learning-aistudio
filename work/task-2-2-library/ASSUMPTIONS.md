# ASSUMPTIONS - Task 2.2: Load & Display Openings

| # | Assumption | Why I Made It | What Happens If It's Wrong |
|---|------------|---------------|----------------------------|
| A1 | `fetch(..., { cache: 'no-store' })` bypasses stale GitHub Pages CDN responses | Project Plan §2.1 & Tech Stack Guide §6 | Browser always requests fresh `manifest.json` and `.md` content |
| A2 | Partial opening failures should isolate broken files rather than hiding working openings | Developer Guide §6.A.3 ("Never crash on bad data") | Loader returns valid entries alongside error messages for failed files |
| A3 | Manifest paths are relative (`lines/<file>.md`) without leading `/` | Tech Stack Guide §5 ("Absolute `/` breaks on `username.github.io/repo/`") | `normalizeManifestPaths` strips any accidental leading slashes |
