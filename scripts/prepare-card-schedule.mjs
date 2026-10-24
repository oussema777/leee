// Local artifact only. Never deploys, changes billing, or calls the payment job.
import { readFileSync, writeFileSync } from 'node:fs';
const plan = process.argv.find(a => a.startsWith('--plan='))?.slice(7);
if (!['pro', 'enterprise'].includes(plan)) {
  console.error('A confirmed Pro/Enterprise plan is required for a one-minute Vercel schedule. On Hobby, choose an authorized external scheduler or approve a plan change first.');
  process.exitCode = 1;
} else {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  config.crons = [...(config.crons || []).filter(c => c.path !== '/api/cron/card-payments'), { path: '/api/cron/card-payments', schedule: '* * * * *' }];
  const output = 'ops/vercel.card-payments.prepared.json';
  writeFileSync(output, JSON.stringify(config, null, 2) + '\n');
  console.log('Prepared ' + output + '. Review and merge during an authorized deployment; vercel.json was not changed.');
}
