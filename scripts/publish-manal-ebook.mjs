// Explicit, resumable publication of the approved edition; creates no readers or orders.
// Run with --apply only against the intended website environment.
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const root = path.resolve("private-ebooks/manal-web");
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const expected = "d220b8d77a3394ea8dafbaebcb9805abeacb02ff05a315c85adfa78e45c119f4";
if (manifest.sourceSha256 !== expected || manifest.pageCount !== 385 || manifest.pages.length !== 385)
  throw Error("The approved 385-page edition is required.");
const assets = [];
for (const [index, file] of manifest.pages.entries()) {
  if (file !== `${String(index + 1).padStart(4, "0")}.webp`) throw Error("Unexpected page sequence");
  const bytes = await readFile(path.join(root, file));
  const meta = await sharp(bytes).metadata();
  if (meta.format !== "webp" || bytes.length > 2 * 1024 * 1024) throw Error("Invalid reading page");
  const digest = createHash("sha256").update(bytes).digest("hex");
  assets.push({ number: index + 1, bytes, storagePath: `manal-${expected.slice(0, 16)}/${index + 1}-${digest}.webp` });
}
const editionHash = createHash("sha256").update(assets.map(a => a.storagePath).join("\n")).digest("hex");
const label = `Approved 10 October 2026 · ${editionHash.slice(0, 16)}`;
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function upload(bucket, key, bytes) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await client.storage.from(bucket).upload(key, bytes, { contentType: "image/webp", upsert: false });
    if (!result.error || String(result.error.statusCode) === "409" || result.error.message === "The resource already exists") return;
    if (attempt === 2) throw Error(`Page upload failed in ${bucket}: ${result.error.message}`);
  }
}
try {
  const baseline = await db.bookInventoryItem.count({ where: { isPublished: true } });
  console.log(JSON.stringify({ action: process.argv.includes("--apply") ? "publish" : "inspect", publishedPhysicalBooks: baseline, pages: assets.length, pageBytes: assets.reduce((s, a) => s + a.bytes.length, 0), priceCents: 500 }));
  if (!process.argv.includes("--apply")) process.exitCode = 0;
  else {
    // Only additive ebook DDL, committed atomically. Never runs db push or a baseline migration.
    await db.$transaction(async tx => {
      await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(20261012)::text");
      const tables = await tx.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'Ebook%'`);
      if (![0, 11, 12].includes(tables.length)) throw Error("Unexpected partial ebook schema; inspect before continuing.");
      const files = [...(tables.length ? [] : ["20261012_ebooks.sql"]), "20261012_ebook_store.sql", "20261012_ebook_bookmarks.sql"];
      for (const file of files) {
        const sql = await readFile(path.join("prisma/patches", file), "utf8");
        for (const statement of sql.split(";").map(s => s.replace(/^--.*$/gm, "").trim()).filter(Boolean))
          await tx.$executeRawUnsafe(statement);
      }
    }, { maxWait: 15000, timeout: 60000 });
    const policies = await db.$queryRawUnsafe("SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'");
    // This installation currently has no object policies. Refuse to infer safety if that changes.
    if (policies.length) throw Error("Review storage object policies before publishing private reading pages.");
    let bucket = await client.storage.getBucket("ebook-private");
    if (bucket.error) {
      const created = await client.storage.createBucket("ebook-private", { public: false, fileSizeLimit: 3 * 1024 * 1024, allowedMimeTypes: ["image/webp"] });
      if (created.error) throw Error("Could not create private storage bucket");
      bucket = await client.storage.getBucket("ebook-private");
    }
    if (bucket.error || bucket.data.public) throw Error("Reading bucket must be private");
    for (let offset = 0; offset < assets.length; offset += 4) {
      await Promise.all(assets.slice(offset, offset + 4).map(a => upload("ebook-private", a.storagePath, a.bytes)));
      if (offset % 40 === 0 || offset + 4 >= assets.length) console.log(`Private pages uploaded: ${Math.min(offset + 4, assets.length)}/${assets.length}`);
    }
    const cover = await readFile("public/images/ebooks/manal-366-cover.webp");
    const coverKey = `ebook-covers/manal-${createHash("sha256").update(cover).digest("hex")}.webp`;
    await upload("uploads", coverKey, cover);
    const coverUrl = client.storage.from("uploads").getPublicUrl(coverKey).data.publicUrl;
    // Verify private reads and deny anonymous public-object access before enabling sales.
    for (const index of [0, 192, 384]) {
      const a = assets[index];
      const result = await client.storage.from("ebook-private").download(a.storagePath);
      if (result.error || !Buffer.from(await result.data.arrayBuffer()).equals(a.bytes)) throw Error("Private page verification failed");
    }
    const publicUrl = client.storage.from("ebook-private").getPublicUrl(assets[0].storagePath).data.publicUrl;
    const anonymous = await fetch(publicUrl);
    if (anonymous.ok) throw Error("Private reading page unexpectedly accessible without authorization");
    const book = await db.$transaction(async tx => {
      await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(20261012)::text");
      const ebook = await tx.ebook.upsert({
        where: { slug: "manal-366-days" },
        create: { slug: "manal-366-days", titleEn: "366 Mistakes That Lead to Business Failure", titleAr: manifest.title, author: "Dr. Manal Hassoun", priceCents: 500, direction: "rtl", language: "ARABIC", categories: ["BUSINESS"], coverUrl,
          descriptionEn: "A daily reading journey through 366 mistakes that can lead to business failure, by Dr. Manal Hassoun. Read the Arabic edition on this website after your payment is verified.",
          descriptionAr: "رحلة قراءة يومية مع الدكتورة منال حسون عبر ٣٦٦ خطأ تقود إلى فشل الأعمال. اقرأ النسخة العربية على الموقع بعد التحقق من الدفع." },
        update: {},
      });
      let version = await tx.ebookVersion.findFirst({ where: { ebookId: ebook.id, label } });
      if (!version) version = await tx.ebookVersion.create({ data: { ebookId: ebook.id, label, pageCount: assets.length } });
      if (ebook.activeVersionId && ebook.activeVersionId !== version.id) throw Error("A different edition is already active; use admin review to change it.");
      await tx.ebookPage.createMany({ data: assets.map(a => ({ versionId: version.id, number: a.number, storagePath: a.storagePath })), skipDuplicates: true });
      const pages = await tx.ebookPage.findMany({ where: { versionId: version.id }, orderBy: { number: "asc" } });
      if (pages.length !== assets.length || pages.some((p, i) => p.storagePath !== assets[i].storagePath || p.number !== i + 1)) throw Error("Incomplete or mismatched reading version");
      await tx.ebookVersion.update({ where: { id: version.id }, data: { ready: true } });
      return tx.ebook.update({ where: { id: ebook.id }, data: { activeVersionId: version.id, published: true }, select: { id: true, slug: true, published: true, priceCents: true } });
    }, { maxWait: 15000, timeout: 60000 });
    console.log(JSON.stringify({ ebook: book, publishedPhysicalBooks: await db.bookInventoryItem.count({ where: { isPublished: true } }), privatePublicAccessDenied: true }));
  }
} catch (e) {
  // Do not expose connection strings or provider credentials in command output.
  console.error("Publication stopped:", e.code || e.name, String(e.message).split("\n").slice(-1)[0]);
  process.exitCode = 1;
} finally { await db.$disconnect(); }
