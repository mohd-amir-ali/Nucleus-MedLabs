import io
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from install_preview import PreviewHandler, prepare_preview
from scripts.build import ROOT


class MemorySocket:
    def __init__(self, data):
        self.input = io.BytesIO(data)
        self.output = bytearray()

    def makefile(self, *args, **kwargs):
        return self.input

    def sendall(self, data):
        self.output.extend(data)


class InstallPreviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.public = prepare_preview(Path(self.temp.name) / 'public')
        self.server = SimpleNamespace(directory=self.public)

    def tearDown(self):
        self.temp.cleanup()

    def request(self, path, method='GET'):
        sock = MemorySocket(f'{method} {path} HTTP/1.0\r\nHost: preview.example\r\nContent-Length: 0\r\n\r\n'.encode())
        PreviewHandler(sock, ('127.0.0.1', 12345), self.server)
        headers, body = bytes(sock.output).split(b'\r\n\r\n', 1)
        return int(headers.split(b' ')[1]), headers, body

    def test_preview_uses_demo_gate_without_changing_source(self):
        self.assertIn('"installPreview": true', (self.public / 'scripts/runtime_config.js').read_text())
        self.assertIn('installPreview: true', (ROOT / 'scripts/runtime_config.js').read_text())
        for private in ['runtime-data', 'server.py', 'app.py', 'install_preview.py', 'tests', 'releases']:
            self.assertFalse((self.public / private).exists())

    def test_app_shell_and_install_scripts_are_served(self):
        status, headers, body = self.request('/')
        self.assertEqual(status, 200)
        self.assertIn(b'name="nucleus-app"', body)
        self.assertIn(b'X-Content-Type-Options: nosniff', headers)
        for path in ['/manifest.json', '/sw.js', '/scripts/runtime_config.js', '/scripts/install_app.js', '/scripts/demo_access.js', '/assets/updates/medical-devices.jpg']:
            with self.subTest(path=path):
                self.assertEqual(self.request(path)[0], 200)

    def test_private_paths_and_traversal_are_unavailable(self):
        (Path(self.temp.name) / 'private.txt').write_text('must not escape')
        for path in ['/api/session', '/api/bookings', '/runtime-data/nucleus.sqlite3', '/server.py', '/scripts/', '/../private.txt', '/%2e%2e/private.txt']:
            with self.subTest(path=path):
                status, _, body = self.request(path)
                self.assertEqual(status, 404)
                self.assertNotIn(b'must not escape', body)

    def test_all_writes_are_rejected(self):
        for method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            with self.subTest(method=method):
                self.assertEqual(self.request('/api/auth/register', method)[0], 405)

    def test_symlink_cannot_expose_files_outside_public_build(self):
        private = Path(self.temp.name) / 'private.txt'
        private.write_text('must not escape')
        (self.public / 'leak.txt').symlink_to(private)
        self.assertEqual(self.request('/leak.txt')[0], 404)


if __name__ == '__main__':
    unittest.main()
