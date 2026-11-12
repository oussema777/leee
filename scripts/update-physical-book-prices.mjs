// Read-only by default. Explicit --apply updates only USD 5 physical inventory.
// Example: node scripts/update-physical-book-prices.mjs --env ../leee-experience/.env
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../src/lib/prisma-adapter.mjs';

const args = process.argv.slice(2);
const envIndex = args.indexOf('--env');
if (envIndex >= 0) {
  if (!args[envIndex + 1]) throw Error('--env requires a file');
  const loaded = dotenv.config({ path: args[envIndex + 1], override: true, quiet: true });
  if (loaded.error) throw Error('Cannot load the specified environment file');
}
const db = new PrismaClient({ adapter: createPrismaAdapter() });
const apply = args.includes('--apply');
const signature = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function protectedPrices(tx) {
  return {
    ebooks: await tx.ebook.findMany({ select: { id: true, slug: true, priceCents: true }, orderBy: { id: 'asc' } }),
    bookOrders: signature(await tx.bookOrder.findMany({ select: { id: true, priceCents: true, deliveryFeeCents: true, currency: true }, orderBy: { id: 'asc' } })),
    ebookOrders: signature(await tx.ebookOrder.findMany({ select: { id: true, priceCents: true }, orderBy: { id: 'asc' } })),
  };
}
try {
  const result = await db.$transaction(async tx => {
    const rows = await tx.bookInventoryItem.findMany({
      select: { id: true, sku: true, slug: true, priceCents: true, currency: true, isPublished: true }, orderBy: { id: 'asc' },
    });
    if (rows.some(row => row.currency !== 'USD' || ![500, 900].includes(row.priceCents))) {
      throw Error('Unexpected inventory price/currency; review before making changes');
    }
    const targets = rows.filter(row => row.priceCents === 500);
    const protectedBefore = await protectedPrices(tx);
    const report = { mode: apply ? 'apply' : 'inspect', inventoryCount: rows.length, toUpdate: targets.length,
      publishedToUpdate: targets.filter(row => row.isPublished).length, alreadyNineDollars: rows.length - targets.length,
      oldPriceCents: 500, newPriceCents: 900, ebooks: protectedBefore.ebooks.map(({ slug, priceCents }) => ({ slug, priceCents })) };
    if (!apply || !targets.length) return report;
    const backupDirectory = resolve('.price-change-backups');
    await mkdir(backupDirectory, { recursive: true });
    const backup = resolve(backupDirectory, `physical-books-${new Date().toISOString().replaceAll(':', '-')}.json`);
    await writeFile(backup, JSON.stringify({ createdAt: new Date().toISOString(), targets, protectedBefore }, null, 2), { flag: 'wx' });
    const changed = await tx.bookInventoryItem.updateMany({
      where: { id: { in: targets.map(row => row.id) }, currency: 'USD', priceCents: 500 }, data: { priceCents: 900 },
    });
    if (changed.count !== targets.length) throw Error('Inventory changed during update; transaction rolled back');
    if (await tx.bookInventoryItem.count({ where: { OR: [{ currency: { not: 'USD' } }, { priceCents: { not: 900 } }] } })) {
      throw Error('Inventory verification failed; transaction rolled back');
    }
    if (signature(await protectedPrices(tx)) !== signature(protectedBefore)) throw Error('Protected prices changed; transaction rolled back');
    return { ...report, updated: changed.count, protectedPricesUnchanged: true, backup };
  }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 30000 });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Price update stopped:', error.code || error.name, String(error.message).split('\n').at(-1));
  process.exitCode = 1;
} finally { await db.$disconnect(); }
