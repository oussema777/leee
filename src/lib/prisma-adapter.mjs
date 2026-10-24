import { PrismaPg } from '@prisma/adapter-pg';
import { supabaseRootCA } from './supabase-ca.mjs';

// Shared by the application, maintenance scripts and isolated integration tests.
// Never substitute the direct migration URL for the application's pooled URL.
export function databaseOptions(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw Error('DATABASE_URL_NOT_CONFIGURED');
  let url;
  try { url = new URL(connectionString); } catch { throw Error('DATABASE_URL_INVALID'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw Error('DATABASE_URL_INVALID');
  function positiveParameter(name, fallback) {
    const value = url.searchParams.get(name);
    if (value === null) return fallback;
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw Error('DATABASE_POOL_SETTING_INVALID');
    return Number(value);
  }
  const max = positiveParameter('connection_limit', 5);
  const connectionTimeoutMillis = positiveParameter('pool_timeout', positiveParameter('connect_timeout', 5)) * 1000;
  const schema = url.searchParams.get('schema') || 'public';
  for (const key of ['connection_limit', 'pool_timeout', 'connect_timeout', 'schema', 'pgbouncer', 'statement_cache_size']) url.searchParams.delete(key);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'verify-full');
  }
  /** @type {import('pg').PoolConfig} */
  const pool = { max, connectionTimeoutMillis, idleTimeoutMillis: 10000 };
  const supabase = url.hostname.endsWith('.pooler.supabase.com') || /^db\.[a-z0-9-]+\.supabase\.co$/.test(url.hostname);
  if (supabase && !url.searchParams.has('sslrootcert')) {
    if (!['verify-full', 'require'].includes(url.searchParams.get('sslmode') || '')) throw Error('DATABASE_TLS_VERIFICATION_REQUIRED');
    // pg URL SSL options override the explicit ssl object. Supply the trusted CA
    // directly, retaining both chain and hostname validation.
    url.searchParams.delete('sslmode');
    pool.ssl = { ca: supabaseRootCA, rejectUnauthorized: true };
  }
  return { pool: { ...pool, connectionString: url.toString() }, schema };
}

/** @param {string | undefined} [connectionString] */
export function createPrismaAdapter(connectionString) {
  const selected = arguments.length === 0 ? process.env.DATABASE_URL : connectionString;
  if (!selected) throw Error('DATABASE_URL_NOT_CONFIGURED');
  const { pool, schema } = databaseOptions(selected);
  return new PrismaPg(pool, { schema });
}
