import { NextRequest } from "next/server";
import { privateJson, withPaymentAdmin } from "@/lib/book-orders/whish-server";
import { testCredentials } from "@/lib/cybersource/test-session-request";
export async function GET(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request);
    if ("error" in auth) return auth.error!;
    let configured = false;
    try { testCredentials(); configured = true; } catch {}
    const approvedOrigin = new URL(request.url).origin === "https://www.theleeexperience.com";
    const enabled = process.env.CYBERSOURCE_TEST_CHECKOUT_ENABLED === "true";
    const testCheckoutAvailable = configured && enabled && approvedOrigin;
    const testCheckoutMessage = !approvedOrigin
      ? "You are viewing the checkout setup locally. Card testing opens on www.theleeexperience.com after the test setup is deployed and enabled."
      : !enabled ? "Staff card testing has not been enabled on this server yet."
      : !configured ? "Test credentials must be configured before staff card testing can begin." : null;
    return privateJson({ environment: "TEST", configured, testCheckoutAvailable, testCheckoutMessage, customerCheckoutEnabled: false, manualTransfersRetired: true });
  } catch { return privateJson({ error: "Could not load Bank Audi status." }, 503); }
}
export async function PUT(request: NextRequest) {
  const auth = await withPaymentAdmin(request);
  if ("error" in auth) return auth.error!;
  return privateJson({ error: "Manual bank transfers have been retired. Card gateway credentials are managed on the server." }, 410);
}
