# Chess Opening Trainer

A static, browser-only chess opening trainer that turns simple Markdown files into interactive board studies and drills.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Testing & Content Validation

```bash
npm test              # Run pure parser and move-validation unit tests
npm run validate-content  # Validate every .md opening file in public/lines/
npm run lint          # Run TypeScript typechecking
npm run build         # Build static bundle into dist/
```

## Adding an Opening

1. Create a lowercase kebab-case `.md` file in `public/lines/` (for example, `public/lines/sicilian-najdorf.md`).
2. Follow the format contract in `docs/OPENING_FORMAT.md`.
3. Run `npm run validate-content` to verify frontmatter and `chess.js` move legality.
