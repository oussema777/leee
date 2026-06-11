import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotificationEmail, renderNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: true, alreadySubscribed: true },
        { status: 200 }
      );
    }

    await db.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        locale: locale || "en",
      },
    });

    await sendNotificationEmail({
      subject: `[LEEE] New newsletter subscriber`,
      replyTo: normalizedEmail,
      html: renderNotification(
        "New newsletter subscriber",
        "Someone subscribed to the newsletter via the website.",
        [
          { label: "Email", value: normalizedEmail },
          { label: "Locale", value: locale || "en" },
        ]
      ),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
