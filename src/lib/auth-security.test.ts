import { afterEach, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
import { createToken, verifyToken } from './auth';
const secret = 'local-auth-fixture-'.repeat(4), key = new TextEncoder().encode(secret);
afterEach(() => vi.unstubAllEnvs());
it('fails closed without a configured signing secret', async () => {
  vi.stubEnv('JWT_SECRET', '');
  await expect(createToken({ userId: 'user', email: 'local@example.test', role: 'ADMIN' })).rejects.toThrow('NOT_CONFIGURED');
  const forged = await new SignJWT({ userId: 'user', email: 'x', role: 'ADMIN' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode('fallback-secret'));
  expect(await verifyToken(forged)).toBeNull();
});
it('accepts a correctly signed token and refuses algorithm, expiry and claim confusion', async () => {
  vi.stubEnv('JWT_SECRET', secret);
  const payload = { userId: 'user', email: 'local@example.test', role: 'ADMIN' };
  expect(await verifyToken(await createToken(payload))).toEqual(payload);
  for (const token of [
    await new SignJWT(payload).setProtectedHeader({ alg: 'HS384' }).setIssuedAt().setExpirationTime('1h').sign(key),
    await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).sign(key),
    await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('-1m').sign(key),
    await new SignJWT({ ...payload, userId: { forged: true } }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(key),
  ]) expect(await verifyToken(token)).toBeNull();
});
