import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";

// Opt-in only. Never use the configured application/production database for tests.
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const url =
    process.env.EBOOK_TEST_DATABASE_URL ||
    "postgresql://postgres@127.0.0.1:55439/postgres";
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw Error("Ebook tests require an isolated local database");
  return { db: new PrismaClient({ datasourceUrl: url }) };
});
const mail = vi.hoisted(() => ({ send: vi.fn(async () => ({ error: null })) }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mail.send };
  },
}));
vi.mock("./storage", () => ({
  readPrivate: vi.fn(async () => Buffer.from("private-page")),
  watermark: vi.fn(async (bytes: Buffer) => bytes),
  savePrivate: vi.fn(async () => "receipts/test.webp"),
}));
import { db } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { hash, codeDigest, limited } from "./server";
import { POST as login } from "@/app/api/ebooks/auth/route";
import { POST as checkout, GET as library } from "@/app/api/ebooks/orders/route";
import {
  GET as viewOrder,
  POST as report,
} from "@/app/api/ebooks/orders/[id]/route";
import { GET as read, PUT as progress, PATCH as bookmark } from "@/app/api/ebooks/read/[id]/route";
import { POST as review } from "@/app/api/admin/ebook-orders/[id]/route";
import { POST as physicalReview } from "@/app/api/admin/book-orders/[id]/whish/route";

describe.skipIf(!process.env.EBOOK_TEST_DATABASE_URL)(
  "ebook purchase integration (isolated PostgreSQL)",
  () => {
    let adminCookie: string;
    let cookie: string;
    let ebookId: string;
    let readerId: string;
    const origin = "http://localhost:3107";
    const testIp = "test-run-" + randomUUID();
    function request(
      path: string,
      method = "GET",
      data?: unknown,
      token = cookie,
    ) {
      return new NextRequest(origin + path, {
        method,
        headers: {
          origin,
          "x-forwarded-for": testIp,
          cookie: token,
          ...(data instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
        },
        ...(data === undefined
          ? {}
          : { body: data instanceof FormData ? data : JSON.stringify(data) }),
      });
    }
    const context = (id: string) => ({ params: Promise.resolve({ id }) });
    async function newOrder() {
      const response = await checkout(
        request("/api/ebooks/orders", "POST", {
          ebookId,
          customerName: "Test Reader",
          method: "WHISH",
          locale: "en",
          termsAccepted: true,
          priceCents: 1,
        }),
      );
      expect(response.status).toBe(200);
      return (await response.json()).id as string;
    }
    async function submit(id: string) {
      const form = new FormData();
      form.set("transactionReference", "TX-" + randomUUID());
      const response = await report(
        request(`/api/ebooks/orders/${id}`, "POST", form),
        context(id),
      );
      expect(response.status).toBe(200);
    }
    async function action(id: string, action: string, extra = {}) {
      const order = await db.ebookOrder.findUniqueOrThrow({ where: { id } });
      return review(
        request(
          `/api/admin/ebook-orders/${id}`,
          "POST",
          {
            action,
            expectedUpdatedAt: order.updatedAt.toISOString(),
            note: "Test review",
            ...extra,
          },
          adminCookie,
        ),
        context(id),
      );
    }
    const verification = () => ({
      checkedWallet: true,
      transactionReference: "VERIFIED-" + randomUUID(),
      receivedAmountCents: 500,
      currency: "USD",
    });
    beforeAll(async () => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", origin);
      vi.stubEnv("EBOOK_AUTH_SECRET", "test-ebook-secret-32-characters-long");
      vi.stubEnv("RESEND_API_KEY", "test-only");
      const admin = await db.user.create({
        data: {
          email: randomUUID() + "@test.invalid",
          password: "unused",
          name: "Test admin",
          role: "ADMIN",
        },
      });
      adminCookie =
        "admin-token=" +
        (await createToken({
          userId: admin.id,
          email: admin.email,
          role: admin.role,
        }));
      await db.bookWhishSettings.upsert({
        where: { id: "book-restore" },
        create: { id: "book-restore", updatedBy: admin.id, config: {} },
        update: {},
      });
      await db.bookWhishSettings.update({
        where: { id: "book-restore" },
        data: {
          config: {
            enabled: true,
            accountName: "Test",
            accountNumber: "12345678",
            supportPhone: "9613600747",
            holdHours: 24,
            qrImageUrl: "/test-qr.webp",
            qrVerified: true,
          },
        },
      });
    });
    beforeEach(async () => {
      mail.send.mockResolvedValue({ error: null });
      const reader = await db.ebookReader.create({
        data: { email: randomUUID() + "@test.invalid" },
      });
      readerId = reader.id;
      const token = randomUUID().replaceAll("-", "").repeat(2);
      cookie = "ebook-reader=" + token;
      await db.ebookSession.create({
        data: {
          id: hash(token),
          readerId,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      const book = await db.ebook.create({
        data: {
          slug: "test-" + randomUUID(),
          titleEn: "Test ebook",
          author: "Author",
          priceCents: 500,
        },
      });
      ebookId = book.id;
      const version = await db.ebookVersion.create({
        data: {
          ebookId,
          label: "Approved",
          pageCount: 2,
          ready: true,
          pages: {
            create: [
              { number: 1, storagePath: "one.webp" },
              { number: 2, storagePath: "two.webp" },
            ],
          },
        },
      });
      await db.ebook.update({
        where: { id: ebookId },
        data: { published: true, activeVersionId: version.id },
      });
    });
    afterAll(async () => {
      await db.$disconnect();
      vi.unstubAllEnvs();
    });
    it("checks server price, reuses pending checkout, prevents cross-account reads, grants and refunds atomically", async () => {
      const id = await newOrder();
      expect(await newOrder()).toBe(id);
      expect(
        (await db.ebookOrder.findUniqueOrThrow({ where: { id } })).priceCents,
      ).toBe(500);
      expect(
        (
          await read(
            request(`/api/ebooks/read/${ebookId}?page=1`),
            context(ebookId),
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await viewOrder(
            request(`/api/ebooks/orders/${id}`, "GET", undefined, ""),
            context(id),
          )
        ).status,
      ).toBe(401);
      await submit(id);
      expect(
        (
          await read(
            request(`/api/ebooks/read/${ebookId}?page=1`),
            context(ebookId),
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await action(id, "VERIFY", {
            ...verification(),
            receivedAmountCents: 400,
          })
        ).status,
      ).toBe(400);
      expect(await db.ebookAccess.count({ where: { orderId: id } })).toBe(0);
      expect((await action(id, "VERIFY", verification())).status).toBe(200);
      const page = await read(
        request(`/api/ebooks/read/${ebookId}?page=1`),
        context(ebookId),
      );
      expect(page.status).toBe(200);
      expect(page.headers.get("cache-control")).toContain("no-store");
      expect(await page.text()).toBe("private-page");
      expect(
        (
          await read(
            request(`/api/ebooks/read/${ebookId}?page=3`),
            context(ebookId),
          )
        ).status,
      ).toBe(404);
      const book = await db.ebook.findUniqueOrThrow({ where: { id: ebookId } });
      expect(
        (
          await progress(
            request(`/api/ebooks/read/${ebookId}`, "PUT", {
              page: 2,
              versionId: book.activeVersionId,
            }),
            context(ebookId),
          )
        ).status,
      ).toBe(200);
      expect(
        (await db.ebookAccess.findUniqueOrThrow({ where: { orderId: id } }))
          .lastPage,
      ).toBe(2);
      await db.ebook.update({
        where: { id: ebookId },
        data: { published: false },
      });
      expect(
        (
          await read(
            request(`/api/ebooks/read/${ebookId}?page=1`),
            context(ebookId),
          )
        ).status,
      ).toBe(200);
      expect((await action(id, "REFUND", { checkedWallet: true })).status).toBe(
        200,
      );
      expect(
        (
          await read(
            request(`/api/ebooks/read/${ebookId}?page=1`),
            context(ebookId),
          )
        ).status,
      ).toBe(403);
      expect((await action(id, "RESTORE")).status).toBe(400);
    });
    it("persists version-scoped bookmarks and rejects invalid or unauthorized changes", async () => {
      const id = await newOrder();
      await submit(id);
      expect((await action(id, "VERIFY", verification())).status).toBe(200);
      const book = await db.ebook.findUniqueOrThrow({ where: { id: ebookId } });
      const data = { action: "save", page: 2, versionId: book.activeVersionId, label: "Return here" };
      const patch = (input = data, token = cookie) => bookmark(request(`/api/ebooks/read/${ebookId}`, "PATCH", input, token), context(ebookId));
      expect((await patch()).status).toBe(200);
      expect((await patch({ ...data, label: "Updated label" })).status).toBe(200);
      const metadata = await (await read(request(`/api/ebooks/read/${ebookId}`), context(ebookId))).json();
      expect(metadata.bookmarks).toEqual([{ page: 2, label: "Updated label" }]);
      expect((await patch({ ...data, page: 3 })).status).toBe(409);
      expect((await patch({ ...data, versionId: "old-edition" })).status).toBe(409);
      expect((await patch({ ...data, label: "x".repeat(121) })).status).toBe(400);
      expect((await patch(data, "")).status).toBe(401);
      expect((await patch(data, adminCookie)).status).toBe(401);
      const outsider = await db.ebookReader.create({ data: { email: randomUUID() + "@test.invalid" } });
      const token = randomUUID().replaceAll("-", "").repeat(2);
      await db.ebookSession.create({ data: { id: hash(token), readerId: outsider.id, expiresAt: new Date(Date.now() + 3600000) } });
      expect((await patch(data, "ebook-reader=" + token)).status).toBe(403);
      const cross = new NextRequest(origin + `/api/ebooks/read/${ebookId}`, { method: "PATCH", headers: { origin: "https://evil.invalid", cookie, "Content-Type": "application/json" }, body: JSON.stringify(data) });
      expect((await bookmark(cross, context(ebookId))).status).toBe(403);
      expect((await patch({ ...data, action: "remove" })).status).toBe(200);
      expect((await (await read(request(`/api/ebooks/read/${ebookId}`), context(ebookId))).json()).bookmarks).toEqual([]);
      await action(id, "REFUND", { checkedWallet: true });
      expect((await patch()).status).toBe(403);
    });
    it("exposes explicitly granted test reading locally without verifying payment", async () => {
      const id = await newOrder();
      const original = process.env.NODE_ENV;
      const order = await db.ebookOrder.findUniqueOrThrow({ where: { id } });
      await db.ebookOrder.update({ where: { id }, data: { reference: "EB-TEST-" + randomUUID(), snapshot: { testMode: true } } });
      await db.ebookAccess.create({ data: { readerId, ebookId, orderId: id } });
      await db.ebookOrderEvent.create({ data: { orderId: id, actor: "test", action: "LOCAL_READER_PREVIEW", details: { expiresAt: new Date(Date.now() + 60000).toISOString() } } });
      try {
        vi.stubEnv("NODE_ENV", "development");
        const localLibrary = await (await library(request("/api/ebooks/orders"))).json();
        expect(localLibrary.access).toHaveLength(1);
        expect(localLibrary.access[0].preview).toBe(true);
        expect((await (await viewOrder(request(`/api/ebooks/orders/${id}`), context(id))).json()).access).toBe(true);
        expect((await read(request(`/api/ebooks/read/${ebookId}?page=1`), context(ebookId))).status).toBe(200);
        expect((await (await read(request(`/api/ebooks/read/${ebookId}`), context(ebookId))).json()).preview).toBe(true);
        vi.stubEnv("NODE_ENV", "production");
        expect((await (await viewOrder(request(`/api/ebooks/orders/${id}`), context(id))).json()).access).toBe(false);
        expect((await read(request(`/api/ebooks/read/${ebookId}?page=1`), context(ebookId))).status).toBe(403);
        expect((await (await library(request("/api/ebooks/orders"))).json()).access).toEqual([]);
        expect((await db.ebookOrder.findUniqueOrThrow({ where: { id } })).state).toBe(order.state);
        vi.stubEnv("NODE_ENV", "development");
        await db.ebookOrderEvent.updateMany({ where: { orderId: id, action: "LOCAL_READER_PREVIEW" }, data: { details: { expiresAt: new Date(Date.now() - 1000).toISOString() } } });
        expect((await (await viewOrder(request(`/api/ebooks/orders/${id}`), context(id))).json()).access).toBe(false);
      } finally { vi.stubEnv("NODE_ENV", original); }
    });
    it("enforces rate limits atomically and resets expired windows using UTC", async () => {
      const key = "rate-test:" + randomUUID();
      const results = await Promise.all(Array.from({ length: 12 }, () => limited(key, 5, 30)));
      expect(results.filter(Boolean)).toHaveLength(5);
      const record = await db.ebookRateLimit.findUniqueOrThrow({ where: { key } });
      expect(record.expiresAt.getTime() - Date.now()).toBeGreaterThan(25000);
      expect(record.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(30000);
      await db.ebookRateLimit.update({ where: { key }, data: { expiresAt: new Date(Date.now() - 1000) } });
      expect(await limited(key, 5, 30)).toBe(true);
      expect((await db.ebookRateLimit.findUniqueOrThrow({ where: { key } })).count).toBe(1);
    });
    it("charges each page once, preserves metadata access at the limit and resets expired read windows", async () => {
      const id = await newOrder(); await submit(id); await action(id, "VERIFY", verification());
      const key = "read:" + readerId;
      await db.ebookRateLimit.upsert({ where: { key }, create: { key, count: 179, expiresAt: new Date(Date.now() + 60000) }, update: { count: 179, expiresAt: new Date(Date.now() + 60000) } });
      const response = () => read(request(`/api/ebooks/read/${ebookId}?page=1`), context(ebookId));
      expect((await response()).status).toBe(200);
      expect((await db.ebookRateLimit.findUniqueOrThrow({ where: { key } })).count).toBe(180);
      expect((await response()).status).toBe(429);
      expect((await read(request(`/api/ebooks/read/${ebookId}`), context(ebookId))).status).toBe(200);
      await db.ebookRateLimit.update({ where: { key }, data: { expiresAt: new Date(Date.now() - 1000) } });
      expect((await response()).status).toBe(200);
      expect((await db.ebookRateLimit.findUniqueOrThrow({ where: { key } })).count).toBe(1);
    });
    it("rejects cross-origin mutations and administrator cookies at the reader boundary", async () => {
      const cross = new NextRequest(origin + "/api/ebooks/orders", {
        method: "POST",
        headers: { origin: "https://evil.invalid", cookie },
        body: "{}",
      });
      expect((await checkout(cross)).status).toBe(403);
      expect(
        (
          await read(
            request(
              `/api/ebooks/read/${ebookId}?page=1`,
              "GET",
              undefined,
              adminCookie,
            ),
            context(ebookId),
          )
        ).status,
      ).toBe(401);
    });
    it("saves paid access even when sending email fails, and records an unsent outbox entry", async () => {
      const id = await newOrder();
      await submit(id);
      mail.send.mockRejectedValue(Error("offline"));
      expect((await action(id, "VERIFY", verification())).status).toBe(200);
      expect(
        (await db.ebookAccess.findUniqueOrThrow({ where: { orderId: id } }))
          .active,
      ).toBe(true);
      expect(
        await db.ebookEmail.count({ where: { orderId: id, sentAt: null } }),
      ).toBeGreaterThan(0);
    });
    it("serializes double approval and supports revoke/restore with reasons", async () => {
      const id = await newOrder();
      await submit(id);
      const order = await db.ebookOrder.findUniqueOrThrow({ where: { id } });
      const input = {
        action: "VERIFY",
        expectedUpdatedAt: order.updatedAt.toISOString(),
        note: "",
        ...verification(),
      };
      const results = await Promise.all([
        review(
          request("/api/admin/ebook-orders/" + id, "POST", input, adminCookie),
          context(id),
        ),
        review(
          request("/api/admin/ebook-orders/" + id, "POST", input, adminCookie),
          context(id),
        ),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      expect(await db.ebookAccess.count({ where: { orderId: id } })).toBe(1);
      expect((await action(id, "REVOKE")).status).toBe(200);
      expect(
        (
          await read(
            request(`/api/ebooks/read/${ebookId}?page=1`),
            context(ebookId),
          )
        ).status,
      ).toBe(403);
      expect((await action(id, "RESTORE")).status).toBe(200);
      expect(
        (
          await read(
            request(`/api/ebooks/read/${ebookId}?page=1`),
            context(ebookId),
          )
        ).status,
      ).toBe(200);
    });
    it("rejects reuse of an ebook transfer in physical-book payment review", async () => {
      const id = await newOrder();
      await submit(id);
      const input = verification();
      await action(id, "VERIFY", input);
      const order = await db.bookOrder.create({
        data: {
          reference: "PHYS-" + randomUUID(),
          locale: "en",
          package: "SINGLE",
          purpose: "SELF",
          requestedBookCount: 1,
          priceCents: 500,
          customerName: "Test",
          customerPhone: "12345678",
          fulfillmentMethod: "PICKUP",
          paymentMethod: "WHISH",
          whishPayment: {
            create: {
              state: "UNDER_REVIEW",
              accessTokenHash: randomUUID(),
              requestHash: randomUUID(),
              snapshot: {},
              expiresAt: new Date(Date.now() + 3600000),
            },
          },
        },
        include: { whishPayment: true },
      });
      const response = await physicalReview(
        request(
          "/api/admin/book-orders/" + order.id + "/whish",
          "POST",
          {
            action: "VERIFY",
            expectedUpdatedAt: order.whishPayment!.updatedAt.toISOString(),
            note: "",
            ...input,
          },
          adminCookie,
        ),
        context(order.id),
      );
      expect(response.status).toBe(400);
      expect(
        (await db.bookOrder.findUniqueOrThrow({ where: { id: order.id } }))
          .paymentStatus,
      ).toBe("PENDING");
    });
    it("expires and consumes login codes, and persists failed attempts", async () => {
      const email = randomUUID() + "@test.invalid",
        code = "123456";
      await db.ebookLoginCode.create({
        data: {
          email,
          digest: codeDigest(email, code),
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      for (let n = 0; n < 5; n++)
        expect(
          (
            await login(
              request(
                "/api/ebooks/auth",
                "POST",
                { action: "VERIFY", email, code: "000000" },
                "",
              ),
            )
          ).status,
        ).toBe(401);
      expect(
        (
          await login(
            request(
              "/api/ebooks/auth",
              "POST",
              { action: "VERIFY", email, code },
              "",
            ),
          )
        ).status,
      ).toBe(401);
      await db.ebookLoginCode.update({
        where: { email },
        data: { attempts: 0 },
      });
      const response = await login(
        request(
          "/api/ebooks/auth",
          "POST",
          { action: "VERIFY", email, code },
          "",
        ),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("HttpOnly");
      expect(
        (
          await login(
            request(
              "/api/ebooks/auth",
              "POST",
              { action: "VERIFY", email, code },
              "",
            ),
          )
        ).status,
      ).toBe(401);
    });
  },
);
