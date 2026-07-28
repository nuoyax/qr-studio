import { describe, it, expect } from "vitest";
import { generateQR } from "../src/lib/qr";

describe("generateQR", () => {
  it("produces a PNG data URL for non-empty text", async () => {
    const r = await generateQR({ text: "hello" });
    expect(r.dataUrl.startsWith("data:image/png")).toBe(true);
    expect(r.size).toBe(256);
  });

  it("rejects empty text", async () => {
    await expect(generateQR({ text: "" })).rejects.toThrow();
  });
});
