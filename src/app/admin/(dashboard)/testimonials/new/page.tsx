import { db } from "@/lib/db";
import TestimonialForm, { type TestimonialData } from "../components/TestimonialForm";

export const dynamic = "force-dynamic";

export default async function NewTestimonialPage({
  searchParams,
}: {
  searchParams: Promise<{ fromSubmission?: string }>;
}) {
  const { fromSubmission } = await searchParams;
  if (!fromSubmission) return <TestimonialForm />;

  const sub = await db.testimonialSubmission.findUnique({ where: { id: fromSubmission } });
  // Guard: only consented, not-yet-approved submissions may pre-fill.
  if (!sub || !sub.consent || sub.status === "APPROVED") return <TestimonialForm />;

  const isAr = sub.locale === "ar";
  const initial: TestimonialData = {
    nameEn: isAr ? "" : sub.fullName,
    nameAr: isAr ? sub.fullName : "",
    titleEn: isAr ? "" : (sub.businessName ?? ""),
    titleAr: isAr ? (sub.businessName ?? "") : "",
    quoteEn: isAr ? "" : sub.quote,
    quoteAr: isAr ? sub.quote : "",
    imageUrl: sub.photoUrl ?? "",
    programEn: sub.program ?? "",
    programAr: "",
    category: "entrepreneurs",
    year: new Date().getFullYear(),
    isOriginalCard: false,
    order: 0,
    isActive: true,
  };

  return <TestimonialForm initial={initial} submissionId={sub.id} />;
}
