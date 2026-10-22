import http.client
import json
import threading
import unittest
from unittest.mock import Mock
from gateway import RelayServer, TARGETS, MAX_BYTES, NoRedirect


class GatewayTest(unittest.TestCase):
    def setUp(self):
        self.sender = Mock(return_value=b'{"HasErrors":false}')
        self.server = RelayServer(('127.0.0.1', 0), 'a' * 64, self.sender)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def request(self, path, body=b'{}', key='a' * 64, content_type='application/json', method='POST'):
        client = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=3)
        client.request(method, path, body=body, headers={'Authorization': 'Bearer ' + key, 'Content-Type': content_type})
        response = client.getresponse()
        data = response.read()
        status = response.status
        client.close()
        return status, data

    def test_health_has_no_carrier_call(self):
        self.assertEqual(self.request('/health', method='GET')[0], 200)
        self.sender.assert_not_called()

    def test_only_fixed_uat_destinations(self):
        for path, target in TARGETS.items():
            self.assertEqual(self.request(path)[0], 200)
            self.sender.assert_called_with(target, b'{}')
        self.assertEqual(self.sender.call_count, 3)

    def test_auth_blocks_carrier_access(self):
        self.assertEqual(self.request('/uat/shipments', key='wrong')[0], 401)
        self.sender.assert_not_called()

    def test_arbitrary_paths_and_queries_rejected(self):
        for path in ['/production/shipments', '/uat/shipments?url=https://evil.test', '/https://evil.test', '/uat/shipments/']:
            self.assertEqual(self.request(path)[0], 404)
        self.sender.assert_not_called()

    def test_invalid_json_and_type_rejected(self):
        for body in [b'[]', b'invalid', b'null', b'\xff\xff']:
            self.assertEqual(self.request('/uat/label', body)[0], 400)
        self.assertEqual(self.request('/uat/label', content_type='text/plain')[0], 415)
        self.sender.assert_not_called()

    def test_body_limit(self):
        self.assertEqual(self.request('/uat/label', b'x' * (MAX_BYTES + 1))[0], 413)
        self.sender.assert_not_called()

    def test_failed_booking_never_retried_or_leaked(self):
        self.sender.side_effect = ValueError('secret-password and private customer data')
        status, body = self.request('/uat/shipments')
        self.assertEqual(status, 502)
        self.assertNotIn(b'secret', body)
        self.assertEqual(self.sender.call_count, 1)

    def test_redirects_disabled(self):
        self.assertIsNone(NoRedirect().redirect_request(None, None, 302, '', {}, 'https://evil.test'))

    def test_weak_key_refused(self):
        with self.assertRaises(ValueError):
            RelayServer(('127.0.0.1', 0), 'short')


if __name__ == '__main__':
    unittest.main()
