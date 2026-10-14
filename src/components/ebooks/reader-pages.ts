import { EbookClientError } from "./client";
import { supportsReaderAvif } from "./reader-format";
export type ReaderSheet = { page: number; url: string; loadedAt: number };

/** A small, temporary RAM buffer; no localStorage, service worker or full-book fetch. */
export class ReaderPages {
  private pages = new Map<number, ReaderSheet>();
  private pending = new Map<number, Promise<ReaderSheet>>();
  private controller = new AbortController();
  private generation = 0;
  constructor(private id: string, private changed: () => void, private denied: (e: EbookClientError) => void) {}
  snapshot() { return new Map(this.pages); }
  async get(page: number): Promise<ReaderSheet> {
    const cached = this.pages.get(page);
    // A reader may spend several minutes on one page. Keep the next spread
    // ready for that reading pace; the reader's separate access heartbeat
    // still clears this entire buffer on expiry/revocation.
    if (cached && Date.now() - cached.loadedAt < 300000) return cached;
    const running = this.pending.get(page);
    if (running) return running;
    const signal = this.controller.signal;
    const task = (async () => {
      let url = "";
      try {
        const avif = await supportsReaderAvif();
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        const response = await fetch(`/api/ebooks/read/${this.id}?page=${page}`, { cache: "no-store", signal, headers: { Accept: avif ? "image/avif,image/webp" : "image/webp" } });
        if (!response.ok) {
          const data = await response.json();
          throw new EbookClientError(data.error || "Unable to load page", response.status);
        }
        const blob = await response.blob();
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        url = URL.createObjectURL(blob);
        const image = new Image(); image.src = url; await image.decode();
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        // A refresh of the same immutable page can keep its existing decoded URL.
        if (cached && this.pages.get(page) === cached) { URL.revokeObjectURL(url); url = cached.url; }
        const sheet = { page, url, loadedAt: Date.now() };
        this.pages.set(page, sheet);
        while (this.pages.size > 16) {
          const oldest = this.pages.keys().next().value!;
          URL.revokeObjectURL(this.pages.get(oldest)!.url); this.pages.delete(oldest);
        }
        this.changed(); return sheet;
      } catch (e) {
        if (url) URL.revokeObjectURL(url);
        if (e instanceof EbookClientError && [401, 403].includes(e.status)) { this.clear(); this.denied(e); }
        throw e;
      } finally { if (this.controller.signal === signal) this.pending.delete(page); }
    })();
    this.pending.set(page, task); return task;
  }
  warm(start: number, end: number, count: number) {
    const generation = ++this.generation;
    // Two upcoming spreads, then the preceding spread; never the whole ebook.
    const wanted = [end + 1, end + 2, end + 3, end + 4, start - 1, start - 2].filter(n => n >= 1 && n <= count);
    void (async () => {
      for (let i = 0; i < wanted.length && generation === this.generation; i += 2)
        await Promise.allSettled(wanted.slice(i, i + 2).map(n => this.get(n)));
    })();
  }
  trim(start: number, end: number) {
    for (const [number, sheet] of this.pages) {
      if (number < start - 6 || number > end + 6) { URL.revokeObjectURL(sheet.url); this.pages.delete(number); }
    }
    this.changed();
  }
  clear() {
    this.generation++; this.controller.abort(); this.controller = new AbortController();
    this.pages.forEach(sheet => URL.revokeObjectURL(sheet.url)); this.pages.clear(); this.pending.clear(); this.changed();
  }
}
