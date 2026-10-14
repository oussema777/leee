export class EbookClientError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function ebookFetch<T = Record<string, unknown>>(
  url: string,
  data?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(
    url,
    data === undefined
      ? { cache: "no-store" }
      : {
          method,
          headers:
            data instanceof FormData
              ? undefined
              : { "Content-Type": "application/json" },
          body: data instanceof FormData ? data : JSON.stringify(data),
        },
  );
  const result = await response.json();
  if (!response.ok) throw new EbookClientError(result.error || "Please try again.", response.status);
  return result;
}
export function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
export function stateLabel(state: string, ar = false) {
  const labels: Record<string, [string, string]> = {
    AWAITING_PAYMENT: ["Awaiting payment", "بانتظار الدفع"],
    UNDER_REVIEW: ["Awaiting verification", "بانتظار التحقق"],
    CHANGES_REQUESTED: ["Correction requested", "مطلوب تصحيح"],
    VERIFIED: ["Paid", "مدفوع"],
    CANCELLED: ["Cancelled", "ملغي"],
    REFUNDED: ["Refunded", "تم الاسترداد"],
  };
  return labels[state]?.[ar ? 1 : 0] || state;
}
