"""Dependency-free local pilot API. Public production hosting remains a separate step."""
from datetime import datetime, timedelta, timezone
from contextlib import contextmanager
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import threading
import time
from urllib.parse import urlsplit, unquote
IST = timezone(timedelta(hours=5, minutes=30))
SESSION_TTL = 43200
PASSWORD_ROUNDS = 600_000
MAX_BODY = 512_000
SLOTS = ('10:30', '12:00', '14:30', '16:30', '18:00', '19:30')
MODES = ('Video consultation', 'Phone call', 'In person')

class APIError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status

def clean(value, limit=80):
    if not isinstance(value, str):
        raise APIError('Please enter valid text.')
    return re.sub(r'[<>\x00-\x1f]', '', value).strip()[:limit]

def contact_key(value):
    value = clean(value).lower()
    if re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
        return value
    digits = re.sub(r'[\s()+-]', '', value)
    if digits.startswith('91') and len(digits) == 12:
        digits = digits[2:]
    if re.fullmatch(r'[6-9]\d{9}', digits):
        return '+91' + digits
    raise APIError('Enter a valid email or 10-digit Indian mobile number.')

def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), PASSWORD_ROUNDS)
    return salt + ':' + digest.hex()

def password_matches(password, stored):
    return hmac.compare_digest(password_hash(password, stored.split(':')[0]), stored)

class Store:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        with self.connect() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY, contact TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL, username TEXT NOT NULL, password TEXT NOT NULL,
                    recovery_hash TEXT NOT NULL, workspace TEXT NOT NULL DEFAULT '{}', revision INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS bookings (
                    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, request_key TEXT NOT NULL,
                    topic TEXT NOT NULL, preferred_date TEXT NOT NULL, preferred_time TEXT NOT NULL,
                    mode TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(user_id, request_key)
                );
            ''')
        os.chmod(self.path, 0o600)
    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()
    @staticmethod
    def public_user(row):
        return {'id': row['id'], 'fullName': row['full_name'], 'username': row['username'], 'contact': row['contact'],
                'contactType': 'Email' if '@' in row['contact'] else 'Mobile', 'contactVerified': False}
    def register(self, body):
        contact = contact_key(body.get('contact', ''))
        name = clean(body.get('fullName', ''), 60)
        username = clean(body.get('username', ''), 35)
        password = body.get('password', '')
        if not name or not re.fullmatch(r'[A-Za-z0-9_.-]{3,35}', username):
            raise APIError('Enter your name and a username of 3-35 letters, numbers, dots, underscores or hyphens.')
        if not isinstance(password, str) or not 12 <= len(password) <= 128:
            raise APIError('Use a password or passphrase of 12-128 characters.')
        user_id, recovery = secrets.token_hex(16), secrets.token_hex(16)
        with self.connect() as db:
            try:
                db.execute('INSERT INTO users (id,contact,full_name,username,password,recovery_hash) VALUES(?,?,?,?,?,?)',
                           (user_id, contact, name, username, password_hash(password), hashlib.sha256(recovery.encode()).hexdigest()))
            except sqlite3.IntegrityError:
                raise APIError('This contact already has an account. Sign in or use your recovery code.', 409)
        return user_id, recovery
    def login(self, contact, password):
        try:
            contact = contact_key(contact)
        except APIError:
            contact = ''
        if not isinstance(password, str) or len(password) > 128:
            raise APIError('Incorrect contact or password.', 401)
        with self.connect() as db:
            user = db.execute('SELECT * FROM users WHERE contact=?', (contact,)).fetchone()
        expected = user['password'] if user else '00' * 16 + ':' + '00' * 32
        matched = password_matches(password, expected)
        if not user or not matched:
            raise APIError('Incorrect contact or password.', 401)
        return user['id']
    def recover(self, body):
        contact = contact_key(body.get('contact', ''))
        code = clean(body.get('recoveryCode', ''), 80)
        password = body.get('password', '')
        if not isinstance(password, str) or not 12 <= len(password) <= 128:
            raise APIError('Use a new password of 12-128 characters.')
        digest = hashlib.sha256(code.encode()).hexdigest()
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            user = db.execute('SELECT * FROM users WHERE contact=?', (contact,)).fetchone()
            if not user or not hmac.compare_digest(digest, user['recovery_hash']):
                raise APIError('Incorrect contact or recovery code.', 401)
            replacement = secrets.token_hex(16)
            db.execute('UPDATE users SET password=?, recovery_hash=? WHERE id=?',
                       (password_hash(password), hashlib.sha256(replacement.encode()).hexdigest(), user['id']))
            db.execute('DELETE FROM sessions WHERE user_id=?', (user['id'],))
        return replacement
    def create_session(self, user_id):
        token = secrets.token_urlsafe(32)
        with self.connect() as db:
            db.execute('DELETE FROM sessions WHERE expires<?', (time.time(),))
            db.execute('INSERT INTO sessions VALUES(?,?,?)', (hashlib.sha256(token.encode()).hexdigest(), user_id, time.time() + SESSION_TTL))
        return token
    def session_user(self, token):
        with self.connect() as db:
            row = db.execute('SELECT user_id FROM sessions WHERE token_hash=? AND expires>?', (hashlib.sha256(token.encode()).hexdigest(), time.time())).fetchone()
        return row['user_id'] if row else None
    def logout(self, token):
        with self.connect() as db:
            db.execute('DELETE FROM sessions WHERE token_hash=?', (hashlib.sha256(token.encode()).hexdigest(),))
    def workspace(self, user_id):
        with self.connect() as db:
            row = db.execute('SELECT * FROM users WHERE id=?', (user_id,)).fetchone()
        return {'user': self.public_user(row), 'workspace': json.loads(row['workspace']), 'revision': row['revision'], 'bookings': self.bookings(user_id)}
    def save_workspace(self, user_id, body):
        workspace, revision = body.get('workspace'), body.get('revision')
        if not isinstance(workspace, dict) or type(revision) is not int or revision < 0:
            raise APIError('Invalid workspace update.')
        allowed = {k: workspace[k] for k in ('assessment', 'history', 'theme', 'viewport', 'savedUpdates') if k in workspace}
        if 'assessment' in allowed and not isinstance(allowed['assessment'], dict):
            raise APIError('Invalid assessment data.')
        if 'history' in allowed and (not isinstance(allowed['history'], list) or len(allowed['history']) > 20):
            raise APIError('Keep at most 20 assessments in history.')
        if 'savedUpdates' in allowed and (not isinstance(allowed['savedUpdates'], list) or len(allowed['savedUpdates']) > 100 or any(not isinstance(x, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', x) for x in allowed['savedUpdates'])):
            raise APIError('Invalid saved article list.')
        encoded = json.dumps(allowed, allow_nan=False)
        if len(encoded.encode()) > 350_000:
            raise APIError('Workspace is too large. Export older assessments first.', 413)
        with self.connect() as db:
            result = db.execute('UPDATE users SET workspace=?, revision=revision+1 WHERE id=? AND revision=?', (encoded, user_id, revision))
            if result.rowcount != 1:
                raise APIError('This workspace changed on another device. Reload its latest version before saving.', 409)
        return {'revision': revision + 1}
    def update_profile(self, user_id, body):
        name, handle = clean(body.get('fullName', ''), 60), clean(body.get('username', ''), 35)
        if not name or not re.fullmatch(r'[A-Za-z0-9_.-]{3,35}', handle):
            raise APIError('Enter a name and a valid username (3-35 characters).')
        with self.connect() as db:
            db.execute('UPDATE users SET full_name=?,username=? WHERE id=?', (name, handle, user_id))
        return {'user': self.workspace(user_id)['user']}
    def request_booking(self, user_id, body):
        topic, date = clean(body.get('topic', ''), 200), clean(body.get('date', ''), 10)
        slot, mode, key = clean(body.get('time', ''), 5), clean(body.get('mode', ''), 40), clean(body.get('requestKey', ''), 80)
        if not topic or slot not in SLOTS or mode not in MODES or not re.fullmatch(r'[A-Za-z0-9_-]{10,80}', key):
            raise APIError('Choose a pathway, preferred time, and consultation mode.')
        try:
            chosen = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            raise APIError('Choose a valid consultation date.')
        today = datetime.now(IST).date()
        if not today < chosen <= today + timedelta(days=90):
            raise APIError('Choose a date from tomorrow through the next 90 days (India time).')
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            existing = db.execute('SELECT * FROM bookings WHERE user_id=? AND request_key=?', (user_id, key)).fetchone()
            if existing:
                return dict(existing)
            if db.execute("SELECT COUNT(*) FROM bookings WHERE user_id=? AND status='requested'", (user_id,)).fetchone()[0] >= 5:
                raise APIError('You already have five pending requests. Cancel an older request first.', 409)
            booking_id = 'NML-' + secrets.token_hex(5).upper()
            db.execute('INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?)', (booking_id, user_id, key, topic, date, slot, mode, 'requested', datetime.now(timezone.utc).isoformat()))
            return dict(db.execute('SELECT * FROM bookings WHERE id=?', (booking_id,)).fetchone())
    def bookings(self, user_id):
        with self.connect() as db:
            return [dict(row) for row in db.execute('SELECT id,topic,preferred_date,preferred_time,mode,status,created_at FROM bookings WHERE user_id=? ORDER BY created_at DESC LIMIT 50', (user_id,))]
    def cancel_booking(self, user_id, booking_id):
        with self.connect() as db:
            updated = db.execute("UPDATE bookings SET status='cancelled' WHERE id=? AND user_id=? AND status='requested'", (booking_id, user_id))
            if updated.rowcount != 1:
                raise APIError('Pending request not found.', 404)
        return {'bookings': self.bookings(user_id)}
    def all_requests(self):
        with self.connect() as db:
            return [dict(row) for row in db.execute('SELECT b.id,b.topic,b.preferred_date,b.preferred_time,b.mode,b.status,u.full_name,u.contact FROM bookings b JOIN users u ON u.id=b.user_id ORDER BY created_at DESC')]

class NucleusServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    def __init__(self, address, directory, store, secure_cookies=False):
        self.directory, self.store, self.secure_cookies = directory, store, secure_cookies
        self.attempts, self.attempts_lock = {}, threading.Lock()
        super().__init__(address, Handler)

class Handler(SimpleHTTPRequestHandler):
    server_version = 'NucleusLocal'
    sys_version = ''
    def send_head(self):
        name = unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        root = Path(self.directory).resolve()
        target = (root / name).resolve()
        if not target.is_relative_to(root) or not target.is_file() or any(part.startswith('.') for part in Path(name).parts):
            self.send_error(404)
            return None
        return super().send_head()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(args[2].directory), **kwargs)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store' if self.path.startswith('/api/') else 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        super().end_headers()
    def list_directory(self, path):
        self.send_error(404)
        return None
    def token(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get('Cookie', ''))
        except Exception:
            return ''
        return cookie['nml_session'].value if 'nml_session' in cookie else ''
    def reply(self, body, status=200, token=None):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        if token is not None:
            self.send_header('Set-Cookie', f'nml_session={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age={SESSION_TTL if token else 0}' + ('; Secure' if self.server.secure_cookies else ''))
        self.end_headers()
        self.wfile.write(data)
    def body(self):
        if self.headers.get('X-Nucleus-Client') != 'web' or self.headers.get_content_type() != 'application/json':
            raise APIError('Unsupported request.', 403)
        origin = self.headers.get('Origin')
        if origin and urlsplit(origin).netloc != self.headers.get('Host'):
            raise APIError('Request origin does not match this server.', 403)
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_BODY:
                raise APIError('Request is too large or empty.', 413)
            body = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError):
            raise APIError('Invalid JSON request.')
        if not isinstance(body, dict):
            raise APIError('Invalid request body.')
        return body
    def rate_limit(self):
        key, now = self.client_address[0], time.time()
        with self.server.attempts_lock:
            self.server.attempts = {k: [t for t in v if now-t < 300] for k,v in self.server.attempts.items() if v and now-v[-1] < 300}
            attempts = self.server.attempts.setdefault(key, [])
            if len(attempts) >= 12:
                raise APIError('Too many account attempts. Try again in five minutes.', 429)
            attempts.append(now)
    def dispatch(self):
        path, store = urlsplit(self.path).path, self.server.store
        if self.command == 'GET' and path == '/api/session':
            user_id = store.session_user(self.token())
            return self.reply(store.workspace(user_id) if user_id else {'user': None})
        body = self.body() if self.command != 'GET' else {}
        if path in ('/api/auth/register', '/api/auth/login', '/api/auth/recover') and self.command == 'POST':
            self.rate_limit()
            if path.endswith('recover'):
                return self.reply({'recoveryCode': store.recover(body)})
            if path.endswith('register'):
                user_id, recovery = store.register(body)
            else:
                user_id, recovery = store.login(body.get('contact', ''), body.get('password', '')), None
            store.logout(self.token())
            token = store.create_session(user_id)
            result = store.workspace(user_id)
            if recovery:
                result['recoveryCode'] = recovery
            return self.reply(result, token=token)
        if path == '/api/auth/logout' and self.command == 'POST':
            store.logout(self.token())
            return self.reply({'ok': True}, token='')
        user_id = store.session_user(self.token())
        if not user_id:
            raise APIError('Your session ended. Sign in again to save your changes.', 401)
        if path == '/api/workspace' and self.command == 'PUT':
            return self.reply(store.save_workspace(user_id, body))
        if path == '/api/profile' and self.command == 'PUT':
            return self.reply(store.update_profile(user_id, body))
        if path == '/api/bookings' and self.command == 'GET':
            return self.reply({'bookings': store.bookings(user_id)})
        if path == '/api/bookings' and self.command == 'POST':
            booking = store.request_booking(user_id, body)
            return self.reply({'booking': booking, 'bookings': store.bookings(user_id)}, 201)
        if path == '/api/bookings/cancel' and self.command == 'POST':
            return self.reply(store.cancel_booking(user_id, clean(body.get('id', ''))))
        raise APIError('Endpoint not found.', 404)
    def api(self):
        try:
            self.dispatch()
        except APIError as exc:
            self.reply({'error': str(exc)}, exc.status)
        except Exception:
            self.log_error('API operation failed')
            self.reply({'error': 'The server could not complete this request. Please retry.'}, 500)
    def do_GET(self):
        if urlsplit(self.path).path.startswith('/api/'):
            return self.api()
        super().do_GET()
    def do_POST(self):
        self.api()
    def do_PUT(self):
        self.api()
