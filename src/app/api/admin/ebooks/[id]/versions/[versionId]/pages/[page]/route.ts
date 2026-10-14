import { NextRequest } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import {
  EbookError,
  endpoint,
  headers,
  json,
  lock,
  requireEbookAdmin,
} from "@/lib/ebooks/server";
import { readPrivate, savePrivate } from "@/lib/ebooks/storage";
import { validPage } from "@/lib/ebooks/policy";
import { receiptForm } from "@/lib/book-orders/whish-receipts";
type Context = {
  params: Promise<{ id: string; versionId: string; page: string }>;
};
export async function GET(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const { id, versionId, page } = await params;
    const entry = await db.ebookPage.findFirst({
      where: { versionId, number: Number(page), version: { ebookId: id } },
    });
    if (!entry) throw new EbookError("Page not found.", 404);
    return new Response(new Uint8Array(await readPrivate(entry.storagePath)), {
      headers: { ...headers, "Content-Type": "image/webp" },
    });
  });
}
export async function POST(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const { id, versionId, page } = await params;
    const version = await db.ebookVersion.findFirst({
      where: { id: versionId, ebookId: id },
    });
    if (
      !version ||
      version.ready ||
      !validPage(Number(page), version.pageCount)
    )
      throw new EbookError("Choose a valid page in an unfinished version.");
    const file = (await receiptForm(request)).get("file");
    if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024)
      throw new EbookError("Choose a page image up to 2 MB.");
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 16000000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !["png", "jpeg", "webp"].includes(metadata.format || "") ||
      (metadata.pages || 1) !== 1
    )
      throw new EbookError("Choose a PNG, JPEG or WebP page.");
    const bytes = await image
      .rotate()
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();
    const path = await savePrivate("pages/" + versionId, bytes);
    await db.$transaction(async (tx) => {
      await lock(tx, "ebook-version:" + versionId);
      const latest = await tx.ebookVersion.findUniqueOrThrow({
        where: { id: versionId },
      });
      if (latest.ready)
        throw new EbookError(
          "Activated versions cannot be modified. Create a new version.",
          409,
        );
      await tx.ebookPage.upsert({
        where: { versionId_number: { versionId, number: Number(page) } },
        create: { versionId, number: Number(page), storagePath: path },
        update: { storagePath: path },
      });
    });
    return json({ success: true });
  });
}
