// Inspect by default. --apply uploads the approved English pages and atomically
// includes them in the existing product at USD 9.99. Does not alter old orders.
import nextEnv from '@next/env';
import { createPrismaAdapter } from '../src/lib/prisma-adapter.mjs';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient({ adapter: createPrismaAdapter() });
const root = 'private-ebooks/manal-english-web';
const expected = 'eefddf85fad8f7cd915c55144cd69f5cb14e70a218162a49ef200d8b2a09e149';
const label = `Approved English 3 November 2026 · ${expected.slice(0, 16)}`;
try {
  const manifest = JSON.parse(await readFile(`${root}/manifest.json`, 'utf8'));
  if (manifest.sourceSha256 !== expected || manifest.pageCount !== 385 || manifest.pages.length !== 385) throw Error('Approved English PDF required');
  const assets = [];
  for (const [i, file] of manifest.pages.entries()) {
    if (file !== `${String(i + 1).padStart(4, '0')}.webp`) throw Error('Invalid page sequence');
    const bytes = await readFile(`${root}/${file}`);
    const meta = await sharp(bytes).metadata();
    if (meta.format !== 'webp' || bytes.length > 2 * 1024 * 1024) throw Error('Invalid page image');
    assets.push({ number: i + 1, bytes, storagePath: `manal-en-${expected.slice(0, 16)}/${i + 1}-${createHash('sha256').update(bytes).digest('hex')}.webp` });
  }
  const book = await db.ebook.findUniqueOrThrow({ where: { slug: 'manal-366-days' }, select: { id: true, priceCents: true, activeVersionId: true, language: true } });
  if (!book.activeVersionId || book.language !== 'ARABIC') throw Error('Existing Arabic edition required');
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'inspect', slug: 'manal-366-days', previousPriceCents: book.priceCents, priceCents: 999, englishPages: assets.length, sourceSha256: expected }));
  if (process.argv.includes('--apply')) {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const bucket = await client.storage.getBucket('ebook-private');
    if (bucket.error || bucket.data.public) throw Error('Private reading bucket required');
    const policies = await db.$queryRawUnsafe("SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'");
    if (policies.length) throw Error('Review storage policies before publishing');
    for (let offset = 0; offset < assets.length; offset += 4) {
      await Promise.all(assets.slice(offset, offset + 4).map(async asset => {
        const result = await client.storage.from('ebook-private').upload(asset.storagePath, asset.bytes, { contentType: 'image/webp', upsert: false });
        if (result.error && String(result.error.statusCode) !== '409' && result.error.message !== 'The resource already exists') throw Error('Private upload failed');
        const stored = await client.storage.from('ebook-private').download(asset.storagePath);
        if (stored.error || !Buffer.from(await stored.data.arrayBuffer()).equals(asset.bytes)) throw Error('Uploaded page verification failed');
      }));
      if (offset % 40 === 0) console.log(`Verified ${Math.min(offset + 4, assets.length)}/385 pages`);
    }
    const publicUrl = client.storage.from('ebook-private').getPublicUrl(assets[0].storagePath).data.publicUrl;
    if ((await fetch(publicUrl)).ok) throw Error('Private page is publicly accessible');
    const sql = await readFile('prisma/patches/20261105_ebook_editions.sql', 'utf8');
    await db.$transaction(async tx => {
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(20261012)::text');
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
      const current = await tx.ebook.findUniqueOrThrow({ where: { id: book.id } });
      if (current.activeVersionId !== book.activeVersionId || current.priceCents !== book.priceCents) throw Error('Product changed; inspect again');
      let version = await tx.ebookVersion.findFirst({ where: { ebookId: book.id, editionLanguage: 'en' } });
      if (version && version.label !== label) throw Error('Another English edition is already released');
      if (!version) version = await tx.ebookVersion.create({ data: { ebookId: book.id, label, pageCount: assets.length, editionLanguage: 'en' } });
      await tx.ebookPage.createMany({ data: assets.map(({ number, storagePath }) => ({ versionId: version.id, number, storagePath })), skipDuplicates: true });
      const pages = await tx.ebookPage.findMany({ where: { versionId: version.id }, orderBy: { number: 'asc' } });
      if (pages.length !== assets.length || pages.some((p, i) => p.number !== assets[i].number || p.storagePath !== assets[i].storagePath)) throw Error('Edition pages mismatch');
      await tx.ebookVersion.update({ where: { id: version.id }, data: { ready: true } });
      await tx.ebook.update({ where: { id: book.id }, data: {
        priceCents: 999,
        descriptionEn: 'A daily reading journey through 366 mistakes that can lead to business failure, by Dr. Manal Hassoun. One purchase includes both the Arabic and English editions. Read both on this website after your payment is verified.',
        descriptionAr: 'رحلة قراءة يومية مع الدكتورة منال حسون عبر ٣٦٦ خطأ تقود إلى فشل الأعمال. شراء واحد يشمل النسختين العربية والإنجليزية. اقرأ النسختين على الموقع بعد التحقق من الدفع.',
      } });
    }, { maxWait: 15000, timeout: 60000 });
    console.log('Published: Arabic + English, USD 9.99. Existing orders and access preserved.');
  }
} catch (error) {
  console.error('Publication stopped:', error.code || error.name, String(error.message).split('\n').at(-1));
  process.exitCode = 1;
} finally { await db.$disconnect(); }
