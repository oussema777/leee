import { afterEach, describe, expect, it, vi } from "vitest";
import { configuredSubmissionTransport, validateSubmissionSchedule } from "./submission-config";
import { testSettings, testCredentials, testPreparation } from "./uat-test-fixtures";
const schedule = { shippingAt: "2026-11-01T10:00:00Z", dueAt: "2026-11-02T10:00:00Z" };
afterEach(() => vi.unstubAllEnvs());
function configure() {
  vi.stubEnv("ARAMEX_UAT_GATEWAY_URL", "https://aramex-gateway.theleeexperience.com");
  vi.stubEnv("ARAMEX_UAT_GATEWAY_KEY", "a".repeat(64));
  vi.stubEnv("ARAMEX_UAT_SUBMISSION_ENABLED", "true");
  vi.stubEnv("ARAMEX_UAT_SHIPMENT_SETTINGS_JSON", JSON.stringify(testSettings()));
  const c = testCredentials();
  for (const [key, value] of Object.entries({ USERNAME: c.UserName, PASSWORD: c.Password, ACCOUNT_NUMBER: c.AccountNumber,
    ACCOUNT_PIN: c.AccountPin, ACCOUNT_ENTITY: c.AccountEntity, ACCOUNT_COUNTRY_CODE: c.AccountCountryCode, VERSION: c.Version })) vi.stubEnv(`ARAMEX_UAT_${key}`, value);
}
describe("explicit UAT submission configuration", () => {
  it("does not activate with credentials alone", () => {
    configure(); vi.stubEnv("ARAMEX_UAT_SUBMISSION_ENABLED", "false");
    expect(() => configuredSubmissionTransport(schedule)).toThrow("SUBMISSION_DISABLED");
  });
  it("accepts complete UAT settings without making a network request", () => {
    configure(); const transport = configuredSubmissionTransport(schedule);
    expect(transport.environment).toBe("UAT"); expect(() => transport.validatePreparation!(testPreparation())).not.toThrow();
  });
  it.each(["null", "{}", "bad-json", JSON.stringify({ ...testSettings(), environment: "PRODUCTION" }), JSON.stringify({ ...testSettings(), endpoint: "https://evil.test" })])("rejects invalid settings", settings => {
    configure(); vi.stubEnv("ARAMEX_UAT_SHIPMENT_SETTINGS_JSON", settings);
    expect(() => configuredSubmissionTransport(schedule)).toThrow();
  });
  it("never falls back to production credentials", () => {
    configure(); vi.stubEnv("ARAMEX_UAT_PASSWORD", ""); vi.stubEnv("ARAMEX_PASSWORD", "production-secret");
    expect(() => configuredSubmissionTransport(schedule)).toThrow();
  });
  it("bounds explicit scheduling and rejects past shipping dates", () => {
    const now = Date.parse("2026-11-01T09:00:00Z");
    expect(validateSubmissionSchedule({ ...schedule, confirmedUat: true, expectedDraftVersion: 1 }, now)).toBe(true);
    expect(validateSubmissionSchedule({ ...schedule, confirmedUat: true, expectedDraftVersion: 1 }, now + 7200000)).toBe(false);
  });
});
