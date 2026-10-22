import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ user: vi.fn(), config: vi.fn(), sync: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.user } } }));
vi.mock("@/lib/api-utils", () => ({ withAdmin: async (request: NextRequest) => request.headers.has("x-admin")
  ? { session: { userId: "admin" } } : { error: NextResponse.json({}, { status: 401 }) } }));
vi.mock("./tracking-lookup", () => ({ configuredTrackingLookup: mocks.config }));
vi.mock("./tracking-sync", () => ({ syncTracking: mocks.sync }));
import { POST } from "@/app/api/admin/book-orders/[id]/shipping/tracking/sync/route";
const context = { params: Promise.resolve({ id: "order-1" }) };
const request = (admin = true, body = "{}") => new NextRequest("http://localhost/sync", { method: "POST", headers: {
  "content-type": "application/json", ...(admin ? { "x-admin": "1" } : {}),
}, body });
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ role: "ADMIN" }); mocks.config.mockReturnValue({ history: vi.fn() }); });
describe("admin-only manual tracking lookup", () => {
  it("requires sign-in and a current admin role before configuring a lookup", async () => {
    expect((await POST(request(false), context)).status).toBe(401);
    mocks.user.mockResolvedValue({ role: "EDITOR" });
    expect((await POST(request(), context)).status).toBe(403);
    expect(mocks.config).not.toHaveBeenCalled(); expect(mocks.sync).not.toHaveBeenCalled();
  });
  it("fails closed when disabled or unconfigured", async () => {
    mocks.config.mockImplementation(() => { throw Error("private config"); });
    const result = await POST(request(), context);
    expect(result.status).toBe(503); expect(mocks.sync).not.toHaveBeenCalled();
    expect(JSON.stringify(await result.json())).not.toContain("private config");
  });
  it("uses only the server order id, never caller-supplied AWBs or credentials", async () => {
    mocks.sync.mockResolvedValue({ received: 2, added: 1, checkedAt: "2026-10-22T10:00:00Z" });
    const result = await POST(request(true, JSON.stringify({ trackingNumber: "other-order", credentials: "forged" })), context);
    expect(result.status).toBe(200); expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.sync).toHaveBeenCalledWith(expect.anything(), "order-1", expect.anything(), expect.any(AbortSignal));
    expect(JSON.stringify(mocks.sync.mock.calls[0])).not.toContain("other-order");
  });
  it.each([["TRACKING_SHIPMENT_CHANGED", 409], ["TRACKING_NOT_ELIGIBLE", 409], ["secret error", 503]])("handles %s safely", async (message, status) => {
    mocks.sync.mockRejectedValue(Error(String(message)));
    const response = await POST(request(), context);
    expect(response.status).toBe(status); expect(JSON.stringify(await response.json())).not.toContain("secret error");
  });
});
