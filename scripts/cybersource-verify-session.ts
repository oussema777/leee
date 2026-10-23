import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { createTestSession } from '../src/lib/cybersource/session';
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
async function main() {
  try {
    await createTestSession(100, process.env, fetch, 'LEE-T-' + randomUUID());
    console.log(JSON.stringify({ environment: 'TEST', signatureAmountOriginReferenceVerified: true, paymentSubmitted: false }));
  } catch (error) {
    const code = error instanceof Error && /^CYBERSOURCE_[A-Z_]+$/.test(error.message) ? error.message : 'SESSION_CHECK_FAILED';
    console.error(JSON.stringify({ code, paymentSubmitted: false })); process.exitCode = 1;
  }
}
void main();
