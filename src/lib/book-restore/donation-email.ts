import { renderNotification, sendTransactionalEmail } from "@/lib/email";

type DonationStatus = "NEEDS_FOLLOW_UP" | "DROP_OFF_EXPECTED" | "PICKUP_TO_SCHEDULE" | "SCHEDULED" | "COLLECTED" | "RECEIVED" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "CLOSED";
type DonationEmail = { to: string; locale: string; reference: string; bookCount?: number; status?: DonationStatus };

const statusCopy: Record<DonationStatus, { en: [string, string]; ar: [string, string] }> = {
  NEEDS_FOLLOW_UP: { en: ["We need to follow up about your book donation", "Our team will contact you to confirm a few details."], ar: ["نحتاج إلى متابعة تبرعك بالكتب", "سيتواصل معك فريقنا لتأكيد بعض التفاصيل."] },
  DROP_OFF_EXPECTED: { en: ["Your book drop-off is expected", "We have recorded that you plan to drop off your books."], ar: ["بانتظار تسليم الكتب", "سجلنا أنك ستقوم بتسليم الكتب إلى فريقنا."] },
  PICKUP_TO_SCHEDULE: { en: ["Your book pickup needs scheduling", "Our team will contact you to arrange a pickup time."], ar: ["يلزم تحديد موعد لاستلام الكتب", "سيتواصل معك فريقنا لترتيب موعد الاستلام."] },
  SCHEDULED: { en: ["Your book donation handover is scheduled", "The handover for your donated books has been scheduled."], ar: ["تم تحديد موعد تسليم الكتب", "تم تحديد موعد استلام الكتب المتبرع بها."] },
  COLLECTED: { en: ["Your donated books were collected", "Our team has collected your donated books."], ar: ["تم استلام الكتب منك", "استلم فريقنا الكتب المتبرع بها منك."] },
  RECEIVED: { en: ["We received your donated books", "Your books have reached our team and will be reviewed."], ar: ["استلمنا الكتب المتبرع بها", "وصلت كتبك إلى فريقنا وستتم مراجعتها."] },
  UNDER_REVIEW: { en: ["Your donated books are under review", "Our team is reviewing the donated books against the Book Restore acceptance criteria."], ar: ["الكتب المتبرع بها قيد المراجعة", "يراجع فريقنا الكتب وفق معايير قبول مبادرة Book Restore."] },
  ACCEPTED: { en: ["Your book donation was accepted", "Thank you. Your donated books have been accepted into the Book Restore initiative."], ar: ["تم قبول تبرعك بالكتب", "شكرًا لك. تم قبول الكتب ضمن مبادرة Book Restore."] },
  REJECTED: { en: ["Update about your book donation", "After review, we could not accept the donated books. Our team can help with the next step."], ar: ["تحديث حول تبرعك بالكتب", "بعد المراجعة، تعذر علينا قبول الكتب. يمكن لفريقنا مساعدتك في الخطوة التالية."] },
  CLOSED: { en: ["Your book donation record is closed", "The process for this book donation has been completed and its record is now closed."], ar: ["تم إغلاق سجل تبرعك بالكتب", "اكتملت إجراءات هذا التبرع وتم إغلاق سجله."] },
};

export async function sendBookDonationEmail(input: DonationEmail) {
  const ar = input.locale === "ar";
  const [heading, intro] = input.status
    ? statusCopy[input.status][ar ? "ar" : "en"]
    : ar
      ? ["استلمنا طلب التبرع بالكتب", "شكرًا لمساهمتك. استلم فريق LEE تفاصيل تبرعك وسيتواصل معك بشأن الخطوة التالية. يخضع قبول الكتب للمراجعة."]
      : ["We received your book donation submission", "Thank you for contributing. The LEE team received your details and will contact you about the next step. Book acceptance is subject to review."];

  await sendTransactionalEmail({
    to: input.to,
    subject: `${heading} — ${input.reference}`,
    html: renderNotification(heading, intro, [
      { label: ar ? "رقم التبرع" : "Donation reference", value: input.reference },
      ...(input.bookCount === undefined ? [] : [{ label: ar ? "عدد الكتب" : "Books submitted", value: String(input.bookCount) }]),
    ], undefined, {
      direction: ar ? "rtl" : "ltr",
      accent: "amber",
      eyebrow: ar ? "PHOENIX • امنح الكتب فصلاً جديداً" : "PHOENIX • GIVE BOOKS ANOTHER CHAPTER",
      footer: ar ? "شكراً لمساهمتك في إعادة الكتب إلى التداول بمسؤولية." : "Thank you for helping books move forward responsibly.",
    }),
  });
}
