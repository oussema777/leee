/**
 * Minimal in-memory per-key rate limiter for public endpoints.
 * Good enough for this site's traffic; resets on server restart and is
 * per-instance (fine on a single Vercel region / dev). Not a security
 * boundary — a damage limiter.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Returns true if the call is allowed, false if over the limit. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count++;
  return true;
}

/** Best-effort client IP (behind Vercel/proxies). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}
