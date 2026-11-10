import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const files = [
  ['/opt/lee-card/reconcile.py', 'reconcile.py', '644'],
  ['/etc/systemd/system/lee-card-reconcile.service', 'lee-card-reconcile.service', '644'],
  ['/etc/systemd/system/lee-card-reconcile.timer', 'lee-card-reconcile.timer', '644'],
].map(([target, source, mode]) => [target, readFileSync(new URL(source, import.meta.url), 'utf8').replaceAll('\r\n', '\n'), mode]);
const payload = Buffer.from(JSON.stringify(files)).toString('base64');
const script = `bash <<'LEE_CARD_INSTALL'
set -eu
test "$(id -u)" = 0 || { echo 'Run from your root PuTTY session.'; exit 1; }
command -v python3 >/dev/null
command -v systemctl >/dev/null
test -f /etc/lee-whish-worker.env || { echo 'Existing worker credential file is missing.'; exit 1; }
for target in /opt/lee-card /etc/systemd/system/lee-card-reconcile.service /etc/systemd/system/lee-card-reconcile.timer; do
  test ! -e "$target" || { echo "Already exists: $target. Stop and review."; exit 1; }
done
umask 077
python3 <<'LEE_CARD_FILES'
import base64, json, os
from pathlib import Path
files = json.loads(base64.b64decode('${payload}'))
credential_file = Path('/etc/lee-whish-worker.env')
if credential_file.stat().st_uid != 0 or credential_file.stat().st_mode & 0o077:
    raise SystemExit('Worker credential file must be root-owned and private (mode 600).')
for line in credential_file.read_text().splitlines():
    if line.startswith('CRON_SECRET='):
        os.environ['CRON_SECRET'] = line.split('=', 1)[1].strip().strip('"').strip("'")
scope = {'__name__': 'preflight'}
exec(compile(files[0][1], '<card-worker>', 'exec'), scope)
if scope['main']() != 0:
    raise SystemExit('Production recovery preflight failed. Nothing installed.')
Path('/opt/lee-card').mkdir(mode=0o755)
Path('/opt/lee-card').chmod(0o755)
for name, content, mode in files:
    p = Path(name)
    with p.open('x', encoding='utf-8', newline='\\n') as f:
        f.write(content)
    p.chmod(int(mode, 8))
LEE_CARD_FILES
systemd-analyze verify /etc/systemd/system/lee-card-reconcile.service /etc/systemd/system/lee-card-reconcile.timer
systemctl daemon-reload
systemctl start lee-card-reconcile.service
systemctl enable --now lee-card-reconcile.timer
systemctl is-active lee-card-reconcile.timer
systemctl show lee-card-reconcile.service -p Result -p ExecMainStatus
journalctl -u lee-card-reconcile.service -n 5 --no-pager
echo 'Card recovery installed. Existing Whish worker unchanged.'
LEE_CARD_INSTALL
`;
mkdirSync('private-ebooks/audi-rollout', {recursive:true});
writeFileSync('private-ebooks/audi-rollout/install-worker-in-putty.txt', script);
console.log('Prepared installer; reuses the existing VPS credential file without embedding secrets.');
