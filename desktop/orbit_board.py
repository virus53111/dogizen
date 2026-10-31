"""Real Android multi-screen workspace using ADB live previews and input.
Windows are draggable and resizable *inside* the Murdilimax Orbit application.
For fluid 30-120 FPS playback the full scrcpy window remains available.
"""
import io
import math
import os
import subprocess
import threading
import time
import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageOps, ImageTk

BACKGROUND='#111427'
ACCENT='#ad91ff'
INK='#f1ecff'
SHELL='#24243f'

class Phone:
 def __init__(self,board,serial,index):
  self.board=board;self.serial=serial;self.alive=True
  stored=board.owner.cfg.get('board_positions',{}).get(serial,{})
  self.w=int(stored.get('w',242));self.h=int(stored.get('h',452))
  self.x=int(stored.get('x',25+index*260));self.y=int(stored.get('y',35+(index%2)*25))
  self.raw_size=(1080,1920);self.view_size=(1,1);self.offset=(0,0)
  self.drag=None;self.resize_start=None;self.photo=None
  self.frame=tk.Frame(board.canvas,bg='#24243f',highlightbackground='#5c5382',highlightthickness=2,width=self.w,height=self.h)
  self.frame.pack_propagate(False)
  self.win=board.canvas.create_window(self.x,self.y,window=self.frame,anchor='nw',width=self.w,height=self.h)
  self.header=tk.Frame(self.frame,bg='#4b386f',height=39,cursor='fleur')
  self.header.pack(fill='x');self.header.pack_propagate(False)
  self.title=tk.Label(self.header,text='◈  '+serial,bg='#4b386f',fg='white',font=('Arial',10,'bold'),cursor='fleur')
  self.title.pack(side='left',padx=7)
  tk.Button(self.header,text='−',bg='#4b386f',fg='white',bd=0,command=lambda:self.scale(-1)).pack(side='right',padx=2)
  tk.Button(self.header,text='+',bg='#4b386f',fg='white',bd=0,command=lambda:self.scale(1)).pack(side='right',padx=2)
  tk.Button(self.header,text='×',bg='#4b386f',fg='white',bd=0,command=self.close).pack(side='right',padx=2)
  for widget in (self.header,self.title):
   widget.bind('<ButtonPress-1>',self.start_move)
   widget.bind('<B1-Motion>',self.move)
   widget.bind('<ButtonRelease-1>',self.end_move)
  self.screen=tk.Label(self.frame,bg='#141526',fg='#bba7d3',text='Android\nПодключение к экрану…',font=('Arial',11))
  self.screen.pack(fill='both',expand=True,padx=6,pady=(5,0))
  self.screen.bind('<ButtonPress-1>',self.start_touch)
  self.screen.bind('<ButtonRelease-1>',self.end_touch)
  footer=tk.Frame(self.frame,bg=SHELL,height=36)
  footer.pack(fill='x');footer.pack_propagate(False)
  for title,key in (('⌂',3),('‹',4),('☰',187)):
   tk.Button(footer,text=title,bg=SHELL,fg=INK,bd=0,font=('Arial',12),
             command=lambda k=key:self.command('shell','input','keyevent',str(k))).pack(side='left',expand=True,fill='both')
  grip=tk.Label(footer,text='◢',bg=SHELL,fg='#ae97fb',cursor='bottom_right_corner')
  grip.pack(side='right',padx=6);grip.bind('<ButtonPress-1>',self.start_resize)
  grip.bind('<B1-Motion>',self.resize);grip.bind('<ButtonRelease-1>',self.end_resize)
  self.stop=threading.Event()
  threading.Thread(target=self.capture_loop,daemon=True,name='orbit-phone-'+serial).start()
 def persist(self):
  positions=self.board.owner.cfg.setdefault('board_positions',{})
  positions[self.serial]={'x':self.x,'y':self.y,'w':self.w,'h':self.h}
  self.board.save()
 def start_move(self,e):
  self.drag=(e.x_root,e.y_root,self.x,self.y);self.board.canvas.tag_raise(self.win)
 def move(self,e):
  if not self.drag:return
  rx,ry,x,y=self.drag
  self.x=max(0,x+e.x_root-rx);self.y=max(0,y+e.y_root-ry)
  self.board.canvas.coords(self.win,self.x,self.y)
  self.board.scroll_region()
 def end_move(self,e):
  self.drag=None;self.persist()
 def start_resize(self,e):
  self.resize_start=(e.x_root,e.y_root,self.w,self.h);self.board.canvas.tag_raise(self.win)
 def resize(self,e):
  if not self.resize_start:return
  rx,ry,w,h=self.resize_start
  self.w=max(185,min(640,w+e.x_root-rx))
  self.h=max(305,min(950,h+e.y_root-ry))
  self.board.canvas.itemconfigure(self.win,width=self.w,height=self.h)
  self.frame.configure(width=self.w,height=self.h)
  self.board.scroll_region()
 def end_resize(self,e):
  self.resize_start=None;self.persist()
 def scale(self,d):
  self.w=max(185,min(640,self.w+40*d));self.h=max(305,min(950,self.h+75*d))
  self.board.canvas.itemconfigure(self.win,width=self.w,height=self.h)
  self.frame.configure(width=self.w,height=self.h)
  self.board.scroll_region();self.persist()
 def command(self,*args):
  adb=self.board.adb
  def do():
   try:subprocess.run([adb,'-s',self.serial,*args],capture_output=True,timeout=12)
   except Exception:pass
  threading.Thread(target=do,daemon=True).start()
 def start_touch(self,e):
  self.touch=(e.x,e.y,time.monotonic())
 def end_touch(self,e):
  if not hasattr(self,'touch'):return
  sx,sy,t=self.touch;del self.touch
  x0,y0=self.translate(sx,sy);x1,y1=self.translate(e.x,e.y)
  if x0 is None or x1 is None:return
  if abs(e.x-sx)+abs(e.y-sy)>15:
   ms=max(100,min(2400,int((time.monotonic()-t)*1000)))
   self.command('shell','input','swipe',str(x0),str(y0),str(x1),str(y1),str(ms))
  else:self.command('shell','input','tap',str(x0),str(y0))
 def translate(self,x,y):
  vw,vh=self.view_size;offx,offy=self.offset
  if not(offx<=x<offx+vw and offy<=y<offy+vh):return (None,None)
  rw,rh=self.raw_size
  return (int((x-offx)*rw/vw),int((y-offy)*rh/vh))
 def capture_loop(self):
  while not self.stop.is_set():
   try:
    p=subprocess.run([self.board.adb,'-s',self.serial,'exec-out','screencap','-p'],
      stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=14)
    if p.returncode==0 and p.stdout:
     with Image.open(io.BytesIO(p.stdout)) as img:
      img.load();frame=img.convert('RGB')
     if self.alive:
      try:self.board.top.after(0,lambda frame=frame:self.display(frame))
      except RuntimeError:pass
   except Exception:pass
   self.stop.wait(1.2)
 def display(self,img):
  if not self.alive:return
  w=max(50,self.w-15);h=max(50,self.h-85)
  self.raw_size=img.size
  view=ImageOps.contain(img,(w,h),Image.Resampling.BILINEAR)
  self.view_size=view.size;self.offset=((w-view.width)//2,(h-view.height)//2)
  bg=Image.new('RGB',(w,h),'#141526')
  bg.paste(view,self.offset)
  photo=ImageTk.PhotoImage(bg)
  self.screen.config(image=photo,text='')
  self.photo=photo
 def close(self):
  self.alive=False;self.stop.set()
  try:self.board.canvas.delete(self.win);self.frame.destroy()
  except tk.TclError:pass
  self.board.phones.pop(self.serial,None)
  self.board.scroll_region()

class DeviceBoard:
 def __init__(self,owner,adb,serials):
  self.owner=owner;self.adb=adb;self.phones={}
  self.top=tk.Toplevel(owner.root)
  self.top.title('Murdilimax Orbit • Android Studio • Live Screens')
  self.top.geometry('1260x820');self.top.minsize(700,500)
  self.top.configure(bg=BACKGROUND)
  toolbar=tk.Frame(self.top,bg=BACKGROUND,height=50)
  toolbar.pack(side='top',fill='x')
  tk.Label(toolbar,text='◈  ANDROID WORKSPACE',bg=BACKGROUND,fg=INK,font=('Arial',14,'bold')).pack(side='left',padx=15)
  for label,mode in (('▦ Сетка','grid'),('☷ В ряд','row')):
   tk.Button(toolbar,text=label,command=lambda m=mode:self.arrange(m),
    bg='#302c4b',fg=INK,bd=0,padx=12,pady=8).pack(side='right',padx=6,pady=7)
  self.canvas=tk.Canvas(self.top,bg='#151628',highlightthickness=0,
    scrollregion=(0,0,2000,1300),xscrollincrement=10,yscrollincrement=10)
  sb_y=tk.Scrollbar(self.top,orient='vertical',command=self.canvas.yview)
  sb_x=tk.Scrollbar(self.top,orient='horizontal',command=self.canvas.xview)
  self.canvas.configure(xscrollcommand=sb_x.set,yscrollcommand=sb_y.set)
  sb_y.pack(side='right',fill='y');sb_x.pack(side='bottom',fill='x')
  self.canvas.pack(side='left',fill='both',expand=True)
  for i,serial in enumerate(serials):self.phones[serial]=Phone(self,serial,i)
  self.scroll_region()
  self.top.protocol('WM_DELETE_WINDOW',self.close)
 def save(self):
  try:self.owner.cfg['board_positions']=self.owner.cfg.get('board_positions',{})
  except Exception:return
  self.owner.orbit_save_settings_config()
 def arrange(self,mode):
  members=list(self.phones.values())
  if not members:return
  screenw=max(800,self.canvas.winfo_width()-40)
  cols=len(members) if mode=='row' else max(1,int(screenw/260))
  for i,p in enumerate(members):
   p.x=20+(i%cols)*260;p.y=25+(i//cols)*490
   self.canvas.coords(p.win,p.x,p.y);p.persist()
  self.scroll_region()
 def scroll_region(self):
  right=max([x.x+x.w+45 for x in self.phones.values()] or [900])
  down=max([x.y+x.h+45 for x in self.phones.values()] or [800])
  self.canvas.configure(scrollregion=(0,0,max(1000,right),max(750,down)))
 def close(self):
  for phone in list(self.phones.values()):
   phone.alive=False;phone.stop.set()
  self.top.destroy()
  self.owner.orbit_board_instance=None

def attach(cls,scope):
 old_android=cls.make_android
 def save(self):scope['save_config'](self.cfg)
 def make_android(self,p):
  old_android(self,p)
  strip=tk.Frame(p,bg=scope['BG']);strip.pack(fill='x',pady=6)
  self.button(strip,'▦ Открыть общую студию телефонов',self.orbit_open_board,primary=True).pack(side='left')
  self.label(strip,'Экраны живые (обновление ~1 с). Для плавного управления — scrcpy.',size=9,
    color=scope['MUTED']).pack(side='left',padx=15)
 def open_board(self):
  if getattr(self,'orbit_board_instance',None):
   try:self.orbit_board_instance.top.lift();return
   except tk.TclError:self.orbit_board_instance=None
  adb=scope['find_executable']('adb.exe',self.sdk,self.cfg)
  if not adb:
   messagebox.showerror('Android','Не найден ADB. Открой настройки и установи Android SDK.');return
  try:
   p=subprocess.run([adb,'devices'],capture_output=True,text=True,timeout=15)
   serials=[ln.split()[0] for ln in p.stdout.splitlines()[1:]
     if len(ln.split())>=2 and ln.split()[1]=='device']
  except Exception as e:messagebox.showerror('Android',str(e));return
  if not serials:
   messagebox.showinfo('Android','Нет запущенных Android-устройств. Создай телефон через кнопку «Создать Android», затем запусти его.');return
  if len(serials)>9:
   if not messagebox.askyesno('Много телефонов',f'Обнаружено {len(serials)} Android. Обновление экранов может нагружать ПК.\nОткрыть первые 9?'):return
   serials=serials[:9]
  self.orbit_board_instance=DeviceBoard(self,adb,serials)
 cls.make_android=make_android
 cls.orbit_save_settings_config=save
 cls.orbit_open_board=open_board
