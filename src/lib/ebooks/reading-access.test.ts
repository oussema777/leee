import { afterEach, describe, expect, it, vi } from "vitest";
const event = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { ebookOrderEvent: { findFirst: event } } }));
import { hasReadingAccess } from "./reading-access";
const access = { active: true, order: { id: "test-order", state: "AWAITING_PAYMENT", reference: "EB-TEST-123", snapshot: { testMode: true } } };
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
function local() {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3107");
  event.mockResolvedValue({ details: { expiresAt: new Date(Date.now() + 60000).toISOString() } });
}
describe("local reader preview grants", () => {
  it("requires an unexpired, explicit order grant", async () => {
    local(); expect(await hasReadingAccess(access)).toBe(true);
    expect(event).toHaveBeenCalledWith(expect.objectContaining({ where: { orderId: "test-order", action: "LOCAL_READER_PREVIEW" } }));
    event.mockResolvedValue(null); expect(await hasReadingAccess(access)).toBe(false);
    event.mockResolvedValue({ details: { expiresAt: new Date(Date.now() - 1).toISOString() } });
    expect(await hasReadingAccess(access)).toBe(false);
  });
  it("never grants unpaid access in production or on a hosted site", async () => {
    local(); vi.stubEnv("NODE_ENV", "production"); expect(await hasReadingAccess(access)).toBe(false);
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://theleeexperience.com");
    expect(await hasReadingAccess(access)).toBe(false); expect(event).not.toHaveBeenCalled();
  });
  it("rejects inactive, ordinary, refunded and cancelled orders", async () => {
    local(); expect(await hasReadingAccess(null)).toBe(false);
    expect(await hasReadingAccess({ ...access, active: false })).toBe(false);
    for (const patch of [{ reference: "EB-123" }, { snapshot: {} }, { state: "REFUNDED" }, { state: "CANCELLED" }])
      expect(await hasReadingAccess({ ...access, order: { ...access.order, ...patch } })).toBe(false);
    expect(event).not.toHaveBeenCalled();
  });
  it("preserves normal paid access without a preview grant", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await hasReadingAccess({ ...access, order: { ...access.order, state: "VERIFIED" } })).toBe(true);
    expect(event).not.toHaveBeenCalled();
  });
});
