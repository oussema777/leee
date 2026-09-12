import { describe, expect, it } from "vitest";
import { renderNotification } from "./email";

describe("transactional email design", () => {
  it("renders the branded Phoenix card with responsive email-safe structure", () => {
    const html = renderNotification(
      "We received your book order",
      "Your order is being reviewed.",
      [{ label: "Order reference", value: "LEE-BK-123" }],
      { href: "https://theleeexperience.com/en/books", label: "View books" },
      { eyebrow: "PHOENIX • BOOKS WITH PURPOSE", accent: "amber" },
    );
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("PHOENIX • BOOKS WITH PURPOSE");
    expect(html).toContain("#F2A65A");
    expect(html).toContain("LEE-BK-123");
    expect(html).toContain("View books");
    expect(html).toContain("info@theleeexperience.com");
  });

  it("supports RTL and escapes customer-controlled content", () => {
    const html = renderNotification(
      "طلب الكتب",
      "تم الاستلام",
      [{ label: "Reference", value: "<script>alert(1)</script>" }],
      undefined,
      { direction: "rtl", accent: "amber" },
    );
    expect(html).toContain('lang="ar" dir="rtl"');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
