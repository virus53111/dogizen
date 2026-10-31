"""Device authorization client for Murdilimax Orbit. No passwords enter the desktop app."""
import json, urllib.error, urllib.request
API='https://murdilimax-orbit.hatchable.site/api/device'
class DeviceError(RuntimeError): pass
def post(path, payload):
 req=urllib.request.Request(API+path, data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','Accept':'application/json'},method='POST')
 try:
  with urllib.request.urlopen(req,timeout=18) as r:
   if 'application/json' not in r.headers.get('content-type',''): raise DeviceError('Аккаунт-сервер недоступен — сделай Hatchable проект Public')
   return json.loads(r.read(65536).decode())
 except urllib.error.HTTPError as e:
  try: detail=json.loads(e.read(4096)).get('error')
  except Exception: detail=str(e)
  raise DeviceError(detail or 'Ошибка входа') from e
 except urllib.error.URLError as e: raise DeviceError('Нет сети: '+str(e)) from e
class DeviceClient:
 def __init__(self): self.token=None
 def _keyring(self):
  try: import keyring; return keyring
  except ImportError: return None
 def existing_token(self):
  if self.token:return self.token
  k=self._keyring()
  if k:
   try:return k.get_password('Murdilimax Orbit Desktop','orbit-token')
   except Exception:return None
 def store_token(self,token):
  self.token=token;k=self._keyring()
  if k:
   try:k.set_password('Murdilimax Orbit Desktop','orbit-token',token)
   except Exception:pass
 def clear_token(self):
  self.token=None;k=self._keyring()
  if k:
   try:k.delete_password('Murdilimax Orbit Desktop','orbit-token')
   except Exception:pass
 def begin(self):return post('/start',{})
 def poll(self,code,secret):return post('/poll',{'code':code,'secret':secret})
 def whoami(self,token):return post('/me',{'token':token})
