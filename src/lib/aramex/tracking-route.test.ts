import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ ingest: vi.fn(), history: vi.fn(), user: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.user } } }));
vi.mock("./tracking", () => ({ ingestTrackingWebhook: mocks.ingest, shipmentTracking: mocks.history }));
vi.mock("@/lib/api-utils", () => ({ withAdmin: async (request: NextRequest) => request.headers.has("x-admin")
  ? { session: { userId: "admin" } } : { error: NextResponse.json({}, { status: 401 }) } }));
import { POST } from "@/app/api/webhooks/aramex/uat/route";
import { GET } from "@/app/api/admin/book-orders/[id]/shipping/tracking/route";
const key = "synthetic-webhook-secret-32-characters";
const request = (body = "{}", token = key) => new NextRequest("http://localhost/api/webhooks/aramex/uat", { method: "POST",
  headers: { "content-type": "application/json", "x-api-key": token }, body });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("ARAMEX_UAT_TRACKING_ENABLED", "true"); vi.stubEnv("ARAMEX_UAT_WEBHOOK_KEY", key); });
afterEach(() => vi.unstubAllEnvs());
describe("closed-by-default authenticated UAT tracking receiver", () => {
  it("does not process when disabled, missing a secure key, or unauthorized", async () => {
    vi.stubEnv("ARAMEX_UAT_TRACKING_ENABLED", "false"); expect((await POST(request())).status).toBe(503);
    vi.stubEnv("ARAMEX_UAT_TRACKING_ENABLED", "true"); vi.stubEnv("ARAMEX_UAT_WEBHOOK_KEY", "short"); expect((await POST(request())).status).toBe(503);
    vi.stubEnv("ARAMEX_UAT_WEBHOOK_KEY", key);
    expect((await POST(request("{}", ""))).status).toBe(401);
    expect((await POST(request("{}", "incorrect"))).status).toBe(401);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });
  it.each([[true, 200], [false, 202]] as const)("acknowledges only persisted events, linked=%s", async (linked, status) => {
    mocks.ingest.mockResolvedValue({ linked }); const response = await POST(request());
    expect(response.status).toBe(status); expect(await response.json()).toEqual({ accepted: true });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it.each([["{bad", 400], ["x".repeat(16385), 413]] as const)("rejects bad request bodies: %#", async (body, status) => {
    expect((await POST(request(body))).status).toBe(status); expect(mocks.ingest).not.toHaveBeenCalled();
  });
  it.each([[Error("database secret"), 503], [Error("INVALID_TRACKING_UPDATE"), 400], [Error("FUTURE_TRACKING_UPDATE"), 400]])("returns safe storage/validation errors: %#", async (error, status) => {
    mocks.ingest.mockRejectedValue(error); const response = await POST(request());
    expect(response.status).toBe(status); expect(JSON.stringify(await response.json())).not.toContain("database secret");
  });
  it("restricts tracking history to current admins", async () => {
    const context = { params: Promise.resolve({ id: "order-1" }) };
    expect((await GET(new NextRequest("http://localhost"), context)).status).toBe(401);
    mocks.user.mockResolvedValue({ role: "EDITOR" });
    expect((await GET(new NextRequest("http://localhost", { headers: { "x-admin": "1" } }), context)).status).toBe(403);
    expect(mocks.history).not.toHaveBeenCalled();
  });
});
