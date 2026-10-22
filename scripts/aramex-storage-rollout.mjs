// Explicit additive rollout; default is read-only inspection.
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const runtime = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const directUrl = process.env.DIRECT_DATABASE_URL;
if (!directUrl) throw Error('Direct database configuration is required');
const direct = new PrismaClient({ datasourceUrl: directUrl });
const tables = ['BookShipment', 'BookShipmentAttempt', 'BookShipmentReconciliation', 'AramexTrackingEvent'];
const files = ['20261022_aramex_reconciliation.sql', '20261022_aramex_tracking.sql'];
const pgBin = 'C:/Program Files/PostgreSQL/18/bin';
const url = new URL(directUrl);
const pgEnv = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
  PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
  PGSSLMODE: url.searchParams.get('sslmode') || 'require', PGCONNECT_TIMEOUT: '15', PGOPTIONS: '-c search_path=public' };
function command(binary, args) {
  const result = spawnSync(path.join(pgBin, binary), args, { env: pgEnv, encoding: 'utf8', windowsHide: true, timeout: 120000 });
  if (result.status !== 0) throw Error(`${binary} failed; exit ${result.status ?? 'unavailable'}. No credentials logged.`);
  return result.stdout;
}
async function identity(db) {
  return db.$queryRaw`SELECT current_database() AS database, current_user AS role,
    (SELECT oid::text FROM pg_database WHERE datname = current_database()) AS database_oid,
    (SELECT oid::text FROM pg_class WHERE oid = 'public."BookOrder"'::regclass) AS order_table_oid`;
}
try {
  const [runtimeIdentity, directIdentity] = await Promise.all([identity(runtime), identity(direct)]);
  if (JSON.stringify(runtimeIdentity) !== JSON.stringify(directIdentity)) throw Error('Runtime/direct identity differs; inspect configuration before rollout');
  const schema = await direct.$queryRaw`SELECT c.relname AS name, c.relrowsecurity AS rls
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ('BookShipment','BookShipmentAttempt','BookShipmentReconciliation','AramexTrackingEvent')`;
  const counts = {};
  for (const table of tables.filter(table => schema.some(row => row.name === table))) {
    counts[table] = Number((await direct.$queryRawUnsafe(`SELECT count(*) AS count FROM public."${table}"`))[0].count);
  }
  const flags = Object.fromEntries(['ARAMEX_UAT_TRACKING_ENABLED','ARAMEX_UAT_LOOKUP_ENABLED','ARAMEX_UAT_LABEL_ENABLED','ARAMEX_UAT_SUBMISSION_ENABLED'].map(key => [key, process.env[key] === 'true']));
  const fingerprint = createHash('sha256').update(`${url.hostname}/${url.pathname}/${JSON.stringify(directIdentity)}`).digest('hex').slice(0,16);
  const inspection = { targetFingerprint: fingerprint, identity: directIdentity, schema, counts, carrierFlagsEnabled: flags };
  console.log(JSON.stringify(inspection, null, 2));
  if (!process.argv.includes('--apply')) process.exitCode = 0;
  else {
    if (!process.argv.includes(`--expect-target=${fingerprint}`)) throw Error('Pass the inspected target fingerprint before applying');
    if (Object.values(flags).some(Boolean)) throw Error('Carrier flags must remain disabled during rollout');
    if (!tables.slice(0,2).every(table => schema.some(row => row.name === table))) throw Error('Prerequisite tables missing');
    const missing = files.filter((_, index) => !schema.some(row => row.name === tables[index + 2]));
    const folder = path.resolve('.impeccable', 'aramex-storage-rollout', new Date().toISOString().replace(/[:.]/g, '-'));
    await mkdir(folder, { recursive: true });
    // Schema restore reference only; existing order/shipment data is never modified.
    command('pg_dump.exe', ['--schema-only', '--no-owner', '--no-privileges', '--schema=public', '--file', path.join(folder, 'before-schema.sql')]);
    const record = { ...inspection, startedAt: new Date().toISOString(), applied: [], backup: 'before-schema.sql', verified: false };
    const recordPath = path.join(folder, 'record.json');
    await writeFile(recordPath, JSON.stringify(record, null, 2));
    for (const file of missing) {
      const sqlPath = path.resolve('prisma/changes', file);
      const hash = createHash('sha256').update(await readFile(sqlPath)).digest('hex');
      command('psql.exe', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', sqlPath]);
      record.applied.push({ file, sha256: hash, at: new Date().toISOString() });
      await writeFile(recordPath, JSON.stringify(record, null, 2));
      console.log(`Applied ${file}`);
    }
    command('psql.exe', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', path.resolve('prisma/changes/aramex-verify-storage.sql')]);
    // Actual application-role read, including both new models; no customer rows emitted.
    const runtimeCounts = { recovery: await runtime.bookShipmentReconciliation.count(), tracking: await runtime.aramexTrackingEvent.count() };
    const afterCounts = { BookShipment: await runtime.bookShipment.count(), BookShipmentAttempt: await runtime.bookShipmentAttempt.count() };
    record.verified = true; record.runtimeCounts = runtimeCounts; record.afterCounts = afterCounts; record.finishedAt = new Date().toISOString();
    await writeFile(recordPath, JSON.stringify(record, null, 2));
    console.log(JSON.stringify({ verified: true, runtimeCounts, recordPath }));
  }
} catch (error) {
  console.error(error instanceof Error && !('code' in error) ? error.message : 'Database operation failed. Inspect the rollout record; credentials and database details suppressed.');
  process.exitCode = 1;
} finally { await Promise.all([runtime.$disconnect(), direct.$disconnect()]); }
