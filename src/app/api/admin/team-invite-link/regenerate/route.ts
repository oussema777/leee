import { NextRequest, NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/api-utils";
import { regenerateInviteLink, buildInviteUrl } from "@/lib/team/inviteLink";

export async function POST(request: NextRequest) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;
  const link = await regenerateInviteLink();
  return NextResponse.json({ token: link.token, url: buildInviteUrl("en", link.token) });
}
