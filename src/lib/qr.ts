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

/** Dot rendering style for stylized QR codes. */
export type DotStyle = "square" | "rounded" | "dot";

export interface StyleOptions {
  dotStyle?: DotStyle;
  /** Override color for the three finder (eye) patterns. Defaults to dark color. */
  eyeColor?: string;
  /** Logo data URL to embed in the center. */
  logoDataUrl?: string;
  /** Logo size as a fraction of QR width (0.1–0.3). */
  logoRatio?: number;
}

export interface StylizedOptions extends GenOptions, StyleOptions {
  text: string;
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

/**
 * Generate a stylized QR code (custom dots / eye color / centered logo).
 * When a logo is embedded, error-correction is forced to "H" to compensate
 * for the occluded modules.
 *
 * Implementation: render the base QR with `qrcode` to a canvas via the raw
 * module matrix, then re-draw each module with the chosen shape, repaint the
 * finder patterns, and finally composite the logo.
 */
export async function generateStylizedQR(
  opts: StylizedOptions,
): Promise<GenerateResult> {
  const {
    text,
    width = 256,
    margin = 2,
    color,
    dotStyle = "square",
    eyeColor,
    logoDataUrl,
    logoRatio = 0.2,
  } = opts;

  if (!text || text.length === 0) {
    throw new Error("Text to encode is empty.");
  }

  // Embedding a logo occludes center modules → force high error correction.
  const ec: "L" | "M" | "Q" | "H" = logoDataUrl ? "H" : (opts.errorCorrectionLevel ?? "M");
  const dark = color?.dark ?? "#000000";
  const light = color?.light ?? "#ffffff";

  // Get the raw module matrix.
  const qr = QRCode.create(text, { errorCorrectionLevel: ec });
  const modules = qr.modules;
  const count = modules.size;
  const total = count + margin * 2;

  const scale = Math.max(1, Math.floor(width / total));
  const canvasSize = scale * total;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  // Background.
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Detect finder patterns (top-left, top-right, bottom-left) — 7x7 each.
  const inFinder = (r: number, c: number) => {
    const tl = r < 7 && c < 7;
    const tr = r < 7 && c >= count - 7;
    const bl = r >= count - 7 && c < 7;
    return tl || tr || bl;
  };

  // Draw data modules (skip finder area, drawn separately for color control).
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!modules.get(r, c)) continue;
      if (inFinder(r, c)) continue;
      const x = (c + margin) * scale;
      const y = (r + margin) * scale;
      drawDot(ctx, x, y, scale, dotStyle, dark);
    }
  }

  // Draw finder patterns with the eye color (ring + center box).
  drawFinder(ctx, margin * scale, margin * scale, scale, eyeColor ?? dark);
  drawFinder(ctx, (count - 7 + margin) * scale, margin * scale, scale, eyeColor ?? dark);
  drawFinder(ctx, margin * scale, (count - 7 + margin) * scale, scale, eyeColor ?? dark);

  // Embed logo.
  if (logoDataUrl) {
    await drawLogo(ctx, canvasSize, logoDataUrl, logoRatio, light);
  }

  return { dataUrl: canvas.toDataURL("image/png"), size: canvasSize };
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  style: DotStyle,
  color: string,
) {
  ctx.fillStyle = color;
  if (style === "dot") {
    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "rounded") {
    roundRect(ctx, x, y, s, s, s * 0.3);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, s, s);
  }
}

/** Draw a 7x7 finder pattern anchored at (x0,y0), module size `s`. */
function drawFinder(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  s: number,
  color: string,
) {
  ctx.fillStyle = color;
  // outer ring (7x7) drawn as outer square minus inner 5x5 hole
  roundRect(ctx, x0, y0, s * 7, s * 7, s * 1.2);
  ctx.fill();
  // cut the inner 5x5 with destination-out then redraw — simpler: draw 5x5 light hole
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  roundRect(ctx, x0 + s, y0 + s, s * 5, s * 5, s * 1);
  ctx.fill();
  ctx.restore();
  // inner 3x3 solid
  ctx.fillStyle = color;
  roundRect(ctx, x0 + s * 2, y0 + s * 2, s * 3, s * 3, s * 0.6);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  logoDataUrl: string,
  ratio: number,
  bg: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const lw = canvasSize * Math.min(0.3, Math.max(0.1, ratio));
      const lx = (canvasSize - lw) / 2;
      const ly = lx;
      const pad = lw * 0.12;
      // white rounded background under the logo for contrast
      ctx.fillStyle = bg;
      roundRect(ctx, lx - pad, ly - pad, lw + pad * 2, lw + pad * 2, pad);
      ctx.fill();
      ctx.drawImage(img, lx, ly, lw, lw);
      resolve();
    };
    img.onerror = () => reject(new Error("Failed to load logo image."));
    img.src = logoDataUrl;
  });
}

/** Default generation options surfaced to the UI. */
export const DEFAULT_GEN_OPTIONS: Omit<GenerateOptions, "text"> = {
  width: 256,
  errorCorrectionLevel: "M",
  margin: 2,
};
