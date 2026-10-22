import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { shippingJson as json } from "@/lib/aramex/access";
import { ingestTrackingWebhook } from "@/lib/aramex/tracking";
export const runtime = "nodejs";

// Supported x-api-key mode from the supplied webhook PDF. No unsigned fallback.
// Configure only after agreeing UAT secret/header, acknowledgement and retries.
export async function POST(request: NextRequest) {
  const key = process.env.ARAMEX_UAT_WEBHOOK_KEY;
  if (process.env.ARAMEX_UAT_TRACKING_ENABLED !== "true" || !key || key.length < 32) return json({ error: "Tracking receiver unavailable." }, 503);
  const supplied = request.headers.get("x-api-key") ?? "";
  const hash = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(hash(key), hash(supplied))) return json({ error: "Unauthorized." }, 401);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Send JSON." }, 415);
  try {
    const reader = request.body?.getReader(); if (!reader) return json({ error: "Missing update." }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16_384) { await reader.cancel(); return json({ error: "Update too large." }, 413); }
      chunks.push(value);
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return json({ error: "Invalid JSON." }, 400); }
    const result = await ingestTrackingWebhook(db, body);
    return json({ accepted: true }, result.linked ? 200 : 202);
  } catch (error) {
    if (error instanceof Error && ["INVALID_TRACKING_UPDATE", "FUTURE_TRACKING_UPDATE"].includes(error.message)) return json({ error: "Invalid tracking update." }, 400);
    // Never acknowledge success before durable persistence. No payload logging.
    return json({ error: "Tracking storage unavailable. Retry later." }, 503);
  }
}
