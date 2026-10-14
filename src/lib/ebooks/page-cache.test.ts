import { expect, it, vi } from "vitest";
import { cachedReadingPage } from "./page-cache";
it("deduplicates concurrent rendering but isolates watermark identities", async () => {
  const render = vi.fn(async () => Buffer.from("order A"));
  const [a, b] = await Promise.all([cachedReadingPage("page:order-A", render), cachedReadingPage("page:order-A", render)]);
  expect(a).toEqual(b); expect(render).toHaveBeenCalledTimes(1);
  const other = await cachedReadingPage("page:order-B", async () => Buffer.from("order B"));
  expect(other).not.toEqual(a);
});
it("does not retain failed renders", async () => {
  await expect(cachedReadingPage("failed-page", async () => { throw Error("storage offline"); })).rejects.toThrow("offline");
  expect(await cachedReadingPage("failed-page", async () => Buffer.from("retry"))).toEqual(Buffer.from("retry"));
});
it("expires processed images", async () => {
  const now = vi.spyOn(Date, "now");
  try {
    now.mockReturnValue(1000);
    await cachedReadingPage("expiring-page", async () => Buffer.from("old"));
    now.mockReturnValue(302000);
    expect(await cachedReadingPage("expiring-page", async () => Buffer.from("new"))).toEqual(Buffer.from("new"));
  } finally { now.mockRestore(); }
});
