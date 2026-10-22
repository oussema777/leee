# LEE Aramex gateway on the existing Eventra VPS

Status 23 October 2026: user confirmed installation, public HTTPS routing and boot enablement. External checks independently returned 200 with the expected UAT health JSON and 401 for an unauthenticated tracking POST. User installed the gateway-specific Certbot deploy hook and reported `Hook syntax OK`; an actual renewal/reload was not exercised. No authorized Aramex request was made. Eventra's three PM2 processes remained online with zero restarts. Gateway Nginx backup: `/etc/nginx/sites-available/lee-aramex-backup.7rual1`. Application gateway routing is now implemented locally; real secret configuration, deployment and authenticated verification remain pending.

User verified Ubuntu 24.04.3, Python 3.12.3, outbound IPv4 72.61.160.199 and spare resources. Eventra uses Nginx, PM2 and MongoDB. The new DNS name is aramex-gateway.theleeexperience.com. User created a separate Nginx site and obtained the lee-aramex-gateway certificate through webroot validation. HTTPS `/health` now returns 200; missing authentication on an allowed POST returns 401. Existing Eventra configuration files have not been edited by our instructions.

## Local tests

`python -m unittest discover -s ops/aramex-gateway -p test_gateway.py -v`

Nine tests passed with carrier transport mocked: health, authentication, exact UAT routes, arbitrary/query destinations blocked, JSON/media validation, body limit, no retry/error leakage, no redirects and weak-key refusal. This does not prove systemd sandbox compatibility on Ubuntu or carrier connectivity.

## Install, one stage at a time

Run `python ops/aramex-gateway/build_install.py` locally to generate `install-in-putty.txt`, the complete copy-and-paste block for the user's authenticated root PuTTY session. It checks port 5088 and refuses existing gateway paths, writes only the gateway app/unit/secret, validates the unit, reloads systemd's unit definitions, and starts only lee-aramex-gateway. It checks loopback health. It does not edit/reload Nginx, install packages, touch PM2, open firewall ports or enable startup yet. The shared secret is generated on the VPS, stored root-only in `/etc/lee-aramex-gateway.env`, never printed. No Aramex credentials are stored on this gateway.

The process uses a dynamic unprivileged user, read-only filesystem protection, no home access/capabilities, 128 MB memory, 10% of one core, 16 tasks and 128 file descriptors. It listens only on 127.0.0.1:5088 with at most four active handler threads. Root owns the source and unit. Sharing the host still shares its availability; resource limits do not eliminate all shared-host risk.

Only exact POST routes `/uat/shipments`, `/uat/tracking`, `/uat/label` are accepted with the secret Bearer header. They map to fixed HTTPS Aramex UAT destinations. No client-controlled URL, redirects, proxy-environment inheritance or retries. Request and response bodies are bounded to 256 KiB. TLS verification is enabled. Errors are sanitized; request/header/body logging is disabled. A failed upstream response may mean a shipment exists, so the app must retain its UNKNOWN/recovery behavior. The stdlib HTTP handler is internal-only and must remain behind Nginx request buffering/limits; do not expose port 5088 publicly.

## Rollout progress

1. Local installation confirmed by user. Check Eventra remains online during public activation.
2. Execute `enable-https-in-putty.txt`: it updates only the dedicated gateway site, with bounded bodies, a shared gateway request limit of 30/minute with burst 5, four connections, timeouts, exact paths and no upstream retries or access logging. It validates before reloading, retains a backup, checks local TLS health (200) and missing-auth rejection (401), and restores the prior site on validation/reload/smoke failure. Ends with `pm2 list` for Eventra verification. No authenticated carrier requests are made. Nginx syntax/runtime validation occurs on the VPS; local Python tests do not validate Nginx.
3. Public health/auth rejection verified; user enabled the new service at boot.
4. Gateway-specific renewal hook installed and shell syntax checked. Renewal execution is not yet tested.
5. Implemented `src/lib/aramex/gateway-fetch.ts`; all three configured application factories require it. Only the approved gateway HTTPS origin and three fixed UAT destination mappings are accepted. The wrapper replaces outbound headers with JSON headers and the gateway Bearer key, forbids redirects/cookies/caching, preserves body and cancellation, and never falls back to direct egress. Low-level adapters still allow injected mocks for testing. Local code changes are not deployed.
6. On 23 October the user confirmed saving the gateway URL and key in Vercel Production and Preview settings. The values have not been independently verified. Deploy and verify authenticated routing from Vercel before enabling Aramex calls. UAT registration/password and whitelist confirmation remain pending.

## Application configuration

Set `ARAMEX_UAT_GATEWAY_URL=https://aramex-gateway.theleeexperience.com` and `ARAMEX_UAT_GATEWAY_KEY` to the 64-character value generated in `/etc/lee-aramex-gateway.env` (value only). Both are server-side settings; never use NEXT_PUBLIC_ or put the secret in a URL. The gateway key is separate from the Aramex account password and webhook key. Missing/wrong-shape configuration makes the operations unavailable before a booking attempt can be claimed. A valid-shaped but wrong key fails at the gateway; a failed booking response remains UNKNOWN and requires review. Gateway setup alone does not enable sending: retain all existing operation flags as false pending account, egress and UAT verification.

The application currently allowlists this exact gateway hostname. Future gateway migration needs a reviewed hostname change, new secret, deployed routing verification and updated carrier whitelist before traffic switches. No direct egress fallback should be added.

## Stop/rollback

To stop the new process only: `systemctl stop lee-aramex-gateway`. It is enabled at boot; use `systemctl disable lee-aramex-gateway` separately if taking it out of service across reboots. Do not stop nginx, MongoDB or PM2. To remove public proxying, restore the backed-up gateway site (503), run `nginx -t`, and reload Nginx. Keep certificate/webroot for renewal; no customer shipments should be recreated because a gateway request failed.
