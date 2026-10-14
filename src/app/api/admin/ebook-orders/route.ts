import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { endpoint, json, requireEbookAdmin } from "@/lib/ebooks/server";
export async function GET(request: NextRequest) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const search =
      request.nextUrl.searchParams.get("search")?.slice(0, 200) || "";
    const page = Math.max(
      1,
      Number(request.nextUrl.searchParams.get("page")) || 1,
    );
    const accessOnly = request.nextUrl.searchParams.get("access") === "1";
    const where = {
      ...(accessOnly ? { access: { isNot: null } } : {}),
      OR: [
        { reference: { contains: search, mode: "insensitive" as const } },
        {
          reader: { email: { contains: search, mode: "insensitive" as const } },
        },
        { customerName: { contains: search, mode: "insensitive" as const } },
      ],
    };
    const [orders, total] = await Promise.all([
      db.ebookOrder.findMany({
        where,
        take: 30,
        skip: (page - 1) * 30,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          title: true,
          customerName: true,
          priceCents: true,
          method: true,
          state: true,
          createdAt: true,
          reader: { select: { email: true } },
          access: { select: { active: true } },
        },
      }),
      db.ebookOrder.count({ where }),
    ]);
    return json({ orders, total });
  });
}
