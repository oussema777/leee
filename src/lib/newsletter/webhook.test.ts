import { describe, it, expect } from "vitest";
import { parseResendWebhook } from "./webhook";

describe("parseResendWebhook", () => {
  it("parses a delivered event (tags is a Record map)", () => {
    const result = parseResendWebhook(
      {
        type: "email.delivered",
        data: {
          to: ["a@x.com"],
          tags: { campaignId: "c1" },
          created_at: "2026-06-25T12:00:00.000Z",
        },
      },
      "evt_1",
    );
    expect(result).toEqual({
      type: "DELIVERED",
      campaignId: "c1",
      email: "a@x.com",
      providerEventId: "evt_1",
      occurredAt: new Date("2026-06-25T12:00:00.000Z"),
    });
    expect(result?.occurredAt).toBeInstanceOf(Date);
  });

  it("maps a hard bounce (Permanent) to BOUNCED", () => {
    const result = parseResendWebhook(
      {
        type: "email.bounced",
        data: {
          to: ["b@x.com"],
          tags: { campaignId: "c1" },
          bounce: { type: "Permanent" },
        },
      },
      "evt_2",
    );
    expect(result?.type).toBe("BOUNCED");
  });

  it("ignores a soft bounce (Transient) → null", () => {
    const result = parseResendWebhook(
      {
        type: "email.bounced",
        data: {
          to: ["b@x.com"],
          tags: { campaignId: "c1" },
          bounce: { type: "Transient" },
        },
      },
      "evt_3",
    );
    expect(result).toBeNull();
  });

  it("reads campaignId from the tags MAP shape for an opened event", () => {
    const result = parseResendWebhook(
      {
        type: "email.opened",
        data: {
          to: ["c@x.com"],
          tags: { campaignId: "c2" },
        },
      },
      "evt_4",
    );
    expect(result?.type).toBe("OPENED");
    expect(result?.campaignId).toBe("c2");
  });

  it("returns null when campaignId is missing (no tags)", () => {
    const result = parseResendWebhook(
      {
        type: "email.delivered",
        data: { to: ["d@x.com"] },
      },
      "evt_5",
    );
    expect(result).toBeNull();
  });

  it("returns null for an unknown event type", () => {
    const result = parseResendWebhook(
      {
        type: "email.something_new",
        data: { to: ["e@x.com"], tags: { campaignId: "c3" } },
      },
      "evt_6",
    );
    expect(result).toBeNull();
  });
});
