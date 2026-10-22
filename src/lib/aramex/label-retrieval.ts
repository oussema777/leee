import type { PrismaClient } from "@prisma/client";
import { lockOrder } from "@/lib/book-orders/whish-server";
import type { LabelLookup } from "./label-lookup";
import { safeLabelUrl } from "./submission-status";

export async function retrieveLabel(db: PrismaClient, orderId: string, lookup: LabelLookup, actor: string, signal: AbortSignal) {
  const shipment = await db.bookShipment.findUnique({ where: { orderId } });
  if (!shipment || shipment.provider !== "ARAMEX" || shipment.environment !== "UAT"
    || shipment.status !== "CREATED" || !shipment.trackingNumber) throw Error("LABEL_NOT_ELIGIBLE");
  const labelUrl = safeLabelUrl(await lookup.label(shipment.trackingNumber, signal));
  if (!labelUrl || signal.aborted) throw Error("LABEL_UNAVAILABLE");
  return db.$transaction(async tx => {
    await lockOrder(tx, orderId);
    const current = await tx.bookShipment.findUnique({ where: { orderId } });
    if (!current || current.id !== shipment.id || current.status !== "CREATED" || current.provider !== "ARAMEX"
      || current.environment !== "UAT" || current.trackingNumber !== shipment.trackingNumber
      || current.updatedAt.getTime() !== shipment.updatedAt.getTime()) throw Error("LABEL_SHIPMENT_CHANGED");
    await tx.bookShipment.update({ where: { id: current.id }, data: { labelUrl, updatedBy: actor } });
    return { labelUrl };
  });
}
