import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";
import { parseContactsCsv } from "@/lib/newsletter/csv";
import { planImport } from "@/lib/newsletter/import";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { page, limit, search, skip } = getPaginationParams(request);
    const tag = new URL(request.url).searchParams.get("tag") || "";
    const where: Record<string, unknown> = { deletedAt: null };
    if (search) where.email = { contains: search, mode: "insensitive" };
    if (tag) where.tags = { has: tag };
    const [data, total] = await Promise.all([
      db.contact.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      db.contact.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch contacts");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { csv } = await request.json();
    if (typeof csv !== "string" || !csv.trim()) return errorResponse("Missing CSV", 400);

    let parsed;
    try { parsed = parseContactsCsv(csv); }
    catch (e) { return errorResponse((e as Error).message, 400); }

    const suppressedRows = await db.suppression.findMany({ select: { email: true } });
    const suppressed = new Set(suppressedRows.map((s) => s.email));
    const plan = planImport(parsed.valid, suppressed);

    let added = 0;
    for (const r of plan.toUpsert) {
      await db.contact.upsert({
        where: { email: r.email },
        update: { name: r.name, tags: r.tags, deletedAt: null },
        create: { email: r.email, name: r.name, tags: r.tags },
      });
      added++;
    }

    return NextResponse.json({
      added,
      duplicates: parsed.duplicates,
      invalid: parsed.invalid,
      suppressedKeptOff: plan.suppressedKeptOff,
    });
  } catch {
    return errorResponse("Failed to import contacts");
  }
}
