import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const user = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: user } } }));
vi.mock("@/lib/api-utils", () => ({
  withAdmin: async (request: NextRequest) => request.headers.has("x-admin")
    ? { session: { userId: "admin", role: "ADMIN" } } : { error: NextResponse.json({}, { status: 401 }) },
}));
import { POST as routePost } from "@/app/api/admin/book-orders/[id]/shipping/submit/route";
const POST = (request: NextRequest) => routePost(request, { params: Promise.resolve({ id: "order-1" }) });

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); user.mockReset(); });
describe("closed shipment submission endpoint", () => {
  it("requires authentication and current admin privileges", async () => {
    expect((await POST(new NextRequest("http://localhost/submit", { method: "POST" }))).status).toBe(401);
    user.mockResolvedValue({ role: "EDITOR" });
    expect((await POST(new NextRequest("http://localhost/submit", { method: "POST", headers: { "x-admin": "1" } }))).status).toBe(403);
  });
  it("stays disabled with production credentials or legacy enable flags", async () => {
    vi.stubEnv("ARAMEX_USERNAME", "test");
    vi.stubEnv("ARAMEX_SUBMISSION_ENABLED", "true");
    const outgoing = vi.fn(() => { throw Error("Unexpected outbound request"); });
    vi.stubGlobal("fetch", outgoing);
    user.mockResolvedValue({ role: "ADMIN" });
    const response = await POST(new NextRequest("http://localhost/submit", {
      method: "POST", headers: { "x-admin": "1" }, body: JSON.stringify({ simulate: "created", enabled: true }),
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "SUBMISSION_DISABLED" });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(outgoing).not.toHaveBeenCalled();
  });
});
