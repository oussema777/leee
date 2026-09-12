import { Resend } from "resend";

/**
 * Outbound email for form/application notifications.
 *
 * Sends to the team inbox (EMAIL_TO, default info@theleeexperience.com) via Resend.
 * Designed to be non-blocking and fail-safe: if RESEND_API_KEY is not configured,
 * or sending fails, it logs and returns without throwing — form submissions must
 * still succeed regardless of email delivery.
 *
 * Required env (set in Vercel):
 *   RESEND_API_KEY  — Resend API key
 *   EMAIL_FROM      — verified sender, e.g. "The LEE Experience <noreply@theleeexperience.com>"
 *   EMAIL_TO        — recipient, defaults to info@theleeexperience.com
 */

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM || "The LEE Experience <noreply@theleeexperience.com>";
const TO = process.env.EMAIL_TO || "info@theleeexperience.com";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export type EmailField = { label: string; value?: string | null };

export type EmailPresentation = {
  eyebrow?: string;
  direction?: "ltr" | "rtl";
  footer?: string;
  accent?: "blue" | "amber";
};

/** Renders an email-client-safe LEE card with an optional Phoenix treatment. */
export function renderNotification(
  heading: string,
  intro: string,
  fields: EmailField[],
  action?: { href: string; label: string },
  presentation: EmailPresentation = {},
): string {
  const direction = presentation.direction === "rtl" ? "rtl" : "ltr";
  const accent = presentation.accent === "amber" ? "#F2A65A" : "#62A9E6";
  const eyebrow = presentation.eyebrow || "THE LEE EXPERIENCE";
  const footer = presentation.footer || "Questions? Our team is ready to help.";
  const rows = fields
    .filter((f) => f.value != null && String(f.value).trim() !== "")
    .map(
      (f) => `<tr>
        <td style="padding:15px 18px;color:#667085;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;vertical-align:top;border-bottom:1px solid #E7EDF3;">${escapeHtml(f.label)}</td>
        <td style="padding:15px 18px;color:#102A43;font-size:14px;font-weight:600;line-height:1.55;vertical-align:top;border-bottom:1px solid #E7EDF3;white-space:pre-wrap;">${escapeHtml(String(f.value))}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="${direction === "rtl" ? "ar" : "en"}" dir="${direction}">
<head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#EEF3F7;font-family:Arial,Helvetica,sans-serif;color:#102A43;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(intro)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#EEF3F7;">
    <tr><td align="center" style="padding:36px 14px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border-collapse:separate;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 44px rgba(13,43,102,.12);">
        <tr><td style="height:6px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="background:#0D2B66;padding:28px 34px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:middle;">
              <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;border-radius:50%;background:${accent};color:#0D2B66;font-size:17px;font-weight:900;">L</span>
              <span style="padding-${direction === "rtl" ? "right" : "left"}:10px;color:#ffffff;font-size:12px;font-weight:800;letter-spacing:.13em;vertical-align:middle;">THE LEE EXPERIENCE</span>
            </td>
          </tr></table>
          <p style="margin:28px 0 10px;color:${accent};font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-.02em;">${escapeHtml(heading)}</h1>
          <p style="margin:14px 0 0;max-width:510px;color:#D9E6F2;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
        </td></tr>
        <tr><td style="padding:30px 34px 10px;background:#ffffff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border:1px solid #E0E8F0;border-radius:12px;border-collapse:separate;overflow:hidden;background:#F9FBFC;">${rows}</table>
          ${action && /^https?:\/\//.test(action.href) ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 8px;"><tr><td style="border-radius:9px;background:${accent};"><a href="${escapeHtml(action.href)}" style="display:inline-block;padding:14px 22px;color:#0D2B66;font-size:14px;font-weight:800;text-decoration:none;">${escapeHtml(action.label)} &nbsp;→</a></td></tr></table>` : ""}
        </td></tr>
        <tr><td style="padding:22px 34px 30px;background:#ffffff;">
          <div style="height:1px;background:#E7EDF3;"></div>
          <p style="margin:20px 0 6px;color:#526779;font-size:13px;line-height:1.6;">${escapeHtml(footer)}</p>
          <p style="margin:0;color:#8292A3;font-size:12px;line-height:1.6;"><a href="mailto:info@theleeexperience.com" style="color:#0D5EA6;text-decoration:none;font-weight:700;">info@theleeexperience.com</a> &nbsp;•&nbsp; theleeexperience.com</p>
        </td></tr>
      </table>
      <p style="margin:18px 0 0;color:#8998A7;font-size:11px;line-height:1.5;">© ${new Date().getFullYear()} The LEE Experience. Books moving forward, responsibly.</p>
    </td></tr>
  </table>
</body></html>`;
}

/** Sends a notification email to the team inbox. Never throws. */
export async function sendNotificationEmail(opts: {
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set; skipping notification: ${opts.subject}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    if (error) console.error("[email] Resend returned error:", error);
  } catch (err) {
    console.error("[email] Failed to send notification:", err);
  }
}

/** Sends an order update only to the purchaser's supplied email. Never throws. */
export async function sendTransactionalEmail(opts: { to: string; subject: string; html: string; replyTo?: string }): Promise<void> {
  if (!resend) return;
  try {
    const { error } = await resend.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html, replyTo: opts.replyTo || TO });
    if (error) console.error("[email] Order email delivery failed:", error.name);
  } catch {
    console.error("[email] Order email delivery failed");
  }
}

export interface BatchEmail {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}

const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || FROM;
const NEWSLETTER_REPLY_TO = process.env.NEWSLETTER_REPLY_TO;

/**
 * Sends a batch of distinct newsletter emails in one request.
 * `idempotencyKey` makes a retried identical batch a no-op at Resend.
 * Returns Resend's per-email ids, or throws so the drainer can mark the batch failed.
 */
export async function sendNewsletterBatch(
  emails: BatchEmail[],
  idempotencyKey: string,
  campaignId: string
): Promise<{ id: string }[]> {
  if (!resend) throw new Error("RESEND_API_KEY not set");
  const payload = emails.map((e) => ({
    from: NEWSLETTER_FROM,
    to: e.to,
    subject: e.subject,
    html: e.html,
    replyTo: NEWSLETTER_REPLY_TO,
    headers: e.headers,
    tags: [{ name: "campaignId", value: campaignId }],
  }));
  const { data, error } = await resend.batch.send(payload, { idempotencyKey });
  if (error) throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  return (data?.data ?? []) as { id: string }[];
}
