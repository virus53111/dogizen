"""Enforce server-verified GUI entitlements in Murdilimax Orbit.

These client checks improve UX and discourage accidental overuse; a
modified open-source desktop client can bypass them. Commercial guarantees
require a server-side paid service and signed license/hardware proofs.
"""
from tkinter import messagebox

FREE={'android':1,'browsers':2}

def attach(cls,scope):
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
 cls.profile_dialog=profile_dialog
 cls.launch_profile=launch_profile
 cls.start_avd=start_avd
 if old_create_avd:cls.orbit_create_avd=create_avd
 if old_open_board:cls.orbit_open_board=open_board
 cls.orbit_entitlements_for_current_session=allowances
