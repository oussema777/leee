import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSuperAdmin } from "@/lib/api-utils";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;

  try {
    await db.$transaction(async (tx) => {
      const sub = await tx.teamSubmission.findUnique({ where: { id } });
      if (!sub) throw new NotFound();
      if (sub.status !== "PENDING") throw new Conflict();
      await tx.teamSubmission.update({
        where: { id },
        data: { status: "REJECTED", reviewedAt: new Date() },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Conflict) return NextResponse.json({ error: "Already processed" }, { status: 409 });
    if (e instanceof NotFound) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Reject failed" }, { status: 500 });
  }
}

class Conflict extends Error {}
class NotFound extends Error {}
