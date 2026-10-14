import { afterEach, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
it("probes AVIF decoding once", async () => {
  const decode = vi.fn(async () => {});
  vi.stubGlobal("Image", class { src = ""; decode = decode; });
  const { supportsReaderAvif } = await import("./reader-format");
  expect(await supportsReaderAvif()).toBe(true);
  expect(await supportsReaderAvif()).toBe(true);
  expect(decode).toHaveBeenCalledOnce();
});
it("falls back when the browser cannot decode AVIF", async () => {
  vi.stubGlobal("Image", class { src = ""; async decode() { throw Error("Unsupported"); } });
  const { supportsReaderAvif } = await import("./reader-format");
  expect(await supportsReaderAvif()).toBe(false);
});
