import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/book-orders/whish-server", () => ({
  withPaymentAdmin: vi.fn(),
  PRIVATE_HEADERS: {},
}));
import { endpoint, sameOrigin } from "./server";

afterEach(() => vi.unstubAllEnvs());

function request(origin?: string, method = "POST", url = "https://www.theleeexperience.com/api/ebooks/auth") {
  return new NextRequest(url, { method, headers: origin ? { origin } : {} });
}

describe("ebook mutation origin checks", () => {
  it.each(["https://theleeexperience.com", "https://www.theleeexperience.com"])(
    "accepts both public domain forms when configured as %s",
    (configured) => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", configured);
      for (const origin of ["https://theleeexperience.com", "https://www.theleeexperience.com"]) {
        for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
          expect(() => sameOrigin(request(origin, method))).not.toThrow();
        }
      }
    },
  );

  it.each([
    undefined, "null", "https://evil.invalid", "https://reader.theleeexperience.com",
    "https://theleeexperience.com.evil.invalid", "http://www.theleeexperience.com",
    "https://www.theleeexperience.com:444", "https://www.theleeexperience.com/",
  ])("blocks untrusted or malformed origin %s before executing the handler", async (origin) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://theleeexperience.com");
    const work = vi.fn(async () => new Response("unexpected"));
    const response = await endpoint(request(origin), work);
    expect(response.status).toBe(403);
    expect(work).not.toHaveBeenCalled();
  });

  it.each(["http://localhost:3107", "http://127.0.0.1:3107", "http://[::1]:3107"])(
    "keeps local origin and port checks for %s", (configured) => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", configured);
      expect(() => sameOrigin(request(configured))).not.toThrow();
      expect(() => sameOrigin(request(configured.replace(":3107", ":3000")))).toThrow();
      expect(() => sameOrigin(request("https://www.theleeexperience.com"))).toThrow();
    },
  );

  it("falls back to the request URL when no site URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(() => sameOrigin(request("https://www.theleeexperience.com"))).not.toThrow();
    expect(() => sameOrigin(request("https://evil.invalid"))).toThrow();
  });

  it("allows read-only requests without an Origin header", () => {
    for (const method of ["GET", "HEAD"]) {
      expect(() => sameOrigin(request(undefined, method))).not.toThrow();
    }
  });
});
