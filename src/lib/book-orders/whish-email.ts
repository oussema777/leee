import { renderNotification, sendTransactionalEmail } from "@/lib/email";

type OrderEmail = {
  to: string; locale: string; reference: string; amountCents: number;
  kind: "CREATED" | "VERIFY" | "REQUEST_CORRECTION" | "REFUND";
  privatePath?: string; note?: string; orderClosed?: boolean; bookSummary?: string;
};

export async function sendWhishOrderEmail(input: OrderEmail) {
  const ar = input.locale === "ar";
  const copy = ar ? {
    CREATED: ["أكمل الدفع لطلب الكتب", "طلبك بانتظار الدفع. استخدم رابطك الخاص للدفع، ثم أرسل تفاصيل العملية. سيتم تأكيد الطلب بعد تحقق فريق LEE من استلام المبلغ."],
    VERIFY: ["تم تأكيد الدفع", input.orderClosed ? "تم استلام دفعتك لكن الطلب مغلق. تواصل مع LEE لترتيب الخطوة التالية." : "تحقق فريق LEE من استلام دفعتك. سنتواصل معك لترتيب الخطوة التالية."],
    REQUEST_CORRECTION: ["يرجى مراجعة تفاصيل الدفع", "راجع الملاحظة أدناه وارجع إلى رابط الدفع المحفوظ لتصحيح التفاصيل. تواصل مع LEE قبل إرسال دفعة أخرى."],
    REFUND: ["تم تسجيل استرداد المبلغ", "سجل فريق LEE إتمام إعادة المبلغ. تواصل معنا إذا احتجت إلى المساعدة."],
  } : {
    CREATED: ["Complete payment for your books", "Your order is awaiting payment. Use your private link to pay, then submit your transaction details. Your order will be confirmed after LEE verifies receipt."],
    VERIFY: ["Payment confirmed", input.orderClosed ? "Your payment was received, but this order is closed. Contact LEE to arrange the next step." : "LEE verified receipt of your payment. We will contact you to arrange the next step."],
    REQUEST_CORRECTION: ["Please check your payment details", "Read the note below and return to your saved payment link to correct the details. Contact LEE before sending another payment."],
    REFUND: ["Refund recorded", "LEE has recorded a completed refund. Contact us if you need help."],
  };
  const [heading, intro] = copy[input.kind];
  let origin = "https://theleeexperience.com";
  try {
    const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL || origin);
    if (["https:", "http:"].includes(configured.protocol)) origin = configured.origin;
  } catch { /* Keep the canonical origin when the optional override is invalid. */ }
  const url = origin + (input.privatePath || `/${ar ? "ar" : "en"}/contact`);
  await sendTransactionalEmail({
    to: input.to,
    subject: `${heading} — ${input.reference}`,
    html: renderNotification(heading, intro, [
      { label: ar ? "رقم الطلب" : "Order reference", value: input.reference },
      { label: ar ? "الكتب المطلوبة" : "Books ordered", value: input.bookSummary },
      { label: ar ? "المبلغ" : "Amount", value: `${(input.amountCents / 100).toFixed(2)} USD` },
      { label: ar ? "ملاحظة من LEE" : "Note from LEE", value: input.note },
      ...(input.privatePath ? [{ label: ar ? "رابط خاص" : "Private link", value: ar ? "احتفظ بهذا الرابط. يمكن لمن يملكه الوصول إلى صفحة الدفع." : "Keep this link safe. Anyone with it can access your payment page." }] : []),
    ], { href: url, label: input.privatePath ? (ar ? "افتح صفحة الدفع" : "Open my payment page") : (ar ? "تواصل مع LEE" : "Contact LEE") }, {
      direction: ar ? "rtl" : "ltr",
      accent: "amber",
      eyebrow: ar ? "PHOENIX • دفع آمن" : "PHOENIX • SECURE PAYMENT",
      footer: ar ? "لأمانك، لا تشارك رابط الدفع الخاص بك مع أي شخص." : "For your security, do not share your private payment link.",
    }),
  });
}
