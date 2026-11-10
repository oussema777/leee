"""Run card recovery through the authenticated website endpoint."""
import json
import os
import sys
import urllib.request
import urllib.error


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def safe_counts(result, group, names):
    values = result.get(group)
    if not isinstance(values, dict):
        raise ValueError("Missing recovery counters")
    counters = {name: values.get(name) for name in names}
    if any(type(value) is not int or value < 0 for value in counters.values()):
        raise ValueError("Invalid recovery counters")
    return counters


def main():
    secret = os.environ.get("CRON_SECRET", "")
    if len(secret) < 32:
        print("Card recovery credential is missing or too short.", file=sys.stderr)
        return 1
    request = urllib.request.Request(
        "https://www.theleeexperience.com/api/cron/card-payments",
        headers={"Authorization": "Bearer " + secret, "User-Agent": "LEE-Card-Reconciler/1.0"},
    )
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=130) as response:
            # Keep unexpected upstream bodies out of memory and service logs.
            body = response.read(65537)
            if len(body) > 65536:
                raise ValueError("Recovery response too large")
            result = json.loads(body)
        if not isinstance(result, dict):
            raise ValueError("Invalid recovery response")
        if result.get("running") is True:
            print("Another recovery run holds the lease.")
            return 0
        payments = safe_counts(result, "payments", ("checked", "applied", "pending", "failed"))
        mail = safe_counts(result, "mail", ("sent", "skipped", "failed", "review"))
        print(json.dumps({"payments": payments, "mail": mail}))
        return 1 if payments["failed"] or mail["failed"] else 0
    except (urllib.error.URLError, TimeoutError, ValueError):
        print("Card recovery failed; inspect the website's card operations dashboard.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
