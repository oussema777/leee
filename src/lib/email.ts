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

/** Renders a simple, branded HTML email body with a details table. */
export function renderNotification(heading: string, intro: string, fields: EmailField[]): string {
  const rows = fields
    .filter((f) => f.value != null && String(f.value).trim() !== "")
    .map(
      (f) => `<tr>
        <td style="padding:8px 14px;color:#4B5563;font-size:13px;font-weight:600;white-space:nowrap;vertical-align:top;border-bottom:1px solid #E8F1FB;">${escapeHtml(f.label)}</td>
        <td style="padding:8px 14px;color:#111827;font-size:14px;vertical-align:top;border-bottom:1px solid #E8F1FB;white-space:pre-wrap;">${escapeHtml(String(f.value))}</td>
      </tr>`
    )
    .join("");

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#E8F1FB;padding:24px;">
    <div style="background:#1B3A5C;padding:18px 24px;border-radius:8px 8px 0 0;">
      <h1 style="color:#ffffff;font-size:18px;margin:0;font-weight:600;">${escapeHtml(heading)}</h1>
    </div>
    <div style="border:1px solid #C0D6EE;border-top:none;border-radius:0 0 8px 8px;padding:20px 24px;background:#ffffff;">
      <p style="color:#4B5563;font-size:14px;margin:0 0 16px;">${escapeHtml(intro)}</p>
      <table style="border-collapse:collapse;width:100%;">${rows}</table>
      <p style="color:#9CA3AF;font-size:12px;margin:18px 0 0;">Sent automatically from theleeexperience.com</p>
    </div>
  </div>`;
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
