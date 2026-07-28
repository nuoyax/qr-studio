import JSZip from "jszip";
import type { GenerateResult } from "./qr";

export interface ZipItem {
  /** File name without extension, e.g. "qr-01". */
  name: string;
  /** Generated QR data URL (PNG). */
  dataUrl: string;
}

/**
 * Pack an array of QR PNG data URLs into a .zip and trigger a download.
 * Duplicate names are de-duplicated with a numeric suffix.
 */
export async function downloadQrZip(items: ZipItem[], zipName = "qrcodes.zip") {
  const zip = new JSZip();
  const seen = new Map<string, number>();
  for (const item of items) {
    let name = item.name || "qr";
    if (seen.has(name)) {
      const n = (seen.get(name) ?? 0) + 1;
      seen.set(name, n);
      name = `${name}-${n}`;
    } else {
      seen.set(name, 0);
    }
    const base64 = item.dataUrl.split(",")[1] ?? "";
    zip.file(`${name}.png`, base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload(blob, zipName);
}

/** Trigger a browser download for a Blob. */
export function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download a single data URL as a file (PNG/SVG).
 */
export function downloadDataUrl(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Re-export for consumers that want the typed result. */
export type { GenerateResult };
