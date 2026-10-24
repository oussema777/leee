import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPrismaAdapter, databaseOptions } from './prisma-adapter.mjs';
import { X509Certificate } from 'node:crypto';
import { supabaseRootCA } from './supabase-ca.mjs';

afterEach(() => vi.unstubAllEnvs());
describe('Prisma driver migration connection safeguards', () => {
  it('bundles the verified Supabase CA only for Supabase endpoints without weakening TLS', () => {
    const options = databaseOptions('postgresql://user:secret@aws-0-test.pooler.supabase.com:6543/app');
    expect(options.pool.ssl).toEqual({ ca: supabaseRootCA, rejectUnauthorized: true });
    expect(new URL(options.pool.connectionString!).searchParams.has('sslmode')).toBe(false);
    expect(new X509Certificate(supabaseRootCA).fingerprint256).toBe('80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA');
    expect(databaseOptions('postgresql://user:secret@db.example.test/app').pool.ssl).toBeUndefined();
    expect(() => databaseOptions('postgresql://user:secret@aws-0-test.pooler.supabase.com/app?sslmode=disable')).toThrow('DATABASE_TLS_VERIFICATION_REQUIRED');
  });
  it('preserves TLS and schema while translating existing pool settings', () => {
    const options = databaseOptions('postgresql://user:encoded%40password@db.example.test:6543/app?sslmode=verify-full&connection_limit=2&pool_timeout=7&pgbouncer=true&schema=content');
    const url = new URL(options.pool.connectionString);
    expect(url.port).toBe('6543');
    expect(url.password).toBe('encoded%40password');
    expect(url.searchParams.get('sslmode')).toBe('verify-full');
    expect(options.schema).toBe('content');
    expect(options.pool.max).toBe(2);
    expect(options.pool.connectionTimeoutMillis).toBe(7000);
    expect(new URL(databaseOptions('postgresql://user:secret@db.example.test/app').pool.connectionString).searchParams.get('sslmode')).toBe('verify-full');
    expect(new URL(databaseOptions('postgresql://postgres@127.0.0.1:55441/aramex_test').pool.connectionString).searchParams.has('sslmode')).toBe(false);
  });
  it('fails closed without a runtime URL rather than using migration credentials', () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('DIRECT_DATABASE_URL', 'postgresql://migration:secret@db.example.test/app');
    expect(() => databaseOptions()).toThrow('DATABASE_URL_NOT_CONFIGURED');
    expect(() => databaseOptions('prisma://secret')).toThrow('DATABASE_URL_INVALID');
    expect(() => databaseOptions('postgresql://user:secret@host/app?connection_limit=NaN')).toThrow('DATABASE_POOL_SETTING_INVALID');
    vi.stubEnv('DATABASE_URL', 'postgresql://runtime:secret@db.example.test/app');
    expect(() => createPrismaAdapter(undefined)).toThrow('DATABASE_URL_NOT_CONFIGURED');
  });
});
