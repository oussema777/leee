import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { errorResponse, getPaginationParams, paginatedResponse, withAdmin } from "@/lib/api-utils";
import { BOOK_VOLUNTEER_STATUSES } from "@/lib/book-restore/volunteer";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request); if ("error" in auth) return auth.error!;
  const { page, limit, search, skip } = getPaginationParams(request);
  const status = new URL(request.url).searchParams.get("status") || "";
  if (status && !BOOK_VOLUNTEER_STATUSES.includes(status as (typeof BOOK_VOLUNTEER_STATUSES)[number])) return errorResponse("Invalid status", 400);
  const where: Prisma.BookVolunteerSubmissionWhereInput = {
    ...(status ? { status: status as (typeof BOOK_VOLUNTEER_STATUSES)[number] } : {}),
    ...(search ? { OR: [
      { reference: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { area: { contains: search, mode: "insensitive" } },
    ] } : {}),
  };
  try {
    const [data, total] = await Promise.all([
      db.bookVolunteerSubmission.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, fullName: true, governorate: true, area: true, interests: true, availability: true, status: true, isRead: true, createdAt: true } }),
      db.bookVolunteerSubmission.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch { return errorResponse("Could not load volunteer applications"); }
}
