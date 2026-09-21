import { BookDonorType, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, getPaginationParams, paginatedResponse, withAdmin } from "@/lib/api-utils";
import { bookDonorAdminSchema } from "@/lib/book-restore/validation";

const clean = (value?: string) => value?.trim() || null;

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { page, limit, search, skip } = getPaginationParams(request);
    const params = new URL(request.url).searchParams;
    const type = params.get("type");
    const where: Prisma.BookDonorWhereInput = {
      ...(type === "INDIVIDUAL" || type === "ORGANISATION" ? { type: type as BookDonorType } : {}),
      ...(search ? { OR: [
        { displayName: { contains: search, mode: "insensitive" as const } },
        { contactName: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [data, total] = await Promise.all([
      db.bookDonor.findMany({ where, skip, take: limit, orderBy: { updatedAt: "desc" }, include: { _count: { select: { donations: true, inventoryItems: true, inventoryAllocations: true } } } }),
      db.bookDonor.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch (error) {
    console.error("Book donors load failed", error);
    return errorResponse("Failed to load donors");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const parsed = bookDonorAdminSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Invalid donor", 400);
    const input = parsed.data;
    const displayName = clean(input.displayName) || "Anonymous donor";
    const phone = clean(input.phone) || "";
    const contactMatches = [...(phone ? [{ phone }] : []), ...(input.email ? [{ email: input.email.toLowerCase() }] : [])];
    const match = contactMatches.length ? await db.bookDonor.findFirst({ where: { type: input.type, displayName: { equals: displayName, mode: "insensitive" }, OR: contactMatches }, select: { id: true } }) : null;
    if (match) return errorResponse("A donor with this name and contact information already exists.", 409);
    const donor = await db.bookDonor.create({ data: {
      ...input, displayName, phone, contactName: clean(input.contactName), email: clean(input.email)?.toLowerCase(), logoUrl: clean(input.logoUrl), adminNotes: clean(input.adminNotes),
      logoApproved: input.type === "ORGANISATION" && Boolean(input.logoUrl) && input.logoApproved,
    } });
    return NextResponse.json(donor, { status: 201 });
  } catch (error) {
    console.error("Book donor create failed", error);
    return errorResponse("Failed to create donor");
  }
}
