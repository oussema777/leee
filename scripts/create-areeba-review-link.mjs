// Creates a revocable TEST-only review grant. Link material stays in ignored .vercel.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../src/lib/prisma-adapter.mjs';

dotenv.config({ path: '.env.local', quiet: true });
if (!process.env.DATABASE_URL) throw Error('DATABASE_URL required');
const smoke = process.argv.includes('--smoke');
const output = path.resolve('.vercel', smoke ? 'areeba-review-smoke.json' : 'areeba-review-link.json');
if (fs.existsSync(output)) throw Error('Review link already exists; inspect it instead of creating another.');
const token = randomBytes(32).toString('hex');
const id = 'cybersource-reviewer:' + createHash('sha256').update(token).digest('hex');
const expiresAt = new Date(Date.now() + (smoke ? 1 : 14) * 86400000).toISOString();
const db = new PrismaClient({ adapter: createPrismaAdapter(process.env.DATABASE_URL) });
try {
  await db.bookWhishSettings.create({ data: { id, config: { enabled: true, environment: 'TEST', expiresAt }, updatedBy: 'areeba-review-setup' } });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({ id, token, expiresAt, url: 'https://www.theleeexperience.com/en/payment-test#' + token }, null, 2));
  console.log(JSON.stringify({ created: true, environment: 'TEST', expiresAt, output }));
} finally { await db.$disconnect(); }
