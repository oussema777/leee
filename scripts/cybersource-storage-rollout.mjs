// Additive TEST ledger rollout. Default: read-only. No order writes or payment calls.
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const runtime = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const direct = new PrismaClient({ datasourceUrl: process.env.DIRECT_DATABASE_URL });
async function identity(db) {
  return db.$queryRaw`SELECT current_database() AS database, current_user AS role,
    (SELECT oid::text FROM pg_database WHERE datname = current_database()) AS database_oid,
    'public."BookOrder"'::regclass::oid::text AS order_table_oid`;
}
try {
  if (!process.env.DIRECT_DATABASE_URL) throw Error('Direct database configuration required');
  const url = new URL(process.env.DIRECT_DATABASE_URL);
  const identities = await Promise.all([identity(runtime), identity(direct)]);
  if (JSON.stringify(identities[0]) !== JSON.stringify(identities[1])) throw Error('Database identities differ');
  const fingerprint = createHash('sha256').update(`${url.hostname}/${url.pathname}/${JSON.stringify(identities[1])}`).digest('hex').slice(0, 16);
  const exists = (await direct.$queryRaw`SELECT to_regclass('public."CybersourceTestAttempt"') IS NOT NULL AS present`)[0].present;
  console.log(JSON.stringify({ targetFingerprint: fingerprint, tableExists: exists }));
  if (process.argv.includes('--apply')) {
    if (!process.argv.includes('--expect-target=' + fingerprint)) throw Error('Expected target fingerprint required');
    const sql = path.resolve('prisma/changes/20261023_cybersource_test_attempts.sql');
    const folder = path.resolve('.impeccable/audi-storage-rollout', new Date().toISOString().replace(/[:.]/g, '-'));
    await mkdir(folder, { recursive: true });
    const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: url.searchParams.get('sslmode') || 'require', PGCONNECT_TIMEOUT: '15', PGOPTIONS: '-c search_path=public -c lock_timeout=10000 -c statement_timeout=60000' };
    function command(binary, args) {
      const result = spawnSync('C:/Program Files/PostgreSQL/18/bin/' + binary, args, { env, encoding: 'utf8', windowsHide: true, timeout: 120000 });
      if (result.status !== 0) throw Error(binary + ' failed; credentials and database output suppressed');
    }
    if (!exists) {
      command('pg_dump.exe', ['--schema-only', '--no-owner', '--no-privileges', '--schema=public', '--file', path.join(folder, 'before-schema.sql')]);
      command('psql.exe', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', sql]);
    }
    const schema = await direct.$queryRaw`SELECT relrowsecurity AS rls FROM pg_class WHERE oid = 'public."CybersourceTestAttempt"'::regclass`;
    if (!schema[0]?.rls) throw Error('Row-level security is missing');
    const count = Number((await runtime.$queryRaw`SELECT count(*) AS count FROM "CybersourceTestAttempt"`)[0].count);
    const record = { targetFingerprint: fingerprint, applied: !exists, verified: true, count, migrationSha256: createHash('sha256').update(await readFile(sql)).digest('hex'), at: new Date().toISOString() };
    await writeFile(path.join(folder, 'record.json'), JSON.stringify(record, null, 2));
    console.log(JSON.stringify(record));
  }
} catch { console.error('Storage rollout failed; credentials and database details suppressed. Inspect configuration and saved rollout records.'); process.exitCode = 1; }
finally { await Promise.all([runtime.$disconnect(), direct.$disconnect()]); }
