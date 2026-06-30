import { NextRequest, NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/api-utils";
import { getOrCreateInviteLink, buildInviteUrl } from "@/lib/team/inviteLink";

export async function GET(request: NextRequest) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;
  const link = await getOrCreateInviteLink();
  return NextResponse.json({ token: link.token, url: buildInviteUrl("en", link.token) });
}
