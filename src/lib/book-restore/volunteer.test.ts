import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { bookVolunteerSchema, volunteerReference } from "./volunteer";
import { POST } from "@/app/api/public/book-restore/volunteers/route";
import { GET as adminGet, PATCH as adminPatch } from "@/app/api/admin/book-volunteers/[id]/route";

const mocks = vi.hoisted(() => ({
  db: { bookVolunteerSubmission: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn() } },
  notify: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => true, clientIp: () => "test" }));
vi.mock("@/lib/email", () => ({ renderNotification: (title: string) => title, sendNotificationEmail: mocks.notify }));
vi.mock("@/lib/api-utils", () => ({
  withAdmin: async (request: NextRequest) => request.headers.get("x-admin") === "yes" ? { session: { userId: "admin-1" } } : { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) },
  errorResponse: (error: string, status = 500) => NextResponse.json({ error }, { status }),
}));

const application = {
  fullName: "Maya Haddad", phone: "+961 70 123 456", email: "Maya@example.test", governorate: "BEIRUT", area: "Hamra",
  interests: ["COLLECTION", "STREET_INTERVIEWS"], availability: "WEEKENDS", experience: "Helped at a book fair",
  notes: "Can travel locally", locale: "en", privacyConsent: true,
};
const publicRequest = (body: unknown) => new NextRequest("http://localhost/api/public/book-restore/volunteers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); mocks.db.bookVolunteerSubmission.create.mockResolvedValue({ reference: "BRV-260928-ABC123" }); mocks.notify.mockResolvedValue(undefined); });

describe("Book Restore volunteer intake", () => {
  it("requires at least one activity and privacy consent", () => {
    expect(bookVolunteerSchema.safeParse({ ...application, interests: [] }).success).toBe(false);
    expect(bookVolunteerSchema.safeParse({ ...application, privacyConsent: false }).success).toBe(false);
    expect(bookVolunteerSchema.safeParse({ ...application, interests: ["OTHER"] }).success).toBe(false);
    expect(volunteerReference(new Date("2026-09-28T12:00:00Z"))).toMatch(/^BRV-260928-[A-F0-9]{6}$/);
  });
  it("stores a structured application and notifies the team", async () => {
    const response = await POST(publicRequest(application));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ reference: "BRV-260928-ABC123" });
    expect(mocks.db.bookVolunteerSubmission.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      interests: ["COLLECTION", "STREET_INTERVIEWS"], email: "maya@example.test", consentTextVersion: "book-volunteer-v1-2026-09-28-en",
    }) }));
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ subject: expect.stringContaining("BRV-260928-ABC123") }));
  });
  it("preserves the saved application when email delivery fails", async () => {
    mocks.notify.mockRejectedValueOnce(Error("Email unavailable"));
    expect((await POST(publicRequest(application))).status).toBe(201);
  });
  it("rejects invalid fields and silently discards a filled honeypot", async () => {
    expect((await POST(publicRequest({ ...application, interests: [] }))).status).toBe(400);
    expect((await POST(publicRequest({ ...application, website: "spam.example" }))).status).toBe(200);
    expect(mocks.db.bookVolunteerSubmission.create).not.toHaveBeenCalled();
  });
});

describe("volunteer admin access", () => {
  const context = { params: Promise.resolve({ id: "volunteer-1" }) };
  const request = (method: string, body?: unknown, admin = true) => new NextRequest("http://localhost/api/admin/book-volunteers/volunteer-1", {
    method, headers: { ...(admin ? { "x-admin": "yes" } : {}), "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  it("requires admin access for reading and changing applications", async () => {
    expect((await adminGet(request("GET", undefined, false), context)).status).toBe(401);
    expect((await adminPatch(request("PATCH", { status: "CONTACTED", adminNotes: "Called", expectedUpdatedAt: new Date().toISOString() }, false), context)).status).toBe(401);
    expect(mocks.db.bookVolunteerSubmission.update).not.toHaveBeenCalled();
  });
  it("rejects stale edits and accepts a current follow-up", async () => {
    const body = { status: "CONTACTED", adminNotes: "Called today", expectedUpdatedAt: "2026-09-28T12:00:00.000Z" };
    mocks.db.bookVolunteerSubmission.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    mocks.db.bookVolunteerSubmission.findUniqueOrThrow.mockResolvedValue({ id: "volunteer-1", ...body });
    expect((await adminPatch(request("PATCH", body), context)).status).toBe(409);
    expect((await adminPatch(request("PATCH", body), context)).status).toBe(200);
  });
});
