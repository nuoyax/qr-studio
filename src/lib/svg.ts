import QRCode from "qrcode";
import type { GenOptions } from "./qr";

export interface SvgGenerateOptions extends GenOptions {
  text: string;
}

/**
 * Generate an SVG string of a QR code for a single payload.
 * Used by the "Download SVG" action.
 */
export async function generateQRSvg(opts: SvgGenerateOptions): Promise<string> {
  const { text, ...qrOpts } = opts;
  if (!text) throw new Error("Text to encode is empty.");
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    ...qrOpts,
  });
}
