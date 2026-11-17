#!/usr/bin/env python3
"""Nucleus MedLabs local pilot. No external tunnel is started."""
import argparse
import json
from pathlib import Path
import socket
import subprocess
import sys
from server import NucleusServer, Store
from scripts.build import build
ROOT = Path(__file__).resolve().parent

def lan_addresses():
    addresses = set()
    if sys.platform == 'darwin':
        for interface in ('en0', 'en1'):
            result = subprocess.run(['/usr/sbin/ipconfig', 'getifaddr', interface], capture_output=True, text=True)
            if result.stdout.strip():
                addresses.add(result.stdout.strip())
    try:
        addresses.update(socket.gethostbyname_ex(socket.gethostname())[2])
    except OSError:
        pass
    return sorted(a for a in addresses if not a.startswith('127.'))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pilot', action='store_true', help='Enable the optional local account pilot instead of the shipped demonstration')
    parser.add_argument('--lan', action='store_true', help='Allow devices on your trusted Wi-Fi')
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--data-dir', type=Path, default=ROOT / 'runtime-data')
    parser.add_argument('--list-requests', action='store_true', help='View consultation requests on this Mac')
    parser.add_argument('--secure-cookies', action='store_true', help='Only for deployment behind HTTPS')
    args = parser.parse_args()
    if not args.pilot and not args.list_requests:
        from http.server import ThreadingHTTPServer
        from install_preview import PreviewHandler
        public=build(mode='offline')
        server=ThreadingHTTPServer(('0.0.0.0' if args.lan else '127.0.0.1',args.port),PreviewHandler)
        server.directory=public
        print(f'CareerShift 8.6.0: http://localhost:{server.server_port}',flush=True)
        try:server.serve_forever()
        except KeyboardInterrupt:pass
        finally:server.server_close()
        return
    store = Store(args.data_dir / 'nucleus.sqlite3')
    if args.list_requests:
        print(json.dumps(store.all_requests(), indent=2, ensure_ascii=False))
        return
    build(mode='pilot')
    try:
        server = NucleusServer(('0.0.0.0' if args.lan else '127.0.0.1', args.port), ROOT / 'dist', store, args.secure_cookies)
    except OSError as exc:
        print(f'Cannot start on port {args.port}: {exc}\nTry: python3 app.py --lan --port 8081', file=sys.stderr)
        raise SystemExit(1)
    print(f'\nNucleus MedLabs 8.6.0 - local pilot\nMac: http://localhost:{args.port}', flush=True)
    if args.lan:
        for ip in lan_addresses():
            print(f'Phone or tablet (same Wi-Fi): http://{ip}:{args.port}', flush=True)
        print('Keep this Terminal open and the Mac awake. Use test credentials on trusted Wi-Fi.', flush=True)
    print('Email verification and advisor notifications are not connected. Requests remain pending review.\nPress Ctrl+C to stop.\n', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped. Accounts and requests remain saved on this Mac.')
    finally:
        server.server_close()
if __name__ == '__main__':
    main()
