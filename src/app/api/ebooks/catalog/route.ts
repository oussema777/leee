import { getPaymentMethods } from '@/lib/payment-methods';
import { liveCustomerEnabled } from '@/lib/cybersource/live-config';
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { endpoint, json } from "@/lib/ebooks/server";
import { ebookPaymentSettings } from "@/lib/ebooks/payment-settings";
import { isWhishAvailable } from "@/lib/book-orders/whish-config";
import { customerTestAccess } from "@/lib/cybersource/customer-config";
export async function GET(request: NextRequest) {
  return endpoint(request, async () => {
    const [ebooks, { whish, bank, testMode, testUntil }] = await Promise.all([
      db.ebook.findMany({
        where: { published: true, activeVersion: { ready: true } },
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleAr: true,
          author: true,
          language: true,
          descriptionEn: true,
          descriptionAr: true,
          coverUrl: true,
          priceCents: true,
          activeVersion: { select: { pageCount: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      ebookPaymentSettings(),
    ]);
    const enabled = await getPaymentMethods();
    return json({
      ebooks,
      testMode: testMode && isWhishAvailable(whish),
      cardTestMode: !liveCustomerEnabled(),
      testUntil,
      methods: [
        isWhishAvailable(whish) ? "WHISH" : null,
        enabled.BANK_AUDI && (liveCustomerEnabled() || await customerTestAccess(request)) ? "BANK_AUDI" : null,
      ].filter(Boolean),
    });
  });
}
