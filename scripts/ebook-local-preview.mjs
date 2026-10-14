// Load prepared reading pages into an isolated local database for review.
// Never reads .env or writes to a remote database.
import { PrismaClient } from "@prisma/client";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT } from "jose";
const url = process.env.EBOOK_TEST_DATABASE_URL;
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw Error(
    "Set EBOOK_TEST_DATABASE_URL to an isolated local PostgreSQL database.",
  );
const root = path.resolve("private-ebooks/manal-web");
const manifest = JSON.parse(
  await readFile(path.join(root, "manifest.json"), "utf8"),
);
const db = new PrismaClient({ datasourceUrl: url });
try {
  const book = await db.ebook.upsert({
    where: { slug: "manal-366-days" },
    create: {
      slug: "manal-366-days",
      titleEn: "366 Mistakes That Lead to Business Failure",
      titleAr: manifest.title,
      author: "Dr. Manal Hassoun",
      priceCents: 500,
      direction: "rtl",
      published: false,
      coverUrl: "/images/ebooks/manal-366-cover.webp",
      descriptionEn:
        "Manal’s approved 366-day reading edition. Personal online reading access after payment verification.",
      descriptionAr:
        "نسخة منال المعتمدة للقراءة اليومية. وصول شخصي للقراءة على الموقع بعد التحقق من الدفع.",
    },
    update: {},
  });
  const version = await db.ebookVersion.create({
    data: {
      ebookId: book.id,
      label: "Approved 10 October 2026 · " + manifest.sourceSha256.slice(0, 10),
      pageCount: manifest.pageCount,
      ready: true,
      pages: {
        create: manifest.pages.map((file, index) => ({
          number: index + 1,
          storagePath: "manal-web/" + file,
        })),
      },
    },
  });
  await db.ebook.update({
    where: { id: book.id },
    data: { activeVersionId: version.id },
  });
  const reader = await db.ebookReader.upsert({
    where: { email: "reader@ebook-preview.invalid" },
    create: { email: "reader@ebook-preview.invalid" },
    update: {},
  });
  const order = await db.ebookOrder.create({
    data: {
      reference: "PREVIEW-" + randomBytes(8).toString("hex"),
      readerId: reader.id,
      ebookId: book.id,
      title: book.titleEn,
      customerName: "Local preview reader",
      locale: "en",
      priceCents: 500,
      method: "WHISH",
      snapshot: {},
      state: "VERIFIED",
    },
  });
  await db.ebookAccess.upsert({
    where: { readerId_ebookId: { readerId: reader.id, ebookId: book.id } },
    create: { orderId: order.id, readerId: reader.id, ebookId: book.id },
    update: { orderId: order.id, active: true },
  });
  const token = randomBytes(32).toString("hex");
  await db.ebookSession.create({
    data: {
      id: createHash("sha256").update(token).digest("hex"),
      readerId: reader.id,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  const admin = await db.user.upsert({
    where: { email: "admin@ebook-preview.invalid" },
    create: {
      email: "admin@ebook-preview.invalid",
      name: "Local preview admin",
      password: "unused",
      role: "ADMIN",
    },
    update: {},
  });
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw Error("Set a local JWT_SECRET before generating preview sessions");
  const adminToken = await new SignJWT({
    userId: admin.id,
    email: admin.email,
    role: "ADMIN",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(secret));
  await mkdir("private-ebooks", { recursive: true });
  await writeFile(
    "private-ebooks/preview.json",
    JSON.stringify(
      { bookId: book.id, orderId: order.id, readerToken: token, adminToken },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      bookId: book.id,
      price: "$5",
      pages: manifest.pageCount,
      published: false,
    }),
  );
} finally {
  await db.$disconnect();
}
