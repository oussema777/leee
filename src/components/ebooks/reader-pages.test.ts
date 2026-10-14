import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ReaderPages } from "./reader-pages";
const fetcher = vi.fn(), revoke = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetcher); fetcher.mockResolvedValue(new Response("page", { headers: { "Content-Type": "image/webp" } }));
  // Each request needs an unconsumed response body.
  fetcher.mockImplementation(async () => new Response("page", { headers: { "Content-Type": "image/webp" } }));
  vi.stubGlobal("Image", class { src = ""; async decode() {} });
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:" + Math.random());
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(revoke);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); fetcher.mockReset(); revoke.mockClear(); });
it("reuses decoded nearby pages and in-flight requests", async () => {
  const pages = new ReaderPages("book", () => {}, () => {});
  const [first, second] = await Promise.all([pages.get(1), pages.get(1)]);
  expect(first.url).toBe(second.url); expect(fetcher).toHaveBeenCalledTimes(1);
  expect((await pages.get(1)).url).toBe(first.url); expect(fetcher).toHaveBeenCalledTimes(1);
  pages.clear(); expect(revoke).toHaveBeenCalledWith(first.url);
});
it("caps resident pages and clears all images on access denial", async () => {
  const denied = vi.fn(), pages = new ReaderPages("book", () => {}, denied);
  for (let page = 1; page <= 20; page++) await pages.get(page);
  expect(pages.snapshot().size).toBe(16);
  fetcher.mockImplementation(async () => Response.json({ error: "Access revoked" }, { status: 403 }));
  await expect(pages.get(21)).rejects.toThrow("Access revoked");
  expect(denied).toHaveBeenCalledOnce(); expect(pages.snapshot().size).toBe(0);
});
it("revalidates expired cached pages without replacing their decoded image", async () => {
  const pages = new ReaderPages("book", () => {}, () => {}), now = vi.spyOn(Date, "now");
  now.mockReturnValue(1000); const first = await pages.get(1);
  now.mockReturnValue(121000); expect((await pages.get(1)).url).toBe(first.url);
  expect(fetcher).toHaveBeenCalledTimes(1);
  now.mockReturnValue(302000); const again = await pages.get(1);
  expect(fetcher).toHaveBeenCalledTimes(2); expect(again.url).toBe(first.url); pages.clear();
});
it("does not reuse a revoked image when a refresh finishes after eviction", async () => {
  const pages = new ReaderPages("book", () => {}, () => {}), now = vi.spyOn(Date, "now");
  now.mockReturnValue(1000); const first = await pages.get(1);
  now.mockReturnValue(302000);
  let release!: (response: Response) => void;
  fetcher.mockImplementationOnce(() => new Promise<Response>(resolve => { release = resolve; }));
  const refresh = pages.get(1);
  await vi.waitFor(() => expect(release).toBeTypeOf("function"));
  pages.trim(50, 51);
  release(new Response("refreshed"));
  expect((await refresh).url).not.toBe(first.url);
  expect(revoke).toHaveBeenCalledWith(first.url);
  pages.clear();
});
it("keeps a replacement request deduplicated when an old aborted request finishes", async () => {
  const pages = new ReaderPages("book", () => {}, () => {});
  const releases: ((response: Response) => void)[] = [];
  fetcher.mockImplementation(() => new Promise<Response>(resolve => releases.push(resolve)));
  const old = pages.get(1);
  const rejection = expect(old).rejects.toMatchObject({ name: "AbortError" });
  await vi.waitFor(() => expect(releases).toHaveLength(1));
  pages.clear();
  const replacement = pages.get(1);
  await vi.waitFor(() => expect(releases).toHaveLength(2));
  releases[0](new Response("old")); await rejection;
  const duplicate = pages.get(1);
  expect(fetcher).toHaveBeenCalledTimes(2);
  releases[1](new Response("new"));
  expect((await replacement).url).toBe((await duplicate).url);
  pages.clear();
});
