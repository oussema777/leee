import type { PrismaClient } from '@prisma/client';
import { checkResult, publicAttempt, type Attempt } from './checkout';
import { findTestPayment, TransactionLookupPending } from './transaction';

export async function recoverTestCheckout(db: Pick<PrismaClient, '$transaction' | '$queryRaw'>, attempt: Attempt,
  find = findTestPayment, verify = checkResult) {
  if (!['READY', 'REVIEW_REQUIRED'].includes(attempt.state)) return publicAttempt(attempt);
  const id = attempt.transactionId || await find(attempt.id);
  if (!id) return publicAttempt(attempt);
  return verify(db, attempt.id, id);
}

export async function checkCustomerResult(db: Pick<PrismaClient, '$transaction' | '$queryRaw'>, attempt: Attempt, hint: string,
  find = findTestPayment, verify = checkResult) {
  // A browser hint can refer to a checkout/setup operation. If it is not in
  // reporting, recover the actual payment using the server-owned reference.
  try { return await verify(db, attempt.id, hint); }
  catch (error) {
    if (!(error instanceof TransactionLookupPending)) throw error;
    const id = await find(attempt.id);
    if (!id || id === hint) throw error;
    return verify(db, attempt.id, id);
  }
}
