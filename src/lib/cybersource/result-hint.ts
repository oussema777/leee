// Untrusted lookup hint only. No client-side outcome can confirm a payment.
export function paymentResultHint(completion: unknown): string | null {
  if (typeof completion !== 'string' || completion.length > 256 * 1024) return null;
  try {
    const part = completion.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!part) return null;
    const value = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')));
    const id = value.completeResponse?.id ?? value.id;
    return typeof id === 'string' && /^\d{10,30}$/.test(id) ? id : null;
  } catch { return null; }
}
