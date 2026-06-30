import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withSuperAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";
import { TeamSubmissionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, sort, order, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const validStatuses: TeamSubmissionStatus[] = ["PENDING", "APPROVED", "REJECTED"];
    const status =
      statusParam && validStatuses.includes(statusParam as TeamSubmissionStatus)
        ? (statusParam as TeamSubmissionStatus)
        : undefined;

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { title: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      db.teamSubmission.findMany({ where, orderBy: { [sort]: order }, skip, take: limit }),
      db.teamSubmission.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch submissions");
  }
}
