"""Android setup wizard and desktop preflight for Murdilimax Orbit.
Uses the official Google Android SDK tools; consent precedes installation.
"""
import os
import platform
import shutil
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path
from tkinter import messagebox, simpledialog

def _tool(sdk,name):
    if not sdk: return None
    root=Path(sdk)
    suffix='.bat' if os.name=='nt' else ''
    for p in [root/'cmdline-tools'/'latest'/'bin'/(name+suffix),
              root/'tools'/'bin'/(name+suffix)]:
        if p.is_file():return str(p)
    folder=root/'cmdline-tools'
    if folder.is_dir():
        for sub in sorted(folder.iterdir(),reverse=True):
            p=sub/'bin'/(name+suffix)
            if p.is_file():return str(p)
    return None

def _sdk_root(cfg):
    choices=[cfg.get('sdk',''),os.environ.get('ANDROID_HOME',''),os.environ.get('ANDROID_SDK_ROOT','')]
    if sys.platform=='darwin':choices.append(str(Path.home()/'Library/Android/sdk'))
    elif os.name=='nt':choices.append(str(Path.home()/'AppData/Local/Android/Sdk'))
    for item in choices:
        if item and Path(item).is_dir():return Path(item)
    return None

def _installed_tools():
    """Bundled ADB/scrcpy from signed build, with system executable fallback."""
    roots=[]
    if getattr(sys,'frozen',False):
        roots.append(Path(getattr(sys,'_MEIPASS',Path(sys.executable).parent)))
    roots.append(Path(__file__).resolve().parent)
    out={}
    ext='.exe' if os.name=='nt' else ''
    for name,parts in {'adb':['tools','platform-tools','adb'+ext],
                       'scrcpy':['tools','scrcpy','scrcpy'+ext]}.items():
        for root in roots:
            p=root.joinpath(*parts)
            if p.is_file():
                out[name]=str(p);break
        if name not in out:out[name]=shutil.which(name)
    return out

def _image_id():
    cpu=platform.machine().lower()
    arch='arm64-v8a' if sys.platform=='darwin' and cpu in ('arm64','aarch64') else 'x86_64'
    return 'system-images;android-35;google_apis;'+arch

def _friendly_exception(error):
    t=str(error)
    if len(t)>1100:t=t[-1100:]
    return t

def attach(cls, scope):
    """Patch entry points before the existing PocketFleet is instantiated."""
    old_make_android=cls.make_android
    old_make_setup=cls.make_setup
    old_refresh=cls.refresh_all
    old_diagnostics=cls.diagnostics
    base_find_sdk=scope['find_sdk']
    base_find_exec=scope['find_executable']
    base_browser_worker=scope['browser_worker']
    tk=scope['tk']
    def find_sdk(cfg):
        result=base_find_sdk(cfg)
        if result:return result
        root=_sdk_root(cfg)
        return root if root and (root/'emulator').is_dir() else None
    def executable(name,sdk=None,cfg=None):
        result=base_find_exec(name,sdk,cfg)
        if result:return result
        bare=name.removesuffix('.exe')
        if bare in ('adb','scrcpy'):
            return _installed_tools().get(bare)
        return None
    bundled=_installed_tools()
    if bundled.get('adb'):
        os.environ['ADB']=bundled['adb']
        os.environ['PATH']=str(Path(bundled['adb']).parent)+os.pathsep+os.environ.get('PATH','')
    if bundled.get('scrcpy'):
        os.environ['PATH']=str(Path(bundled['scrcpy']).parent)+os.pathsep+os.environ.get('PATH','')
    scope['find_sdk']=find_sdk
    scope['find_executable']=executable
    def make_android(self,p):
        old_make_android(self,p)
        strip=tk.Frame(p,bg=scope['BG'])
        strip.pack(fill='x',pady=(7,5))
        self.button(strip,'＋ Создать Android-телефон',self.orbit_create_avd,primary=True).pack(side='left',padx=(0,9))
        self.button(strip,'✓ Проверка Android',self.orbit_check_android).pack(side='left',padx=(0,9))
        self.button(strip,'↗ Android Studio',lambda:webbrowser.open('https://developer.android.com/studio')).pack(side='left')
    def make_setup(self,p):
        old_make_setup(self,p)
        strip=tk.Frame(p,bg=scope['BG']);strip.pack(anchor='w',pady=(6,6))
        self.button(strip,'⚡ Создать Android с нуля',self.orbit_create_avd,primary=True).pack(side='left',padx=(0,9))
        self.button(strip,'◉ Первый запуск браузера',self.orbit_browser_first_run).pack(side='left')
    def refresh(self):
        old_refresh(self)
        bundled=_installed_tools()
        if bundled.get('adb') and not base_find_exec('adb.exe',self.sdk):
            self.status.set('● Встроен ADB · SCRCPY '+('OK' if bundled.get('scrcpy') else 'НЕ НАЙДЕН'))
    def detect(self):
        sdk=find_sdk(self.cfg)
        sdkman=_tool(sdk,'sdkmanager')
        avdman=_tool(sdk,'avdmanager')
        adb=executable('adb.exe',sdk,self.cfg)
        emulator=executable('emulator.exe',sdk,self.cfg)
        scrcpy=executable('scrcpy.exe',sdk,self.cfg)
        return {'sdk':sdk,'sdkmanager':sdkman,'avdmanager':avdman,'adb':adb,'emulator':emulator,'scrcpy':scrcpy}
    def check_android(self):
        t=detect(self)
        rows=['Android SDK: '+str(t['sdk'] or 'НЕ УСТАНОВЛЕН'),
              'ADB: '+('OK' if t['adb'] else 'Не найден'),
              'Emulator: '+('OK' if t['emulator'] else 'Не найден'),
              'scrcpy: '+('OK' if t['scrcpy'] else 'Не найден'),
              'SDK Manager: '+('OK' if t['sdkmanager'] else 'Не найден'),
              'AVD Manager: '+('OK' if t['avdmanager'] else 'Не найден'),
              '', 'Для виртуального телефона потребуется системный образ (~1-3 ГБ).']
        messagebox.showinfo('Murdilimax Orbit — диагностика Android','\n'.join(rows))
    def browser_first_run(self):
        if not self.cfg['profiles']:
            if not messagebox.askyesno('Camoufox','Создать первый браузерный профиль и запустить Camoufox?\n\nПри первом запуске движок может загрузить большой браузер из интернета.'):
                return
            item={'id':'orbit_starter','name':'Мой первый браузер','url':'https://example.org','proxy':''}
            self.cfg['profiles'].append(item)
            scope['save_config'](self.cfg)
            self.refresh_all()
        self.show_tab('browser')
        if not self.browser_tree.selection():
            self.browser_tree.selection_set(self.cfg['profiles'][0]['id'])
        self.launch_profile()
        self.status.set('● Camoufox запускается. При первом запуске может идти загрузка…')
    def create_avd(self):
        tools=detect(self)
        if not tools['sdk']:
            messagebox.showinfo('Android Studio не найден','Сначала установи Android Studio и Android SDK через официальный установщик.\n\nOrbit откроет страницу загрузки.')
            webbrowser.open('https://developer.android.com/studio')
            return
        if not tools['sdkmanager'] or not tools['avdmanager']:
            messagebox.showinfo('Нужны Android SDK Command-line Tools',
                'Открой Android Studio → Settings → Languages & Frameworks → Android SDK → SDK Tools.\n'
                'Установи “Android SDK Command-line Tools (latest)” и “Android Emulator”.\n\nПосле этого снова нажми “Создать Android-телефон”.')
            webbrowser.open('https://developer.android.com/tools/sdkmanager')
            return
        name=simpledialog.askstring('Новый Android','Имя нового телефона (буквы, цифры, _):',
                                    initialvalue='Orbit_Pixel_'+str(int(time.time())%10000),parent=self.root)
        if not name:return
        import re
        if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{2,28}',name):
            messagebox.showerror('Имя','Используй 3–29 символов: латинские буквы, цифры и _ . Имя должно начинаться с буквы.')
            return
        image=_image_id()
        if not messagebox.askyesno('Установка Android',
            'Orbit загрузит официальный Android 15 Google APIs для виртуального устройства:\n'+image+
            '\n\nРазмер скачивания может составить несколько ГБ, а на диске понадобится ещё больше места.\n'
            'Нужны интернет и аппаратная виртуализация.\n\n'
            'Продолжить? Лицензии Android SDK будут показаны при первом запуске Android Studio.'):
            return
        self.status.set('● Устанавливаю Android SDK и образ…')
        def worker():
            sdk=tools['sdk']; env=os.environ.copy()
            env['ANDROID_HOME']=str(sdk);env['ANDROID_SDK_ROOT']=str(sdk)
            try:
                path=sdk/'system-images'/'android-35'/'google_apis'/image.rsplit(';',1)[-1]
                if not (path/'system.img').exists():
                    cmd=[tools['sdkmanager'],'--sdk_root='+str(sdk),'platform-tools','emulator',image]
                    p=subprocess.run(cmd,input='\n',capture_output=True,text=True,timeout=1800,env=env)
                    if p.returncode:
                        msg=(p.stdout+'\n'+p.stderr)[-900:]
                        raise RuntimeError('Android SDK Manager: '+msg+
                            '\n\nПри необходимости открой Android Studio и прими лицензии SDK.')
                rc,out=scope['run_capture']([tools['avdmanager'],'list','avd'],timeout=20)
                if name in out:raise RuntimeError('Устройство с таким именем уже существует.')
                proc=subprocess.run([tools['avdmanager'],'create','avd','-n',name,'-k',image,
                    '-d','pixel','--force'],input='no\n',capture_output=True,text=True,timeout=70,env=env)
                if proc.returncode:raise RuntimeError((proc.stdout+'\n'+proc.stderr)[-950:])
                self.root.after(0,lambda:self.orbit_avd_created(name))
            except Exception as e:
                self.root.after(0,lambda msg=_friendly_exception(e):messagebox.showerror('Android',msg))
                self.root.after(0,lambda:self.status.set('● Ошибка установки Android'))
        threading.Thread(target=worker,daemon=True).start()
    def avd_created(self,name):
        self.sdk=find_sdk(self.cfg)
        self.refresh_all()
        self.status.set('● Телефон '+name+' создан')
        if messagebox.askyesno('Android готов',f'Телефон {name} создан.\nЗапустить его сейчас?'):
            emulator=executable('emulator.exe',self.sdk,self.cfg)
            if emulator:
                subprocess.Popen([emulator,'-avd',name,'-no-boot-anim'],close_fds=True)
                self.status.set('● Запускается новый телефон '+name)
                self.root.after(16000,self.refresh_all)
    cls.make_android=make_android
    cls.make_setup=make_setup
    cls.refresh_all=refresh
    cls.orbit_create_avd=create_avd
    cls.orbit_avd_created=avd_created
    cls.orbit_check_android=check_android
    cls.orbit_browser_first_run=browser_first_run
