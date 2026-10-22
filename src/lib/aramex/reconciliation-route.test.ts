import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ user: vi.fn(), shipment: vi.fn(), reconcile: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.user }, bookShipment: { findUnique: mocks.shipment } } }));
vi.mock("@/lib/api-utils", () => ({ withAdmin: async (request: NextRequest) => request.headers.has("x-test-admin")
  ? { session: { userId: "verified-admin" } } : { error: NextResponse.json({}, { status: 401 }) } }));
vi.mock("./reconciliation", async original => ({ ...await original<typeof import("./reconciliation")>(), reconcileShipment: mocks.reconcile }));
import { GET, POST } from "@/app/api/admin/book-orders/[id]/shipping/reconciliation/route";
import { ReconciliationError } from "./reconciliation";
const context = { params: Promise.resolve({ id: "order-1" }) };
const request = (body = "{}", admin = true) => new NextRequest("http://localhost/recovery", { method: "POST",
  headers: { "content-type": "application/json", ...(admin ? { "x-test-admin": "1" } : {}) }, body });
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ role: "ADMIN" }); });
describe("authenticated recovery API", () => {
  it("requires sign-in and a current admin role for reading and changing evidence", async () => {
    for (const handler of [GET, POST]) {
      expect((await handler(request("{}", false), context)).status).toBe(401);
      mocks.user.mockResolvedValue({ role: "EDITOR" });
      expect((await handler(request(), context)).status).toBe(403);
    }
    expect(mocks.shipment).not.toHaveBeenCalled(); expect(mocks.reconcile).not.toHaveBeenCalled();
  });
  it("uses the authenticated actor and prevents caching", async () => {
    mocks.reconcile.mockResolvedValue({ status: "CREATED" });
    const response = await POST(request(), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.reconcile).toHaveBeenCalledWith(expect.anything(), "order-1", {}, "verified-admin");
  });
  it.each([["{broken", 400], ["x".repeat(16385), 413]] as const)("rejects malformed/oversized data: %#", async (body, code) => {
    expect((await POST(request(body), context)).status).toBe(code);
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });
  it.each([
    [new ReconciliationError("STALE_REVIEW"), 409], [new ReconciliationError("INVALID_RECONCILIATION"), 400],
    [{ code: "P2002" }, 409], [{ code: "P2021" }, 503], [Error("private secret"), 500],
  ])("returns safe recovery errors: %#", async (error, status) => {
    mocks.reconcile.mockRejectedValue(error);
    const response = await POST(request(), context);
    expect(response.status).toBe(status); expect(JSON.stringify(await response.json())).not.toContain("private secret");
  });
});
