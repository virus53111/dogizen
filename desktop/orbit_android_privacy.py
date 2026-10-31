"""Per-AVD network privacy configuration and emulator-identity diagnostics.
Standard Android Emulator remains detectable as an emulator.
"""
import subprocess
from urllib.parse import urlparse
from tkinter import messagebox,simpledialog

def attach(cls,scope):
 tk=scope['tk']
 original_make=cls.make_android
 original_start=cls.start_avd
 find_exe=scope['find_executable']
 def make_android(self,p):
  original_make(self,p)
  row=tk.Frame(p,bg=scope['BG'])
  row.pack(fill='x',pady=(4,4))
  self.button(row,'◎ Прокси для AVD',self.orbit_proxy_setup).pack(side='left',padx=(0,9))
  self.button(row,'⌕ Проверить сведения Android',self.orbit_emulator_diagnostics).pack(side='left')
  self.label(p,'Изолированные AVD хранят приложения и данные отдельно. Прокси перенаправляет TCP, но не весь трафик. Android Emulator может распознаваться сайтами и приложениями.',color=scope['MUTED'],size=9).pack(anchor='w',pady=6)
 def setup(self):
  selected=self.selected_android()
  if not selected or not selected.startswith('avd:'):
   messagebox.showinfo('Прокси','Выбери установленный Android AVD.');return
  name=selected.split(':',1)[1]
  known=self.cfg.setdefault('avd_proxies',{})
  text=simpledialog.askstring('Android Emulator Proxy',
    'Прокси для '+name+' (только http://host:port).\nПустая строка — отключить. Пароли не сохраняются.\nПрокси не покрывает UDP и не делает Android невидимым.',
    initialvalue=known.get(name,''),parent=self.root)
  if text is None:return
  text=text.strip()
  if text:
   u=urlparse(text)
   if u.scheme!='http' or not u.hostname or not u.port or u.username or u.password or len(text)>210:
    messagebox.showerror('Прокси','Укажи безопасный HTTP-прокси без логина и пароля: http://host:8080');return
   known[name]=text
  else:known.pop(name,None)
  scope['save_config'](self.cfg)
  self.status.set('● Настройки Android-прокси сохранены для '+name)
 def start(self):
  selected=self.selected_android()
  if not selected or not selected.startswith('avd:'):return original_start(self)
  name=selected.split(':',1)[1]
  proxy=self.cfg.get('avd_proxies',{}).get(name)
  if not proxy:return original_start(self)
  emulator=find_exe('emulator.exe',self.sdk,self.cfg)
  if not emulator:
   messagebox.showerror('Android','Не найден Android Emulator.');return
  if not messagebox.askyesno('Запуск Android','Запустить '+name+' с TCP-прокси '+proxy+'?\n\nUDP может идти мимо прокси. Проверяй сеть в тестовой среде.'):return
  try:
   flags=subprocess.CREATE_NO_WINDOW if scope['os'].name=='nt' else 0
   subprocess.Popen([emulator,'-avd',name,'-no-boot-anim','-http-proxy',proxy],creationflags=flags)
   self.status.set('● Запускается AVD с прокси: '+name)
   self.root.after(9000,self.refresh_all)
  except Exception as e:messagebox.showerror('Android Proxy',str(e))
 def diagnostic(self):
  serial=self.selected_serial()
  if not serial:
   messagebox.showinfo('Android','Выбери запущенный Android.');return
  adb=find_exe('adb.exe',self.sdk,self.cfg)
  if not adb:return
  values=[]
  for key in ('ro.build.fingerprint','ro.product.model','ro.kernel.qemu'):
   try:
    p=subprocess.run([adb,'-s',serial,'shell','getprop',key],capture_output=True,text=True,timeout=6)
    values.append(key+': '+p.stdout.strip()[:160])
   except Exception:values.append(key+': недоступно')
  messagebox.showinfo('Android: сведения об устройстве','\n'.join(values)+'\n\nОбычный эмулятор имеет признаки виртуального устройства. Это диагностическая функция, не подмена идентификатора.')
 cls.make_android=make_android
 cls.start_avd=start
 cls.orbit_proxy_setup=setup
 cls.orbit_emulator_diagnostics=diagnostic
