# QR Code Tools

> A browser-based QR code **generator & decoder** with batch support, image-paste decoding, and XLSX import/export. Built with React + TypeScript + Vite.

**[中文文档](./README.zh-CN.md)** · English (default)

---

## Features

### Generate

- **Single QR** — encode any text or URL into a QR code with live preview.
- **Batch generate** — paste multiple rows, or import from **XLSX / TXT / CSV**, and generate all at once.
- **Customizable** — size, error-correction level (L/M/Q/H), margin, foreground & background colors.
- **Export** — download each PNG individually, **download all as a ZIP**, or **export the content list to XLSX**.
- **SVG export** for the single QR (vector, scalable).

### Decode

- **Single image** — pick an image file and read the QR code inside.
- **Paste image** — copy a screenshot or image and press **Ctrl+V** anywhere on the Decode tab to decode it instantly.
- **Batch decode** — drag & drop or select multiple images at once; results are listed in a table.
- **Export** — copy any decoded value to the clipboard, or **export all results to XLSX** (file name, decoded text, status).

### General

- 🔒 **100% client-side** — all processing runs in your browser. No data is uploaded to any server.
- 🌐 **Bilingual UI** — English (default) and 简体中文, with your choice remembered.
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
    ├── App.tsx               # shell: tabs, header, i18n toggle
    ├── styles.css            # UI styles
    ├── components/
    │   ├── Generator.tsx     # generate (single + batch)
    │   └── Decoder.tsx      # decode (single + batch + paste)
    └── lib/
        ├── qr.ts             # generate QR data URL
        ├── svg.ts            # generate QR SVG string
        ├── decode.ts         # decode QR from image / ImageData
        ├── excel.ts          # read/write XLSX, TXT/CSV
        ├── zip.ts            # zip packaging + blob downloads
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

## Usage tips

- **Batch generate from Excel**: put one content entry per row (a column named `Content` / `Text` / `URL` is preferred, otherwise the first column is used). Import the `.xlsx` and click Generate.
- **Paste to decode**: take a screenshot (`Win+Shift+S` / `Cmd+Shift+4`), then `Ctrl+V` / `Cmd+V` on the Decode tab — the QR inside the image is read immediately.
- **Error-correction level**: higher levels (Q/H) tolerate more damage but produce denser codes. `M` is a good default.

---

## License

MIT — see [LICENSE](./LICENSE).
