import { afterEach, expect, it, vi } from 'vitest';
import { sendCardMail } from './live-mail';
afterEach(() => vi.unstubAllEnvs());
const mail = { from: 'test@example.test', to: 'buyer@example.test', subject: 'Test', html: '<p>Test</p>' };
it('never calls the provider when delivery is disabled', async () => {
  vi.stubEnv('CYBERSOURCE_LIVE_EMAIL_ENABLED', 'false'); const fetcher = vi.fn();
  await expect(sendCardMail(mail, 'key', new AbortController().signal, fetcher)).rejects.toThrow('DISABLED'); expect(fetcher).not.toHaveBeenCalled();
});
it('requires explicit provider acceptance and sends the stable retry key', async () => {
  vi.stubEnv('CYBERSOURCE_LIVE_EMAIL_ENABLED', 'true'); vi.stubEnv('RESEND_API_KEY', 'fake-local-test');
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ id: 'accepted' }))).mockResolvedValueOnce(new Response('{}', { status: 429 })).mockResolvedValueOnce(new Response('{}'));
  const signal = new AbortController().signal;
  expect(await sendCardMail(mail, 'lee-card/test', signal, fetcher)).toBe('accepted');
  expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: 'error', signal, headers: { 'Idempotency-Key': 'lee-card/test' } });
  await expect(sendCardMail(mail, 'lee-card/test', signal, fetcher)).rejects.toThrow('REJECTED');
  await expect(sendCardMail(mail, 'lee-card/test', signal, fetcher)).rejects.toThrow('RESPONSE_INVALID');
});
