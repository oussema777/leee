import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotificationEmail, renderNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, nationality, organization, role, sector, experience, interestArea, motivation, cvUrl } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
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

    const submission = await db.joinUsSubmission.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        nationality: nationality?.trim() || null,
        organization: organization?.trim() || null,
        role: role?.trim() || null,
        sector: sector?.trim() || null,
        experience: experience?.trim() || null,
        interestArea: interestArea || null,
        motivation: motivation?.trim() || null,
        cvUrl: cvUrl || null,
      },
    });

    await sendNotificationEmail({
      subject: `[LEEE] New application: ${firstName} ${lastName}${role ? ` (${role})` : ""}`,
      replyTo: email,
      html: renderNotification(
        "New application received",
        `A new application was submitted via the website${role ? ` for the "${role}" path.` : "."}`,
        [
          { label: "Name", value: `${firstName} ${lastName}` },
          { label: "Email", value: email },
          { label: "Phone", value: phone },
          { label: "Nationality", value: nationality },
          { label: "Organization", value: organization },
          { label: "Role", value: role },
          { label: "Sector", value: sector },
          { label: "Experience", value: experience },
          { label: "Interest area", value: interestArea ? String(interestArea) : null },
          { label: "Motivation", value: motivation },
          { label: "CV", value: cvUrl },
        ]
      ),
    });

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
  } catch (error) {
    console.error("Join Us submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
