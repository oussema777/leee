import { describe, expect, it, vi } from "vitest";
import { createLabelLookup, parseLabel, UAT_LABEL_URL, configuredLabelLookup } from "./label-lookup";
import { testCredentials } from "./uat-test-fixtures";
const response = () => ({ HasErrors: false, Transaction: { Reference1: "ref" }, ShipmentNumber: "123456789", ShipmentLabel: { LabelURL: "https://ws.uat.aramex.net/label.pdf" } });
describe("PrintLabel contract", () => {
  it("accepts only a correlated label for the existing AWB", () => {
    expect(parseLabel(response(), "123456789", "ref")).toContain("/label.pdf");
    expect(() => parseLabel(response(), "different", "ref")).toThrow();
    expect(() => parseLabel(response(), "123456789", "different")).toThrow();
    expect(() => parseLabel({ ...response(), HasErrors: true }, "123456789", "ref")).toThrow();
  });
  it.each(["", "http://aramex.com/a", "https://evil.example/a", "https://aramex.com.evil.example/a", "https://user:pass@aramex.com/a"])("rejects unsafe/missing URL %s", url => {
    expect(() => parseLabel({ ...response(), ShipmentLabel: { LabelURL: url } }, "123456789", "ref")).toThrow();
  });
  it("uses PrintLabel only, explicit account settings, and a fresh correlation reference", async () => {
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      expect(url).toBe(UAT_LABEL_URL);
      expect(init).toMatchObject({ redirect: "error", cache: "no-store", credentials: "omit" });
      const body = JSON.parse(String(init!.body));
      expect(body).toMatchObject({ ShipmentNumber: "123456789", OriginEntity: "BEY", ProductGroup: "DOM", LabelInfo: { ReportID: 9201, ReportType: "URL" } });
      expect(body.Shipments).toBeUndefined();
      return Response.json({ ...response(), Transaction: body.Transaction });
    });
    const lookup = createLabelLookup({ credentials: testCredentials(), originEntity: "BEY", reportId: 9201, fetchImpl: send });
    await expect(lookup.label("123456789", new AbortController().signal)).resolves.toContain("/label.pdf");
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("times out even when fetch ignores cancellation, with no retry", async () => {
    const send = vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => {}));
    const lookup = createLabelLookup({ credentials: testCredentials(), originEntity: "BEY", reportId: 9201, timeoutMs: 10, fetchImpl: send });
    await expect(lookup.label("123456789", new AbortController().signal)).rejects.toThrow("LOOKUP_UNAVAILABLE");
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("is disabled by default", () => {
    vi.stubEnv("ARAMEX_UAT_LABEL_ENABLED", "false");
    try { expect(() => configuredLabelLookup()).toThrow("LOOKUP_DISABLED"); } finally { vi.unstubAllEnvs(); }
  });
});
