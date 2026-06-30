import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidInviteToken } from "@/lib/team/inviteLink";
import { validateSubmission } from "@/lib/team/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!rateLimit(`pub-team:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    if (!(await isValidInviteToken(token))) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }
    const result = validateSubmission(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await db.teamSubmission.create({ data: { ...result.value, status: "PENDING" } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
