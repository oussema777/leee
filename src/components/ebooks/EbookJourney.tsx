import { Check } from "lucide-react";
import p from "./purchase.module.css";

export function EbookJourney({ step, ar }: { step: 1 | 2 | 3 | 4; ar: boolean }) {
  const labels = ar ? ["البريد", "الطلب", "الدفع", "القراءة"] : ["Email", "Order", "Payment", "Read"];
  return <ol className={p.journey} aria-label={ar ? "خطوات طلب الكتاب الإلكتروني" : "Ebook order progress"}>
    {labels.map((label, i) => <li key={label} data-state={i + 1 < step ? "done" : i + 1 === step ? "current" : "next"} aria-current={i + 1 === step ? "step" : undefined}>
      <span className={p.stepNumber}>{i + 1 < step ? <Check size={14} aria-hidden="true" /> : i + 1}</span>
      <span>{label}</span>
    </li>)}
  </ol>;
}
