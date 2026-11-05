// Generates a private installation block; does not connect to or modify the VPS.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { parse } from 'dotenv';
const envPath = process.argv[2];
if (!envPath) throw Error('Pass the local environment file containing CRON_SECRET.');
const { CRON_SECRET: secret } = parse(readFileSync(envPath));
if (!secret || secret.length < 16 || !/^[a-zA-Z0-9_+/=.-]+$/.test(secret)) throw Error('A valid CRON_SECRET is required.');
const files = [
  ['/opt/lee-whish/reconcile.py', readFileSync(new URL('./reconcile.py', import.meta.url), 'utf8'), '644'],
  ['/etc/systemd/system/lee-whish-reconcile.service', readFileSync(new URL('./lee-whish-reconcile.service', import.meta.url), 'utf8'), '644'],
  ['/etc/systemd/system/lee-whish-reconcile.timer', readFileSync(new URL('./lee-whish-reconcile.timer', import.meta.url), 'utf8'), '644'],
  ['/etc/lee-whish-worker.env', 'CRON_SECRET=' + secret + '\n', '600'],
];
const payload = Buffer.from(JSON.stringify(files)).toString('base64');
const script = `# Private installation block: contains the worker credential. Do not share.
bash <<'LEE_WHISH_INSTALL'
set -eu
test "$(id -u)" = 0 || { echo 'Run from your root session.'; exit 1; }
command -v python3 >/dev/null
command -v systemctl >/dev/null
for target in /opt/lee-whish /etc/lee-whish-worker.env /etc/systemd/system/lee-whish-reconcile.service /etc/systemd/system/lee-whish-reconcile.timer; do
  test ! -e "$target" || { echo "Already exists: $target. Stop and review before changing it."; exit 1; }
done
umask 077
python3 <<'LEE_WHISH_FILES'
import base64, json, os
from pathlib import Path
files = json.loads(base64.b64decode('${payload}'))
Path('/opt/lee-whish').mkdir(mode=0o755)
for name, content, mode in files:
    p = Path(name)
    with p.open('x', encoding='utf-8', newline='\\n') as f:
        f.write(content.replace('\\r\\n', '\\n'))
    p.chmod(int(mode, 8))
LEE_WHISH_FILES
systemd-analyze verify /etc/systemd/system/lee-whish-reconcile.service /etc/systemd/system/lee-whish-reconcile.timer
systemctl daemon-reload
systemctl start lee-whish-reconcile.service
systemctl enable --now lee-whish-reconcile.timer
systemctl is-active lee-whish-reconcile.timer
systemctl show lee-whish-reconcile.service -p Result -p ExecMainStatus
journalctl -u lee-whish-reconcile.service -n 5 --no-pager
echo 'LEE Whish worker installed. Existing websites and services were not restarted.'
LEE_WHISH_INSTALL
`;
mkdirSync('private-ebooks/whish-rollout', { recursive: true });
writeFileSync('private-ebooks/whish-rollout/install-worker-in-putty.txt', script);
console.log('Prepared private-ebooks/whish-rollout/install-worker-in-putty.txt; no VPS commands executed.');
