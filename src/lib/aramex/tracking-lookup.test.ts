import { afterEach, describe, expect, it, vi } from "vitest";
import { configuredTrackingLookup, createTrackingLookup, parseTrackingHistory, UAT_TRACKING_URL } from "./tracking-lookup";
import { testCredentials } from "./uat-test-fixtures";
const awb = "123456789";
const event = () => ({ WaybillNumber: awb, UpdateCode: "SH005", UpdateDateTime: "2026-10-20T10:00:00Z",
  UpdateLocation: "Beirut", Comments: "Test delivery", ProblemCode: "" });
const response = (reference = "test-reference") => ({ HasErrors: false, Transaction: { Reference1: reference }, TrackingResults: [{ Key: awb, Value: [event()] }] });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
describe("full tracking history parsing", () => {
  it("normalizes supported dates and optional fields into webhook-shaped events", () => {
    const raw = response(); raw.TrackingResults[0].Value[0].UpdateDateTime = `/Date(${Date.parse(event().UpdateDateTime)}+0300)/`;
    expect(parseTrackingHistory(raw, awb, "test-reference")[0]).toMatchObject({ Key: awb, Value: { UpdateDateTime: "2026-10-20T10:00:00.000Z", OrderNumber: "" } });
    expect(parseTrackingHistory({ ...response(), TrackingResults: [{ Key: awb, Value: [] }] }, awb, "test-reference")).toEqual([]);
  });
  it.each([
    { ...response(), HasErrors: true }, { ...response(), Transaction: { Reference1: "wrong" } },
    { ...response(), TrackingResults: [] }, { ...response(), TrackingResults: [{ Key: "wrong", Value: [event()] }] },
    { ...response(), TrackingResults: [{ Key: awb, Value: [{ ...event(), WaybillNumber: "wrong" }] }] },
    { ...response(), TrackingResults: [{ Key: awb, Value: [event(), { ...event(), UpdateDateTime: "2026-10-20T10:00:00" }] }] },
    { ...response(), TrackingResults: [{ Key: awb, Value: [{ ...event(), UpdateDateTime: "2099-01-01T00:00:00Z" }] }] },
    { ...response(), TrackingResults: [{ Key: awb, Value: Array.from({ length: 501 }, event) }] },
  ])("rejects incomplete, unrelated or ambiguous evidence: %#", raw => {
    expect(() => parseTrackingHistory(raw, awb, "test-reference")).toThrow("INVALID_TRACKING_RESPONSE");
  });
});
describe("one-shot UAT tracking lookup", () => {
  it("requests full history with timezone and all references, never production", async () => {
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      expect(url).toBe(UAT_TRACKING_URL);
      const body = JSON.parse(init!.body as string);
      expect(body).toMatchObject({ GetLastTrackingUpdateOnly: false, GetUpdateTimeZone: true, Shipments: [awb],
        Transaction: { Reference2: "", Reference3: "", Reference4: "", Reference5: "" } });
      expect(init).toMatchObject({ redirect: "error", credentials: "omit", cache: "no-store" });
      return Response.json(response(body.Transaction.Reference1));
    });
    const result = await createTrackingLookup({ credentials: testCredentials(), fetchImpl: send }).history(awb, new AbortController().signal);
    expect(result).toHaveLength(1); expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toContain("fixture-password");
  });
  it.each([401, 429, 500, 302])("does not retry HTTP %s", async status => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response("secret carrier error", { status }));
    await expect(createTrackingLookup({ credentials: testCredentials(), fetchImpl: send }).history(awb, new AbortController().signal)).rejects.toThrow("LOOKUP_UNAVAILABLE");
    expect(send).toHaveBeenCalledTimes(1);
  });
  it.each(["not JSON", "x".repeat(262145)])("bounds invalid response bodies: %#", async body => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
    await expect(createTrackingLookup({ credentials: testCredentials(), fetchImpl: send }).history(awb, new AbortController().signal)).rejects.toThrow("LOOKUP_UNAVAILABLE");
  });
  it.each(["headers", "body"])("times out stalled %s", async stage => {
    vi.useFakeTimers();
    const send = vi.fn<typeof fetch>().mockImplementation(() => stage === "headers" ? new Promise(() => {})
      : Promise.resolve(new Response(new ReadableStream({ start() {} }))));
    const pending = createTrackingLookup({ credentials: testCredentials(), fetchImpl: send, timeoutMs: 10 }).history(awb, new AbortController().signal);
    const assertion = expect(pending).rejects.toThrow("LOOKUP_UNAVAILABLE");
    await vi.advanceTimersByTimeAsync(11); await assertion;
    expect(send.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
  it("honors caller cancellation without exposing raw errors", async () => {
    const caller = new AbortController(); caller.abort(); const send = vi.fn<typeof fetch>();
    await expect(createTrackingLookup({ credentials: testCredentials(), fetchImpl: send }).history(awb, caller.signal)).rejects.toThrow("LOOKUP_UNAVAILABLE");
    expect(send).not.toHaveBeenCalled();
  });
  it("requires separate UAT configuration and never falls back to production credentials", () => {
    vi.stubEnv("ARAMEX_UAT_LOOKUP_ENABLED", "false"); expect(() => configuredTrackingLookup()).toThrow("LOOKUP_DISABLED");
    vi.stubEnv("ARAMEX_UAT_LOOKUP_ENABLED", "true"); vi.stubEnv("ARAMEX_UAT_USERNAME", "");
    vi.stubEnv("ARAMEX_UAT_GATEWAY_URL", "https://aramex-gateway.theleeexperience.com");
    vi.stubEnv("ARAMEX_UAT_GATEWAY_KEY", "a".repeat(64));
    vi.stubEnv("ARAMEX_USERNAME", "production@example.test");
    expect(() => configuredTrackingLookup()).toThrow("INVALID_UAT_CREDENTIALS");
  });
});
