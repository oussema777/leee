// Read every generated model against an explicitly selected, local-only test DB.
// Never emits row contents, credentials or falls back to DATABASE_URL.
import assert from 'node:assert/strict';
import { Prisma, PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../src/lib/prisma-adapter.mjs';
const url = process.env.PRISMA_UPGRADE_TEST_DATABASE_URL;
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)
  || new URL(url).pathname !== '/aramex_test') throw Error('Dedicated local test database required');
const db = new PrismaClient({ adapter: createPrismaAdapter(url) });
try {
  let models = 0;
  for (const model of Prisma.dmmf.datamodel.models) {
    await db[model.name[0].toLowerCase() + model.name.slice(1)].findMany({ take: 1 });
    models++;
  }
  // Transaction rollback and the pooled raw-query path used by recovery workers.
  const marker = 'prisma-upgrade-rollback-check';
  await assert.rejects(db.$transaction(async tx => {
    await tx.$executeRaw`CREATE TEMP TABLE prisma_upgrade_check (id text) ON COMMIT DROP`;
    await tx.$executeRaw`INSERT INTO prisma_upgrade_check VALUES (${marker})`;
    const rows = await tx.$queryRaw`SELECT id FROM prisma_upgrade_check`;
    assert.equal(rows[0].id, marker);
    throw Error('EXPECTED_ROLLBACK');
  }), /EXPECTED_ROLLBACK/);
  console.log(`PASS: ${models} model reads, parameterized SQL and transaction rollback on local database.`);
} finally { await db.$disconnect(); }
