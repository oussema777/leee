"""Invoke the authenticated LEE reconciliation endpoint; never process payment data here."""
import json
import os
import sys
import urllib.request
import urllib.error


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main():
    secret = os.environ.get("CRON_SECRET", "")
    if len(secret) < 16:
        print("CRON_SECRET must be configured.", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        print("Worker configuration present; no request sent.")
        return 0
    request = urllib.request.Request(
        "https://www.theleeexperience.com/api/cron/whish-pay",
        headers={"Authorization": "Bearer " + secret, "User-Agent": "LEE-Whish-Reconciler/1.0"},
    )
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=250) as response:
            result = json.load(response)
        if "payments" not in result or "mail" not in result:
            print("Unexpected reconciliation response.", file=sys.stderr)
            return 1
        print(json.dumps({"payments": result["payments"], "mail": result["mail"]}))
        return 1 if result["payments"].get("errors", 0) or result["mail"].get("errors", 0) else 0
    except (urllib.error.URLError, TimeoutError, ValueError):
        print("Whish reconciliation request failed; inspect the application and retry.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
