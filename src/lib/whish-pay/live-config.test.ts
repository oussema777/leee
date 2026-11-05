import { describe, expect, it, vi } from 'vitest';
import { liveConfig, liveWhishEnabled, sandboxConfig, whishClient, PRODUCTION_URL, SANDBOX_URL } from './client';
const env = { WHISH_PAY_LIVE_ENABLED: 'true', WHISH_PAY_LIVE_CHANNEL: 'local', WHISH_PAY_LIVE_SECRET: 'not-a-real-secret', WHISH_PAY_LIVE_WEBSITE_URL: 'theleeexperience.com', WHISH_PAY_LIVE_PUBLIC_ORIGIN: 'https://www.theleeexperience.com' };
describe('Whish production configuration separation', () => {
  it('requires explicit enablement and exact issued website/origin', () => {
    expect(liveWhishEnabled({})).toBe(false);
    expect(liveWhishEnabled(env)).toBe(true);
    expect(liveWhishEnabled({ ...env, WHISH_PAY_LIVE_ENABLED: 'false' })).toBe(false);
    expect(liveWhishEnabled({ ...env, WHISH_PAY_LIVE_PUBLIC_ORIGIN: 'https://evil.example' })).toBe(false);
    expect(() => liveConfig({ WHISH_PAY_CHANNEL: 'sandbox', WHISH_PAY_SECRET: 'sandbox' })).toThrow();
  });
  it('uses live credentials only with the fixed production host and prevents redirects', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ status: true, code: null, data: { collectStatus: 'success' } })));
    await whishClient(liveConfig(env), fetcher).status('original-id');
    expect(fetcher).toHaveBeenCalledWith(PRODUCTION_URL + '/payment/collect/status', expect.objectContaining({ redirect: 'error', headers: expect.objectContaining({ secret: env.WHISH_PAY_LIVE_SECRET, channel: 'local' }), body: JSON.stringify({ externalId: 'original-id', currency: 'USD' }) }));
    const sandbox = sandboxConfig({ WHISH_PAY_SANDBOX_ENABLED: 'true', WHISH_PAY_CHANNEL: 'sbx', WHISH_PAY_SECRET: 'sbx-secret', WHISH_PAY_WEBSITE_URL: 'theleeexperience.com', WHISH_PAY_PUBLIC_ORIGIN: env.WHISH_PAY_LIVE_PUBLIC_ORIGIN });
    await whishClient(sandbox, fetcher).status('sandbox-id');
    expect(fetcher.mock.calls[1][0]).toBe(SANDBOX_URL + '/payment/collect/status');
  });
});
