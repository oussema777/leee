import { db } from '@/lib/db';
import { authorizedLiveJob, runLiveJobs } from '@/lib/cybersource/live-runner';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// No schedule is activated until the live rollout is approved.
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!authorizedLiveJob(request.headers.get('authorization'))) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  try { return Response.json(await runLiveJobs(db), { headers }); }
  catch { return Response.json({ error: 'Payment recovery unavailable' }, { status: 503, headers }); }
}
