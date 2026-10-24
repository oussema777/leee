import { afterEach, expect, it, vi } from 'vitest';
import { liveCustomerEnabled } from './live-config';
afterEach(() => vi.unstubAllEnvs());
it('does not advertise live checkout with incomplete credentials despite flags', () => {
  for (const name of ['CUSTOMER','ORDER_CREATION','SESSION','LOOKUP','FULFILLMENT','JOBS']) vi.stubEnv('CYBERSOURCE_LIVE_' + name + '_ENABLED', 'true');
  vi.stubEnv('CYBERSOURCE_LIVE_MERCHANT_ID', 'fixture'); vi.stubEnv('CYBERSOURCE_LIVE_KEY_ID', 'key'); vi.stubEnv('CYBERSOURCE_LIVE_SECRET_KEY', Buffer.alloc(32, 7).toString('base64'));
  vi.stubEnv('JWT_SECRET', 'fixture'.repeat(8)); vi.stubEnv('CRON_SECRET', '');
  expect(liveCustomerEnabled()).toBe(false);
  vi.stubEnv('CRON_SECRET', 'fixture'.repeat(8)); expect(liveCustomerEnabled()).toBe(true);
  vi.stubEnv('CYBERSOURCE_LIVE_SECRET_KEY', 'bad'); expect(liveCustomerEnabled()).toBe(false);
});
