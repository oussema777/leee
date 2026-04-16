import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const applySchema = z.object({
  careerSlug:  z.string().min(1).max(200),
  fullName:    z.string().min(2).max(120),
  email:       z.string().email().max(200),
  phone:       z.string().max(40).optional().or(z.literal("")),
  resumeUrl:   z.string().url().max(500).optional().or(z.literal("")),
  coverLetter: z.string().min(20).max(5000),
  website:     z.string().max(0).optional(), // honeypot
});

type ApplyErrorEnvelope = {
  ok: false;
  error: "validation" | "not_found" | "closed" | "server";
  fields?: Record<string, string>;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = applySchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") fields[key] = issue.message;
      }
      return NextResponse.json<ApplyErrorEnvelope>(
        { ok: false, error: "validation", fields },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Honeypot: silently pretend success, write nothing
    if (data.website && data.website.length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const career = await db.career.findUnique({ where: { slug: data.careerSlug } });
    if (!career) {
      return NextResponse.json<ApplyErrorEnvelope>(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isClosed = !career.isActive || (career.deadline !== null && career.deadline < now);
    if (isClosed) {
      return NextResponse.json<ApplyErrorEnvelope>(
        { ok: false, error: "closed" },
        { status: 410 }
      );
    }

    await db.careerApplication.create({
      data: {
        careerId: career.id,
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        resumeUrl: data.resumeUrl?.trim() || null,
        coverLetter: data.coverLetter.trim(),
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Career application error:", err);
    return NextResponse.json<ApplyErrorEnvelope>(
      { ok: false, error: "server" },
      { status: 500 }
    );
  }
}
