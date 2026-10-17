# Screenshot Framer

A local, privacy-friendly web app for framing and preparing App Store & Google Play screenshots. No account, no backend, works offline.

## Features

- Load multiple screenshots (PNG/JPG/JPEG/WEBP) and remove them from the list individually
- Apply device frames (iOS & Android, popular devices)
- Add custom frames (PNG/SVG)
- Add text layers with multi-language support
- **Design tab (Figma-like)**: live canvas size readout, editable W×H with aspect-ratio lock, background color or transparent (checkerboard preview), selection X/Y/W/H fields and center-horizontal/vertical alignment
- **Text tab**: 23 font families (9 system + 14 bundled Google Fonts, offline), quick size chips, bold/italic, fill or outline, left/center/right align, letter spacing and line height
- **Language tab**: languages, active language switch, glossary with term preservation
- Google Translate integration with glossary & term preservation
- Export PNGs to separate AppStore/GooglePlay folders
- Download the current canvas as a single PNG (no ZIP needed)
- Project export/import as ZIP (fully portable)
- Responsive layout (side panels collapse into drawers on small screens), keyboard-accessible controls and ARIA-labelled widgets
- Completely local - no CDN, no tracking (Bootstrap 5 and Bootstrap Icons are bundled, not loaded from a CDN)

## Usage

1. `npm install` (first time), then `npm run dev` and open the printed URL
   - For a production build: `npm run build`, then serve `dist/` with any static server
   - Note: opening `index.html` directly via `file://` does not work because browsers block ES modules — use the dev server or a static server
2. Add your screenshots
3. Choose device frame and adjust
4. Open the **Design** tab to set canvas size / background, and **Text** tab for typography
5. Add text and translate if needed
6. Export individual or all as PNGs, or use **Download PNG** for the current view
7. Export project as ZIP to move to another PC
8. Remove a screenshot any time with the **×** button in the screenshot list

Run the automated tests with `npm test` (Vitest + jsdom).

## Requirements

- Modern browser with ES modules support
- Node.js for the dev server (`npm run dev`)
- No internet required for core features (translation needs internet)

## Fonts

14 popular Google Fonts are bundled locally in `fonts/` (latin + latin-ext subsets, so Turkish characters render correctly) and declared in `css/fonts.css`. Nothing is fetched from a CDN at runtime.

To refresh or extend the font set, edit the family list in `tools/fetch_fonts.py` and run:

```bash
python3 tools/fetch_fonts.py
```

This downloads the woff2 files into `fonts/` and regenerates `css/fonts.css`.

## Tech stack

- **Bootstrap 5.3** (npm) for the component/base layer, driven by `<html data-bs-theme="dark">`; app tokens in `css/variables.css` remap the official `--bs-*` variables so the dark theme stays consistent.
- **Bootstrap Icons** (npm) for all icons — self-hosted, so icons work offline.
- **Fabric.js / JSZip / FileSaver** live in `vendor/` and are loaded with plain `<script>` tags (the Vite build copies them into `dist/vendor/`).
- `js/main.js` is the single entry point: it imports the CSS in explicit order (Bootstrap first, app theme last) and then boots the app.

## Files

Vendored libraries (Fabric.js, JSZip, FileSaver) are included in `vendor/`. Bootstrap 5 and Bootstrap Icons come from npm and are bundled by Vite. No CDN is used at runtime.

## Notes

- Translation requires online connection and shows preview for review before applying
- Glossary helps preserve brand/product names and technical terms
- Project ZIP includes all assets for full portability
