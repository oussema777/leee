import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  body,
  EbookError,
  endpoint,
  headers,
  json,
  limited,
  hash,
  READER_COOKIE,
} from "@/lib/ebooks/server";
import { canRead, validPage } from "@/lib/ebooks/policy";
import { readPrivate, watermark } from "@/lib/ebooks/storage";
import { hasReadingAccess } from "@/lib/ebooks/reading-access";
import { cachedReadingPage } from "@/lib/ebooks/page-cache";
type Context = { params: Promise<{ id: string }> };
async function accessFor(request: NextRequest, id: string, chargeRead = false) {
  const token = request.cookies.get(READER_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new EbookError("Sign in with your purchase email to continue.", 401);
  type Row = { readerId: string; email: string; accessId: string | null; active: boolean; lastPage: number; progressVersionId: string | null;
    orderId: string; state: string; reference: string; snapshot: unknown; titleEn: string; titleAr: string; author: string; direction: string;
    versionId: string; pageCount: number; ready: boolean; previewDetails: unknown; storagePath: string | null; readAllowed: boolean; bookmarks: { page: number; label: string }[] };
  const page = Number(request.nextUrl.searchParams.get("page") || 0);
  // Prisma's nested includes execute multiple remote queries. Join the session,
  // entitlement, edition and page in one parameterized query instead.
  const rows = await db.$queryRaw<Row[]>`
    WITH session AS (
      SELECT "readerId" FROM "EbookSession"
      WHERE "id" = ${hash(token)} AND "expiresAt" > ${new Date().toISOString()}::timestamp
    ), read_limit AS (
      INSERT INTO "EbookRateLimit" ("key", "count", "expiresAt")
      SELECT 'read:' || "readerId", 1, ${new Date(Date.now() + 60000).toISOString()}::timestamp FROM session WHERE ${chargeRead}
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "EbookRateLimit"."expiresAt" <= ${new Date().toISOString()}::timestamp THEN 1 ELSE "EbookRateLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "EbookRateLimit"."expiresAt" <= ${new Date().toISOString()}::timestamp THEN ${new Date(Date.now() + 60000).toISOString()}::timestamp ELSE "EbookRateLimit"."expiresAt" END
      WHERE "EbookRateLimit"."expiresAt" <= ${new Date().toISOString()}::timestamp OR "EbookRateLimit"."count" < 180
      RETURNING "count"
    )
    SELECT s."readerId", r."email", a."id" AS "accessId", a."active", a."lastPage", a."progressVersionId",
      EXISTS(SELECT 1 FROM read_limit) AS "readAllowed",
      o."id" AS "orderId", o."state", o."reference", o."snapshot",
      b."titleEn", b."titleAr", b."author", b."direction", v."id" AS "versionId", v."pageCount", v."ready", p."storagePath",
      (SELECT e."details" FROM "EbookOrderEvent" e WHERE e."orderId" = o."id" AND e."action" = 'LOCAL_READER_PREVIEW' ORDER BY e."createdAt" DESC LIMIT 1) AS "previewDetails",
      COALESCE((SELECT jsonb_agg(jsonb_build_object('page', m."page", 'label', m."label") ORDER BY m."page") FROM "EbookBookmark" m WHERE m."accessId" = a."id" AND m."versionId" = v."id"), '[]'::jsonb) AS "bookmarks"
    FROM session s
    JOIN "EbookReader" r ON r."id" = s."readerId"
    LEFT JOIN "EbookAccess" a ON a."readerId" = s."readerId" AND a."ebookId" = ${id}
    LEFT JOIN "EbookOrder" o ON o."id" = a."orderId"
    LEFT JOIN "Ebook" b ON b."id" = a."ebookId"
    LEFT JOIN "EbookVersion" v ON v."id" = b."activeVersionId"
    LEFT JOIN "EbookPage" p ON p."versionId" = v."id" AND p."number" = ${Number.isFinite(page) ? page : 0}
    `;
  const row = rows[0];
  if (!row) throw new EbookError("Sign in with your purchase email to continue.", 401);
  const version = { id: row.versionId, pageCount: row.pageCount, ready: row.ready };
  const access = row.accessId ? { id: row.accessId, active: row.active, lastPage: row.lastPage, progressVersionId: row.progressVersionId,
    order: { id: row.orderId, state: row.state, reference: row.reference, snapshot: row.snapshot },
    ebook: { titleEn: row.titleEn, titleAr: row.titleAr, author: row.author, direction: row.direction } } : null;
  if (!access || !row.ready || !(await hasReadingAccess(access, row.previewDetails)))
    throw new EbookError(
      "Active paid access is required to read this ebook.",
      403,
    );
  if (chargeRead && !row.readAllowed) throw new EbookError("Please slow down and try again shortly.", 429);
  return { reader: { id: row.readerId, email: row.email }, access, version, storagePath: row.storagePath, bookmarks: row.bookmarks };
}
export async function GET(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    const { id } = await params;
    const { reader, access, version, storagePath, bookmarks } = await accessFor(request, id, request.nextUrl.searchParams.has("page"));
    const page = request.nextUrl.searchParams.get("page");
    if (page !== null) {
      if (!validPage(Number(page), version.pageCount))
        throw new EbookError("Page not found.", 404);
      if (!storagePath) throw new EbookError("Page not found.", 404);
      const format = request.headers.get("accept")?.includes("image/avif") ? "avif" : "webp";
      const bytes = await cachedReadingPage(`${format}-v2:${storagePath}:${access.order.reference}`, async () =>
        watermark(await readPrivate(storagePath), "LEE | " + access.order.reference, format));
      // Recheck after storage/image processing so a concurrent revocation fails closed.
      const current = await accessFor(request, id);
      if (current.version.id !== version.id) throw new EbookError("The edition changed. Reload your reader.", 409);
      return new Response(new Uint8Array(bytes), {
        headers: {
          ...headers,
          "Content-Type": `image/${format}`,
          "Vary": "Accept",
          "Content-Disposition": "inline",
        },
      });
    }
    return json({
      reader: { email: reader.email },
      titleEn: access.ebook.titleEn,
      titleAr: access.ebook.titleAr,
      direction: access.ebook.direction,
      author: access.ebook.author,
      preview: !canRead(access),
      bookmarks,
      pageCount: version.pageCount,
      versionId: version.id,
      lastPage:
        access.progressVersionId === version.id
          ? Math.min(access.lastPage, version.pageCount)
          : 1,
    });
  });
}
export async function PATCH(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    const { id } = await params;
    const { reader, access, version } = await accessFor(request, id);
    if (!(await limited("bookmark:" + reader.id, 60, 60)))
      throw new EbookError("Please slow down and try again shortly.", 429);
    const input = await body(request);
    if (input.versionId !== version.id || !validPage(input.page, version.pageCount))
      throw new EbookError("Reload the reader to save this bookmark.", 409);
    if (input.action !== "save" && input.action !== "remove")
      throw new EbookError("Invalid bookmark action.", 400);
    if (input.action === "remove") {
      await db.$executeRaw`DELETE FROM "EbookBookmark"
        WHERE "accessId" = ${access.id} AND "versionId" = ${version.id} AND "page" = ${input.page}`;
    } else {
      if (typeof input.label !== "string" || input.label.length > 120)
        throw new EbookError("Bookmark labels must be 120 characters or fewer.", 400);
      await db.$executeRaw`INSERT INTO "EbookBookmark" ("accessId", "versionId", "page", "label")
        VALUES (${access.id}, ${version.id}, ${input.page}, ${input.label.trim()})
        ON CONFLICT ("accessId", "versionId", "page") DO UPDATE SET "label" = EXCLUDED."label"`;
    }
    return json({ success: true });
  });
}
export async function PUT(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    const { id } = await params;
    const { access, version } = await accessFor(request, id);
    const input = await body(request);
    if (
      input.versionId !== version.id ||
      !validPage(input.page, version.pageCount)
    )
      throw new EbookError("Reload the reader to save your position.", 409);
    await db.ebookAccess.update({
      where: { id: access.id },
      data: { lastPage: input.page, progressVersionId: version.id },
    });
    return json({ success: true });
  });
}
