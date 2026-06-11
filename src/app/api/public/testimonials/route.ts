import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendNotificationEmail, renderNotification } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));

const submitSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: optionalText(40),
  businessName: optionalText(200),
  governorate: optionalText(50),
  program: optionalText(60),
  quote: z.string().min(10).max(1000),
  consent: z.boolean(),
  locale: z.enum(["en", "ar"]),
  photoUrl: z.string().url().max(500).optional().or(z.literal("")),
  motivation: optionalText(5000),
  challenges: optionalText(5000),
  skillsGained: optionalText(5000),
  valuableLesson: optionalText(5000),
  lifeImpact: optionalText(5000),
  results: optionalText(5000),
  successStory: optionalText(5000),
  adviceToOthers: optionalText(5000),
  additionalComments: optionalText(5000),
  website: z.string().max(0).optional(), // honeypot
});

type ErrorEnvelope = {
  ok: false;
  error: "validation" | "rate_limited" | "server";
  fields?: Record<string, string>;
};

export async function POST(request: NextRequest) {
  if (!rateLimit(`pub-testimonial:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") fields[key] = issue.message;
      }
      return NextResponse.json<ErrorEnvelope>({ ok: false, error: "validation", fields }, { status: 400 });
    }

    const data = parsed.data;

    // Honeypot: silently pretend success, write nothing
    if (data.website && data.website.length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const clean = (s?: string) => (s && s.trim() ? s.trim() : null);

    const submission = await db.testimonialSubmission.create({
      data: {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: clean(data.phone),
        businessName: clean(data.businessName),
        governorate: clean(data.governorate),
        program: clean(data.program),
        quote: data.quote.trim(),
        locale: data.locale,
        consent: data.consent,
        consentTextVersion: `v1-${data.locale}`,
        photoUrl: clean(data.photoUrl),
        motivation: clean(data.motivation),
        challenges: clean(data.challenges),
        skillsGained: clean(data.skillsGained),
        valuableLesson: clean(data.valuableLesson),
        lifeImpact: clean(data.lifeImpact),
        results: clean(data.results),
        successStory: clean(data.successStory),
        adviceToOthers: clean(data.adviceToOthers),
        additionalComments: clean(data.additionalComments),
      },
    });

    await sendNotificationEmail({
      subject: `[LEEE] New testimonial submission: ${data.fullName}`,
      replyTo: data.email,
      html: renderNotification(
        "New testimonial submitted",
        `A beneficiary shared their story via the website (in ${data.locale === "ar" ? "Arabic" : "English"}).`,
        [
          { label: "Name", value: data.fullName },
          { label: "Email", value: data.email },
          { label: "Phone", value: data.phone },
          { label: "Business / Project", value: data.businessName },
          { label: "Governorate", value: data.governorate },
          { label: "Program", value: data.program },
          { label: "Quote", value: data.quote },
          { label: "Publish consent", value: data.consent ? "Yes" : "No" },
          { label: "Photo", value: data.photoUrl },
        ]
      ),
    });

    return NextResponse.json({ ok: true, id: submission.id }, { status: 201 });
  } catch (err) {
    console.error("Testimonial submission error:", err);
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "server" }, { status: 500 });
  }
}
