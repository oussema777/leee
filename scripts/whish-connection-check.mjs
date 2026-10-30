// Read-only authentication test. Never prints credentials, balances or payer data.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.whish.local', quiet: true });
const { WHISH_PAY_CHANNEL: channel, WHISH_PAY_SECRET: secret, WHISH_PAY_WEBSITE_URL: websiteUrl } = process.env;
if (!channel || !secret || !websiteUrl) throw new Error('Missing Whish sandbox credentials');
try {
  const response = await fetch('https://partner.api.sbx.whish.money/itel-service/api/payment/account/balance?currency=USD', {
    headers: { channel, secret, websiteUrl, 'User-Agent': 'LEEExperience/1.0 (https://theleeexperience.com; info@theleeexperience.com)' },
    redirect: 'error', signal: AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => null);
  console.log(JSON.stringify({ environment: 'sandbox', httpStatus: response.status, authenticated: response.ok && result?.status === true && result?.code === null, code: typeof result?.code === 'string' ? result.code : null }));
  if (!response.ok || result?.status !== true || result?.code !== null) process.exitCode = 1;
} catch { console.error('Whish sandbox connection failed or timed out. No credentials logged.'); process.exitCode = 1; }
