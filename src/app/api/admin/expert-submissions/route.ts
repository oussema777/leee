import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";
import { ExpertSubmissionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, sort, order, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const validStatuses: ExpertSubmissionStatus[] = ["NEW", "SHORTLISTED", "CONTACTED", "ARCHIVED", "REJECTED"];
    const status =
      statusParam && validStatuses.includes(statusParam as ExpertSubmissionStatus)
        ? (statusParam as ExpertSubmissionStatus)
        : undefined;

    const where = {
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { professionalTitle: { contains: search, mode: "insensitive" as const } },
              { expertiseKeywords: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      db.expertSubmission.findMany({ where, orderBy: { [sort]: order }, skip, take: limit }),
      db.expertSubmission.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch submissions");
  }
}
