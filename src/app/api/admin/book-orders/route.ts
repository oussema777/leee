import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, getPaginationParams, withAdmin } from "@/lib/api-utils";

const statuses = ["NEW", "CONFIRMED", "PREPARING", "READY", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;
const purposes = ["SELF", "GIFT", "DONATION"] as const;

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { page, limit, search, skip } = getPaginationParams(request);
    const params = new URL(request.url).searchParams;
    const status = params.get("status") || "";
    const purpose = params.get("purpose") || "";
    if (status && !statuses.includes(status as (typeof statuses)[number])) return errorResponse("Invalid order status", 400);
    if (purpose && !purposes.includes(purpose as (typeof purposes)[number])) return errorResponse("Invalid order purpose", 400);
    const where = {
      ...(status ? { status: status as (typeof statuses)[number] } : {}),
      ...(purpose ? { purpose: purpose as (typeof purposes)[number] } : {}),
      ...(search ? { OR: [
        { reference: { contains: search, mode: "insensitive" as const } },
        { customerName: { contains: search, mode: "insensitive" as const } },
        { customerPhone: { contains: search, mode: "insensitive" as const } },
        { recipientName: { contains: search, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [data, total] = await Promise.all([
      db.bookOrder.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, customerName: true, customerPhone: true, package: true, purpose: true, requestedBookCount: true, priceCents: true, currency: true, paymentStatus: true, status: true, isRead: true, createdAt: true },
      }),
      db.bookOrder.count({ where }),
    ]);
    return NextResponse.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Book orders list failed", error);
    return errorResponse("Failed to load book orders");
  }
}

