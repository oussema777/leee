import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeShipping as authorize, shippingJson as json } from "@/lib/aramex/access";
import { draftEditable, submissionView } from "@/lib/aramex/submission-status";
import { lebanonCities } from "@/lib/aramex/cities";
import { lockOrder } from "@/lib/book-orders/whish-server";
import { isDraftStorageMissing, saveDraftSchema, shippingOrderFingerprint } from "@/lib/aramex/drafts";
import {
  pendingAramexConfirmations, preparationDefaults, preparationSchema,
  prepareShipment, shippingCollection, type PreparationContext,
} from "@/lib/aramex/preparation";

const select = {
  id: true, reference: true, updatedAt: true, purpose: true, status: true,
  fulfillmentMethod: true, paymentMethod: true, paymentStatus: true, priceCents: true,
  currency: true, requestedBookCount: true, customerName: true, customerPhone: true,
  customerEmail: true, recipientName: true, recipientPhone: true, governorate: true,
  area: true, detailedAddress: true, whishPayment: { select: { state: true } },
} as const;
type Context = { params: Promise<{ id: string }> };


export async function GET(request: NextRequest, { params }: Context) {
  try {
    const auth = await authorize(request); if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const order = await db.bookOrder.findUnique({ where: { id }, select });
    if (!order) return json({ error: "Order not found." }, 404);
    let draftStorageAvailable = true;
    const saved = await db.bookShipment.findUnique({ where: { orderId: id } }).catch(error => {
      if (!isDraftStorageMissing(error)) throw error;
      draftStorageAvailable = false;
      return null;
    });
    const stale = !!saved && saved.orderFingerprint !== shippingOrderFingerprint(order);
    if (request.nextUrl.searchParams.get("summary") === "1") {
      return json({
        draftStorageAvailable, submission: submissionView(saved),
        savedDraft: saved ? { updatedAt: saved.updatedAt.toISOString(), stale, editable: draftEditable(saved.status) } : null,
      });
    }
    const storedInput = saved ? preparationSchema.safeParse(saved.input) : null;
    if (storedInput && !storedInput.success) return json({ error: "The saved draft cannot be loaded. Contact support before replacing it." }, 409);
    const context: PreparationContext = {
      draftStorageAvailable, submission: submissionView(saved),
      savedDraft: saved && storedInput?.success ? {
        id: saved.id, version: saved.version, updatedAt: saved.updatedAt.toISOString(),
        stale, editable: draftEditable(saved.status), input: storedInput.data,
      } : null,
      reference: order.reference, status: order.status, purpose: order.purpose,
      paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
      bookCount: order.requestedBookCount,
      orderTotalCents: order.priceCents,
      sourceAddress: [order.governorate, order.area, order.detailedAddress].filter(Boolean).join(", "),
      defaults: preparationDefaults(order), collection: shippingCollection(order),
      cities: lebanonCities, pendingConfirmations: pendingAramexConfirmations,
    };
    return json(context);
  } catch {
    return json({ error: "Unable to load shipment preparation." }, 500);
  }
}

async function readBody(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 32_768) { await reader.cancel(); throw new Error("TOO_LARGE"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const auth = await authorize(request); if (auth instanceof NextResponse) return auth;
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Send a JSON preparation request." }, 415);
    }
    let body: unknown;
    try { body = await readBody(request); }
    catch (error) {
      return error instanceof Error && error.message === "TOO_LARGE"
        ? json({ error: "Preparation request is too large." }, 413)
        : json({ error: "Invalid JSON." }, 400);
    }
    const parsed = preparationSchema.safeParse(body);
    if (!parsed.success) return json({
      error: "Check the recipient and parcel details.",
      issues: parsed.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })),
    }, 400);
    const { id } = await params;
    // Always derive payment/collection from the current server record, never the form.
    const order = await db.bookOrder.findUnique({ where: { id }, select });
    if (!order) return json({ error: "Order not found." }, 404);
    if (parsed.data.expectedUpdatedAt !== order.updatedAt.toISOString()) {
      return json({ error: "This order changed. Reload preparation before continuing." }, 409);
    }
    const collection = shippingCollection(order);
    if (collection.problems.length) return json({ error: collection.problems.join(" ") }, 409);
    return json(prepareShipment(order, parsed.data));
  } catch {
    // Do not log customer data or return upstream/database error details.
    return json({ error: "Unable to prepare this shipment." }, 500);
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const auth = await authorize(request); if (auth instanceof NextResponse) return auth;
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Send a JSON preparation request." }, 415);
    }
    let body: unknown;
    try { body = await readBody(request); }
    catch (error) {
      return json({ error: error instanceof Error && error.message === "TOO_LARGE"
        ? "Preparation request is too large." : "Invalid JSON." },
      error instanceof Error && error.message === "TOO_LARGE" ? 413 : 400);
    }
    const parsed = saveDraftSchema.safeParse(body);
    if (!parsed.success) return json({
      error: "Check the recipient and parcel details.",
      issues: parsed.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })),
    }, 400);
    const { id } = await params;
    const result = await db.$transaction(async tx => {
      // Use the same row lock as order/payment review. Collection is recalculated
      // within the transaction, and concurrent draft saves are serialized.
      await lockOrder(tx, id);
      const order = await tx.bookOrder.findUnique({ where: { id }, select });
      if (!order) throw Error("ORDER_MISSING");
      if (order.updatedAt.toISOString() !== parsed.data.input.expectedUpdatedAt) throw Error("STALE_ORDER");
      const problems = shippingCollection(order).problems;
      if (problems.length) return { error: problems.join(" ") } as const;
      const current = await tx.bookShipment.findUnique({ where: { orderId: id } });
      if (current && !draftEditable(current.status)) throw Error("SHIPMENT_LOCKED");
      if ((current?.version ?? null) !== parsed.data.expectedDraftVersion) throw Error("STALE_DRAFT");
      const preparation = prepareShipment(order, parsed.data.input);
      const data = {
        input: parsed.data.input, preparation, status: "DRAFT",
        orderFingerprint: shippingOrderFingerprint(order), updatedBy: auth.userId,
      };
      const saved = current
        ? await tx.bookShipment.update({ where: { id: current.id }, data: { ...data, version: { increment: 1 } } })
        : await tx.bookShipment.create({ data: { ...data, orderId: id, createdBy: auth.userId } });
      return {
        savedDraft: {
          id: saved.id, version: saved.version, updatedAt: saved.updatedAt.toISOString(),
          stale: false, editable: true, input: parsed.data.input,
        },
        preparation,
      };
    });
    return json(result, "error" in result ? 409 : 200);
  } catch (error) {
    if (isDraftStorageMissing(error)) return json({ error: "Draft saving needs the shipping database update. You can still review a preparation." }, 503);
    const messages: Record<string, string> = {
      ORDER_MISSING: "Order not found.",
      STALE_ORDER: "This order changed. Reload preparation before saving.",
      STALE_DRAFT: "Someone saved a newer draft. Reload preparation before saving your changes.",
      SHIPMENT_LOCKED: "This shipment has moved beyond draft preparation and cannot be overwritten.",
    };
    if (error instanceof Error && messages[error.message]) return json({ error: messages[error.message] }, error.message === "ORDER_MISSING" ? 404 : 409);
    return json({ error: "Unable to save this shipping draft. Your changes are still on this screen." }, 500);
  }
}
