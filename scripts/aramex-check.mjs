// Read-only production tracking check. Does not create shipments or pickups.
// Usage: npm run aramex:check -- <existing-Aramex-tracking-number>
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

async function main() {
  const trackingNumber = process.argv[2];
  if (!trackingNumber || !/^\d{8,20}$/.test(trackingNumber) || process.argv.length !== 3) {
    throw new Error("Usage: npm run aramex:check -- <existing-Aramex-tracking-number>");
  }

  const fields = {
    UserName: "ARAMEX_USERNAME",
    Password: "ARAMEX_PASSWORD",
    AccountNumber: "ARAMEX_ACCOUNT_NUMBER",
    AccountPin: "ARAMEX_ACCOUNT_PIN",
    AccountEntity: "ARAMEX_ACCOUNT_ENTITY",
    AccountCountryCode: "ARAMEX_ACCOUNT_COUNTRY_CODE",
  };
  const clientInfo = { Version: "v1.0", Source: 24 };
  for (const [field, key] of Object.entries(fields)) {
    if (!process.env[key]?.trim()) throw new Error(`Missing setting: ${key}`);
    clientInfo[field] = process.env[key];
  }

  let response;
  try {
    response = await fetch("https://ws.aramex.net/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        ClientInfo: clientInfo,
        // All five reference fields are required by the live JSON serializer.
        Transaction: { Reference1: "LEE-connection-check", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
        Shipments: [trackingNumber],
        GetLastTrackingUpdateOnly: true,
      }),
    });
  } catch {
    throw new Error("Aramex could not be reached within the request timeout. Credentials were not logged.");
  }
  if (!response.ok) throw new Error(`Aramex returned HTTP ${response.status}.`);

  let data;
  try { data = await response.json(); } catch {
    throw new Error("Aramex returned an unexpected response format.");
  }
  if (!data || typeof data.HasErrors !== "boolean") throw new Error("Aramex returned an unexpected response structure.");
  if (data.HasErrors) {
    const descriptions = {
      ERR01: "Invalid username or password.",
      ERR02: "Invalid shipping account information.",
      ERR03: "The shipping account is blocked.",
      ERR75: "ClientInfo - Failed to login using Portal Service.",
    };
    // Never log raw responses: they may contain credentials or customer data.
    const messages = (Array.isArray(data.Notifications) ? data.Notifications : []).map((item) => {
      const code = typeof item?.Code === "string" && /^(ERR|REQ)\d+$/.test(item.Code) ? item.Code : "UNKNOWN";
      return `${code}: ${descriptions[code] || "Aramex rejected the tracking request."}`;
    });
    throw new Error(messages.join("\n") || "Aramex rejected the tracking request.");
  }
  if (!Array.isArray(data.TrackingResults)) throw new Error("Aramex did not return a tracking results list.");
  const result = data.TrackingResults.find((item) => item?.Key === trackingNumber);
  if (!Array.isArray(result?.Value) || result.Value.length === 0) {
    throw new Error("Aramex returned no errors, but no events for this shipment; tracking verification is incomplete.");
  }
  console.log("Aramex tracking connection verified: existing shipment retrieved successfully.");
  console.log("No shipments or pickups were created. Shipment creation and COD eligibility are not verified by this check.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Aramex connection check failed.");
  process.exitCode = 1;
});
