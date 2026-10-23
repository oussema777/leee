import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/ebooks/policy";
import {
  body,
  EbookError,
  endpoint,
  json,
  limited,
  lock,
  requireReader,
} from "@/lib/ebooks/server";
import { ebookPaymentSettings } from "@/lib/ebooks/payment-settings";
import { makeSnapshot } from "@/lib/book-orders/whish-config";
import { cardSnapshot, customerTestAccess } from "@/lib/cybersource/customer-config";
import { hasReadingAccess, localReaderPreviewEnabled } from "@/lib/ebooks/reading-access";
export async function GET(request: NextRequest) {
  return endpoint(request, async () => {
    const reader = await requireReader(request);
    const [orders, access] = await Promise.all([db.ebookOrder.findMany({
      where: { readerId: reader.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        reference: true,
        ebookId: true,
        title: true,
        state: true,
        priceCents: true,
        method: true,
        customerNote: true,
        createdAt: true,
        access: { select: { active: true } },
      },
    }), db.ebookAccess.findMany({
      where: {
        readerId: reader.id,
        active: true,
        ...(!localReaderPreviewEnabled() ? { order: { state: "VERIFIED" as const } } : {}),
      },
      include: {
        order: true,
        ebook: {
          select: {
            id: true,
            titleEn: true,
            titleAr: true,
            coverUrl: true,
            author: true,
          },
        },
      },
    })]);
    const visible = await Promise.all(access.map(async entry =>
      await hasReadingAccess(entry) ? { ...entry, order: undefined, preview: entry.order.state !== "VERIFIED" } : null));
    return json({ reader: { email: reader.email }, orders, access: visible.filter(Boolean) });
  });
}
export async function POST(request: NextRequest) {
  return endpoint(request, async () => {
    const reader = await requireReader(request);
    const input = checkoutSchema.safeParse(await body(request));
    if (!input.success)
      throw new EbookError(
        "Check your name, payment method and online reading agreement.",
      );
    if (!(await limited("order:" + reader.id, 20, 3600)))
      throw new EbookError("Too many orders. Please try again later.", 429);
    const { ebookId, customerName, method, locale } = input.data;
    const isCardTest = method === "BANK_AUDI";
    if (isCardTest && !(await customerTestAccess(request))) throw new EbookError("Card testing is available only to signed-in payment administrators.", 403);
    const order = await db.$transaction(async (tx) => {
      await lock(tx, "ebook-checkout:" + reader.id + ":" + ebookId);
      const ebook = await tx.ebook.findUnique({
        where: { id: ebookId },
        include: { activeVersion: true },
      });
      if (!ebook?.published || !ebook.activeVersion?.ready)
        throw new EbookError("This ebook is not available for purchase.", 404);
      const paid = await tx.ebookOrder.findFirst({
        where: { readerId: reader.id, ebookId, state: "VERIFIED", ...(!isCardTest ? { NOT: { reference: { startsWith: "EB-TEST-CARD-" } } } : {}) },
      });
      if (paid)
        throw new EbookError(
          "You have already purchased this ebook. Open My ebooks or contact support.",
          409,
        );
      const existing = await tx.ebookOrder.findFirst({
        where: {
          readerId: reader.id,
          ebookId,
          ...(isCardTest ? { reference: { startsWith: "EB-TEST-CARD-" } } : { NOT: { reference: { startsWith: "EB-TEST-CARD-" } } }),
          state: {
            in: ["AWAITING_PAYMENT", "UNDER_REVIEW", "CHANGES_REQUESTED"],
          },
        },
      });
      if (existing) return existing;
      const settings = await ebookPaymentSettings();
      const snapshot =
        method === "WHISH"
          ? makeSnapshot(settings.whish, ebook.priceCents)
          : cardSnapshot(ebook.priceCents);
      if (!snapshot)
        throw new EbookError(
          "This payment method is temporarily unavailable.",
          409,
        );
      return tx.ebookOrder.create({
        data: {
          readerId: reader.id,
          ebookId,
          customerName,
          locale,
          method,
          reference:
            (isCardTest ? "EB-TEST-CARD-" : settings.testMode ? "EB-TEST-" : "EB-") + randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
          priceCents: ebook.priceCents,
          title:
            locale === "ar" ? ebook.titleAr || ebook.titleEn : ebook.titleEn,
          snapshot: { ...snapshot, ...(settings.testMode ? { testMode: true } : {}) } as unknown as Prisma.InputJsonValue,
          events: {
            create: {
              actor: reader.id,
              action: "CREATED",
              details: { terms: "ebook-online-v1", testMode: isCardTest || settings.testMode },
            },
          },
        },
      });
    });
    return json({ id: order.id });
  });
}
