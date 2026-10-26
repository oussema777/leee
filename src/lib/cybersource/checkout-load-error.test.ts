import { expect, it } from 'vitest';
import { isCheckoutLoadError } from './checkout-load-error';
it('permits reopening when the script or SDK initialization fails before mounting', () => {
  expect(isCheckoutLoadError(Error('script blocked'), false)).toBe(true);
});
it('recognizes documented iframe loading failures', () => {
  for (const reason of ['MOUNT_ERROR', 'MOUNT_PAYMENT_UNAVAILABLE', 'SHOW_LOAD_ERROR']) expect(isCheckoutLoadError({ reason }, true)).toBe(true);
});
it('never interprets unknown, tokenization or completion failures as safe loading retries', () => {
  for (const error of [null, Error('Unknown'), { reason: 'COMPLETE_AUTHENTICATION_CANCELED' }, { reason: 'COMPLETE_TRANSACTION_FAILED' }, { reason: 'MOUNT_TOKEN_TIMEOUT' }, { reason: 'UNKNOWN_ERROR' }]) expect(isCheckoutLoadError(error, true)).toBe(false);
});
