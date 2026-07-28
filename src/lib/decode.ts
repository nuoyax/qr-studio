import jsQR from "jsqr";

export interface DecodeResult {
  ok: boolean;
  /** Decoded text when ok=true; error message otherwise. */
  value?: string;
  /** File name used for batch result rows. */
  fileName: string;
}

/**
 * Decode a QR code from raw RGBA image data.
 * jsQR scans up to 4 times with inversion/fallback, mirroring the
 * documented behaviour for images that may contain inverted contrast.
 */
export function decodeFromImageData(
  imageData: ImageData,
): string | null {
  // Primary scan.
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  return code?.data ?? null;
}

/**
 * Decode a QR code from a browser file (image). Resolves to the decoded
 * string, or null if no QR was found.
 */
export function decodeFromFile(file: File): Promise<string | null> {
  return fileToImageData(file).then((imgData) => decodeFromImageData(imgData));
}

/** Load a File into an ImageData via an offscreen canvas. */
export function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable."));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };
    img.src = url;
  });
}
