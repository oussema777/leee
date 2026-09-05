import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, getPaginationParams, paginatedResponse, withAdmin } from "@/lib/api-utils";
import { BOOK_DONATION_STATUSES } from "@/lib/book-restore/validation";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, skip } = getPaginationParams(request);
    const status = new URL(request.url).searchParams.get("status") || "";
    if (status && !BOOK_DONATION_STATUSES.includes(status as (typeof BOOK_DONATION_STATUSES)[number])) {
      return errorResponse("Invalid status", 400);
    }

    const where = {
      ...(status ? { status: status as (typeof BOOK_DONATION_STATUSES)[number] } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: "insensitive" as const } },
              { fullName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { area: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      db.bookDonationSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          fullName: true,
          governorate: true,
          estimatedQuantity: true,
          handoverMethod: true,
          status: true,
          isRead: true,
          createdAt: true,
        },
      }),
      db.bookDonationSubmission.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to load book donations");
  }
}
