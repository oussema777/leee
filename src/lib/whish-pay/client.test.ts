import { describe, expect, it, vi } from 'vitest';
import { sandboxConfig, safeCollectUrl, whishClient, SANDBOX_URL } from './client';
const config = { channel: 'test-channel', secret: 'test-secret', websiteUrl: 'theleeexperience.com', origin: 'https://preview.vercel.app' };
const input = { amount: '1.00', currency: 'USD' as const, externalId: 'test-id', invoice: 'Test', successCallbackUrl: config.origin + '/callback', failureCallbackUrl: config.origin + '/callback', successRedirectUrl: config.origin, failureRedirectUrl: config.origin };
function transport(body: unknown) { return vi.fn<typeof fetch>().mockResolvedValue(Response.json(body)); }
describe('Whish sandbox client', () => {
  it('fails closed when disabled or missing credentials', () => {
    expect(() => sandboxConfig({})).toThrow('SANDBOX_DISABLED');
    expect(() => sandboxConfig({ WHISH_PAY_SANDBOX_ENABLED: 'true' })).toThrow('CONFIGURATION_REQUIRED');
  });
  it('rejects local callback origins', () => {
    expect(() => sandboxConfig({ WHISH_PAY_SANDBOX_ENABLED: 'true', WHISH_PAY_CHANNEL: 'c', WHISH_PAY_SECRET: 's', WHISH_PAY_WEBSITE_URL: 'site', WHISH_PAY_PUBLIC_ORIGIN: 'https://localhost' })).toThrow('PUBLIC_ORIGIN_REQUIRED');
  });
  it('sends the exact issued websiteUrl and string amount to sandbox only', async () => {
    const fetcher = transport({ status: true, code: null, data: { collectUrl: 'https://whish.money/pay/test' } });
    expect(await whishClient(config, fetcher).create(input)).toBe('https://whish.money/pay/test');
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(SANDBOX_URL + '/payment/whish');
    expect(init?.redirect).toBe('error');
    expect(init?.headers).toMatchObject({ websiteUrl: 'theleeexperience.com', secret: 'test-secret' });
    expect(JSON.parse(init!.body as string)).toEqual(input);
  });
  it('treats HTTP 200 / code 500 as uncertain', async () => {
    await expect(whishClient(config, transport({ status: false, code: '500', data: null })).create(input)).rejects.toMatchObject({ code: '500', uncertain: true });
  });
  it('handles account rejection without treating it as payment success', async () => {
    await expect(whishClient(config, transport({ status: false, code: 'auth.session_not_exist', data: null })).create(input)).rejects.toMatchObject({ code: 'auth.session_not_exist', uncertain: false });
  });
  it('treats network errors as uncertain without exposing original error text', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('sensitive provider detail'));
    await expect(whishClient(config, fetcher).create(input)).rejects.toMatchObject({ message: 'TRANSPORT_UNCERTAIN', uncertain: true });
  });
  it.each(['pending', 'success', 'failed', 'refunded', 'unknown'])('returns persisted %s status', async status => {
    expect(await whishClient(config, transport({ status: true, code: null, data: { collectStatus: status } })).status('id')).toBe(status);
  });
  it('does not infer payment from an unknown status or a success envelope', async () => {
    await expect(whishClient(config, transport({ status: true, code: null, data: { collectStatus: 'paid' } })).status('id')).rejects.toThrow('INVALID_STATUS');
    await expect(whishClient(config, transport({ status: true, code: null, data: {} })).create(input)).rejects.toThrow('INVALID_PAYMENT_LINK');
  });
  it.each(['http://whish.money/pay', 'https://whish.money.evil.test/pay', 'https://evil.test/pay', 'javascript:alert(1)', 'https://user:pass@whish.money/pay'])('rejects unsafe redirect %s', url => {
    expect(() => safeCollectUrl(url)).toThrow('INVALID_PAYMENT_LINK');
  });
});
