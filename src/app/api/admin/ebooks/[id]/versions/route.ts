import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  body,
  EbookError,
  endpoint,
  json,
  lock,
  requireEbookAdmin,
} from "@/lib/ebooks/server";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const { id } = await params;
    const data = z
      .object({
        label: z.string().trim().min(1).max(200),
        pageCount: z.number().int().min(1).max(2000),
      })
      .safeParse(await body(request));
    if (!data.success)
      throw new EbookError(
        "Provide a version label and a page count from 1 to 2000.",
      );
    return json(
      await db.ebookVersion.create({ data: { ebookId: id, ...data.data } }),
    );
  });
}
export async function PUT(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const { id } = await params;
    const input = await body(request);
    if (typeof input.versionId !== "string" || input.previewConfirmed !== true)
      throw new EbookError("Preview this version and confirm it is ready.");
    await db.$transaction(async (tx) => {
      await lock(tx, "ebook-catalog:" + id);
      await lock(tx, "ebook-version:" + input.versionId);
      const version = await tx.ebookVersion.findFirst({
        where: { id: input.versionId, ebookId: id },
        include: {
          pages: { select: { number: true }, orderBy: { number: "asc" } },
        },
      });
      if (
        !version ||
        version.pages.length !== version.pageCount ||
        version.pages.some((p, i) => p.number !== i + 1)
      )
        throw new EbookError(
          "This version is incomplete. Upload all pages first.",
        );
      await tx.ebookVersion.update({
        where: { id: version.id },
        data: { ready: true },
      });
      await tx.ebook.update({
        where: { id },
        data: { activeVersionId: version.id },
      });
    });
    return json({ success: true });
  });
}
