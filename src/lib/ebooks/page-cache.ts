// Server RAM only. Authorization is still checked before and after every response.
// The reference is part of the key: a reader never receives another order's watermark.
const entries = new Map<string, { bytes: Buffer; expires: number }>();
const pending = new Map<string, Promise<Buffer>>();
let size = 0;
const LIMIT = 32 * 1024 * 1024;
export async function cachedReadingPage(key: string, load: () => Promise<Buffer>) {
  const hit = entries.get(key);
  if (hit && hit.expires > Date.now()) {
    entries.delete(key); entries.set(key, hit); return hit.bytes;
  }
  if (hit) { size -= hit.bytes.length; entries.delete(key); }
  const running = pending.get(key);
  if (running) return running;
  const promise = load().then(bytes => {
    if (bytes.length <= LIMIT) {
      while (size + bytes.length > LIMIT && entries.size) {
        const oldest = entries.keys().next().value!;
        size -= entries.get(oldest)!.bytes.length; entries.delete(oldest);
      }
      entries.set(key, { bytes, expires: Date.now() + 300000 }); size += bytes.length;
    }
    return bytes;
  }).finally(() => pending.delete(key));
  pending.set(key, promise); return promise;
}
