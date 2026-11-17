import io
import json
from pathlib import Path
import tempfile
import threading
import time
from types import SimpleNamespace
import unittest
from datetime import datetime,timedelta
from server import Store,Handler,APIError,IST,contact_key

class MemorySocket:
    def __init__(self,data):self.input=io.BytesIO(data);self.output=bytearray()
    def makefile(self,*args,**kwargs):return self.input
    def sendall(self,data):self.output.extend(data)

class QuietHandler(Handler):
    def log_message(self,*args):pass

class PilotTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name);(self.root/'dist').mkdir();(self.root/'dist'/'index.html').write_text('public')
        self.store=Store(self.root/'private'/'db.sqlite3')
        self.server=SimpleNamespace(directory=self.root/'dist',store=self.store,secure_cookies=False,attempts={},attempts_lock=threading.Lock())
    def tearDown(self):self.temp.cleanup()
    def create(self,contact='alice@example.test'):
        return self.store.register({'contact':contact,'fullName':'Test User','username':'test.user','password':'A long test passphrase 123'})
    def http(self,path,body=None,token='',method=None,origin='http://localhost:8080',client_header=True):
        data=json.dumps(body).encode() if body is not None else b''
        method=method or ('POST' if body is not None else 'GET')
        headers=[f'{method} {path} HTTP/1.0','Host: localhost:8080',f'Origin: {origin}',f'Cookie: nml_session={token}']
        if body is not None:
            headers+=['Content-Type: application/json',f'Content-Length: {len(data)}']
            if client_header:headers+=['X-Nucleus-Client: web']
        sock=MemorySocket(('\r\n'.join(headers)+'\r\n\r\n').encode()+data)
        QuietHandler(sock,('127.0.0.1',43210),self.server)
        header,raw=bytes(sock.output).split(b'\r\n\r\n',1)
        status=int(header.split(b' ')[1]);result=json.loads(raw) if b'application/json' in header else raw
        return status,header.decode(),result
    def test_parallel_saves_have_one_winner_and_no_lost_update(self):
        from concurrent.futures import ThreadPoolExecutor
        user,_=self.create()
        def attempt(i):
            try:
                self.store.save_workspace(user,{'workspace':{'assessment':{'marker':i}},'revision':0})
                return 200
            except APIError as error:return error.status
        with ThreadPoolExecutor(max_workers=10) as pool: results=list(pool.map(attempt,range(10)))
        self.assertEqual(results.count(200),1)
        self.assertEqual(results.count(409),9)
        self.assertEqual(self.store.workspace(user)['revision'],1)

    def test_static_symlink_cannot_expose_database(self):
        (self.root/'dist'/'leak.sqlite3').symlink_to(self.store.path)
        self.assertEqual(self.http('/leak.sqlite3')[0],404)

    def test_workspace_rejects_malformed_saved_articles(self):
        user,_=self.create()
        for invalid in ['not-a-list',['<script>'],['ok']*101]:
            with self.assertRaises(APIError):
                self.store.save_workspace(user,{'workspace':{'savedUpdates':invalid},'revision':0})

    def test_password_validation(self):
        user,_=self.create()
        self.assertEqual(self.store.login('ALICE@example.test','A long test passphrase 123'),user)
        with self.assertRaises(APIError):self.store.login('alice@example.test','wrong-password')
        with self.assertRaises(APIError):self.store.login('nobody@example.test','A long test passphrase 123')
    def test_contacts_are_normalized(self):
        self.assertEqual(contact_key('+91 98765 43210'),contact_key('9876543210'))
        with self.assertRaises(APIError):contact_key('abcde')
    def test_short_password_rejected(self):
        with self.assertRaises(APIError):self.store.register({'contact':'a@example.test','fullName':'Test','username':'test','password':'123456'})
    def test_session_expiry_and_logout(self):
        user,_=self.create();token=self.store.create_session(user)
        self.assertEqual(self.store.session_user(token),user)
        self.store.logout(token);self.assertIsNone(self.store.session_user(token))
        token=self.store.create_session(user)
        with self.store.connect() as db:db.execute('UPDATE sessions SET expires=?',(time.time()-1,))
        self.assertIsNone(self.store.session_user(token))
    def test_recovery_invalidates_sessions_and_rotates_code(self):
        user,code=self.create();token=self.store.create_session(user)
        new=self.store.recover({'contact':'alice@example.test','recoveryCode':code,'password':'The replacement password 456'})
        self.assertNotEqual(code,new);self.assertIsNone(self.store.session_user(token))
        self.assertEqual(self.store.login('alice@example.test','The replacement password 456'),user)
        with self.assertRaises(APIError):self.store.recover({'contact':'alice@example.test','recoveryCode':code,'password':'Another long password 789'})
    def test_accounts_and_revisions_are_isolated(self):
        alice,_=self.create();bob,_=self.create('bob@example.test')
        self.store.save_workspace(alice,{'workspace':{'assessment':{'professionId':'nurse'}},'revision':0})
        self.assertEqual(self.store.workspace(bob)['workspace'],{})
        with self.assertRaises(APIError) as error:self.store.save_workspace(alice,{'workspace':{},'revision':0})
        self.assertEqual(error.exception.status,409)
        self.assertEqual(self.store.workspace(alice)['workspace']['assessment']['professionId'],'nurse')
    def booking_body(self):
        return {'topic':'Clinical research','date':(datetime.now(IST).date()+timedelta(days=1)).isoformat(),'time':'10:30','mode':'Video consultation','requestKey':'request_test_1234'}
    def test_requests_are_idempotent_pending_and_owner_scoped(self):
        alice,_=self.create();bob,_=self.create('bob@example.test');body=self.booking_body()
        first=self.store.request_booking(alice,body);second=self.store.request_booking(alice,body)
        self.assertEqual(first['id'],second['id']);self.assertEqual(first['status'],'requested')
        self.assertEqual(len(self.store.bookings(alice)),1);self.assertEqual(self.store.bookings(bob),[])
        with self.assertRaises(APIError):self.store.cancel_booking(bob,first['id'])
        self.store.cancel_booking(alice,first['id']);self.assertEqual(self.store.bookings(alice)[0]['status'],'cancelled')
    def test_booking_dates_are_validated(self):
        user,_=self.create();body=self.booking_body();body['date']='2020-01-01'
        with self.assertRaises(APIError):self.store.request_booking(user,body)
        body['date']=(datetime.now(IST).date()+timedelta(days=91)).isoformat()
        with self.assertRaises(APIError):self.store.request_booking(user,body)
    def test_http_login_cookie_and_wrong_password(self):
        self.create()
        status,header,result=self.http('/api/auth/login',{'contact':'alice@example.test','password':'wrong-password'})
        self.assertEqual(status,401);self.assertNotIn('Set-Cookie',header)
        status,header,result=self.http('/api/auth/login',{'contact':'alice@example.test','password':'A long test passphrase 123'})
        self.assertEqual(status,200);self.assertIn('HttpOnly',header);self.assertIn('SameSite=Strict',header);self.assertIn('no-store',header)
        self.assertNotIn('password',result['user']);self.assertFalse(result['user']['contactVerified'])
    def test_http_rejects_cross_origin_and_unmarked_writes(self):
        self.assertEqual(self.http('/api/auth/login',{},origin='https://other.example')[0],403)
        self.assertEqual(self.http('/api/auth/login',{},client_header=False)[0],403)
    def test_unauthenticated_writes_and_private_files_blocked(self):
        self.assertEqual(self.http('/api/workspace',{'workspace':{},'revision':0},method='PUT')[0],401)
        self.assertEqual(self.http('/../private/db.sqlite3')[0],404)
        self.assertEqual(self.http('/server.py')[0],404)
        self.assertEqual(self.http('/index.html')[0],200)
    def test_rate_limits(self):
        for i in range(12):self.http('/api/auth/login',{'contact':'none@example.test','password':'wrong'})
        self.assertEqual(self.http('/api/auth/login',{'contact':'none@example.test','password':'wrong'})[0],429)

if __name__=='__main__':unittest.main()
