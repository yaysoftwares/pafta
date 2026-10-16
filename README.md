# Screenshot Framer

A local, privacy-friendly web app for framing and preparing App Store & Google Play screenshots. No account, no backend, works offline.

## Features

- Load multiple screenshots (PNG/JPG/JPEG/WEBP)
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
- Completely local - no CDN, no tracking

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

## Files

All dependencies (Fabric.js, JSZip, FileSaver) are included in `vendor/`. No CDN used.

## Notes

- Translation requires online connection and shows preview for review before applying
- Glossary helps preserve brand/product names and technical terms
- Project ZIP includes all assets for full portability
