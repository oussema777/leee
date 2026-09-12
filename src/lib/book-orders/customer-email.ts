import { renderNotification, sendTransactionalEmail } from "@/lib/email";

type OrderStatus = "CONFIRMED" | "PREPARING" | "READY" | "DISPATCHED" | "COMPLETED" | "CANCELLED";

type BookOrderEmail = {
  to: string;
  locale: string;
  reference: string;
  amountCents: number;
  fulfillmentMethod: string;
  selectionMode: "CUSTOM" | "LEE_CHOICE";
  requestedBookCount: number;
  bookTitles?: string[];
  status?: OrderStatus;
};

export function formatBookOrderSummary(input: Pick<BookOrderEmail, "locale" | "selectionMode" | "requestedBookCount" | "bookTitles">) {
  const ar = input.locale === "ar";
  if (input.selectionMode === "LEE_CHOICE") {
    return ar
      ? `${input.requestedBookCount} كتب يختارها فريق LEE بعناية لك`
      : `${input.requestedBookCount} books thoughtfully curated for you by LEE`;
  }
  if (input.bookTitles?.length) return input.bookTitles.map((title, index) => `${index + 1}. ${title}`).join("\n");
  return ar ? `${input.requestedBookCount} كتب` : `${input.requestedBookCount} ${input.requestedBookCount === 1 ? "book" : "books"}`;
}

const statusCopy: Record<OrderStatus, { en: [string, string]; ar: [string, string] }> = {
  CONFIRMED: { en: ["Your book order is confirmed", "We have confirmed your order and will begin preparing it."], ar: ["تم تأكيد طلب الكتب", "أكدنا طلبك وسنبدأ بتحضيره."] },
  PREPARING: { en: ["Your book order is being prepared", "Our team is preparing your books."], ar: ["طلب الكتب قيد التحضير", "يعمل فريقنا الآن على تحضير كتبك."] },
  READY: { en: ["Your book order is ready", "Your books are ready. Our team will contact you with the handover details."], ar: ["طلب الكتب جاهز", "كتبك جاهزة. سيتواصل معك فريقنا لتأكيد تفاصيل التسليم."] },
  DISPATCHED: { en: ["Your book order is on its way", "Your books have been dispatched for delivery."], ar: ["طلب الكتب في طريقه إليك", "تم إرسال كتبك للتوصيل."] },
  COMPLETED: { en: ["Your book order is complete", "Your book order has been completed. Thank you for supporting The LEE Experience."], ar: ["اكتمل طلب الكتب", "اكتمل طلبك. شكرًا لدعمك The LEE Experience."] },
  CANCELLED: { en: ["Your book order was cancelled", "Your book order has been cancelled. Contact us if you need help."], ar: ["تم إلغاء طلب الكتب", "تم إلغاء طلبك. تواصل معنا إذا كنت بحاجة إلى المساعدة."] },
};

export async function sendBookOrderCustomerEmail(input: BookOrderEmail) {
  const ar = input.locale === "ar";
  const [heading, intro] = input.status
    ? statusCopy[input.status][ar ? "ar" : "en"]
    : ar
      ? ["استلمنا طلب الكتب", "شكرًا لك. استلمنا طلبك وسيراجعه فريق LEE قبل تأكيده. لم يتم تأكيد أي دفعة عبر هذه الرسالة."]
      : ["We received your book order", "Thank you. The LEE team will review your order before confirming it. This message does not confirm receipt of payment."];
  const fulfillment = input.fulfillmentMethod === "PICKUP" ? (ar ? "استلام" : "Pickup") : (ar ? "توصيل" : "Delivery");

  await sendTransactionalEmail({
    to: input.to,
    subject: `${heading} — ${input.reference}`,
    html: renderNotification(heading, intro, [
      { label: ar ? "رقم الطلب" : "Order reference", value: input.reference },
      { label: ar ? "الكتب المطلوبة" : "Books ordered", value: formatBookOrderSummary(input) },
      { label: ar ? "المبلغ" : "Total", value: `${(input.amountCents / 100).toFixed(2)} USD` },
      { label: ar ? "طريقة الاستلام" : "Fulfilment", value: fulfillment },
    ], undefined, {
      direction: ar ? "rtl" : "ltr",
      accent: "amber",
      eyebrow: ar ? "PHOENIX • كتب بأثر" : "PHOENIX • BOOKS WITH PURPOSE",
      footer: ar ? "هل تحتاج إلى مساعدة بشأن طلبك؟ فريقنا جاهز لمساعدتك." : "Need help with your order? Our team is ready to assist.",
    }),
  });
}
