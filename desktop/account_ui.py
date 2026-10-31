"""Account screen for Orbit desktop. Paired in the user's web browser."""
import threading,time,webbrowser
from orbit_auth import DeviceClient,DeviceError
def attach(cls,ctx):
 tk=ctx['tk'];BG=ctx['BG'];PANEL=ctx['PANEL'];GREEN=ctx['GREEN'];PURPLE=ctx['PURPLE'];MUTED=ctx['MUTED']
 original_init=cls.__init__; original_tab=cls.show_tab
 def tab(self,name):
  if getattr(self,'orbit_ready',False) and name!='account' and not self.orbit_authorized and not getattr(self,'orbit_local_mode',False):
   name='account'
  return original_tab(self,name)
 def init(self,root):
  self.orbit_client=DeviceClient();self.orbit_authorized=False;self.orbit_ready=False;self.orbit_pair=None;self.orbit_local_mode=False;self.orbit_entitlements={'android':1,'browsers':2};self.orbit_plan='free'
  original_init(self,root)
  p=tk.Frame(self.work,bg=BG);self.panels['account']=p
  self.head(p,'Твой аккаунт Murdilimax Orbit','Один аккаунт на сайте и в программе. Подключение подтверждается в браузере.')
  card=tk.Frame(p,bg=PANEL,padx=24,pady=24);card.pack(fill='x',pady=(10,14))
  self.orbit_message=tk.StringVar(value='Войди, чтобы открыть Android и браузеры')
  self.orbit_code=tk.StringVar(value='')
  self.label(card,'',textvariable=self.orbit_message,size=13,color=PURPLE,weight='bold').pack(anchor='w')
  self.label(card,'',textvariable=self.orbit_code,size=24,color=GREEN,weight='bold').pack(anchor='w',pady=(13,8))
  self.label(card,'Нажми кнопку и подтверди код в браузере. Пароль в программе не вводится.',color=MUTED,size=10).pack(anchor='w',pady=12)
  bar=tk.Frame(card,bg=PANEL);bar.pack(anchor='w')
  self.button(bar,'↗ Войти через браузер',self.orbit_begin,primary=True).pack(side='left',padx=(0,8))
  self.button(bar,'Кабинет ↗',lambda:webbrowser.open('https://murdilimax-orbit.hatchable.site/account.html')).pack(side='left',padx=(0,8))
  self.button(bar,'◉ Без аккаунта',self.orbit_offline).pack(side='left',padx=(0,8))
  self.button(bar,'Выйти',self.orbit_logout).pack(side='left')
  self.label(p,'Секрет входа хранится в Keychain / Credential Manager. Для Android нужны Android Studio и scrcpy.',color=MUTED,size=10).pack(anchor='w',pady=8)
  nav=root.winfo_children()[1]
  self.tabs['account']=self.button(nav,'◈ Аккаунт',lambda:self.show_tab('account'))
  self.tabs['account'].pack(side='left',padx=(0,8),before=self.tabs['android'])
  self.orbit_ready=True;self.show_tab('account')
  token=self.orbit_client.existing_token()
  if token:
   self.orbit_message.set('Проверка сохранённого входа…')
   def restore():
    try:
     result=self.orbit_client.whoami(token)
     if result.get('authorized'):
      self.root.after(0,lambda email=result.get('email',''),limits=result.get('entitlements',{}),plan=result.get('plan','free'):self.orbit_success(email,limits,plan));return
     self.orbit_client.clear_token()
     self.root.after(0,lambda:self.orbit_message.set('Войди в аккаунт'))
    except Exception:
     self.root.after(0,lambda:self.orbit_message.set('Нет связи с сервером. Повтори позже.'))
   threading.Thread(target=restore,daemon=True).start()
 def success(self,email,entitlements=None,plan='free'):
  self.orbit_authorized=True
  self.orbit_local_mode=False
  self.orbit_plan=plan
  limits=entitlements or {'android':1,'browsers':2}
  self.orbit_entitlements={
      'android':max(0,min(50,int(limits.get('android',1)))),
      'browsers':max(0,min(500,int(limits.get('browsers',2))))}
  self.orbit_message.set('✓ '+email+' · '+str(plan).upper()+' · '+str(self.orbit_entitlements['android'])+' Android / '+str(self.orbit_entitlements['browsers'])+' браузеров')
  self.orbit_code.set('')
  self.show_tab('android')
 def begin(self):
  self.orbit_message.set('Соединение с сервером аккаунтов…')
  def work():
   try:
    r=self.orbit_client.begin();code,secret=r['code'],r['device_secret']
    self.orbit_pair=(code,secret)
    self.root.after(0,lambda:self.orbit_code.set('КОД: '+code))
    self.root.after(0,lambda:self.orbit_message.set('Подтверди вход в браузере'))
    webbrowser.open(r['verification_uri'])
    until=time.monotonic()+min(600,int(r.get('expires_in',600)))
    while time.monotonic()<until and self.orbit_pair==(code,secret):
     time.sleep(max(3,int(r.get('interval',3))))
     r=self.orbit_client.poll(code,secret)
     if r.get('status')=='authorized' and r.get('token'):
      self.orbit_client.store_token(r['token'])
      license_data=self.orbit_client.whoami(r['token'])
      if not license_data.get('authorized'):
       raise DeviceError('Не удалось подтвердить серверную лицензию')
      self.root.after(0,lambda email=r.get('email',''),limits=license_data.get('entitlements'),plan=license_data.get('plan','free'):self.orbit_success(email,limits,plan));return
     if r.get('status') in ('consumed','expired','invalid'):break
    self.root.after(0,lambda:self.orbit_message.set('Код истёк. Начни снова.'))
   except Exception as e:
    self.root.after(0,lambda msg=str(e):self.orbit_message.set('Ошибка: '+msg[:110]))
  threading.Thread(target=work,daemon=True).start()
 def offline(self):
  self.orbit_local_mode=True
  self.orbit_entitlements={'android':1,'browsers':2}
  self.orbit_plan='free'
  self.orbit_message.set('◉ Бесплатный локальный режим: 1 Android, 2 браузера')
  self.orbit_code.set('')
  self.show_tab('android')
 def logout(self):
  self.orbit_pair=None;self.orbit_client.clear_token();self.orbit_authorized=False;self.orbit_local_mode=False
  self.orbit_entitlements={'android':1,'browsers':2}
  self.orbit_plan='free'
  self.orbit_message.set('Ты вышел из аккаунта');self.orbit_code.set('');self.show_tab('account')
 cls.__init__=init;cls.show_tab=tab;cls.orbit_begin=begin;cls.orbit_success=success;cls.orbit_logout=logout;cls.orbit_offline=offline
