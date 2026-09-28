import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { renderNotification, sendNotificationEmail } from "@/lib/email";
import { bookVolunteerSchema, volunteerConsentVersion, volunteerReference } from "@/lib/book-restore/volunteer";

export async function POST(request: NextRequest) {
  if (!rateLimit(`book-volunteer:${clientIp(request)}`, 5, 3600000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  if (Number(request.headers.get("content-length") || 0) > 16000) return NextResponse.json({ error: "validation" }, { status: 413 });
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "website" in body && String(body.website).trim()) return NextResponse.json({ ok: true, reference: null });
    const parsed = bookVolunteerSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
      }
      return NextResponse.json({ error: "validation", fields }, { status: 400 });
    }
    const data = parsed.data;
    let submission: { reference: string } | null = null;
    for (let attempt = 0; attempt < 3 && !submission; attempt++) {
      try {
        submission = await db.bookVolunteerSubmission.create({
          data: {
            reference: volunteerReference(), fullName: data.fullName, phone: data.phone,
            email: data.email?.toLowerCase() || null, governorate: data.governorate,
            area: data.area, interests: data.interests, otherInterest: data.otherInterest || null,
            availability: data.availability, experience: data.experience || null, notes: data.notes || null,
            locale: data.locale, privacyConsent: true, consentTextVersion: volunteerConsentVersion(data.locale),
          }, select: { reference: true },
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") || attempt === 2) throw error;
      }
    }
    if (!submission) throw Error("Could not create volunteer reference");
    try {
      await sendNotificationEmail({
        subject: `[LEEE] Book Restore volunteer: ${submission.reference}`,
        replyTo: data.email || undefined,
        html: renderNotification("New Book Restore volunteer", "A volunteer offered to help with Book Restore. Review the application in the admin inbox.", [
          { label: "Reference", value: submission.reference }, { label: "Name", value: data.fullName },
          { label: "Phone", value: data.phone }, { label: "Email", value: data.email },
          { label: "Location", value: `${data.area}, ${data.governorate}` },
          { label: "Activities", value: data.interests.join(", ") + (data.otherInterest ? ` — ${data.otherInterest}` : "") },
          { label: "Availability", value: data.availability }, { label: "Experience", value: data.experience },
          { label: "Notes", value: data.notes },
        ]),
      });
    } catch { console.error("Book volunteer notification unavailable"); }
    return NextResponse.json({ ok: true, reference: submission.reference }, { status: 201 });
  } catch (error) {
    console.error("Book volunteer submission failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
