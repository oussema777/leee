import { execFileSync } from "node:child_process";
import { stat, writeFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const WRITE = process.argv.includes("--write");
const MAX_DIMENSION = 2560;
const MAX_FILE_BYTES = 1.5 * 1024 * 1024;
const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function gitFiles(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function deployableImages() {
  const files = new Set([
    ...gitFiles(["ls-files", "--", "public"]),
    ...gitFiles(["ls-files", "--others", "--exclude-standard", "--", "public"]),
  ]);

  return [...files]
    .filter((file) => SUPPORTED.has(path.extname(file).toLowerCase()))
    .sort();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function encodedImage(file) {
  const extension = path.extname(file).toLowerCase();
  let pipeline = sharp(file, {
    animated: false,
    failOn: "warning",
    limitInputPixels: 80_000_000,
  })
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (extension === ".jpg" || extension === ".jpeg") {
    pipeline = pipeline.jpeg({
      quality: 80,
      progressive: true,
      mozjpeg: true,
      chromaSubsampling: "4:2:0",
    });
  } else if (extension === ".png") {
    pipeline = pipeline.png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      effort: 10,
    });
  } else {
    pipeline = pipeline.webp({ quality: 80, effort: 5, smartSubsample: true });
  }

  return pipeline.toBuffer();
}

async function optimize(file) {
  const before = (await stat(file)).size;
  const metadata = await sharp(file, { animated: false }).metadata();
  const tooLarge = before > MAX_FILE_BYTES;
  const tooWide = (metadata.width ?? 0) > MAX_DIMENSION;
  const tooTall = (metadata.height ?? 0) > MAX_DIMENSION;

  if (!WRITE) {
    return { file, before, metadata, needsWork: tooLarge || tooWide || tooTall };
  }

  // Once an image is within budget, leave it byte-for-byte unchanged. This
  // makes repeated runs idempotent and avoids generational quality loss.
  if (!tooLarge && !tooWide && !tooTall) {
    return { file, before, after: before, metadata, changed: false };
  }

  const output = await encodedImage(file);
  // Avoid replacing already-efficient images unless resizing was required.
  if (!tooWide && !tooTall && output.length >= before * 0.95) {
    return { file, before, after: before, metadata, changed: false };
  }

  const temporary = `${file}.optimizing`;
  await writeFile(temporary, output);
  try {
    await rename(temporary, file);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }

  return { file, before, after: output.length, metadata, changed: true };
}

const files = deployableImages();
const results = [];

// A small pool is much faster than processing hundreds of photos serially,
// without creating a large memory spike on developer machines or CI.
const queue = [...files];
const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
  while (queue.length > 0) {
    const file = queue.shift();
    if (!file) return;
    try {
      results.push(await optimize(file));
    } catch (error) {
      console.error(`Could not process ${file}: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    }
  }
});

await Promise.all(workers);
results.sort((a, b) => a.file.localeCompare(b.file));

if (WRITE) {
  const changed = results.filter((result) => result.changed);
  const before = changed.reduce((total, result) => total + result.before, 0);
  const after = changed.reduce((total, result) => total + result.after, 0);
  for (const result of changed) {
    console.log(`${result.file}: ${formatBytes(result.before)} -> ${formatBytes(result.after)}`);
  }
  console.log(`\nOptimized ${changed.length}/${files.length} images: ${formatBytes(before)} -> ${formatBytes(after)} (${before ? Math.round((1 - after / before) * 100) : 0}% smaller).`);
} else {
  const violations = results.filter((result) => result.needsWork);
  for (const result of violations) {
    console.error(`${result.file}: ${formatBytes(result.before)}, ${result.metadata.width ?? "?"}x${result.metadata.height ?? "?"}`);
  }
  if (violations.length > 0) {
    console.error(`\n${violations.length} image(s) exceed ${formatBytes(MAX_FILE_BYTES)} or ${MAX_DIMENSION}px. Run npm run assets:optimize.`);
    process.exitCode = 1;
  } else {
    console.log(`Checked ${files.length} deployable images; all are within the asset budget.`);
  }
}
