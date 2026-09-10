import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { renderNotification, sendNotificationEmail } from "@/lib/email";
import { BOOK_PACKAGES, deliveryFeeCents, type BookPackageKey, isFreeExtraIndex } from "@/lib/book-orders/config";
import { bookOrderSchema } from "@/lib/book-orders/validation";

function orderReference() {
  return `LEE-BK-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  if (!rateLimit(`book-order:${clientIp(request)}`, 10, 60 * 60 * 1_000)) {
    return NextResponse.json({ error: "Too many order attempts. Please try again later." }, { status: 429 });
  }

  try {
    const parsed = bookOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Please check your order details." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    if (input.website) return NextResponse.json({ reference: orderReference() }, { status: 201 });

    const packageKey = input.package as BookPackageKey;
    const packageDetails = BOOK_PACKAGES[packageKey];
    const deliveryFee = deliveryFeeCents(packageKey, input.fulfillmentMethod);
    const orderTotal = packageDetails.priceCents + deliveryFee;
    const reference = orderReference();

    const order = await db.$transaction(async (transaction) => {
      const selectedBooks = input.selectedBookIds.length
        ? await transaction.bookInventoryItem.findMany({
            where: { id: { in: input.selectedBookIds }, isPublished: true },
            select: { id: true, title: true, status: true, stockQuantity: true },
          })
        : [];

      if (selectedBooks.length !== input.selectedBookIds.length) throw new Error("BOOK_UNAVAILABLE");
      if (selectedBooks.some((book) => book.status !== "AVAILABLE" || book.stockQuantity < 1)) {
        throw new Error("BOOK_UNAVAILABLE");
      }

      if (input.selectionMode === "CUSTOM") {
        for (const bookId of input.selectedBookIds) {
          const result = await transaction.bookInventoryItem.updateMany({
            where: { id: bookId, isPublished: true, status: "AVAILABLE", stockQuantity: { gt: 0 } },
            data: { stockQuantity: { decrement: 1 } },
          });
          if (result.count !== 1) throw new Error("BOOK_UNAVAILABLE");

          const remaining = await transaction.bookInventoryItem.findUnique({
            where: { id: bookId },
            select: { stockQuantity: true },
          });
          if (remaining?.stockQuantity === 0) {
            await transaction.bookInventoryItem.update({ where: { id: bookId }, data: { status: "RESERVED" } });
          }
        }
      }

      return transaction.bookOrder.create({
        data: {
          reference,
          locale: input.locale,
          package: packageKey,
          purpose: input.purpose,
          selectionMode: input.selectionMode,
          requestedBookCount: packageDetails.totalBooks,
          priceCents: orderTotal,
          deliveryFeeCents: deliveryFee,
          currency: "USD",
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || null,
          fulfillmentMethod: input.fulfillmentMethod,
          governorate: input.governorate || null,
          area: input.area || null,
          detailedAddress: input.detailedAddress || null,
          recipientName: input.recipientName || null,
          recipientPhone: input.recipientPhone || null,
          giftMessage: input.giftMessage || null,
          showSenderName: input.showSenderName,
          paymentMethod: input.paymentMethod,
          items: input.selectedBookIds.length
            ? {
                create: input.selectedBookIds.map((inventoryItemId, index) => ({
                  inventoryItemId,
                  isFreeExtra: isFreeExtraIndex(packageKey, index),
                })),
              }
            : undefined,
        },
        select: { id: true, reference: true, customerEmail: true },
      });
    });

    const purposeLabel = input.purpose === "SELF" ? "Personal order" : input.purpose === "GIFT" ? "Gift order" : "Book donation";
    const selectedTitles = input.selectedBookIds.length
      ? await db.bookInventoryItem.findMany({ where: { id: { in: input.selectedBookIds } }, select: { title: true } })
      : [];
    void sendNotificationEmail({
      subject: `New book order ${reference}`,
      replyTo: input.customerEmail,
      html: renderNotification("New book order", "A new cash order is ready for review.", [
        { label: "Reference", value: reference },
        { label: "Customer", value: input.customerName },
        { label: "Phone", value: input.customerPhone },
        { label: "Email", value: input.customerEmail },
        { label: "Order type", value: purposeLabel },
        { label: "Package", value: `${packageDetails.totalBooks} books — $${packageDetails.priceCents / 100}` },
        { label: "Book selection", value: input.selectionMode === "LEE_CHOICE" ? "LEE chooses suitable books" : selectedTitles.map((book) => book.title).join(", ") },
        { label: "Recipient", value: input.recipientName },
        { label: "Recipient phone", value: input.recipientPhone },
        { label: "Delivery", value: [input.governorate, input.area, input.detailedAddress].filter(Boolean).join(", ") },
        { label: "Gift message", value: input.giftMessage },
        { label: "Payment", value: input.paymentMethod === "CASH_ON_DELIVERY" ? "Cash on delivery / pickup" : "Cash arrangement with purchaser" },
      ]),
    });

    return NextResponse.json({ id: order.id, reference: order.reference }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOK_UNAVAILABLE") {
      return NextResponse.json({ error: "One of the selected books is no longer available. Please choose another." }, { status: 409 });
    }
    console.error("Book order creation failed", error);
    return NextResponse.json({ error: "We could not place your order. Please try again." }, { status: 500 });
  }
}
