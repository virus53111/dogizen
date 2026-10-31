"""Enforce server-verified GUI entitlements in Murdilimax Orbit.

These client checks improve UX and discourage accidental overuse; a
modified open-source desktop client can bypass them. Commercial guarantees
require a server-side paid service and signed license/hardware proofs.
"""
from tkinter import messagebox
import threading

FREE={'android':1,'browsers':2}

def attach(cls,scope):
 original_init=cls.__init__
 def init(self,root):
  original_init(self,root)
  def check_license():
   try:
    if not root.winfo_exists():return
    token=self.orbit_client.existing_token()
    if getattr(self,'orbit_authorized',False) and token:
     def verify():
      try:
       data=self.orbit_client.whoami(token)
       if not data.get('authorized'):
        self.orbit_client.clear_token()
        root.after(0,lambda:self.orbit_license_expired())
       else:
        root.after(0,lambda d=data:self.orbit_license_update(d))
      except Exception:
       # No paid feature access without periodic server verification.
       root.after(0,lambda:self.orbit_license_offline())
     threading.Thread(target=verify,daemon=True).start()
   finally:
    try:root.after(300000,check_license)
    except Exception:pass
  root.after(300000,check_license)
 def license_expired(self):
  self.orbit_authorized=False
  self.orbit_entitlements=FREE.copy()
  self.orbit_plan='free'
  self.orbit_message.set('Срок сессии истёк — войди повторно')
  self.show_tab('account')
 def license_update(self,data):
  limits=data.get('entitlements') or FREE
  self.orbit_entitlements={'android':max(0,int(limits.get('android',1))),
                           'browsers':max(0,int(limits.get('browsers',2)))}
  self.orbit_plan=data.get('plan','free')
 def license_offline(self):
  if getattr(self,'orbit_plan','free')!='free':
   self.orbit_plan='free'
   self.orbit_entitlements=FREE.copy()
   self.orbit_message.set('Нет связи: платные возможности временно отключены')
 def allowances(self):
  return getattr(self,'orbit_entitlements',FREE) or FREE
 def permit(self,kind,current=0):
  quota=max(0,int(allowances(self).get(kind,0)))
  if current<quota:return True
  messagebox.showinfo('Лимит тарифа',
    ('Доступно Android: ' if kind=='android' else 'Доступно браузеров: ')+str(quota)+
    '.\nСейчас выбран тариф '+str(getattr(self,'orbit_plan','free')).upper()+
    '.\nПлатные тарифы начнут действовать после включения официальной оплаты.')
  return False
 old_profile_dialog=cls.profile_dialog
 def profile_dialog(self,existing=None):
  if existing is None and not permit(self,'browsers',len(self.cfg.get('profiles',[]))):return
  return old_profile_dialog(self,existing)
 old_launch_profile=cls.launch_profile
 def launch_profile(self):
  selected=self.selected_profile()
  if not selected:return
  allowed=max(0,int(allowances(self).get('browsers',0)))
  active=[p.get('id') for p in self.cfg.get('profiles',[])[:allowed]]
  if selected.get('id') not in active:
   permit(self,'browsers',allowed);return
  return old_launch_profile(self)
 old_start_avd=cls.start_avd
 def start_avd(self):
  count=0
  for serial,process in list(getattr(self,'running',{}).items()):
   try:
    if process.poll() is None:count+=1
   except Exception:pass
  # Self-started Android AVDs: apply tier capacity.
  if not permit(self,'android',count):return
  return old_start_avd(self)
 old_create_avd=getattr(cls,'orbit_create_avd',None)
 def create_avd(self):
  count=sum(x.startswith('avd:') for x in self.android_tree.get_children())
  if not permit(self,'android',count):return
  return old_create_avd(self)
 old_open_board=getattr(cls,'orbit_open_board',None)
 def open_board(self):
  max_devices=max(0,int(allowances(self).get('android',0)))
  connected=sum(x.startswith('device:') for x in self.android_tree.get_children())
  if connected>max_devices:
   messagebox.showinfo('Лимит Android','Обнаружено '+str(connected)+' устройств, разрешено: '+str(max_devices)+'.\nОтключи лишние устройства либо выбери другой тариф.')
   return
  return old_open_board(self)
 cls.__init__=init
 cls.orbit_license_expired=license_expired
 cls.orbit_license_update=license_update
 cls.orbit_license_offline=license_offline
 cls.profile_dialog=profile_dialog
 cls.launch_profile=launch_profile
 cls.start_avd=start_avd
 if old_create_avd:cls.orbit_create_avd=create_avd
 if old_open_board:cls.orbit_open_board=open_board
 cls.orbit_entitlements_for_current_session=allowances
