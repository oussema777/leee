import { db } from "@/lib/db";
import { canRead } from "./policy";

type Access = { active: boolean; order: { id: string; state: string; reference: string; snapshot: unknown } } | null;
export function localReaderPreviewEnabled() {
  if (process.env.NODE_ENV !== "development") return false;
  try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.NEXT_PUBLIC_SITE_URL || "").hostname); }
  catch { return false; }
}
export async function hasReadingAccess(access: Access, previewDetails?: unknown) {
  if (canRead(access)) return true;
  if (!access?.active || !localReaderPreviewEnabled() ||
      !["AWAITING_PAYMENT", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(access.order.state) ||
      !access.order.reference.startsWith("EB-TEST-") ||
      (access.order.snapshot as { testMode?: boolean } | null)?.testMode !== true) return false;
  const event = previewDetails === undefined ? await db.ebookOrderEvent.findFirst({
    where: { orderId: access.order.id, action: "LOCAL_READER_PREVIEW" },
    orderBy: { createdAt: "desc" },
  }) : { details: previewDetails };
  const until = (event?.details as { expiresAt?: string } | null)?.expiresAt;
  return typeof until === "string" && Date.parse(until) > Date.now();
}
