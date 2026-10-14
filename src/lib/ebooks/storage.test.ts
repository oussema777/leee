import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getBucket: vi.fn(),
  createBucket: vi.fn(),
  from: vi.fn(),
  upload: vi.fn(),
  download: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ storage: mocks }),
}));
import { readPrivate, savePrivate } from "./storage";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fixture");
  vi.stubEnv("EBOOK_LOCAL_STORAGE_ROOT", "");
  mocks.from.mockReturnValue({
    upload: mocks.upload,
    download: mocks.download,
  });
});
it("refuses uploads and reads if the ebook bucket becomes public", async () => {
  mocks.getBucket.mockResolvedValue({ data: { public: true }, error: null });
  await expect(
    savePrivate("pages/version", Buffer.from("page")),
  ).rejects.toThrow("private");
  await expect(readPrivate("pages/version/one.webp")).rejects.toThrow(
    "unavailable",
  );
  expect(mocks.download).toHaveBeenCalledOnce();
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("downloads while privacy is checked but releases no bytes before that check", async () => {
  let release!: (value: unknown) => void;
  mocks.getBucket.mockReturnValue(new Promise(resolve => { release = resolve; }));
  mocks.download.mockResolvedValue({ data: new Blob(["page"]), error: null });
  const reading = readPrivate("pages/version/one.webp");
  expect(mocks.download).toHaveBeenCalledOnce();
  release({ data: { public: false }, error: null });
  expect((await reading).toString()).toBe("page");
  expect(mocks.createBucket).not.toHaveBeenCalled();
});
it("rechecks privacy after bucket creation, including creation races", async () => {
  mocks.getBucket
    .mockResolvedValueOnce({ error: {} })
    .mockResolvedValueOnce({ data: { public: true } });
  mocks.createBucket.mockResolvedValue({ error: {} });
  await expect(
    savePrivate("pages/version", Buffer.from("page")),
  ).rejects.toThrow("unavailable");
  expect(mocks.upload).not.toHaveBeenCalled();
});
