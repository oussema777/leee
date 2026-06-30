import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateExpertSubmission } from "@/lib/experts/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendNotificationEmail, renderNotification } from "@/lib/email";

type ErrorEnvelope = { ok: false; error: "validation" | "rate_limited" | "server"; fields?: Record<string, string> };

export async function POST(request: NextRequest) {
  if (!rateLimit(`expert-apply:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
      return NextResponse.json({ ok: true }, { status: 200 }); // honeypot
    }
    const result = validateExpertSubmission(body ?? {});
    if (!result.ok) {
      const fields = result.field ? { [result.field]: result.error } : {};
      return NextResponse.json<ErrorEnvelope>({ ok: false, error: "validation", fields }, { status: 400 });
    }
    const v = result.value;
    await db.expertSubmission.create({ data: { ...v, status: "NEW" } });

    await sendNotificationEmail({
      subject: `[LEEE] New expert application: ${v.fullName}`,
      replyTo: v.email,
      html: renderNotification(
        "New expert application",
        "A professional applied to join the expert network via the website.",
        [
          { label: "Name", value: v.fullName },
          { label: "Title", value: v.professionalTitle },
          { label: "Email", value: v.email },
          { label: "Phone", value: v.phone },
          { label: "Country", value: v.countries.join(", ") },
          { label: "Expertise", value: v.expertiseKeywords },
          { label: "Experience", value: v.yearsExperience },
          { label: "Daily rate", value: v.dailyRate },
          { label: "Available", value: v.availableForEngagements },
        ]
      ),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Expert submission error:", err);
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "server" }, { status: 500 });
  }
}
