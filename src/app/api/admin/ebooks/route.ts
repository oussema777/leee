import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { catalogSchema } from "@/lib/ebooks/policy";
import {
  body,
  EbookError,
  endpoint,
  json,
  requireEbookAdmin,
} from "@/lib/ebooks/server";
export async function GET(request: NextRequest) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    return json(
      await db.ebook.findMany({
        include: {
          activeVersion: { select: { label: true, pageCount: true } },
          _count: { select: { orders: true, access: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    );
  });
}
export async function POST(request: NextRequest) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const input = catalogSchema.safeParse(await body(request));
    if (!input.success) throw new EbookError(input.error.issues[0].message);
    if (input.data.published)
      throw new EbookError("Prepare and preview the book before publishing.");
    return json(await db.ebook.create({ data: input.data }), 201);
  });
}
