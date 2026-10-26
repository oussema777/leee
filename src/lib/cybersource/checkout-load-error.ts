// Only documented pre-payment initialization/rendering failures are retryable.
// Completion, tokenization and unknown errors remain subject to server recovery.
const renderingErrors = new Set([
  'MOUNT_ERROR', 'MOUNT_PAYMENT_TIMEOUT', 'MOUNT_PAYMENT_UNAVAILABLE',
  'MOUNT_CONTAINER_SELECTOR', 'MOUNT_INVALID_CONTAINER', 'MOUNT_SIDEBAR_OPTIONS',
  'SHOW_LOAD_ERROR', 'SHOW_PAYMENT_TIMEOUT', 'SHOW_PAYMENT_UNAVAILABLE',
  'SHOW_LOAD_CONTAINER_SELECTOR', 'SHOW_LOAD_INVALID_CONTAINER', 'SHOW_LOAD_SIDEBAR_OPTIONS',
]);
export function isCheckoutLoadError(error: unknown, mountStarted: boolean) {
  if (!mountStarted) return true;
  if (!error || typeof error !== 'object') return false;
  const reason = (error as { reason?: unknown }).reason;
  return typeof reason === 'string' && renderingErrors.has(reason);
}
