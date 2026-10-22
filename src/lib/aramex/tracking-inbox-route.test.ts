import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ user: vi.fn(), inbox: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.user } } }));
vi.mock("@/lib/api-utils", () => ({ withAdmin: async (request: NextRequest) => request.headers.has("x-admin")
  ? { session: { userId: "admin" } } : { error: NextResponse.json({}, { status: 401 }) } }));
vi.mock("./tracking-inbox", async original => ({ ...await original<typeof import("./tracking-inbox")>(), trackingInbox: mocks.inbox }));
import { GET } from "@/app/api/admin/aramex/tracking-inbox/route";
const request = (query = "", admin = true) => new NextRequest(`http://localhost/api/admin/aramex/tracking-inbox${query}`, { headers: admin ? { "x-admin": "1" } : {} });
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ role: "ADMIN" }); mocks.inbox.mockResolvedValue({ events: [], total: 0 }); });
describe("tracking inbox access", () => {
  it("requires authentication and current admin role", async () => {
    expect((await GET(request("", false))).status).toBe(401);
    mocks.user.mockResolvedValue({ role: "EDITOR" });
    expect((await GET(request())).status).toBe(403);
    expect(mocks.inbox).not.toHaveBeenCalled();
  });
  it.each(["?page=0", "?page=1.5", "?page=10001", "?trackingNumber=a", "?trackingNumber=%25"]) ("rejects invalid filters %s", async query => {
    expect((await GET(request(query))).status).toBe(400); expect(mocks.inbox).not.toHaveBeenCalled();
  });
  it("passes bounded filters and prevents caching", async () => {
    const response = await GET(request("?page=2&trackingNumber=123456789"));
    expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.inbox).toHaveBeenCalledWith(expect.anything(), { page: 2, trackingNumber: "123456789" });
  });
  it("distinguishes storage failure from an empty inbox without leaking details", async () => {
    mocks.inbox.mockRejectedValue(Error("database password private"));
    const response = await GET(request());
    expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain("password");
  });
});
