# QR Code Tools

> A browser-based QR code **generator & decoder** with batch support, image-paste decoding, and XLSX import/export. Built with React + TypeScript + Vite.

**[中文文档](./README.zh-CN.md)** · English (default)

---

## Features

### Generate

- **Single QR** — encode any text or URL into a QR code with live preview.
- **Structured templates** — generate URL, Wi-Fi, vCard (contact), SMS, email, phone, and geolocation QR codes from form fields instead of raw text.
- **Stylized QR** — choose square / rounded / dot module shapes, recolor the finder (eye) patterns, and **embed a centered logo** (error correction auto-raised to H to compensate).
- **Batch generate** — paste multiple rows, or import from **XLSX / TXT / CSV**, and generate all at once.
- **Customizable** — size, error-correction level (L/M/Q/H), margin, foreground & background colors.
- **Export** — download each PNG individually, **download all as a ZIP**, or **export the content list to XLSX**.
- **SVG export** for the single plain-text QR (vector, scalable).

### Decode

- **Single image** — pick an image file and read the QR code inside.
- **Paste image** — copy a screenshot or image and press **Ctrl+V** anywhere on the Decode tab to decode it instantly.
- **Camera scan** — scan a QR code live with your device camera (front/back switching on multi-camera devices); stops automatically on first hit.
- **Batch decode** — drag & drop or select multiple images at once; results are listed in a table.
- **Export** — copy any decoded value to the clipboard, or **export all results to XLSX** (file name, decoded text, status).

### General

- 🔒 **100% client-side** — all processing runs in your browser. No data is uploaded to any server.
- 🌐 **Bilingual UI** — English (default) and 简体中文, with your choice remembered.
- 🌙 **Dark mode** — auto-detects OS preference on first visit, toggle persists.
- 🕘 **History** — recent generated & decoded items are stored locally; restore, clear, or export as **CSV / JSON**.
- 📱 **Responsive** layout that works on desktop and mobile.
- ⚡ Built with **React 18 + TypeScript + Vite 6**, using [`qrcode`](https://www.npmjs.com/package/qrcode), [`jsqr`](https://www.npmjs.com/package/jsqr), [`xlsx`](https://www.npmjs.com/package/xlsx) (SheetJS), and [`jszip`](https://www.npmjs.com/package/jszip).

---

## Tech stack

| Layer        | Choice                                   |
| ------------ | ---------------------------------------- |
| Framework    | React 18                                 |
| Language     | TypeScript 5                             |
| Build tool   | Vite 6                                   |
| QR generate  | `qrcode`                                 |
| QR decode    | `jsqr`                                   |
| Spreadsheet  | `xlsx` (SheetJS)                         |
| ZIP archive  | `jszip`                                  |
| Deploy       | GitHub Pages (static `dist/`)            |

---

## Getting started

### Prerequisites

- Node.js **18+** (tested on Node 22)
- npm 9+

### Install & run

```bash
# install dependencies
npm install

# start the dev server (http://localhost:5173)
npm run dev

# type-check + production build
npm run build

# preview the production build locally
npm run preview
```

The production output is written to `dist/`.

---

## Project structure

```
qrcode-tools/
├── index.html
├── vite.config.ts
├── tsconfig*.json
├── package.json
├── public/
│   └── qr.svg
└── src/
    ├── main.tsx              # entry
    ├── App.tsx               # shell: tabs, header, theme/lang toggle, history
    ├── styles.css            # UI styles (light + dark via [data-theme])
    ├── components/
    │   ├── Generator.tsx     # generate (templates + styling + batch)
    │   ├── Decoder.tsx       # decode (single + batch + paste + camera)
    │   └── HistoryPanel.tsx  # recent items, CSV/JSON export, restore
    └── lib/
        ├── qr.ts             # generate QR data URL + stylized canvas
        ├── svg.ts            # generate QR SVG string
        ├── decode.ts         # decode QR from image / ImageData
        ├── camera.ts         # getUserMedia continuous scanner
        ├── payload.ts        # structured content builders (wifi/vcard/…)
        ├── excel.ts          # read/write XLSX, TXT/CSV
        ├── zip.ts            # zip packaging + blob downloads
        ├── history.ts        # local history store + CSV/JSON export
        ├── theme.ts          # light/dark theme persistence
        └── i18n.ts           # EN / ZH dictionaries
```

---

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes the site automatically.

### Option A — automatic (recommended)

1. Push the repo to GitHub.
2. Go to **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Push to `main` (or trigger the workflow manually). The site is published at:
   `https://<your-username>.github.io/qrcode-tools/`

The Vite config uses `base: "./"` so the built assets work under any project subpath.

### Option B — manual

```bash
npm run build
# upload the contents of dist/ to your static host (Pages, Netlify, Vercel, ...)
```

---

## Releases

Pushing a version tag (`v1.0.0`, `v1.1.0-rc.1`, …) triggers the **Release** workflow (`.github/workflows/release.yml`), which:

1. Builds the production bundle (`npm run build`).
2. Zips `dist/` into `qrcode-tools-<tag>.zip`.
3. Generates a SHA256 checksum (`checksums-sha256.txt`).
4. Creates a GitHub Release with the zip + checksum attached, and auto-generated notes (commit log since the previous tag). Pre-release tags (containing `-`) are marked as pre-release.

```bash
# create and push a tag to cut a release
git tag v1.1.0
git push origin v1.1.0
```

The resulting artifacts appear under **Releases** on the GitHub repo page. See [CHANGELOG.md](./CHANGELOG.md) for version history.

---

## Usage tips

- **Batch generate from Excel**: put one content entry per row (a column named `Content` / `Text` / `URL` is preferred, otherwise the first column is used). Import the `.xlsx` and click Generate.
- **Paste to decode**: take a screenshot (`Win+Shift+S` / `Cmd+Shift+4`), then `Ctrl+V` / `Cmd+V` on the Decode tab — the QR inside the image is read immediately.
- **Camera scan**: requires HTTPS or `localhost` (browser security). On phones, the back camera is preferred.
- **Error-correction level**: higher levels (Q/H) tolerate more damage but produce denser codes. `M` is a good default; a logo embed forces `H`.

---

## License

MIT — see [LICENSE](./LICENSE).
