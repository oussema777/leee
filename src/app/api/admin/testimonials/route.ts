import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";

type ApproveErrorReason = "not_found" | "no_consent" | "already_approved";
const APPROVE_ERROR_MESSAGES: Record<ApproveErrorReason, string> = {
  not_found: "Submission not found",
  no_consent: "This submission has no publish consent and cannot be published",
  already_approved: "This submission has already been approved",
};
class ApproveError extends Error {
  constructor(public reason: ApproveErrorReason) {
    super(reason);
  }
}

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, sort, order, skip } = getPaginationParams(request);
    const where = search
      ? { OR: [{ nameEn: { contains: search, mode: "insensitive" as const } }, { quoteEn: { contains: search, mode: "insensitive" as const } }] }
      : {};

    const [data, total] = await Promise.all([
      db.testimonial.findMany({ where, orderBy: { [sort === "createdAt" ? "order" : sort]: order }, skip, take: limit }),
      db.testimonial.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch testimonials");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { submissionId, ...data } = body;

    if (submissionId) {
      // Approve & Publish: validate the source submission and create the
      // testimonial + mark it APPROVED atomically. Eligibility is enforced
      // HERE (the authoritative write path), not just in the editor page —
      // consent is a privacy/legal gate and must not be bypassable via a
      // crafted request.
      const testimonial = await db.$transaction(async (tx) => {
        const sub = await tx.testimonialSubmission.findUnique({ where: { id: submissionId } });
        if (!sub) throw new ApproveError("not_found");
        if (!sub.consent) throw new ApproveError("no_consent");
        if (sub.status === "APPROVED") throw new ApproveError("already_approved");

        const created = await tx.testimonial.create({ data });
        await tx.testimonialSubmission.update({
          where: { id: submissionId },
          data: { status: "APPROVED", reviewedAt: new Date(), publishedTestimonialId: created.id },
        });
        return created;
      });
      return NextResponse.json(testimonial, { status: 201 });
    }

    const testimonial = await db.testimonial.create({ data });
    return NextResponse.json(testimonial, { status: 201 });
  } catch (err) {
    if (err instanceof ApproveError) {
      return errorResponse(APPROVE_ERROR_MESSAGES[err.reason], 409);
    }
    console.error("Create testimonial error:", err);
    return errorResponse("Failed to create testimonial");
  }
}
