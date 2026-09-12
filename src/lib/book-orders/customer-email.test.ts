import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendBookOrderCustomerEmail } from "./customer-email";
import { sendWhishOrderEmail } from "./whish-email";
import { sendBookDonationEmail } from "../book-restore/donation-email";

const send = vi.hoisted(() => vi.fn());
vi.mock("@/lib/email", () => ({
  sendTransactionalEmail: send,
  renderNotification: (heading: string, intro: string, fields: Array<{ label: string; value?: string }>, _action?: unknown, presentation?: unknown) =>
    JSON.stringify({ heading, intro, fields, presentation }),
}));

beforeEach(() => send.mockClear());

describe("book customer emails", () => {
  it("acknowledges a cash order without claiming that payment was received", async () => {
    await sendBookOrderCustomerEmail({
      to: "buyer@example.test", locale: "en", reference: "LEE-BK-1",
      amountCents: 900, fulfillmentMethod: "DELIVERY", selectionMode: "CUSTOM",
      requestedBookCount: 1, bookTitles: ["The Little Prince"],
    });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: "buyer@example.test",
      subject: "We received your book order — LEE-BK-1",
      html: expect.stringContaining("does not confirm receipt of payment"),
    }));
    expect(send.mock.calls[0][0].html).toContain("The Little Prince");
  });

  it("renders Arabic order updates as RTL text", async () => {
    await sendBookOrderCustomerEmail({
      to: "buyer@example.test", locale: "ar", reference: "LEE-BK-2",
      amountCents: 500, fulfillmentMethod: "PICKUP", selectionMode: "LEE_CHOICE",
      requestedBookCount: 5, status: "READY",
    });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      subject: "طلب الكتب جاهز — LEE-BK-2",
      html: expect.stringContaining('"direction":"rtl"'),
    }));
  });

  it("sends a donor receipt and an acceptance update", async () => {
    await sendBookDonationEmail({
      to: "donor@example.test", locale: "en", reference: "BRD-1", bookCount: 3,
    });
    await sendBookDonationEmail({
      to: "donor@example.test", locale: "en", reference: "BRD-1", status: "ACCEPTED",
    });
    expect(send.mock.calls[0][0].subject).toContain("We received your book donation submission");
    expect(send.mock.calls[1][0].subject).toContain("Your book donation was accepted");
  });

  it("renders the Arabic Whish payment email correctly", async () => {
    await sendWhishOrderEmail({
      to: "buyer@example.test", locale: "ar", reference: "LEE-BK-3",
      amountCents: 500, kind: "CREATED", privatePath: "/ar/books/payment#secret",
    });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      subject: "أكمل الدفع لطلب الكتب — LEE-BK-3",
      html: expect.stringContaining('"direction":"rtl"'),
    }));
  });
});
