import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotificationEmail, renderNotification } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  bookDonationSchema,
  consentTextVersion,
  generateDonationReference,
} from "@/lib/book-restore/validation";

type ErrorEnvelope = {
  ok: false;
  error: "validation" | "rate_limited" | "server";
  fields?: Record<string, string>;
};

const clean = (value?: string) => (value?.trim() ? value.trim() : null);

export async function POST(request: NextRequest) {
  if (!rateLimit(`pub-book-donation:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);

    if (body && typeof body === "object" && "website" in body && String(body.website).trim()) {
      return NextResponse.json({ ok: true, reference: null }, { status: 200 });
    }

    const parsed = bookDonationSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fields[field]) fields[field] = issue.message;
      }
      return NextResponse.json<ErrorEnvelope>({ ok: false, error: "validation", fields }, { status: 400 });
    }

    const data = parsed.data;
    let submission: { reference: string } | null = null;

    for (let attempt = 0; attempt < 3 && !submission; attempt += 1) {
      try {
        submission = await db.bookDonationSubmission.create({
          data: {
            reference: generateDonationReference(),
            fullName: data.fullName,
            phone: data.phone,
            email: clean(data.email)?.toLowerCase() ?? null,
            governorate: data.governorate,
            area: data.area,
            detailedAddress: clean(data.detailedAddress),
            estimatedQuantity: data.estimatedQuantity,
            bookCategories: data.bookCategories,
            otherCategory: clean(data.otherCategory),
            bookLanguages: data.bookLanguages,
            overallCondition: data.overallCondition,
            handoverMethod: data.handoverMethod,
            photoUrls: [],
            notes: clean(data.notes),
            locale: data.locale,
            donationConsent: data.donationConsent,
            privacyConsent: data.privacyConsent,
            acceptanceAcknowledged: data.acceptanceAcknowledged,
            consentTextVersion: consentTextVersion(data.locale),
          },
          select: { reference: true },
        });
      } catch (error) {
        const referenceCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";
        if (!referenceCollision || attempt === 2) throw error;
      }
    }

    if (!submission) throw new Error("Unable to create a unique donation reference");

    await sendNotificationEmail({
      subject: `[LEEE] New book donation: ${submission.reference}`,
      replyTo: data.email || undefined,
      html: renderNotification(
        "New book donation registered",
        `A donor submitted a book donation in ${data.locale === "ar" ? "Arabic" : "English"}.`,
        [
          { label: "Reference", value: submission.reference },
          { label: "Name", value: data.fullName },
          { label: "Phone / WhatsApp", value: data.phone },
          { label: "Email", value: data.email },
          { label: "Location", value: `${data.area}, ${data.governorate}` },
          { label: "Quantity", value: data.estimatedQuantity },
          { label: "Categories", value: data.bookCategories.join(", ") },
          { label: "Handover", value: data.handoverMethod },
        ],
      ),
    });

    return NextResponse.json({ ok: true, reference: submission.reference }, { status: 201 });
  } catch (error) {
    console.error("Book donation submission failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "server" }, { status: 500 });
  }
}
