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

## Deploying to GitHub Pages

1. Push this repository to GitHub on the `main` branch.
2. In your repository on GitHub, open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Every push to `main` (or manual run under the **Actions** tab) runs tests, builds `dist/`, and publishes to `https://<username>.github.io/<repo-name>/`.

