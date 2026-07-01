import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { ExpertSubmissionStatus } from "@prisma/client";

const VALID_STATUSES: ExpertSubmissionStatus[] = [
  "NEW",
  "SHORTLISTED",
  "CONTACTED",
  "ARCHIVED",
  "REJECTED",
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const item = await db.expertSubmission.findUnique({ where: { id } });
    if (!item) return errorResponse("Not found", 404);
    if (!item.isRead) {
      await db.expertSubmission.update({ where: { id }, data: { isRead: true } });
      return NextResponse.json({ ...item, isRead: true });
    }
    return NextResponse.json(item);
  } catch {
    return errorResponse("Failed to fetch submission");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid body", 400);
    }

    if ("status" in body && !VALID_STATUSES.includes(body.status)) {
      return errorResponse("Invalid status", 400);
    }

    const data: {
      status?: ExpertSubmissionStatus;
      adminNotes?: string;
      reviewedAt?: Date;
    } = {};

    if ("status" in body) data.status = body.status as ExpertSubmissionStatus;
    if ("adminNotes" in body) data.adminNotes = String(body.adminNotes ?? "").slice(0, 5000);

    if (Object.keys(data).length === 0) return errorResponse("Nothing to update", 400);

    // Set reviewedAt only when moving from NEW to a non-NEW status for the first time
    if (data.status && data.status !== "NEW") {
      const current = await db.expertSubmission.findUnique({
        where: { id },
        select: { status: true, reviewedAt: true },
      });
      if (current && current.status === "NEW" && current.reviewedAt === null) {
        data.reviewedAt = new Date();
      }
    }

    const item = await db.expertSubmission.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch {
    return errorResponse("Failed to update submission");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await db.expertSubmission.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("Failed to delete submission");
  }
}
