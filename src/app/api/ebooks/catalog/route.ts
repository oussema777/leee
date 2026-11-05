import { getPaymentMethods } from '@/lib/payment-methods';
import { whishCustomerAccess } from '@/lib/whish-pay/customer-config';
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
          versions: { where: { ready: true, editionLanguage: { not: null } }, select: { editionLanguage: true } },
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
    const whishTestMode = await whishCustomerAccess(request);
    return json({
      ebooks,
      whishTestMode,
      testMode: testMode && isWhishAvailable(whish),
      cardTestMode: !liveCustomerEnabled(),
      testUntil,
      methods: [
        whishTestMode || isWhishAvailable(whish) ? "WHISH" : null,
        enabled.BANK_AUDI && (liveCustomerEnabled() || await customerTestAccess(request)) ? "BANK_AUDI" : null,
      ].filter(Boolean),
    });
  });
}
