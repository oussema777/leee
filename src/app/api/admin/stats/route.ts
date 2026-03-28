import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const [
      programs,
      events,
      blogPosts,
      galleryImages,
      videos,
      testimonials,
      contactSubmissions,
      joinUsSubmissions,
      serviceRequests,
      unreadContacts,
      unreadJoinUs,
      unreadServices,
    ] = await Promise.all([
      db.program.count(),
      db.event.count(),
      db.blogPost.count(),
      db.galleryImage.count(),
      db.video.count(),
      db.testimonial.count(),
      db.contactSubmission.count(),
      db.joinUsSubmission.count(),
      db.serviceRequest.count(),
      db.contactSubmission.count({ where: { isRead: false } }),
      db.joinUsSubmission.count({ where: { isRead: false } }),
      db.serviceRequest.count({ where: { isRead: false } }),
    ]);

    const recentContacts = await db.contactSubmission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        isRead: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      stats: {
        programs,
        events,
        blogPosts,
        galleryImages,
        videos,
        testimonials,
        contactSubmissions,
        joinUsSubmissions,
        serviceRequests,
      },
      unread: {
        contacts: unreadContacts,
        joinUs: unreadJoinUs,
        services: unreadServices,
        total: unreadContacts + unreadJoinUs + unreadServices,
      },
      recentContacts,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
