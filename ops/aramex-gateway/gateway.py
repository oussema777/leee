"""Loopback-only, authenticated UAT relay behind the dedicated Nginx site.

No database access, shell execution, arbitrary destination, redirects or retries.
Never log request/response bodies, headers or carrier credentials.
"""
import hmac
import json
import os
import re
import socket
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn

TARGETS = {
    '/uat/shipments': 'https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments',
    '/uat/tracking': 'https://ws.uat.aramex.net/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments',
    '/uat/label': 'https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/PrintLabel',
}
MAX_BYTES = 256 * 1024


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def forward(url, body):
    # Ignore machine-wide proxy variables. TLS certificate verification remains on.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    request = urllib.request.Request(url, data=body, method='POST', headers={
        'Content-Type': 'application/json', 'Accept': 'application/json',
    })
    with opener.open(request, timeout=12) as response:
        if response.status != 200:
            raise ValueError('Upstream unavailable')
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError('Response too large')
        json.loads(data.decode('utf-8'))
        return data


class RelayServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    request_queue_size = 8

    def __init__(self, address, key, sender=forward):
        if not re.fullmatch(r'[a-f0-9]{64}', key):
            raise ValueError('A 64-character gateway secret is required')
        self.key = key
        self.sender = sender
        self.slots = threading.BoundedSemaphore(4)
        super().__init__(address, Handler)

    def process_request(self, request, client_address):
        if not self.slots.acquire(blocking=False):
            self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except Exception:
            self.slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try:
            super().process_request_thread(request, client_address)
        finally:
            self.slots.release()

    def handle_error(self, request, client_address):
        pass  # No traceback containing customer payloads or credentials.


class Handler(BaseHTTPRequestHandler):
    server_version = 'LEE-Gateway'
    sys_version = ''
    protocol_version = 'HTTP/1.0'

    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *args):
        pass

    def reply(self, code, body):
        self.close_connection = True
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            self.reply(200, b'{"status":"ok","environment":"UAT"}')
        else:
            self.reply(404, b'{"error":"Not found"}')

    def do_POST(self):
        destination = TARGETS.get(self.path)
        if not destination:
            self.reply(404, b'{"error":"Not found"}')
            return
        auth = self.headers.get_all('Authorization', [])
        expected = ('Bearer ' + self.server.key).encode('ascii')
        if len(auth) != 1 or not hmac.compare_digest(auth[0].encode('utf-8'), expected):
            self.reply(401, b'{"error":"Unauthorized"}')
            return
        lengths = self.headers.get_all('Content-Length', [])
        if self.headers.get('Transfer-Encoding') or len(lengths) != 1 or not re.fullmatch(r'[0-9]{1,7}', lengths[0]):
            self.reply(400, b'{"error":"Content length required"}')
            return
        length = int(lengths[0])
        if length < 2 or length > MAX_BYTES:
            self.reply(413, b'{"error":"Invalid body size"}')
            return
        if self.headers.get_content_type() != 'application/json':
            self.reply(415, b'{"error":"Send JSON"}')
            return
        try:
            body = self.rfile.read(length)
            if len(body) != length or not isinstance(json.loads(body.decode('utf-8')), dict):
                raise ValueError('Invalid body')
        except (ValueError, UnicodeError, socket.timeout):
            self.reply(400, b'{"error":"Invalid JSON body"}')
            return
        try:
            result = self.server.sender(destination, body)
            self.reply(200, result)
        except Exception:
            # A failed call may still have booked a shipment. Never retry it.
            self.reply(502, b'{"error":"Carrier result unavailable; verify before retrying"}')


if __name__ == '__main__':
    RelayServer(('127.0.0.1', 5088), os.environ.get('LEE_ARAMEX_GATEWAY_KEY', '')).serve_forever()
