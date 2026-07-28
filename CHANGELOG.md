# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] — 2026-07-28

### Added
- **Structured content templates** — generate URL / Wi-Fi / vCard / SMS / email / phone / geolocation QR codes from form fields.
- **Stylized QR codes** — square / rounded / dot module shapes, custom finder-eye color, centered logo embedding (error correction auto-raised to H).
- **Camera live scan** — decode a QR code in real time via `getUserMedia`, with front/back switching and automatic stop on first hit.
- **Dark mode** — auto-detects OS preference on first visit; toggle persists in `localStorage`.
- **History panel** — recent generated & decoded items stored locally (capped at 50), with restore, clear, and CSV / JSON export.
- **Tag-triggered GitHub Release workflow** — pushing a `v*` tag builds the production bundle and publishes a GitHub Release with a `dist` zip + SHA256 checksum.
- `theme-color` meta tags for light/dark browser chrome.
- `prefers-reduced-motion` support.

### Changed
- Fully responsive/adaptive layout: tablet (≤900px) and mobile (≤640px) breakpoints, stacked card-style tables on phones, iOS input zoom mitigation (16px inputs), `viewport-fit=cover`.
- Input font sizes raised to 16px on mobile to prevent iOS auto-zoom on focus.

## [1.0.0] — 2026-07-28

### Added
- **QR generation** — single + batch (XLSX / TXT / CSV import), per-PNG / ZIP / XLSX export, SVG export, customizable size / EC level / margin / colors.
- **QR decoding** — single image, **Ctrl+V paste-image** decode, batch drag & drop / multi-select, XLSX export.
- **Bilingual UI** — English (default) and 简体中文, choice persisted.
- **GitHub Pages** deployment via GitHub Actions; relative `base` for project subpaths.
- 100% client-side — no data leaves the browser.

[Unreleased]: https://github.com/halo/qr-studio/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/halo/qr-studio/releases/tag/v1.1.0
[1.0.0]: https://github.com/halo/qr-studio/releases/tag/v1.0.0
