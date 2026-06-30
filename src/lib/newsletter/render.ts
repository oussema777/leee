export function applyMergeTags(html: string, vars: { name: string | null }): string {
  return html.replace(/\{\{\s*name\s*\}\}/g, vars.name ?? "");
}

export function injectUnsubscribeFooter(html: string, unsubUrl: string, locale: "EN" | "AR"): string {
  const isAr = locale === "AR";
  const label = isAr ? "إلغاء الاشتراك" : "Unsubscribe";
  const line = isAr
    ? "أنت تتلقى هذه الرسالة لأنك مشترك في نشرة The LEE Experience."
    : "You are receiving this because you subscribed to The LEE Experience newsletter.";
  const footer = `<div dir="${isAr ? "rtl" : "ltr"}" style="font-family:Arial,sans-serif;font-size:12px;color:#9CA3AF;text-align:center;padding:24px 16px;">
    <p style="margin:0 0 6px;">${line}</p>
    <p style="margin:0;"><a href="${unsubUrl}" style="color:#6B7280;text-decoration:underline;">${label}</a></p>
  </div>`;
  return `${html}\n${footer}`;
}
