#!/usr/bin/env python3
"""Serve an isolated demonstration preview over a temporary localhost.run HTTPS link."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
from urllib.parse import unquote, urlsplit
from scripts.build import build

ROOT = Path(__file__).resolve().parent


def prepare_preview(output):
    public = build(output, mode='offline')
    return public


class PreviewHandler(SimpleHTTPRequestHandler):
    """Only serve files from the disposable public build; no accounts/API."""
    server_version = 'NucleusPreview/8.6'
    sys_version = ''

    def __init__(self, request, address, server):
        super().__init__(request, address, server, directory=str(server.directory))

    def send_head(self):
        name = unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        root = Path(self.directory).resolve()
        target = (root / name).resolve()
        if not target.is_relative_to(root) or not target.is_file() or target.is_symlink():
            self.send_error(404, 'Not available in the app preview')
            return None
        if name.startswith('api/') or any(part.startswith('.') for part in Path(name).parts):
            self.send_error(404, 'Not available in the app preview')
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404, 'Directory listing unavailable')
        return None

    def do_POST(self):
        self.send_error(405, 'Accounts and requests are not enabled in this preview')

    do_PUT = do_DELETE = do_PATCH = do_POST

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()

    def log_message(self, *args):
        pass


def ssh_command(port, ssh):
    # No local account key, SSH agent, or custom SSH config is forwarded/offered.
    return [ssh, '-F', '/dev/null', '-T',
            '-o', 'StrictHostKeyChecking=accept-new',
            '-o', f'UserKnownHostsFile={ROOT / "runtime-data" / "preview-known-hosts"}',
            '-o', 'IdentityFile=none', '-o', 'IdentitiesOnly=yes', '-o', 'IdentityAgent=none',
            '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=20',
            '-o', 'ServerAliveInterval=30', '-o', 'ServerAliveCountMax=3',
            '-o', 'ExitOnForwardFailure=yes',
            '-R', f'80:127.0.0.1:{port}', 'nokey@localhost.run']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=0, help='Local port (default: choose a free port)')
    parser.add_argument('--local-only', action='store_true', help='Check the demonstration preview on this Mac without an internet tunnel')
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error('--port must be between 0 and 65535')
    ssh = shutil.which('ssh')
    if not args.local_only and not ssh:
        parser.error('SSH is unavailable. Run this launcher on the Mac, which includes SSH.')
    with tempfile.TemporaryDirectory(prefix='nucleus-install-preview-') as temporary:
        public = prepare_preview(Path(temporary) / 'public')
        try:
            server = ThreadingHTTPServer(('127.0.0.1', args.port), PreviewHandler)
        except OSError as exc:
            print(f'Cannot start preview: {exc}. Try --port 0.', file=sys.stderr)
            return 1
        server.directory = public
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        tunnel = None
        try:
            port = server.server_address[1]
            print(f'\nNucleus MedLabs v8.6 - installation preview\nMac check: http://localhost:{port}\n', flush=True)
            if args.local_only:
                print('Local-only mode: no public link. Press Ctrl+C to stop.', flush=True)
                thread.join()
            else:
                (ROOT / 'runtime-data').mkdir(exist_ok=True)
                print('Starting a temporary PUBLIC demonstration link through localhost.run.\n'
                      'Only the app and its public assets are shared. Your Mac account database is not served.\n'
                      'Progress is saved on the device; cloud accounts and consultation requests are unavailable.\n\n'
                      '1. Open the https:// link printed below in Chrome on your phone or tablet.\n'
                      '2. Tap Install app, or Chrome menu > Add to Home screen > Install.\n'
                      '3. Wait for Settings to show Ready for offline use.\n'
                      '4. Close Chrome and launch the Nucleus MedLabs icon.\n\n'
                      'Keep this Terminal open and the Mac awake while installing.\n'
                      'The free link is temporary and can change. Export progress before changing links.\n'
                      'Press Ctrl+C to stop sharing.\n', flush=True)
                tunnel = subprocess.Popen(ssh_command(port, ssh))
                code = tunnel.wait()
                print('\nThe HTTPS preview has stopped. Run this launcher again for a new link.\n'
                      'If connection failed, check internet access; some networks block SSH port 22.', flush=True)
                return code
        except KeyboardInterrupt:
            print('\nPreview stopped. Your local account database was not changed.', flush=True)
        finally:
            if tunnel and tunnel.poll() is None:
                tunnel.terminate()
                try:
                    tunnel.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    tunnel.kill()
                    tunnel.wait()
            server.shutdown()
            server.server_close()
            thread.join(timeout=3)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
