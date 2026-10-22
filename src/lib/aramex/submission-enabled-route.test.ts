import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ user: vi.fn(), config: vi.fn(), submit: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.user } } }));
vi.mock("@/lib/api-utils", () => ({ withAdmin: async (r: NextRequest) => r.headers.has("x-admin")
  ? { session: { userId: "admin" } } : { error: NextResponse.json({}, { status: 401 }) } }));
vi.mock("./submission-config", async original => ({ ...await original<typeof import("./submission-config")>(), configuredSubmissionTransport: mocks.config }));
vi.mock("./submission", async original => ({ ...await original<typeof import("./submission")>(), submitSavedShipment: mocks.submit }));
import { POST, GET } from "@/app/api/admin/book-orders/[id]/shipping/submit/route";
import { SubmissionError } from "./submission";
import { ShipmentMappingError } from "./shipment-request";
const input = () => ({ expectedDraftVersion: 3, confirmedUat: true, shippingAt: new Date(Date.now() + 3600000).toISOString(), dueAt: new Date(Date.now() + 86400000).toISOString() });
const request = (body: unknown = input(), admin = true) => new NextRequest("http://localhost/submit", { method: "POST",
  headers: { "content-type": "application/json", ...(admin ? { "x-admin": "1" } : {}) }, body: JSON.stringify(body) });
const context = { params: Promise.resolve({ id: "saved-order" }) };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("ARAMEX_UAT_SUBMISSION_ENABLED", "true"); mocks.user.mockResolvedValue({ role: "ADMIN" }); mocks.config.mockReturnValue({ environment: "UAT" }); });
afterEach(() => vi.unstubAllEnvs());
describe("gated UAT submission route", () => {
  it("reports configuration availability only to current admins without sending", async () => {
    expect((await GET(request(input(), false))).status).toBe(401);
    expect(await (await GET(request())).json()).toEqual({ available: true });
    mocks.config.mockImplementation(() => { throw Error("private config"); });
    expect(await (await GET(request())).json()).toEqual({ available: false });
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("checks current role before configuration or booking", async () => {
    expect((await POST(request(input(), false), context)).status).toBe(401);
    mocks.user.mockResolvedValue({ role: "EDITOR" });
    expect((await POST(request(), context)).status).toBe(403);
    expect(mocks.config).not.toHaveBeenCalled(); expect(mocks.submit).not.toHaveBeenCalled();
  });
  it.each([{ confirmedUat: false }, { expectedDraftVersion: 0 }, { credentials: "injected" }, { trackingNumber: "fake" }, { shippingAt: "2020-01-01T00:00:00Z" }, { dueAt: "2020-01-01T00:00:00Z" }])("rejects unsafe or stale input %j", async override => {
    expect((await POST(request({ ...input(), ...override }), context)).status).toBe(400);
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("rejects oversized input", async () => {
    expect((await POST(request({ padding: "x".repeat(5000) }), context)).status).toBe(413);
    expect(mocks.config).not.toHaveBeenCalled();
  });
  it("fails closed before claiming an attempt when config is invalid", async () => {
    mocks.config.mockImplementation(() => { throw Error("secret details"); });
    const response = await POST(request(), context);
    expect(response.status).toBe(503); expect(mocks.submit).not.toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
  it.each(["CREATED", "UNKNOWN", "REJECTED"])("returns only safe saved result fields for %s", async status => {
    mocks.submit.mockResolvedValue({ status, environment: "UAT", trackingNumber: "123456789", labelUrl: "https://evil.test/a", input: "private", preparation: "private" });
    const response = await POST(request(), context); const body = await response.json();
    expect(response.status).toBe(200); expect(body).toEqual({ status, environment: "UAT", trackingNumber: "123456789", labelUrl: null, requiresReview: status !== "CREATED" });
    expect(mocks.submit).toHaveBeenCalledWith(expect.anything(), { orderId: "saved-order", actor: "admin", expectedDraftVersion: 3 }, { environment: "UAT" });
  });
  it.each(["STALE_DRAFT", "STALE_ORDER", "CONFIRMATION_REQUIRED", "RESULT_NOT_SAVED_CONFIRMATION_REQUIRED"])("preserves review requirement for %s", async code => {
    mocks.submit.mockRejectedValue(new SubmissionError(code));
    expect((await POST(request(), context)).status).toBe(409);
  });
  it("returns draft validation without exposing raw errors", async () => {
    mocks.submit.mockRejectedValue(new ShipmentMappingError("RECIPIENT_EMAIL_REQUIRED"));
    expect((await POST(request(), context)).status).toBe(422);
    mocks.submit.mockRejectedValue(Error("database password"));
    const response = await POST(request(), context);
    expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain("password");
  });
});
