import QRCode from "qrcode";

/** Renderer options shared by every QR generation call. */
export interface GenOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  color?: { dark?: string; light?: string };
}

export interface GenerateOptions extends GenOptions {
  /** Text content encoded into the QR code. */
  text: string;
}

export interface GenerateResult {
  /** Data URL (PNG by default) of the generated QR image. */
  dataUrl: string;
  /** Width/height of the generated square image in pixels. */
  size: number;
}

/**
 * Generate a single QR code from text as a PNG data URL.
 * Throws if `text` is empty (empty payloads cannot be encoded).
 */
export async function generateQR(opts: GenerateOptions): Promise<GenerateResult> {
  const { text, ...qrOpts } = opts;
  if (!text || text.length === 0) {
    throw new Error("Text to encode is empty.");
  }
  const width = qrOpts.width ?? 256;
  const dataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    ...qrOpts,
    width,
  });
  return { dataUrl, size: width };
}

/** Default generation options surfaced to the UI. */
export const DEFAULT_GEN_OPTIONS: Omit<GenerateOptions, "text"> = {
  width: 256,
  errorCorrectionLevel: "M",
  margin: 2,
};
