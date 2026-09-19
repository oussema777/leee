import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { optimizeImageUpload } from "./image-optimization";

describe("optimizeImageUpload", () => {
  it("constrains dimensions and returns WebP", async () => {
    const source = await sharp({
      create: {
        width: 3000,
        height: 1500,
        channels: 3,
        background: "#5895d0",
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeImageUpload(source, 1000);
    const metadata = await sharp(result.buffer).metadata();

    expect(result.contentType).toBe("image/webp");
    expect(result.extension).toBe("webp");
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(1000);
    expect(metadata.height).toBe(500);
    expect(result.buffer.length).toBeLessThan(source.length);
  });

  it("rejects data that is not an image", async () => {
    await expect(optimizeImageUpload(Buffer.from("not an image"))).rejects.toThrow();
  });
});
