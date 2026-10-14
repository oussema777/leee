import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { drainEbookEmails } from "@/lib/ebooks/mail";
import { endpoint, json } from "@/lib/ebooks/server";
export async function GET(request: NextRequest) {
  return endpoint(request, async () => {
    if (
      !process.env.CRON_SECRET ||
      request.headers.get("authorization") !==
        "Bearer " + process.env.CRON_SECRET
    )
      return json({ error: "Unauthorized" }, 401);
    const sent = await drainEbookEmails();
    await db.ebookSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    await db.ebookLoginCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    await db.ebookRateLimit.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return json({ sent });
  });
}
