"""Device authorization client for Murdilimax Orbit. No passwords enter the desktop app."""
import json, urllib.error, urllib.request, os, secrets
from pathlib import Path
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
 def installation_id(self):
  """Stable, random per-install ID, not a claim of unique hardware identity.
  Use OS Keychain where available. A user can reinstall or copy this value;
  stronger commercial binding requires a platform-backed non-exportable key.
  """
  if getattr(self,'_install_id',None):return self._install_id
  key='orbit-installation-v1'
  k=self._keyring()
  if k:
   try:
    val=k.get_password('Murdilimax Orbit Desktop',key)
    if val and len(val)==64:
     self._install_id=val;return val
   except Exception:pass
  path=Path.home()/'.murdilimax-orbit'/'installation-id'
  if path.exists():
   try:
    val=path.read_text().strip()
    if len(val)==64 and all(c in '0123456789abcdef' for c in val):
     self._install_id=val;return val
   except Exception:pass
  val=secrets.token_hex(32)
  if k:
   try:k.set_password('Murdilimax Orbit Desktop',key,val)
   except Exception:pass
  path.parent.mkdir(parents=True,exist_ok=True)
  try:
   path.write_text(val)
   if os.name!='nt':
    os.chmod(path,0o600)
  except OSError:pass
  self._install_id=val
  return val
 def begin(self):return post('/start',{'installation_id':self.installation_id()})
 def poll(self,code,secret):return post('/poll',{'code':code,'secret':secret})
 def whoami(self,token):return post('/me',{'token':token,'installation_id':self.installation_id()})
