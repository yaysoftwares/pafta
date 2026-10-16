# Screenshot Framer

A local, privacy-friendly web app for framing and preparing App Store & Google Play screenshots. No account, no backend, works offline.

## Features

- Load multiple screenshots (PNG/JPG/JPEG/WEBP)
- Apply device frames (iOS & Android, popular devices)
- Add custom frames (PNG/SVG)
- Add text layers with multi-language support
- Google Translate integration with glossary & term preservation
- Export PNGs to separate AppStore/GooglePlay folders
- Project export/import as ZIP (fully portable)
- Completely local - no CDN, no tracking

## Usage

1. `npm install` (first time), then `npm run dev` and open the printed URL
   - For a production build: `npm run build`, then serve `dist/` with any static server
   - Note: opening `index.html` directly via `file://` does not work because browsers block ES modules — use the dev server or a static server
2. Add your screenshots
3. Choose device frame and adjust
4. Add text and translate if needed
5. Export individual or all as PNGs
6. Export project as ZIP to move to another PC

## Requirements

- Modern browser with ES modules support
- Node.js for the dev server (`npm run dev`)
- No internet required for core features (translation needs internet)

## Files

All dependencies (Fabric.js, JSZip, FileSaver) are included in `vendor/`. No CDN used.

## Notes

- Translation requires online connection and shows preview for review before applying
- Glossary helps preserve brand/product names and technical terms
- Project ZIP includes all assets for full portability
