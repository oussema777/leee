import { beforeEach, expect, it, vi } from "vitest";
import { saveWhishReceipt } from "./whish-receipts";
const mocks = vi.hoisted(() => ({ getBucket: vi.fn(), createBucket: vi.fn(), upload: vi.fn(), from: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ storage: mocks }) }));
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.test"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fixture");
  mocks.from.mockReturnValue({ upload: mocks.upload }); mocks.upload.mockResolvedValue({ error: null });
});
it("refuses to upload receipts into a public bucket", async () => {
  mocks.getBucket.mockResolvedValue({ data: { public: true }, error: null });
  await expect(saveWhishReceipt("payment-1", Buffer.from("cleaned"))).rejects.toThrow("Private");
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("creates private storage with a size and image type restriction", async () => {
  mocks.getBucket.mockResolvedValue({ error: { message: "missing" } }); mocks.createBucket.mockResolvedValue({ error: null });
  const path = await saveWhishReceipt("payment-1", Buffer.from("cleaned"));
  expect(mocks.createBucket).toHaveBeenCalledWith("book-whish-receipts", { public: false, fileSizeLimit: 2097152, allowedMimeTypes: ["image/webp"] });
  expect(path).toMatch(/^payment-1\/[a-f0-9-]+\.webp$/);
  expect(mocks.upload).toHaveBeenCalledWith(path, expect.any(Buffer), { contentType: "image/webp", upsert: false });
});
it("rechecks privacy after a concurrent bucket creation", async () => {
  mocks.getBucket.mockResolvedValueOnce({ error: {} }).mockResolvedValueOnce({ data: { public: true }, error: null });
  mocks.createBucket.mockResolvedValue({ error: { message: "already exists" } });
  await expect(saveWhishReceipt("payment-1", Buffer.from("cleaned"))).rejects.toThrow("privately");
  expect(mocks.upload).not.toHaveBeenCalled();
});
