import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";

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
      // Approve & Publish: create the testimonial and mark the source
      // submission APPROVED atomically.
      const testimonial = await db.$transaction(async (tx) => {
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
  } catch {
    return errorResponse("Failed to create testimonial");
  }
}
