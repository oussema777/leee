import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { renderNotification, sendNotificationEmail } from "@/lib/email";
import { sendWhishOrderEmail } from "@/lib/book-orders/whish-email";
import { sendBookOrderCustomerEmail } from "@/lib/book-orders/customer-email";
import { BOOK_PACKAGES, deliveryFeeCents, type BookPackageKey, isFreeExtraIndex } from "@/lib/book-orders/config";
import { bookOrderSchema } from "@/lib/book-orders/validation";
import { makeSnapshot, paymentDeadline } from "@/lib/book-orders/whish-config";
import { expireWhishPayments, getWhishConfig, tokenHash, requestHash, paymentPath, privateJson } from "@/lib/book-orders/whish-server";

function orderReference() { return "LEE-BK-" + new Date().getFullYear() + "-" + crypto.randomUUID().slice(0, 8).toUpperCase(); }

export async function POST(request: NextRequest) {
  if (!rateLimit("book-order:" + clientIp(request), 10, 3600000)) return privateJson({ error: "Too many order attempts. Please try again later." }, 429);
  try {
    const parsed = bookOrderSchema.safeParse(await request.json());
    if (!parsed.success) return privateJson({ error: parsed.error.issues[0]?.message || "Please check your order details." }, 400);
    const input = parsed.data;
    if (input.website) return NextResponse.json({ reference: orderReference() }, { status: 201 });
    const whish = input.paymentMethod === "WHISH";
    const hash = whish ? tokenHash(input.paymentAccessToken!) : null;
    const fingerprint = requestHash(input);
    const replay = async () => {
      if (!hash) return null;
      const p = await db.bookWhishPayment.findUnique({ where: { accessTokenHash: hash }, include: { order: { select: { id: true, reference: true, locale: true } } } });
      if (!p) return null;
      if (p.requestHash !== fingerprint) return privateJson({ error: "This payment session belongs to another order. Start a new checkout." }, 409);
      return privateJson({ id: p.order.id, reference: p.order.reference, paymentUrl: paymentPath(p.order.locale, p.order.reference, input.paymentAccessToken!) });
    };
    const existing = await replay();
    if (existing) return existing;
    const packageKey = input.package as BookPackageKey;
    const pack = BOOK_PACKAGES[packageKey];
    const delivery = deliveryFeeCents(packageKey, input.fulfillmentMethod);
    const total = pack.priceCents + delivery;
    const config = whish ? await getWhishConfig() : null;
    const snapshot = config ? makeSnapshot(config, total) : null;
    if (whish && !snapshot) return privateJson({ error: "Whish is currently unavailable. Please choose cash or try again later." }, 409);
    await expireWhishPayments().catch(() => console.error("Book reservation cleanup unavailable"));
    let order;
    let selectedTitles: string[] = [];
    try {
      order = await db.$transaction(async tx => {
        const selected = input.selectedBookIds.length ? await tx.bookInventoryItem.findMany({
          where: { id: { in: input.selectedBookIds }, isPublished: true },
          select: { id: true, title: true, status: true, stockQuantity: true },
        }) : [];
        if (selected.length !== input.selectedBookIds.length || selected.some(b => b.status !== "AVAILABLE" || b.stockQuantity < 1)) throw Error("BOOK_UNAVAILABLE");
        selectedTitles = selected.map(book => book.title);
        if (input.selectionMode === "CUSTOM") {
          for (const id of [...input.selectedBookIds].sort()) {
            const reserved = await tx.bookInventoryItem.updateMany({
              where: { id, isPublished: true, status: "AVAILABLE", stockQuantity: { gt: 0 } },
              data: { stockQuantity: { decrement: 1 } },
            });
            if (reserved.count !== 1) throw Error("BOOK_UNAVAILABLE");
            await tx.bookInventoryItem.updateMany({ where: { id, stockQuantity: 0 }, data: { status: "RESERVED" } });
          }
        }
        return tx.bookOrder.create({
          data: {
            reference: orderReference(), locale: input.locale, package: packageKey, purpose: input.purpose,
            selectionMode: input.selectionMode, requestedBookCount: pack.totalBooks,
            priceCents: total, deliveryFeeCents: delivery, currency: "USD",
            customerName: input.customerName, customerPhone: input.customerPhone, customerEmail: input.customerEmail || null,
            fulfillmentMethod: input.fulfillmentMethod, governorate: input.governorate || null,
            area: input.area || null, detailedAddress: input.detailedAddress || null,
            recipientName: input.recipientName || null, recipientPhone: input.recipientPhone || null,
            giftMessage: input.giftMessage || null, showSenderName: input.showSenderName,
            paymentMethod: input.paymentMethod, termsAccepted: input.termsAccepted, consentTextVersion: "book-order-v2",
            items: input.selectedBookIds.length ? { create: input.selectedBookIds.map((inventoryItemId, i) => ({ inventoryItemId, isFreeExtra: isFreeExtraIndex(packageKey, i) })) } : undefined,
            ...(snapshot && config && hash ? { whishPayment: { create: {
              accessTokenHash: hash, requestHash: fingerprint, snapshot: snapshot as unknown as Prisma.InputJsonValue,
              expiresAt: paymentDeadline(config, snapshot),
              events: { create: { action: "CREATED", actor: "customer", details: { amountCents: total, currency: "USD" } } },
            } } } : {}),
          },
          select: { id: true, reference: true },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && whish) {
        const response = await replay();
        if (response) return response;
      }
      throw e;
    }
    const privatePath = whish ? paymentPath(input.locale, order.reference, input.paymentAccessToken!) : null;
    await Promise.all([sendNotificationEmail({
      subject: "New book order " + order.reference, replyTo: input.customerEmail,
      html: renderNotification("New book order", whish ? "Awaiting the purchaser's Whish payment. Do not mark paid until receipt is verified." : "A new cash order is ready for review.", [
        { label: "Reference", value: order.reference }, { label: "Customer", value: input.customerName },
        { label: "Phone", value: input.customerPhone }, { label: "Email", value: input.customerEmail },
        { label: "Purpose", value: input.purpose },
        { label: "Book selection", value: input.selectionMode === "LEE_CHOICE" ? "LEE chooses suitable books" : selectedTitles.join(", ") },
        { label: "Recipient", value: input.recipientName }, { label: "Recipient phone", value: input.recipientPhone },
        { label: "Delivery address", value: [input.governorate, input.area, input.detailedAddress].filter(Boolean).join(", ") },
        { label: "Gift message", value: input.giftMessage }, { label: "Show sender name", value: input.showSenderName ? "Yes" : "No" },
        { label: "Books", value: String(pack.totalBooks) }, { label: "Total including delivery", value: "USD " + total / 100 },
        { label: "Payment", value: input.paymentMethod }, { label: "Fulfilment", value: input.fulfillmentMethod },
      ]),
    }), ...(input.customerEmail ? [privatePath
      ? sendWhishOrderEmail({
          to: input.customerEmail, locale: input.locale, reference: order.reference,
          amountCents: total, kind: "CREATED", privatePath,
        })
      : sendBookOrderCustomerEmail({
          to: input.customerEmail, locale: input.locale, reference: order.reference,
          amountCents: total, fulfillmentMethod: input.fulfillmentMethod,
        })] : [])]);
    return privateJson({
      id: order.id, reference: order.reference,
      ...(privatePath ? { paymentUrl: privatePath } : {}),
    }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "BOOK_UNAVAILABLE") return privateJson({ error: "One of the selected books is no longer available. Please choose another." }, 409);
    console.error("Book order creation failed");
    return privateJson({ error: "We could not place your order. Please try again." }, 500);
  }
}
