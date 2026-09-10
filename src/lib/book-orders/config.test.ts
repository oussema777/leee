import { describe, expect, it } from "vitest";
import { DELIVERY_FEE_CENTS, deliveryFeeCents } from "./config";

describe("deliveryFeeCents", () => {
  it("charges $4 for delivery of a single book", () => {
    expect(deliveryFeeCents("SINGLE", "DELIVERY")).toBe(DELIVERY_FEE_CENTS);
    expect(DELIVERY_FEE_CENTS).toBe(400);
  });

  it("makes delivery free for every multi-book pack", () => {
    expect(deliveryFeeCents("FIVE", "DELIVERY")).toBe(0);
    expect(deliveryFeeCents("TEN_PLUS_ONE", "DELIVERY")).toBe(0);
    expect(deliveryFeeCents("TWENTY_PLUS_TWO", "DELIVERY")).toBe(0);
  });

  it("does not charge for pickup", () => {
    expect(deliveryFeeCents("SINGLE", "PICKUP")).toBe(0);
  });
});
