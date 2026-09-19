import sharp from "sharp";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export type OptimizedImage = {
  buffer: Buffer;
  contentType: "image/webp";
  extension: "webp";
};

/**
 * Verifies, rotates and compresses a user-supplied image before storage.
 * Metadata is intentionally stripped by Sharp for privacy and smaller files.
 */
export async function optimizeImageUpload(
  source: Buffer,
  maxDimension = 2000
): Promise<OptimizedImage> {
  const image = sharp(source, {
    animated: false,
    failOn: "warning",
    limitInputPixels: 40_000_000,
  });
  const metadata = await image.metadata();

  if (
    !metadata.width ||
    !metadata.height ||
    !ALLOWED_FORMATS.has(metadata.format ?? "") ||
    (metadata.pages ?? 1) > 1
  ) {
    throw new Error("Only valid JPEG, PNG, or WebP images are allowed");
  }

  const buffer = await image
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toBuffer();

  return { buffer, contentType: "image/webp", extension: "webp" };
}
