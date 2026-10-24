import { expect, it } from 'vitest';
import { boundedJson, InputTooLarge } from './bounded-input';
it('limits streamed bytes independently of Content-Length', async () => {
  const request = new Request('https://example.test', { method: 'POST', headers: { 'content-length': '1' }, body: JSON.stringify({ text: 'x'.repeat(1000) }) });
  await expect(boundedJson(request, 20)).rejects.toBeInstanceOf(InputTooLarge);
});
it('accepts bounded JSON and rejects malformed content', async () => {
  expect(await boundedJson(new Request('https://example.test', { method: 'POST', body: '{"ok":true}' }))).toEqual({ ok: true });
  await expect(boundedJson(new Request('https://example.test', { method: 'POST', body: '{broken' }))).rejects.toBeInstanceOf(SyntaxError);
});
