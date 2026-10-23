import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { privateJson, withPaymentAdmin } from "@/lib/book-orders/whish-server";
import { rateLimit } from "@/lib/rate-limit";
import { CheckoutError, checkoutErrorMessage, selectionSchema, inspectCheckout, startCheckout, checkResult } from "@/lib/cybersource/checkout";
import { transactionIdSchema } from "@/lib/cybersource/transaction";
export const runtime = "nodejs";
export const maxDuration = 60;
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("inspect"), selection: selectionSchema }).strict(),
  z.object({ action: z.literal("start"), selection: selectionSchema, confirmedTest: z.literal(true), retry: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal("result"), attemptId: z.string().regex(/^LEE-T-[a-f0-9-]{36}$/), transactionId: transactionIdSchema }).strict(),
]);
export async function POST(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request);
    if ("error" in auth) return auth.error!;
    if (process.env.CYBERSOURCE_TEST_CHECKOUT_ENABLED !== "true") return privateJson({ error: "Test card checkout is not available yet." }, 503);
    const origin = request.headers.get("origin");
    const ownOrigin = new URL(request.url).origin;
    if (!origin || origin !== ownOrigin || !["https://www.theleeexperience.com", "http://127.0.0.1:3000", "http://localhost:3000"].includes(origin)) return privateJson({ error: "Reload from the approved website address." }, 403);
    if (!rateLimit("audi-checkout:" + auth.session.userId, 20, 60000)) return privateJson({ error: "Please wait before trying again." }, 429);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return privateJson({ error: "Send JSON." }, 415);
    const reader = request.body?.getReader(); if (!reader) return privateJson({ error: "Missing request." }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 4096) return privateJson({ error: "Request too large." }, 413); chunks.push(value); } }
    finally { await reader.cancel().catch(() => {}); }
    let raw; try { raw = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return privateJson({ error: "Invalid JSON." }, 400); }
    const parsed = inputSchema.safeParse(raw); if (!parsed.success) return privateJson({ error: "Check the order reference and test confirmation." }, 400);
    const input = parsed.data;
    if (input.action === "inspect") return privateJson(await inspectCheckout(db, input.selection));
    if (input.action === "result") return privateJson({ attempt: await checkResult(db, input.attemptId, input.transactionId) });
    if (origin !== "https://www.theleeexperience.com") return privateJson({ error: "The card form must be opened on https://www.theleeexperience.com." }, 409);
    return privateJson(await startCheckout(db, input.selection, auth.session.userId, input.retry));
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ code: error.code, error: checkoutErrorMessage(error.code) }, error.status);
    return privateJson({ error: "Unable to verify checkout. Do not pay again; refresh the saved test status or check the transaction in Cybersource." }, 503);
  }
}
