import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSuperAdmin } from "@/lib/api-utils";
import { buildBoardMemberData } from "@/lib/team/mapping";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const body = await request.json();

  try {
    const member = await db.$transaction(async (tx) => {
      const sub = await tx.teamSubmission.findUnique({ where: { id } });
      if (!sub) throw new NotFound();
      if (sub.status !== "PENDING") throw new Conflict();
      const maxOrder =
        (
          await tx.boardMember.aggregate({
            where: { memberType: "TEAM" },
            _max: { order: true },
          })
        )._max.order ?? 0;
      const data = buildBoardMemberData(
        sub as any,
        { name: String(body.secondName ?? ""), title: String(body.secondTitle ?? "") },
        maxOrder
      );
      const created = await tx.boardMember.create({ data });
      await tx.teamSubmission.update({
        where: { id },
        data: { status: "APPROVED", approvedMemberId: created.id, reviewedAt: new Date() },
      });
      return created;
    });
    return NextResponse.json({ ok: true, memberId: member.id });
  } catch (e) {
    if (e instanceof Conflict) return NextResponse.json({ error: "Already processed" }, { status: 409 });
    if (e instanceof NotFound) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Approve failed" }, { status: 500 });
  }
}

class Conflict extends Error {}
class NotFound extends Error {}
