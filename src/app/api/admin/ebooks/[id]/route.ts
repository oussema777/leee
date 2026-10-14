import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { catalogSchema } from "@/lib/ebooks/policy";
import {
  body,
  EbookError,
  endpoint,
  json,
  lock,
  requireEbookAdmin,
} from "@/lib/ebooks/server";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const { id } = await params;
    const ebook = await db.ebook.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { pages: true } } },
        },
      },
    });
    if (!ebook) throw new EbookError("Ebook not found.", 404);
    return json(ebook);
  });
}
export async function PUT(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const { id } = await params;
    const raw = await body(request);
    const parsed = catalogSchema.safeParse(raw);
    if (!parsed.success) throw new EbookError(parsed.error.issues[0].message);
    return json(
      await db.$transaction(async (tx) => {
        await lock(tx, "ebook-catalog:" + id);
        const current = await tx.ebook.findUniqueOrThrow({
          where: { id },
          include: { activeVersion: true },
        });
        if (current.updatedAt.toISOString() !== raw.expectedUpdatedAt)
          throw new EbookError(
            "This ebook changed. Reload before saving.",
            409,
          );
        if (parsed.data.published && !current.activeVersion?.ready)
          throw new EbookError(
            "Upload, preview and activate a complete version first.",
          );
        return tx.ebook.update({ where: { id }, data: parsed.data });
      }),
    );
  });
}
