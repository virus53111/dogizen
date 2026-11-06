#!/usr/bin/env python3
"""MURDILIMAX Crystal Qt desktop. Real read-only scanner, not a website demo."""
from __future__ import annotations
import os,sys,json,threading,subprocess,math
from pathlib import Path
from datetime import datetime,timezone
from io import BytesIO
from PySide6.QtCore import Qt,QSettings,QThread,Signal,QTimer,QPointF,QRectF
from PySide6.QtGui import QColor,QPainter,QLinearGradient,QPen,QPolygonF,QPixmap
from PySide6.QtWidgets import (QApplication,QMainWindow,QWidget,QFrame,QVBoxLayout,QHBoxLayout,QLabel,
 QPushButton,QCheckBox,QProgressBar,QTableWidget,QTableWidgetItem,QLineEdit,QComboBox,
 QFileDialog,QMessageBox,QInputDialog,QHeaderView,QAbstractItemView,QScrollArea)
from murdilimax_engine import scan_image,recover,Candidate,ScanCancelled
from murdilimax_recovery_alpha import scan_folder,carve_image,restore as restore_hit
from murdilimax_preview import preview_bytes,decode_preview
from murdilimax_devices import is_physical,enumerate_drives,destination_is_different_disk
from murdilimax_deepcheck import assess_deep
import murdilimax_recovery_v04

VERSION='0.10.0'
CATS=('Photos','Documents','Archives','Video','Audio','Crypto backups','Other')
WORDS={
'ru':{'title':'Восстановление данных','intro':'Найдите потерянные файлы · локально и только для чтения',
'choose':'ВЫБЕРИТЕ ИСТОЧНИК','image':'Образ диска','folder':'Папка','physical':'HDD / USB','none':'Источник не выбран',
'types':'ТИПЫ ФАЙЛОВ','Photos':'Фото','Documents':'Документы','Archives':'Архивы','Video':'Видео','Audio':'Аудио','Crypto backups':'Кошельки','Other':'Другие',
'start':'НАЧАТЬ СКАНИРОВАНИЕ','stop':'ОСТАНОВИТЬ','expert':'ЭКСПЕРТНЫЕ ФУНКЦИИ','results':'РЕЗУЛЬТАТЫ СКАНИРОВАНИЯ',
'preview':'ПРЕДПРОСМОТР','recover':'ВОССТАНОВИТЬ ОТМЕЧЕННОЕ','photo':'ПОКАЗАТЬ ФОТО','name':'Имя файла','path':'Путь',
'size':'Размер','type':'Тип','state':'Состояние','ready':'ГОТОВО К РАБОТЕ','working':'СКАНИРОВАНИЕ','done':'ЗАВЕРШЕНО',
'search':'Поиск по файлам…','empty_preview':'Выберите файл в списке. Предпросмотр фото загружается локально.',
'privacy':'Исходный диск только для чтения · Сохранение на другой носитель · Без облака',
'meta':'NTFS / exFAT / ext4','carve':'JPG / PNG / PDF / ZIP','deep':'Искать потерянные разделы',
'mft':'Поиск повреждённой MFT','select':'Выберите образ или папку','no_source':'Сначала выберите источник',
'no_files':'Отметьте файлы галочками','output':'Сохраните файлы на другой физический диск',
'warning':'Чтение физического диска может ухудшить неисправность. Для важных данных сначала снимите образ. Продолжить?',
'unknown':'Состояние кластеров неизвестно, данные могут быть повреждены. Продолжить?',
'error':'Ошибка','lang':'RU / EN','scan':'Сканирование','disks':'Диски','raid':'RAID / NAS','wallet':'Кошельки'},
'en':{'title':'Data recovery','intro':'Recover important files · local and read-only',
'choose':'CHOOSE SOURCE','image':'Disk image','folder':'Folder','physical':'HDD / USB','none':'No source selected',
'types':'FILE CATEGORIES','Photos':'Photos','Documents':'Documents','Archives':'Archives','Video':'Video','Audio':'Audio','Crypto backups':'Wallet backups','Other':'Other',
'start':'START SCANNING','stop':'STOP','expert':'EXPERT TOOLS','results':'SCAN RESULTS',
'preview':'PREVIEW','recover':'RECOVER CHECKED','photo':'PREVIEW PHOTO','name':'Filename','path':'Path',
'size':'Size','type':'Type','state':'Status','ready':'READY','working':'SCANNING','done':'COMPLETE',
'search':'Search files…','empty_preview':'Select a file. Photo preview loads locally.',
'privacy':'Read-only source · Recover to another device · No cloud',
'meta':'NTFS / exFAT / ext4','carve':'JPG / PNG / PDF / ZIP','deep':'Find lost partitions',
'mft':'Salvage damaged MFT','select':'Select an image or folder','no_source':'Choose a source first',
'no_files':'Check at least one file','output':'Recover files to another physical device',
'warning':'Reading an unstable drive can worsen failure. Image important disks first. Continue?',
'unknown':'Some clusters have unknown state; output may be damaged. Continue?',
'error':'Error','lang':'EN / RU','scan':'Scan','disks':'Disks','raid':'RAID / NAS','wallet':'Wallets'}}
STYLE="""
QWidget{font:12px 'Segoe UI';color:#EAF0FF;}
QMainWindow,QWidget#root{background:#070B20;}
QFrame#sidebar{background:#0A1130;border-right:1px solid #4B4E8B;}
QFrame#panel{background:#131B3C;border:1px solid #5C589B;border-radius:15px;}
QLabel#logo{font-size:19px;font-weight:900;color:#F5E8FF;}
QLabel#heading{font-size:18px;font-weight:900;}
QLabel#small{font-size:11px;font-weight:800;color:#B8C5EB;}
QLabel#muted{color:#A2AFD1;}
QPushButton{background:#1B2856;border:1px solid #6B73B4;color:white;font-weight:750;border-radius:11px;padding:9px;}
QPushButton:hover{background:#35447E;border-color:#7CEBFF;}
QPushButton#primary{background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 #7531D1,stop:.5 #9857E8,stop:1 #0B94B9);border:2px solid #C28DFF;font-size:15px;padding:12px;}
QPushButton#primary:disabled{background:#282842;color:#999;}
QPushButton#source{background:#171F4A;border:1px solid #7361AC;font-size:14px;padding:17px;}
QPushButton#nav{text-align:left;background:transparent;border:0;padding:13px;}
QPushButton#nav[selected='true']{background:#402871;border:1px solid #B37EFF;}
QLineEdit,QComboBox{background:#0B1433;border:1px solid #535A9B;border-radius:8px;padding:8px;}
QCheckBox{spacing:6px;}
QCheckBox::indicator{width:15px;height:15px;border:1px solid #A084E4;border-radius:4px;background:#15234D;}
QCheckBox::indicator:checked{background:#9C5FEA;border-color:#85F1FF;}
QProgressBar{height:14px;background:#091339;border:1px solid #4853A1;border-radius:7px;text-align:center;}
QProgressBar::chunk{background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 #9A45EF,stop:1 #31DAF5);border-radius:7px;}
QTableWidget{background:#101937;alternate-background-color:#182145;border:1px solid #414986;gridline-color:#25325B;selection-background-color:#53328A;}
QHeaderView::section{background:#202956;color:#DFE9FF;padding:8px;border:0;}
QScrollBar:vertical{background:#0F1735;width:10px;} QScrollBar::handle:vertical{background:#5D54A0;border-radius:5px;}
"""
def display_size(n):
 n=float(n)
 for unit in ('B','KiB','MiB','GiB','TiB'):
  if n<1024 or unit=='TiB':return f'{int(n)} B' if unit=='B' else f'{n:.1f} {unit}'
  n/=1024

class Hero(QWidget):
 def __init__(self):
  super().__init__();self.setMinimumHeight(150);self.tick=0
  self.timer=QTimer(self);self.timer.timeout.connect(self.move);self.timer.start(120)
 def move(self):
  if self.isVisible():self.tick+=.07;self.update()
 def paintEvent(self,event):
  p=QPainter(self);p.setRenderHint(QPainter.RenderHint.Antialiasing)
  w=self.width();h=self.height();g=QLinearGradient(0,0,w,h)
  g.setColorAt(0,QColor('#1C164B'));g.setColorAt(.6,QColor('#0D3662'));g.setColorAt(1,QColor('#300F50'))
  p.setPen(Qt.PenStyle.NoPen);p.setBrush(g);p.drawRoundedRect(QRectF(0,0,w,h),17,17)
  for i in range(26):
   x=(i*179+31)%max(w,1);y=(i*79+13)%max(h,1)
   p.setOpacity(.3+.3*abs(math.sin(self.tick+i)))
   p.setBrush(QColor('#E2C9FF' if i%2 else '#91F5FF'));p.drawEllipse(QPointF(x,y),1.4,1.4)
  p.setOpacity(1)
  for dx,c,d,hh in [(-77,'#9F51F1','#F6BAFF',93),(18,'#229EE2','#B8F7FF',132),(106,'#8B2CC8','#FAD6FF',86)]:
   x=w*.81+dx;y=h*.94;r=hh*.35
   top=QPointF(x,y-hh);left=QPointF(x-r,y-hh*.53);right=QPointF(x+r,y-hh*.56);mid=QPointF(x,y-hh*.38)
   for points,col in [([top,left,mid],c),([top,mid,right],d),([left,QPointF(x-r*.6,y),mid],d),([right,mid,QPointF(x+r*.6,y)],c)]:
    p.setPen(QPen(QColor('#E4BFFF'),1));p.setBrush(QColor(col));p.drawPolygon(QPolygonF(points))
  p.end()

class Worker(QThread):
 event=Signal(str,object)
 def __init__(self,kind,source,categories,deep=False,mft=False,selected=None,output=None):
  super().__init__();self.kind=kind;self.source=source;self.categories=categories
  self.deep=deep;self.mft=mft;self.selected=selected or [];self.output=output;self.stop=threading.Event()
 def run(self):
  try:
   if self.kind=='restore':
    saved=[];errors=[]
    for n,c in enumerate(self.selected):
     if self.stop.is_set():break
     try:
      if isinstance(c,Candidate):
       report=recover(self.source,c,self.output,allow_unknown=True,cancel=self.stop.is_set)
       saved.append({'source':c.path,'result':report,'check':assess_deep(report['path'])})
      else:
       name,sha=restore_hit(c,self.output)
       saved.append({'source':c.label,'result':{'path':name,'sha256':sha},'check':assess_deep(name)})
     except ScanCancelled:self.stop.set();break
     except Exception as e:errors.append(str(e))
     self.event.emit('progress',int(100*(n+1)/len(self.selected)))
    stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    target=Path(self.output)/('MURDILIMAX-recovery-'+stamp+'.json')
    target.write_text(json.dumps({'version':VERSION,'saved':saved,'errors':errors,'cancelled':self.stop.is_set()},ensure_ascii=False,indent=2),encoding='utf8')
    self.event.emit('done',f'{len(saved)} saved; {len(errors)} errors. Report: {target}')
   elif self.kind=='preview':
    pic=decode_preview(preview_bytes(self.source,self.selected[0]))
    buf=BytesIO();pic.save(buf,format='PNG');self.event.emit('preview',buf.getvalue())
   elif self.kind in ('metadata','physical'):
    def progress(a,b):
     if self.stop.is_set():raise ScanCancelled('Cancelled')
     self.event.emit('progress',int(a*100/max(1,b)))
    found,vol,errors=scan_image(self.source,progress=progress,deep_partitions=self.deep,salvage_mft=self.mft)
    count=0
    for c in found:
     if self.stop.is_set():break
     if not c.is_dir and c.kind in self.categories:
      count+=1
      if count<=12000:self.event.emit('hit',c)
    self.event.emit('done',f'{count} candidates · {len(vol)} volumes · '+'; '.join(errors[:2]))
   else:
    count=[0]
    def bridge(typ,obj):
     if typ=='hit':
      category='Crypto backups' if obj.kind=='Crypto' else obj.kind
      if category in self.categories:
       count[0]+=1
       if count[0]<=12000:self.event.emit('hit',obj)
     elif typ=='progress':self.event.emit('progress',int(obj))
    if self.kind=='folder':
     chosen={'Crypto' if c=='Crypto backups' else c for c in self.categories}
     scan_folder(self.source,chosen,self.stop,bridge)
    else:carve_image(self.source,self.categories,self.stop,bridge)
    self.event.emit('done',f'{count[0]} candidates')
  except Exception as e:self.event.emit('error',str(e))
  finally:self.event.emit('end',None)

class Window(QMainWindow):
 def __init__(self):
  super().__init__();self.store=QSettings('MURDILIMAX','Crystal')
  self.lang=self.store.value('language','ru');self.lang=self.lang if self.lang in WORDS else 'ru'
  self.source='';self.mode='metadata';self.entries=[];self.worker=None
  self.setWindowTitle('MURDILIMAX Recovery — Crystal '+VERSION);self.resize(1390,870);self.setMinimumSize(1000,730)
  self.build();self.translate()
 def t(self,k):return WORDS[self.lang].get(k,k)
 def label(self,s='',name=None):
  l=QLabel(s)
  if name:l.setObjectName(name)
  return l
 def button(self,s,fn,name=None):
  b=QPushButton(s);b.clicked.connect(fn)
  if name:b.setObjectName(name)
  return b
 def panel(self):
  f=QFrame();f.setObjectName('panel');return f
 def build(self):
  root=QWidget();root.setObjectName('root');self.setCentralWidget(root)
  main=QHBoxLayout(root);main.setContentsMargins(0,0,0,0);main.setSpacing(0)
  side=QFrame();side.setObjectName('sidebar');side.setFixedWidth(213);main.addWidget(side)
  sv=QVBoxLayout(side);sv.setContentsMargins(14,24,14,19)
  sv.addWidget(self.label('◇  MURDILIMAX','logo'))
  sv.addWidget(self.label('     CRYSTAL RECOVERY','muted'));sv.addSpacing(33)
  self.nav=[]
  for symbol,key,fn in [('⌕','scan',lambda:None),('▣','disks',self.image_source),
                         ('↺','recover',self.restore_checked),('◇','raid',self.expert_tools),
                         ('▧','preview',self.preview_file),('♧','wallet',self.expert_tools)]:
   b=self.button('',fn,'nav');self.nav.append((b,symbol,key));sv.addWidget(b)
  self.nav[0][0].setProperty('selected','true')
  sv.addStretch();sv.addWidget(self.label('✦    ◇    ✦','muted'));sv.addWidget(self.label('0.10.0 · OFFLINE','muted'))
  scroll=QScrollArea();scroll.setWidgetResizable(True);scroll.setFrameShape(QFrame.Shape.NoFrame);main.addWidget(scroll,1)
  page=QWidget();page.setObjectName('root');scroll.setWidget(page)
  body=QVBoxLayout(page);body.setContentsMargins(19,17,19,13);body.setSpacing(13)
  art=Hero();body.addWidget(art)
  h=QVBoxLayout(art);h.setContentsMargins(25,25,25,22)
  self.head=self.label();self.head.setStyleSheet('font-size:32px;font-weight:900;color:white;background:transparent')
  self.intro=self.label();self.intro.setStyleSheet('color:#C6D8F7;background:transparent')
  h.addWidget(self.head);h.addWidget(self.intro);h.addStretch()
  src=self.panel();body.addWidget(src)
  s=QVBoxLayout(src);s.setContentsMargins(17,12,17,15)
  top=QHBoxLayout();self.srctitle=self.label('','small');top.addWidget(self.srctitle);top.addStretch()
  self.langbtn=self.button('',self.change_lang);top.addWidget(self.langbtn);s.addLayout(top)
  choices=QHBoxLayout();self.imagebtn=self.button('',self.image_source,'source')
  self.folderbtn=self.button('',self.folder_source,'source');self.physicalbtn=self.button('',self.device_source,'source')
  for b in (self.imagebtn,self.folderbtn,self.physicalbtn):choices.addWidget(b)
  s.addLayout(choices)
  self.source_label=self.label('','muted');self.source_label.setWordWrap(True);s.addWidget(self.source_label)
  options=QHBoxLayout();self.modecombo=QComboBox();self.modecombo.addItem('',userData='metadata');self.modecombo.addItem('',userData='carve')
  self.modecombo.currentIndexChanged.connect(self.mode_changed);options.addWidget(self.modecombo)
  self.deep=QCheckBox();self.deep.setChecked(True);options.addWidget(self.deep)
  self.mft=QCheckBox();self.mft.setChecked(True);options.addWidget(self.mft);options.addStretch();s.addLayout(options)
  self.cathead=self.label('','small');s.addWidget(self.cathead)
  catrow=QHBoxLayout();self.categories={}
  for cat in CATS:
   cb=QCheckBox();cb.setChecked(cat in ('Photos','Documents','Archives','Crypto backups'))
   cb.setStyleSheet('QCheckBox{background:#2A235B;border:1px solid #7A55A9;border-radius:12px;padding:7px}')
   self.categories[cat]=cb;catrow.addWidget(cb)
  s.addLayout(catrow)
  buttons=QHBoxLayout();self.scanbtn=self.button('',self.scan,'primary');buttons.addWidget(self.scanbtn,3)
  self.stopbtn=self.button('',self.stop);buttons.addWidget(self.stopbtn)
  self.expertbtn=self.button('',self.expert_tools);buttons.addWidget(self.expertbtn);s.addLayout(buttons)
  progress_panel=self.panel();body.addWidget(progress_panel)
  ps=QHBoxLayout(progress_panel)
  gem=self.label('◇');gem.setStyleSheet('font-size:42px;color:#75E8FF');ps.addWidget(gem)
  pv=QVBoxLayout();self.state_label=self.label('','small');pv.addWidget(self.state_label)
  self.progress=QProgressBar();pv.addWidget(self.progress)
  self.detail=self.label('','muted');self.detail.setWordWrap(True);pv.addWidget(self.detail);ps.addLayout(pv,1)
  self.count=self.label('0','heading');ps.addWidget(self.count)
  mid=QHBoxLayout();body.addLayout(mid,1)
  result_panel=self.panel();mid.addWidget(result_panel,4)
  rv=QVBoxLayout(result_panel);rh=QHBoxLayout();self.resulttitle=self.label('','small');rh.addWidget(self.resulttitle)
  rh.addStretch();self.search=QLineEdit();self.search.setFixedWidth(200);self.search.textChanged.connect(self.filter);rh.addWidget(self.search);rv.addLayout(rh)
  self.table=QTableWidget(0,5);self.table.setAlternatingRowColors(True);self.table.verticalHeader().hide()
  self.table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
  self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
  self.table.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
  self.table.horizontalHeader().setSectionResizeMode(0,QHeaderView.ResizeMode.Stretch)
  for i,width in enumerate((220,170,75,100,95)):
   if i:self.table.setColumnWidth(i,width)
  self.table.setMinimumHeight(210);self.table.itemSelectionChanged.connect(self.describe);rv.addWidget(self.table,1)
  pre=self.panel();pre.setMinimumWidth(230);mid.addWidget(pre,2)
  vp=QVBoxLayout(pre);self.previewtitle=self.label('','small');vp.addWidget(self.previewtitle)
  self.photo=QLabel();self.photo.setAlignment(Qt.AlignmentFlag.AlignCenter);self.photo.setWordWrap(True)
  self.photo.setMinimumHeight(170);self.photo.setStyleSheet('background:#0B1536;border:1px solid #46578E;border-radius:10px;padding:10px')
  vp.addWidget(self.photo,3);self.info=self.label('','muted');self.info.setWordWrap(True);vp.addWidget(self.info,1)
  self.photobtn=self.button('',self.preview_file);vp.addWidget(self.photobtn)
  footer=QHBoxLayout();body.addLayout(footer)
  self.restorebtn=self.button('',self.restore_checked,'primary');footer.addWidget(self.restorebtn,3)
  self.advbtn=self.button('',self.expert_tools);footer.addWidget(self.advbtn)
  self.privacy=self.label('','muted');self.privacy.setAlignment(Qt.AlignmentFlag.AlignCenter);body.addWidget(self.privacy)
  self.setStyleSheet(STYLE);self.busy(False)
 def translate(self):
  self.head.setText(self.t('title'));self.intro.setText(self.t('intro'))
  for b,sym,key in self.nav:b.setText(sym+'   '+self.t(key))
  self.srctitle.setText(self.t('choose'));self.langbtn.setText(self.t('lang'))
  self.imagebtn.setText('◈  '+self.t('image'));self.folderbtn.setText('▤  '+self.t('folder'))
  self.physicalbtn.setText('▣  '+self.t('physical'))
  if not self.source:self.source_label.setText(self.t('none'))
  self.modecombo.setItemText(0,self.t('meta'));self.modecombo.setItemText(1,self.t('carve'))
  self.deep.setText(self.t('deep'));self.mft.setText(self.t('mft'));self.cathead.setText(self.t('types'))
  for cat,cb in self.categories.items():cb.setText(self.t(cat))
  self.scanbtn.setText('◈  '+self.t('start'));self.stopbtn.setText(self.t('stop'))
  self.expertbtn.setText(self.t('expert'));self.advbtn.setText(self.t('expert'))
  if self.worker is None:self.state_label.setText(self.t('ready'))
  self.resulttitle.setText(self.t('results'));self.search.setPlaceholderText(self.t('search'))
  for i,k in enumerate(('name','path','size','type','state')):self.table.setHorizontalHeaderItem(i,QTableWidgetItem(self.t(k)))
  self.previewtitle.setText(self.t('preview'));self.photobtn.setText(self.t('photo'))
  if not self.entries:self.photo.setText(self.t('empty_preview'))
  self.restorebtn.setText('↺  '+self.t('recover'));self.privacy.setText(self.t('privacy'))
 def change_lang(self):
  self.lang='en' if self.lang=='ru' else 'ru';self.store.setValue('language',self.lang);self.translate()
 def busy(self,flag):
  for b in (self.scanbtn,self.imagebtn,self.folderbtn,self.physicalbtn,self.expertbtn,self.restorebtn,self.photobtn,self.advbtn):b.setEnabled(not flag)
  self.stopbtn.setEnabled(flag)
 def mode_changed(self):
  if self.mode=='folder':return
  if self.mode.startswith('physical'):self.mode='physical' if self.modecombo.currentIndex()==0 else 'physical-carve'
  else:self.mode=self.modecombo.currentData()
 def image_source(self):
  if self.worker:return
  p,_=QFileDialog.getOpenFileName(self,self.t('select'),'','Raw images (*.img *.dd *.bin *.raw);;All files (*)')
  if p:self.source=p;self.mode=self.modecombo.currentData();self.source_label.setText('◈ '+p)
 def folder_source(self):
  if self.worker:return
  p=QFileDialog.getExistingDirectory(self,self.t('select'))
  if p:self.source=p;self.mode='folder';self.source_label.setText('▤ '+p)
 def device_source(self):
  if self.worker:return
  drives=enumerate_drives()
  if not drives:QMessageBox.information(self,'HDD/USB','No available Windows physical disks');return
  names=[d['path']+' · '+display_size(d['size']) for d in drives]
  name,ok=QInputDialog.getItem(self,self.t('physical'),self.t('select'),names,0,False)
  if not ok:return
  if QMessageBox.warning(self,'READ ONLY',self.t('warning'),QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
  self.source=drives[names.index(name)]['path']
  self.mode='physical' if self.modecombo.currentIndex()==0 else 'physical-carve'
  self.source_label.setText('▣ '+name)
 def selected_cats(self):return {k for k,v in self.categories.items() if v.isChecked()}
 def run_worker(self,job):
  self.worker=job;job.event.connect(self.on_event);job.finished.connect(self.task_end)
  self.busy(True);self.progress.setRange(0,100);self.progress.setValue(0);job.start()
 def task_end(self):
  w=self.worker;self.worker=None;self.busy(False)
  if w:w.deleteLater()
 def stop(self):
  if self.worker:self.worker.stop.set()
 def scan(self):
  if self.worker:return
  if not self.source:QMessageBox.warning(self,self.t('error'),self.t('no_source'));return
  valid=Path(self.source).is_dir() if self.mode=='folder' else is_physical(self.source) if self.mode.startswith('physical') else Path(self.source).is_file()
  if not valid:QMessageBox.warning(self,self.t('error'),'Source does not exist');return
  if not self.selected_cats():QMessageBox.warning(self,self.t('error'),self.t('types'));return
  self.entries.clear();self.table.setRowCount(0);self.count.setText('0')
  self.photo.clear();self.photo.setText(self.t('empty_preview'));self.state_label.setText(self.t('working'))
  self.run_worker(Worker(self.mode,self.source,self.selected_cats(),self.deep.isChecked(),self.mft.isChecked()))
 def on_event(self,key,obj):
  if key=='hit':
   if len(self.entries)>=12000:return
   i=len(self.entries);self.entries.append(obj);self.table.insertRow(i)
   if isinstance(obj,Candidate):name,path,kind,state=obj.name,obj.path,obj.kind,obj.state
   else:name,path,kind,state=Path(obj.label).name,obj.label,obj.kind,'candidate'
   for j,value in enumerate((name,path,display_size(obj.size),self.t(kind),state)):
    cell=QTableWidgetItem(value)
    if j==0:
     cell.setFlags(cell.flags()|Qt.ItemFlag.ItemIsUserCheckable)
     cell.setCheckState(Qt.CheckState.Unchecked)
    if j==4:cell.setForeground(QColor('#79F1D1' if state=='free' else '#E8C68C'))
    self.table.setItem(i,j,cell)
   self.count.setText(str(len(self.entries)))
  elif key=='progress':self.progress.setValue(max(0,min(100,int(obj))))
  elif key=='done':
   self.state_label.setText(self.t('done'));self.detail.setText(str(obj));self.progress.setValue(100)
  elif key=='preview':
   pix=QPixmap();pix.loadFromData(obj,'PNG')
   self.photo.setPixmap(pix.scaled(320,240,Qt.AspectRatioMode.KeepAspectRatio,Qt.TransformationMode.SmoothTransformation))
  elif key=='error':
   self.detail.setText(str(obj));QMessageBox.warning(self,self.t('error'),str(obj))
 def filter(self,text):
  q=text.casefold()
  for i,item in enumerate(self.entries):
   name=item.path if isinstance(item,Candidate) else item.label
   self.table.setRowHidden(i,q not in name.casefold())
 def describe(self):
  indexes=self.table.selectionModel().selectedRows() if self.table.selectionModel() else []
  if not indexes:return
  i=indexes[0].row()
  if i>=len(self.entries):return
  c=self.entries[i];self.photo.setPixmap(QPixmap());self.photo.setText(self.t('empty_preview'))
  self.info.setText((c.path if isinstance(c,Candidate) else c.label)+'\n'+display_size(c.size)+
                    (' · '+c.state if isinstance(c,Candidate) else ''))
 def preview_file(self):
  if self.worker:return
  rows=self.table.selectionModel().selectedRows() if self.table.selectionModel() else []
  if len(rows)!=1:return
  item=self.entries[rows[0].row()]
  if not isinstance(item,Candidate) or Path(item.name).suffix.lower() not in ('.jpg','.jpeg','.png','.gif','.webp'):
   QMessageBox.information(self,self.t('preview'),'Select one photo found via filesystem metadata');return
  self.run_worker(Worker('preview',self.source,set(),selected=[item]))
 def restore_checked(self):
  if self.worker:return
  selected=[c for i,c in enumerate(self.entries) if self.table.item(i,0) and self.table.item(i,0).checkState()==Qt.CheckState.Checked]
  if not selected:QMessageBox.information(self,self.t('recover'),self.t('no_files'));return
  out=QFileDialog.getExistingDirectory(self,self.t('output'))
  if not out:return
  if is_physical(self.source):
   if not destination_is_different_disk(self.source,out):
    QMessageBox.warning(self,self.t('error'),'Different destination disk cannot be verified; blocked');return
  else:
   src=Path(self.source).resolve();dst=Path(out).resolve()
   if (src.is_dir() and (src==dst or src in dst.parents)) or (src.is_file() and dst==src.parent):
    QMessageBox.warning(self,self.t('error'),'Output must not overwrite source');return
  if any(isinstance(c,Candidate) and c.state=='unknown' for c in selected):
   if QMessageBox.warning(self,self.t('recover'),self.t('unknown'),QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
  self.state_label.setText(self.t('recover'))
  self.run_worker(Worker('restore',self.source,set(),selected=selected,output=out))
 def expert_tools(self):
  if self.worker:return
  args=[sys.executable]
  if not getattr(sys,'frozen',False):args.append(str(Path(__file__).resolve()))
  args.append('--legacy')
  try:subprocess.Popen(args)
  except OSError as e:QMessageBox.warning(self,self.t('error'),str(e))
 def closeEvent(self,e):
  if self.worker and self.worker.isRunning():
   QMessageBox.warning(self,self.t('error'),self.t('stop'));e.ignore()
  else:e.accept()

def main():
 if '--legacy' in sys.argv:
  murdilimax_recovery_v04.App().mainloop();return 0
 app=QApplication(sys.argv);app.setStyle('Fusion')
 app.setApplicationName('MURDILIMAX Recovery');app.setOrganizationName('MURDILIMAX')
 w=Window();w.show();return app.exec()
if __name__=='__main__':raise SystemExit(main())
