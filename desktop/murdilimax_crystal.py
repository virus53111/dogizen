#!/usr/bin/env python3
"""MURDILIMAX Crystal Desktop (Qt 6). Real read-only recovery engine, no demo data.

New visual shell around the existing tested recovery modules. Windows x64 installer
bundles Qt; users do not need to install Python. No network, telemetry, or secrets.
"""
from __future__ import annotations
import json
import math
import os
import sys
import threading
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from PySide6.QtCore import Qt, QSettings, Signal, QThread, QTimer, QPointF, QRectF
from PySide6.QtGui import (QColor, QFont, QLinearGradient, QPainter, QPainterPath,
                           QPen, QPixmap, QPolygonF, QBrush)
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QFrame, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QCheckBox, QProgressBar, QLineEdit, QTableWidget, QTableWidgetItem,
    QFileDialog, QMessageBox, QInputDialog, QDialog, QComboBox, QPlainTextEdit,
    QHeaderView, QAbstractItemView, QScrollArea, QSizePolicy, QGraphicsDropShadowEffect, QGridLayout,
)

from murdilimax_engine import scan_image, recover, Candidate, ScanCancelled
from murdilimax_recovery_alpha import scan_folder, carve_image, restore as restore_hit, Hit
from murdilimax_devices import is_physical, is_volume, enumerate_drives, enumerate_volumes
from murdilimax_imager import image_source, ImagingCancelled, SourceReadLimitExceeded
from murdilimax_raid import assemble, RAID5_LAYOUTS
from murdilimax_wallets import discover_wallet_backups
from murdilimax_preview import preview_bytes, decode_preview
from murdilimax_md import inspect_md_set, extract_md_member
from murdilimax_deepcheck import assess_deep
from murdilimax_session import make_session, save_session as store_view_session, load_session as load_view_session
from murdilimax_fontguard import select_cyrillic_font, validate_cyrillic_font
from murdilimax_crystal_logic import (
    CATEGORIES, file_size, validate_source, safe_destination,
    normalize_categories, supported_preview, recommendation_color, selected_items, read_visible_photo,
)

VERSION='0.10.5'
BG='#070B20'
PANEL='#111937'
VIOLET='#B87AFF'
CYAN='#55E5FF'
TEXT='#F1F2FF'
MUTED='#9FA9D2'
MAX_VISIBLE=12000

TR={
'ru':{
 'volume_card':'Весь диск (C:, D:)','volume_select':'Выберите диск целиком',
 'volume_help':'Выберите диск из списка и нажмите ОК. Папки открывать не нужно.',
 'volume_selected':'Выбран весь диск. Нажмите «Начать сканирование». Источник открывается только для чтения.',
 'unnamed_volume':'Без метки','no_volumes':'Доступные локальные диски не найдены. Подключите диск или разблокируйте его в Windows.',
 'unsupported_volume':'Для поиска удалённых файлов на диске поддерживаются NTFS и exFAT. Другую файловую систему откройте как поддерживаемый образ.',
 'live_volume_warning':'Будет просканирован весь выбранный диск только для чтения. Windows и другие программы могут продолжать записывать на него: это не снимок диска и восстановление не гарантируется. Закройте лишние программы. Сохраняйте найденные файлы на другой физический накопитель. Продолжить?',
 'volume_image_help':'Для создания образа выберите физический HDD/USB. Снятие образа активного системного диска запрещено; используйте отдельную загрузочную среду.',
 'title':'Восстановление данных','subtitle':'Верни важные файлы. Прозрачный локальный анализ без облака.',
 'scan':'Сканирование','disks':'Диски','restore':'Восстановление','raid':'RAID / NAS',
 'preview':'Предпросмотр','wallet':'Кошельки','reports':'Отчёты','settings':'Настройки',
 'source_title':'ВЫБЕРИТЕ ИСТОЧНИК ДЛЯ АНАЛИЗА','image_card':'Образ диска','folder_card':'Файлы в папке (не удалённые)','physical_card':'HDD / USB',
 'source_empty':'Источник ещё не выбран','refresh':'Выбрать другой','categories':'ТИПЫ ФАЙЛОВ ДЛЯ ПОИСКА',
 'Photos':'Фото','Documents':'Документы','Archives':'Архивы','Video':'Видео','Audio':'Аудио',
 'Crypto backups':'Криптокошельки','Other':'Другие','start':'НАЧАТЬ СКАНИРОВАНИЕ',
 'stop':'ОСТАНОВИТЬ','image_action':'СОЗДАТЬ ОБРАЗ','raid_action':'СОБРАТЬ RAID',
 'scan_status':'Ожидание источника','scan_sub':'Результаты появятся после настоящего сканирования',
 'scanning':'СКАНИРОВАНИЕ ИСТОЧНИКА','imaging':'СОЗДАНИЕ ОБРАЗА','recovering':'ВОССТАНОВЛЕНИЕ ФАЙЛОВ',
 'idle':'ГОТОВО К РАБОТЕ','found':'НАЙДЕНО ФАЙЛОВ','results':'РЕЗУЛЬТАТЫ СКАНИРОВАНИЯ',
 'search':'Поиск по результатам…','name':'Имя файла','location':'Путь / расположение',
 'size':'Размер','type':'Тип','condition':'Состояние','preview_title':'ПРЕДПРОСМОТР',
 'preview_empty':'Выберите фотографию из списка.\nИзображение загрузится локально.',
 'preview_note':'Предпросмотр не гарантирует целостность файла.',
 'restore_selected':'ВОССТАНОВИТЬ ОТМЕЧЕННОЕ','advisor':'СОВЕТ ПО ВОССТАНОВЛЕНИЮ',
 'report_button':'ОТКРЫТЬ ОТЧЁТ','privacy':'Только чтение источника  ·  Результаты на другой диск  ·  Без передачи данных',
 'confirm_physical':'Чтение физического диска может ухудшить состояние неисправного оборудования. Используйте образ для важных данных. Продолжить?',
 'confirm_unknown':'Некоторые файлы имеют неизвестное состояние кластеров. Они могут быть повреждены. Всё равно попробовать?',
 'choose_source':'Выберите образ / диск / папку','choose_output':'Выберите папку на ДРУГОМ физическом носителе',
 'choose_image_output':'Сохраните новый образ на ДРУГОМ физическом диске',
 'no_file':'Отметьте хотя бы один файл в результатах.','no_source':'Сначала выберите источник.',
 'no_categories':'Выберите хотя бы одну категорию файлов.','error':'Ошибка','complete':'Операция завершена',
 'no_preview':'Выберите одну фотографию из результатов или из выбранной папки.',
 'wallet_title':'ПОИСК РЕЗЕРВНЫХ КОПИЙ КОШЕЛЬКОВ','wallet_warning':'Проверяются только названия файлов, без чтения ключей и seed-фраз.',
 'start_wallet':'Искать названия в выбранной папке','settings_title':'Настройки интерфейса',
 'language':'Язык','motion':'Анимированный фон','warnings':'Данные могут быть повреждены: используйте копии и проверяйте восстановленные файлы.',
 'confirm_reset':'Выйти сейчас нельзя: операция ещё выполняется. Нажмите «Остановить» и дождитесь её окончания.',
 'no_report':'Отчёт ещё не создан. Сначала восстановите хотя бы один файл.',
 'scan_finished':'Сканирование завершено','recovery_finished':'Восстановление завершено',
 'validating':'Проверка файлов и создание локального отчёта…','selected':'Выбрано','working':'Операция выполняется…',
 'raid_help':'Используйте только заранее созданные ОБРАЗЫ участников, не физические HDD. Порядок дисков и размер блока должны быть известны. RAID6 — только фиксированные P/Q, RAID10 — только near-2.',
 'raid_members':'Пути образов по порядку, по одному на строку. «-» — отсутствующий диск:',
 'add_member':'Добавить образ','build_raid':'Собрать новый образ','cancel':'Отмена','ok':'ОК',
 'source_mode':'Режим сканирования','metadata_mode':'По метаданным NTFS/exFAT/ext4','carve_mode':'По сигнатурам JPG/PNG/PDF/ZIP',
 'folder_mode':'Обычные файлы в папке','deep_mode':'Поиск потерянных разделов (медленнее)',
 'mft_mode':'Поиск повреждённых записей NTFS (экспериментально)',
 'device_select':'Выберите физический диск Windows','local_advice':'Локальные рекомендации, не диагноз и не ИИ.',
 'save_session':'СОХРАНИТЬ СЕССИЮ','open_session':'ОТКРЫТЬ СЕССИЮ',
 'session_saved':'Сводка сканирования сохранена локально. Она не содержит файлов или данных для восстановления.',
 'session_view':'СОХРАНЁННАЯ СЕССИЯ · ТОЛЬКО ПРОСМОТР',
 'session_rescan':'Для восстановления и предпросмотра выберите исходный носитель и выполните новое сканирование.',
 'session_sensitive':'Файл сессии содержит имена и пути файлов. Храните его в защищённом месте.',
},
'en':{
 'volume_card':'Whole drive (C:, D:)','volume_select':'Select a whole drive',
 'volume_help':'Select a drive from the list and press OK. Do not open any folders.',
 'volume_selected':'Whole drive selected. Press Start scanning. The source is opened read-only.',
 'unnamed_volume':'Unnamed volume','no_volumes':'No available local drives found. Connect the drive or unlock it in Windows.',
 'unsupported_volume':'Deleted-file volume scanning supports NTFS and exFAT. Use a supported disk image for other filesystems.',
 'live_volume_warning':'The entire selected volume will be read, never written. Windows and other apps may still write to it: this is not a snapshot and recovery is not guaranteed. Close other apps. Recover to another physical disk. Continue?',
 'volume_image_help':'Choose a physical HDD/USB to acquire an image. Live system-disk imaging is blocked; use a separate recovery environment.',
 'title':'Data recovery','subtitle':'Bring important files back. Transparent offline analysis, no cloud.',
 'scan':'Scan','disks':'Disks','restore':'Recovery','raid':'RAID / NAS',
 'preview':'Preview','wallet':'Wallets','reports':'Reports','settings':'Settings',
 'source_title':'CHOOSE A SOURCE TO ANALYZE','image_card':'Disk image','folder_card':'Existing folder files','physical_card':'HDD / USB',
 'source_empty':'No source selected','refresh':'Choose another','categories':'SEARCH FILE CATEGORIES',
 'Photos':'Photos','Documents':'Documents','Archives':'Archives','Video':'Video','Audio':'Audio',
 'Crypto backups':'Crypto backups','Other':'Other','start':'START SCANNING',
 'stop':'STOP','image_action':'MAKE DISK IMAGE','raid_action':'RAID BUILDER',
 'scan_status':'Waiting for source','scan_sub':'Actual results will appear after a real scan',
 'scanning':'SCANNING SOURCE','imaging':'ACQUIRING DISK IMAGE','recovering':'RECOVERING FILES',
 'idle':'READY','found':'FILES FOUND','results':'SCAN RESULTS',
 'search':'Search results…','name':'File name','location':'Path / location',
 'size':'Size','type':'Type','condition':'Condition','preview_title':'PREVIEW',
 'preview_empty':'Select a photo result.\nThe preview is loaded locally.',
 'preview_note':'A preview is not proof of full file integrity.',
 'restore_selected':'RECOVER CHECKED FILES','advisor':'RECOVERY GUIDANCE',
 'report_button':'OPEN REPORT','privacy':'Source read only  ·  Recover to a different disk  ·  No data uploads',
 'confirm_physical':'Reading a physical disk can worsen hardware failure. Image important drives first. Continue?',
 'confirm_unknown':'Some candidates have unknown allocation status and may be damaged. Recover anyway?',
 'choose_source':'Select disk image / physical device / folder','choose_output':'Choose output folder on ANOTHER physical disk',
 'choose_image_output':'Save a NEW image on a DIFFERENT physical disk',
 'no_file':'Check at least one file in the results.','no_source':'Choose a source first.',
 'no_categories':'Choose at least one file category.','error':'Error','complete':'Operation complete',
 'no_preview':'Choose one found photo or an existing photo from a selected folder.',
 'wallet_title':'WALLET BACKUP FILENAME FINDER','wallet_warning':'Only filenames are inspected; no seed phrases or keys are accessed.',
 'start_wallet':'Search filenames in selected folder','settings_title':'Interface settings',
 'language':'Language','motion':'Animated backdrop','warnings':'Recovery results may be corrupt; work from a copy and verify extracted files.',
 'confirm_reset':'An operation is still running. Press Stop and wait for it to finish before exiting.',
 'no_report':'No report created yet. Recover a file first.',
 'scan_finished':'Scan complete','recovery_finished':'Recovery finished',
 'validating':'Checking files and writing a local report…','selected':'Selected','working':'Operation in progress…',
 'raid_help':'Use previously acquired member IMAGES only, never physical disks. Member order and chunk size must be known. RAID6 fixed P/Q only, RAID10 near-2 only.',
 'raid_members':'Member image paths in physical order, one per line. Use "-" for a missing member:',
 'add_member':'Add image','build_raid':'Build new image','cancel':'Cancel','ok':'OK',
 'source_mode':'Scan mode','metadata_mode':'NTFS/exFAT/ext4 metadata','carve_mode':'JPG/PNG/PDF/ZIP signatures',
 'folder_mode':'Visible files in a folder','deep_mode':'Find lost partitions (slower)',
 'mft_mode':'Damaged NTFS record salvage (experimental)',
 'device_select':'Select Windows physical disk','local_advice':'Local rule-based guidance, not AI or diagnosis.',
 'save_session':'SAVE SESSION','open_session':'OPEN SESSION',
 'session_saved':'Scan summary saved locally. It contains no recovered bytes or information authorizing recovery.',
 'session_view':'SAVED SESSION · VIEW ONLY',
 'session_rescan':'To preview or recover files, choose the original source again and run a fresh scan.',
 'session_sensitive':'Session files contain filenames and paths. Keep them private.',
}}


def tr(lang:str,key:str)->str:
    return TR.get(lang,TR['ru']).get(key,key)


class CrystalBanner(QWidget):
    """Vector crystal art, resolution independent, optional low-power shimmer."""
    def __init__(self,parent=None):
        super().__init__(parent)
        self.setMinimumHeight(110)
        self.phase=0.0
        self.animated=True
        self.timer=QTimer(self)
        self.timer.timeout.connect(self.advance)
        self.timer.start(95)
    def advance(self):
        if self.animated and self.isVisible():
            self.phase+=.07
            self.update()
    def paintEvent(self,event):
        p=QPainter(self);p.setRenderHint(QPainter.RenderHint.Antialiasing)
        r=self.rect();w=r.width();h=r.height()
        g=QLinearGradient(0,0,w,h)
        g.setColorAt(0,QColor('#1A1A53'));g.setColorAt(.6,QColor('#112C60'));g.setColorAt(1,QColor('#2C1058'))
        p.setBrush(g);p.setPen(Qt.PenStyle.NoPen);p.drawRoundedRect(QRectF(r),22,22)
        p.setClipPath(self.rounded_path(w,h))
        for k in range(32):
            x=(k*157+45)%max(1,w);y=(k*71+12)%max(1,h)
            opacity=.29+.21*math.sin(self.phase+k)
            p.setOpacity(opacity)
            p.setBrush(QColor('#9FEAFF') if k%2 else QColor('#FFE5FF'))
            rr=1+(k%3)
            p.drawEllipse(QPointF(x,y),rr,rr)
        p.setOpacity(1)
        cx=w*.82;by=h*.91
        self.crystal(p,cx-95,by,54,108,'#5535E9','#A46EFF','#F4D9FF')
        self.crystal(p,cx+12,by,80,146,'#1672CC','#50E7FF','#F5FFFF')
        self.crystal(p,cx+105,by,48,92,'#8A26BB','#E077FF','#FFE5FF')
        ring=QPen(QColor(116,237,255,170),2);p.setPen(ring);p.setBrush(Qt.BrushStyle.NoBrush)
        p.drawEllipse(QRectF(cx-145,by-90,270,66))
        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(QColor(92,222,255,40));p.drawEllipse(QRectF(cx-150,by-38,300,66))
        p.end()
    def crystal(self,p,x,y,w,h,dark,light,shine):
        a=QPointF(x,y-h);b=QPointF(x-w*.56,y-h*.55);c=QPointF(x+w*.54,y-h*.55)
        d=QPointF(x-w*.4,y);e=QPointF(x+w*.4,y);mid=QPointF(x,y-h*.42)
        for poly,color in [([a,b,mid],light),([a,mid,c],shine),([b,d,mid],dark),([mid,d,e],light),([mid,e,c],dark)]:
            p.setPen(QPen(QColor(221,190,255,185),1))
            p.setBrush(QColor(color));p.drawPolygon(QPolygonF(poly))
    def rounded_path(self,w,h):
        path=QPainterPath();path.addRoundedRect(QRectF(0,0,w,h),22,22);return path


class Job(QThread):
    message=Signal(str,object)
    def __init__(self,kind:str,payload:dict,parent=None):
        super().__init__(parent);self.kind=kind;self.payload=payload;self.stop=threading.Event()
    def send(self,key,obj):
        self.message.emit(key,obj)
    def run(self):
        p=self.payload
        try:
            if self.kind=='scan':
                chosen=p['categories'];mode=p['mode'];src=p['source'];seen=0
                if mode in ('metadata','physical','volume'):
                    def progress(a,b):
                        if self.stop.is_set():raise ScanCancelled('Cancelled')
                        self.send('progress',int(a*100/max(1,b)))
                    candidates,volumes,errors=scan_image(src,progress=progress,
                        deep_partitions=p['deep'],salvage_mft=p['mft'])
                    for item in candidates:
                        if self.stop.is_set():break
                        if item.kind in chosen and not item.is_dir:
                            seen+=1
                            if seen<=MAX_VISIBLE:self.send('found',item)
                    self.send('scan_done',{'found':seen,'volumes':len(volumes),'errors':errors,'cancelled':self.stop.is_set()})
                else:
                    def bridge(event,obj):
                        nonlocal seen
                        if event=='hit':
                            category='Crypto backups' if obj.kind=='Crypto' else obj.kind
                            if category in chosen:
                                seen+=1
                                if seen<=MAX_VISIBLE:self.send('found',obj)
                        elif event=='progress':self.send('progress',int(obj))
                    if mode=='folder':
                        chosen={'Crypto' if x=='Crypto backups' else x for x in chosen}
                        scan_folder(src,chosen,self.stop,bridge)
                    else:
                        carve_image(src,chosen,self.stop,bridge)
                    self.send('scan_done',{'found':seen,'volumes':0,'errors':[],'cancelled':self.stop.is_set()})
            elif self.kind=='recover':
                saved=[];errors=[];items=p['items'];dst=p['destination'];src=p['source']
                for index,item in enumerate(items):
                    if self.stop.is_set():break
                    try:
                        if isinstance(item,Candidate):
                            result=recover(src,item,dst,allow_unknown=True,cancel=self.stop.is_set)
                            path=result['path'];saved.append({'source':item.path,'result':result,'validation':assess_deep(path)})
                        else:
                            path,sha=restore_hit(item,dst)
                            saved.append({'source':item.label,'result':{'path':path,'sha256':sha},'validation':assess_deep(path)})
                    except ScanCancelled:
                        self.stop.set();break
                    except Exception as exc:
                        errors.append(f'{getattr(item,"name",getattr(item,"label","file"))}: {exc}')
                    self.send('progress',int((index+1)*100/max(1,len(items))))
                now=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
                report=Path(dst)/('MURDILIMAX-recovery-'+now+'.json')
                content={'application':f'MURDILIMAX Recovery {VERSION}','created_utc':now,'source':src,
                    'saved':saved,'errors':errors,'cancelled':self.stop.is_set(),
                    'note':'Local report; filenames and hashes may be sensitive. No cloud upload.'}
                try:
                    with report.open('x',encoding='utf-8') as f:json.dump(content,f,ensure_ascii=False,indent=2)
                except OSError as exc:errors.append('Report: '+str(exc));report=None
                self.send('recover_done',{'saved':len(saved),'errors':errors,'report':str(report) if report else '',
                    'cancelled':self.stop.is_set()})
            elif self.kind=='image':
                result=image_source(p['source'],p['destination'],cancel=self.stop,
                    progress=lambda done,total,bad:self.send('image_progress',(done,total,bad)),
                    allow_resume_physical=p.get('resume_physical',False))
                self.send('image_done',result)
            elif self.kind=='preview':
                item=p['item']
                if isinstance(item,Candidate):
                    raw=preview_bytes(p['source'],item)
                elif isinstance(item,Hit) and not item.carved and p.get('mode')=='folder':
                    raw=read_visible_photo(item.source,item.size)
                else:
                    raise ValueError('Preview is supported for discovered photos only')
                pic=decode_preview(raw,width=700,height=540)
                output=BytesIO();pic.save(output,format='PNG')
                self.send('preview_done',output.getvalue())
            elif self.kind=='wallet':
                result=discover_wallet_backups(p['source'],cancelled=self.stop.is_set)
                self.send('wallet_done',result)
            elif self.kind=='md_extract':
                result=extract_md_member(p['source'],p['destination'])
                self.send('md_extract_done',result)
            elif self.kind=='raid':
                out=assemble(p['members'],p['destination'],p['level'],p['chunk'],
                    p['verify'],layout=p['layout'],progress=lambda a,b:self.send('progress',int(100*a/max(1,b))))
                self.send('raid_done',out)
        except (ScanCancelled,ImagingCancelled) as exc:
            self.send('paused',str(exc))
        except (Exception,SourceReadLimitExceeded) as exc:
            self.send('failed',str(exc))
        finally:
            self.send('task_end',None)


QSS=r"""
QWidget { color: #F1F2FF; font-size: 12px; }
QMainWindow, QWidget#root { background: #070B20; }
QFrame#sidebar { background: #0A102C; border-right: 1px solid #353D82; }
QLabel#brand { font-size: 21px; font-weight: 900; color: #F9F0FF; }
QLabel#tagline { color: #9DCAFF; font-size: 11px; }
QPushButton#nav { text-align: left; background: transparent; color:#C5CCEE; border: 0; border-radius: 12px; padding: 13px 16px; font-weight:650; }
QPushButton#nav:hover { background:#202455; color:white; }
QPushButton#nav[active="true"] { background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 #6132A7,stop:.6 #363D98,stop:1 #135E95); border:1px solid #B47AFF; color:white; }
QFrame#panel { background:#111936; border:1px solid #3D4A88; border-radius:17px; }
QFrame#smallpanel { background:#121B3E; border:1px solid #474E92; border-radius:13px; }
QLabel#section { color:#B9C5EF; font-weight:800; letter-spacing:1.1px; }
QLabel#muted { color: #A7B3D6; }
QLabel#counter { color: #E8D3FF; font-size: 20px; font-weight:900; }
QPushButton#source { background:qlineargradient(x1:0,y1:0,x2:1,y2:1,stop:0 #27215A,stop:1 #10274A); border:1px solid #55599B; border-radius:13px; padding:17px 9px; font-weight:800; font-size:15px; }
QPushButton#source:hover { border:2px solid #67EAFF; background:#26377D; }
QPushButton#primary { color:#FAF7FF; background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 #7F3BD8,stop:.5 #9F62F0,stop:1 #148DC0); border:2px solid #C99AFF; border-radius:14px; padding:12px 20px; font-size:16px; font-weight:900; }
QPushButton#primary:hover { background:#8E57DE; border:2px solid #82EDFF; }
QPushButton#primary:disabled { color:#7787AD; border-color:#55577B; background:#252744; }
QPushButton#secondary { color:#DEF0FF; background:#1A2550; border:1px solid #688BCC; border-radius:12px; padding:10px 13px; font-weight:800; }
QPushButton#secondary:hover { border-color:#74E7FF; background:#29386D; }
QPushButton#secondary:disabled { color:#7C84A1; background:#1A1C35; }
QPushButton#danger { color:#F8C5D9; border:1px solid #A15378; background:#2B183A; border-radius:12px; padding:10px 13px; font-weight:800; }
QPushButton#danger:disabled { color:#686A89; }
QLineEdit, QComboBox, QPlainTextEdit { color:#F0F3FF; background:#0A1230; border:1px solid #4D548C; border-radius:9px; padding:7px; selection-background-color:#6437AA; }
QCheckBox { color:#C4C9E9; spacing:7px; }
QCheckBox::indicator { width:16px; height:16px; border:1px solid #A080E8; border-radius:5px; background:#17244A; }
QCheckBox::indicator:checked { background:#8755DF; border:2px solid #80E9FF; }
QProgressBar { border:1px solid #515C9E; border-radius:8px; background:#0A1233; height:16px; text-align:center; font-weight:800; }
QProgressBar::chunk { background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 #923AE1,stop:.5 #A866FA,stop:1 #34DBF1); border-radius:8px; }
QTableWidget { background:#0D1633; alternate-background-color:#151E40; color:#DCE7FF; border:1px solid #4A568B; border-radius:12px; gridline-color:#29385D; selection-background-color:#4B3384; selection-color:#FFF; }
QHeaderView::section { background:#1D2853; color:#C8D9FF; border:0; border-right:1px solid #303D67; padding:9px; font-weight:800; }
QScrollBar:vertical { background:#101635; width:12px; }
QScrollBar::handle:vertical { background:#5F52A2; min-height:35px; border-radius:6px; }
QDialog { background:#0D1431; }
QMessageBox { background:#0E1737; }
"""


class CrystalWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.cfg=QSettings('MURDILIMAX','Recovery-Crystal')
        saved=self.cfg.value('language','ru')
        self.lang=saved if saved in ('ru','en') else 'ru'
        self.motion=self.cfg.value('motion','true')!='false'
        self.source='';self.mode='metadata';self.entries=[];self.last_report='';self.worker=None
        self.session_snapshot=None;self.scan_complete=False;self.scan_total=0;self.scan_errors=[]
        self.filtered=[]
        self.setWindowTitle('MURDILIMAX Recovery · Crystal '+VERSION)
        self.resize(1180,820);self.setMinimumSize(900,560)
        self.build_ui();self.retranslate()
    def t(self,key):return tr(self.lang,key)
    def label(self,text,kind=None):
        lbl=QLabel(text)
        if kind:lbl.setObjectName(kind)
        return lbl
    def button(self,text,fn,kind='secondary'):
        b=QPushButton(text);b.setObjectName(kind);b.clicked.connect(fn);b.setCursor(Qt.CursorShape.PointingHandCursor);return b
    def panel(self):
        f=QFrame();f.setObjectName('panel');return f
    def build_ui(self):
        root=QWidget();root.setObjectName('root');self.setCentralWidget(root)
        full=QHBoxLayout(root);full.setContentsMargins(0,0,0,0);full.setSpacing(0)
        sidebar=QFrame();sidebar.setObjectName('sidebar');sidebar.setFixedWidth(180);full.addWidget(sidebar)
        sv=QVBoxLayout(sidebar);sv.setContentsMargins(15,24,15,20);sv.setSpacing(8)
        self.brand=self.label('MURDILIMAX','brand');sv.addWidget(self.brand)
        sv.addWidget(self.label('   CRYSTAL RECOVERY','tagline'))
        sv.addSpacing(36)
        self.nav=[]
        for sym,key,fn in [
          ('','scan',lambda:None),('','disks',self.pick_volume),('','restore',self.recover_selected),
          ('','raid',self.raid_builder),('','preview',self.preview_selected),
          ('','wallet',self.wallet_finder),('','reports',self.open_report),('','settings',self.open_settings)]:
            b=self.button('',fn,'nav');b.setProperty('active','true' if key=='scan' else 'false')
            self.nav.append((b,sym,key));sv.addWidget(b)
        sv.addStretch()
        ornament=QLabel('');ornament.setAlignment(Qt.AlignmentFlag.AlignCenter)
        ornament.setStyleSheet('color:#77DEFF; font-size:26px; margin-bottom:10px');sv.addWidget(ornament)
        sv.addWidget(self.label(VERSION+'·  LOCAL / READ ONLY','tagline'))
        outer=QScrollArea();outer.setWidgetResizable(True);outer.setFrameShape(QFrame.Shape.NoFrame)
        outer.setStyleSheet('QScrollArea{border:0;background:#070B20;} QScrollBar{background:#151732}')
        full.addWidget(outer,1)
        content=QWidget();content.setObjectName('root');outer.setWidget(content)
        cv=QVBoxLayout(content);cv.setContentsMargins(20,18,21,13);cv.setSpacing(14)
        hero=CrystalBanner();self.hero=hero;cv.addWidget(hero)
        hl=QVBoxLayout(hero);hl.setContentsMargins(29,23,29,23)
        self.hero_title=self.label('','');self.hero_title.setStyleSheet('font-size:27px;font-weight:950;color:white;background:transparent')
        self.hero_sub=self.label('');self.hero_sub.setWordWrap(True)
        self.hero_sub.setStyleSheet('font-size:13px;color:#CFDDFC;background:transparent')
        hl.addWidget(self.hero_title);hl.addWidget(self.hero_sub);hl.addStretch()
        source_panel=self.panel();cv.addWidget(source_panel)
        sp=QVBoxLayout(source_panel);sp.setContentsMargins(17,13,17,16);sp.setSpacing(10)
        header=QHBoxLayout();self.source_title=self.label('','section');header.addWidget(self.source_title);header.addStretch()
        self.language=self.button('RU / EN',self.switch_language);header.addWidget(self.language);sp.addLayout(header)
        cards=QGridLayout();cards.setSpacing(9)
        self.btn_volume=self.button('',self.pick_volume,'source')
        self.btn_image=self.button('',self.pick_image,'source')
        self.btn_folder=self.button('',self.pick_folder,'source')
        self.btn_device=self.button('',self.pick_device,'source')
        for i,btn in enumerate((self.btn_volume,self.btn_image,self.btn_folder,self.btn_device)):
            btn.setMinimumHeight(48);cards.addWidget(btn,i//2,i%2)
        sp.addLayout(cards)
        self.source_text=self.label('','muted');self.source_text.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        self.source_text.setWordWrap(True);sp.addWidget(self.source_text)
        self.advanced_btn=self.button('',lambda: self.advanced.setVisible(not self.advanced.isVisible()))
        sp.addWidget(self.advanced_btn)
        self.advanced=QWidget();advanced_layout=QVBoxLayout(self.advanced)
        advanced_layout.setContentsMargins(0,0,0,0)
        sp.addWidget(self.advanced);self.advanced.hide()
        opts=QVBoxLayout();opts.setSpacing(8)
        self.scan_mode=QComboBox();self.scan_mode.setMaximumWidth(365)
        self.scan_mode.addItem('NTFS/exFAT/ext4',userData='metadata');self.scan_mode.addItem('JPG/PNG/PDF/ZIP',userData='carve')
        self.scan_mode.currentIndexChanged.connect(self.mode_changed)
        opts.addWidget(self.scan_mode)
        self.deep=QCheckBox();self.deep.setChecked(True);opts.addWidget(self.deep)
        self.mft=QCheckBox();self.mft.setChecked(True);opts.addWidget(self.mft)
        advanced_layout.addLayout(opts)
        self.cat_title=self.label('','section');advanced_layout.addWidget(self.cat_title)
        catrow=QGridLayout();catrow.setSpacing(8)
        self.checkboxes={}
        for i,category in enumerate(CATEGORIES):
            c=QCheckBox();c.setChecked(category in ('Photos','Documents','Archives','Crypto backups'))
            c.setStyleSheet('QCheckBox{background:#242051;border:1px solid #7654AB;border-radius:14px;padding:6px 8px;font-size:11px;font-weight:700;} QCheckBox:checked{background:#3A285F;border-color:#84DDF7;} QCheckBox::indicator{width:12px;height:12px;}')
            self.checkboxes[category]=c;catrow.addWidget(c,i//4,i%4)
        advanced_layout.addLayout(catrow)
        actions=QHBoxLayout();actions.setSpacing(10)
        self.start_btn=self.button('',self.scan,'primary');actions.addWidget(self.start_btn,2)
        self.stop_btn=self.button('',self.cancel,'danger');actions.addWidget(self.stop_btn)
        self.image_btn=self.button('',self.make_image);actions.addWidget(self.image_btn)
        self.raid_btn=self.button('',self.raid_builder)
        extra_actions=QHBoxLayout();extra_actions.addWidget(self.image_btn);extra_actions.addWidget(self.raid_btn)
        sp.addLayout(actions);sp.addLayout(extra_actions)
        status_panel=self.panel();cv.addWidget(status_panel)
        prog=QHBoxLayout(status_panel);prog.setContentsMargins(18,12,18,12);prog.setSpacing(17)
        gem=self.label('');gem.setStyleSheet('font-size:46px;color:#75E3FF;')
        prog.addWidget(gem)
        pb=QVBoxLayout();pb.setSpacing(6)
        self.status_label=self.label('','section');pb.addWidget(self.status_label)
        self.progress=QProgressBar();self.progress.setRange(0,100);self.progress.setValue(0);self.progress.setFormat('%p%')
        pb.addWidget(self.progress)
        self.status_detail=self.label('','muted');self.status_detail.setWordWrap(True);pb.addWidget(self.status_detail)
        prog.addLayout(pb,1)
        self.count_label=self.label('0','counter');prog.addWidget(self.count_label)
        middle=QVBoxLayout();middle.setSpacing(13);cv.addLayout(middle,1)
        result_panel=self.panel();middle.addWidget(result_panel,4)
        rv=QVBoxLayout(result_panel);rv.setContentsMargins(13,14,13,13);rv.setSpacing(10)
        self.results_title=self.label('','section');rv.addWidget(self.results_title)
        rh=QHBoxLayout()
        rh.addStretch()
        self.session_save_btn=self.button('',self.save_scan_session);rh.addWidget(self.session_save_btn)
        self.session_open_btn=self.button('',self.open_scan_session);rh.addWidget(self.session_open_btn)
        self.search=QLineEdit();self.search.setMinimumWidth(120)
        self.search.textChanged.connect(self.apply_filter);rh.addWidget(self.search);rv.addLayout(rh)
        self.table=QTableWidget(0,5);self.table.setAlternatingRowColors(True)
        self.table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.table.verticalHeader().setVisible(False)
        self.table.setShowGrid(False)
        self.table.horizontalHeader().setStretchLastSection(False)
        self.table.horizontalHeader().setSectionResizeMode(0,QHeaderView.ResizeMode.Stretch)
        self.table.setColumnWidth(1,170);self.table.setColumnWidth(2,94);self.table.setColumnWidth(3,95);self.table.setColumnWidth(4,116)
        self.table.itemSelectionChanged.connect(self.show_selection)
        self.table.setMinimumHeight(220);rv.addWidget(self.table,1)
        preview_panel=self.panel();preview_panel.setMinimumWidth(0);middle.addWidget(preview_panel,2)
        pv=QVBoxLayout(preview_panel);pv.setContentsMargins(14,14,14,14)
        self.preview_header=self.label('','section');pv.addWidget(self.preview_header)
        self.preview_image=QLabel();self.preview_image.setMinimumHeight(150)
        self.preview_image.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.preview_image.setStyleSheet('background:#0A1435;border:1px solid #3D5489;border-radius:12px;color:#B1C2E9;padding:12px')
        pv.addWidget(self.preview_image,3)
        self.file_detail=self.label('','muted');self.file_detail.setWordWrap(True)
        self.file_detail.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        pv.addWidget(self.file_detail,2)
        self.preview_note=self.label('','muted');self.preview_note.setWordWrap(True);pv.addWidget(self.preview_note)
        self.preview_btn=self.button('',self.preview_selected);pv.addWidget(self.preview_btn)
        bottom=QVBoxLayout();bottom.setSpacing(12);cv.addLayout(bottom)
        self.restore_btn=self.button('',self.recover_selected,'primary');bottom.addWidget(self.restore_btn,2)
        self.advisor_btn=self.button('',self.advise_selected);bottom.addWidget(self.advisor_btn)
        self.report_btn=self.button('',self.open_report);bottom.addWidget(self.report_btn)
        self.privacy=self.label('','muted');self.privacy.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.privacy.setWordWrap(True);cv.addWidget(self.privacy)
        self.setStyleSheet(QSS)
        shadow=QGraphicsDropShadowEffect(self.start_btn);shadow.setBlurRadius(25)
        shadow.setColor(QColor(157,80,255,120));shadow.setOffset(0,4);self.start_btn.setGraphicsEffect(shadow)
        self.set_busy(False)
    def retranslate(self):
        self.hero_title.setText(self.t('title'));self.hero_sub.setText(self.t('subtitle'))
        for b,sym,key in self.nav:b.setText(self.t(key))
        self.source_title.setText(self.t('source_title'))
        self.btn_volume.setText(' '+self.t('volume_card'))
        self.btn_volume.setToolTip(self.t('volume_help'))
        self.btn_image.setText(' '+self.t('image_card'))
        self.btn_folder.setText(' '+self.t('folder_card'))
        self.btn_device.setText(' '+self.t('physical_card'))
        if not self.source:self.source_text.setText(self.t('source_empty'))
        self.language.setText('RU / EN' if self.lang=='ru' else 'EN / RU')
        self.cat_title.setText(self.t('categories'))
        self.advanced_btn.setText('Параметры поиска / типы файлов' if self.lang=='ru' else 'Scan options / file types')
        for key,cb in self.checkboxes.items():cb.setText(self.t(key))
        self.scan_mode.setItemText(0,self.t('metadata_mode'))
        self.scan_mode.setItemText(1,self.t('carve_mode'))
        self.deep.setText(self.t('deep_mode'));self.mft.setText(self.t('mft_mode'))
        self.start_btn.setText(self.t('start'));self.stop_btn.setText(self.t('stop'))
        self.image_btn.setText(self.t('image_action'));self.raid_btn.setText(self.t('raid_action'))
        if not self.worker:self.status_label.setText(self.t('idle'));self.status_detail.setText(self.t('scan_sub'))
        self.results_title.setText(self.t('results'))
        self.search.setPlaceholderText(self.t('search'))
        for i,key in enumerate(['name','location','size','type','condition']):
            self.table.setHorizontalHeaderItem(i,QTableWidgetItem(self.t(key)))
        self.preview_header.setText(self.t('preview_title'))
        if not self.entries:self.preview_image.setText(self.t('preview_empty'))
        self.preview_note.setText(self.t('preview_note'))
        self.preview_btn.setText(self.t('preview'))
        self.restore_btn.setText(self.t('restore_selected'))
        self.advisor_btn.setText(self.t('advisor'))
        self.report_btn.setText(self.t('report_button'))
        self.session_save_btn.setText(self.t('save_session'));self.session_open_btn.setText(self.t('open_session'))
        self.privacy.setText(self.t('privacy'))
    def switch_language(self):
        self.lang='en' if self.lang=='ru' else 'ru'
        self.cfg.setValue('language',self.lang);self.retranslate()
    def set_busy(self,busy):
        for b in (self.start_btn,self.btn_volume,self.btn_image,self.btn_folder,self.btn_device,self.image_btn,
                  self.raid_btn):b.setEnabled(not busy)
        for b in (self.restore_btn,self.preview_btn,self.advisor_btn):
            b.setEnabled(not busy and self.session_snapshot is None)
        self.session_save_btn.setEnabled(not busy and self.scan_complete and self.session_snapshot is None)
        self.session_open_btn.setEnabled(not busy)
        self.stop_btn.setEnabled(busy)
        self.image_btn.setEnabled(not busy and not is_volume(self.source))
    def mode_changed(self):
        if self.mode in ('metadata','carve'):
            self.mode=self.scan_mode.currentData()
        elif self.mode in ('physical','physical-carve'):
            self.mode='physical' if self.scan_mode.currentIndex()==0 else 'physical-carve'
        elif self.mode in ('volume','volume-carve'):
            self.mode='volume' if self.scan_mode.currentIndex()==0 else 'volume-carve'
    def pick_volume(self):
        if self.worker:return
        drives=enumerate_volumes()
        if not drives:
            QMessageBox.information(self,self.t('volume_card'),self.t('no_volumes'));return
        choices=[f"{d['letter']}   {d['label'] or self.t('unnamed_volume')}   ·   {file_size(d['size'])}   ·   {d['fs']}" for d in drives]
        choice,ok=QInputDialog.getItem(self,self.t('volume_select'),self.t('volume_help'),choices,0,False)
        if not ok:return
        drive=drives[choices.index(choice)]
        if drive['fs'].upper() not in ('NTFS','EXFAT'):
            QMessageBox.information(self,self.t('volume_card'),self.t('unsupported_volume'));return
        self.invalidate_results()
        self.source=drive['path']
        self.mode='volume' if self.scan_mode.currentIndex()==0 else 'volume-carve'
        self.source_text.setText(''+choice+'\n'+self.t('volume_selected'))
        self.set_busy(False)
    def pick_image(self):
        if self.worker:return
        path,_=QFileDialog.getOpenFileName(self,self.t('choose_source'),'','Raw images (*.img *.dd *.bin *.raw);;All files (*)')
        if path:
            self.invalidate_results();self.source=path;self.mode=self.scan_mode.currentData();self.source_text.setText(''+path)
            self.set_busy(False)
    def pick_folder(self):
        if self.worker:return
        path=QFileDialog.getExistingDirectory(self,self.t('choose_source'))
        if path:
            self.invalidate_results();self.source=path;self.mode='folder';self.source_text.setText(''+path)
            self.set_busy(False)
    def pick_device(self):
        if self.worker:return
        drives=enumerate_drives()
        if not drives:
            QMessageBox.information(self,'Windows HDD/USB','Physical Windows devices are not available, or access is denied.');return
        choices=[f"{d['path']}   ·   {file_size(d['size'])}" for d in drives]
        choice,ok=QInputDialog.getItem(self,self.t('device_select'),self.t('choose_source'),choices,0,False)
        if ok:
            if QMessageBox.warning(self,'READ ONLY',self.t('confirm_physical'),QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
            i=choices.index(choice);self.invalidate_results();self.source=drives[i]['path'];self.mode='physical' if self.scan_mode.currentIndex()==0 else 'physical-carve'
            self.source_text.setText(''+choice)
            self.set_busy(False)
    def current_categories(self):
        return normalize_categories(k for k,c in self.checkboxes.items() if c.isChecked())
    def launch(self,kind,kwargs):
        if self.worker:return
        self.worker=Job(kind,kwargs,self);self.worker.message.connect(self.handle_job)
        self.worker.finished.connect(self.job_finished)
        self.set_busy(True);self.progress.setRange(0,100);self.progress.setValue(0)
        self.status_detail.setText(self.t('working'))
        self.worker.start()
    def job_finished(self):
        old=self.worker;self.worker=None;self.set_busy(False)
        if old:old.deleteLater()
    def cancel(self):
        if self.worker:self.worker.stop.set()
    def scan(self):
        if self.worker:return
        try:
            validate_source(self.source,self.mode)
            categories=self.current_categories()
            if not categories:raise ValueError(self.t('no_categories'))
            if self.mode in ('carve','physical-carve','volume-carve') and not categories.intersection({'Photos','Documents','Archives'}):
                raise ValueError('Signature carving supports JPG/PNG/PDF/ZIP only')
        except Exception as exc:
            QMessageBox.warning(self,self.t('error'),str(exc));return
        if is_volume(self.source):
            if QMessageBox.warning(self,self.t('volume_card'),self.t('live_volume_warning'),
                    QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No,
                    QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
        self.invalidate_results()
        self.status_label.setText(self.t('scanning'))
        self.launch('scan',{'source':self.source,'mode':self.mode,'categories':categories,'deep':self.deep.isChecked(),'mft':self.mft.isChecked()})
    def handle_job(self,key,obj):
        if key=='progress':
            self.progress.setRange(0,100);self.progress.setValue(max(0,min(100,int(obj))))
        elif key=='found':
            self.entries.append(obj)
            row=len(self.entries)-1;self.table.insertRow(row)
            if isinstance(obj,Candidate):
                name=obj.name;path=obj.path;kind=obj.kind;state=obj.state;size=obj.size
            else:
                name=Path(obj.label).name;path=obj.label;kind=obj.kind;state='candidate';size=obj.size
            values=[name,path,file_size(size),self.t(kind),state]
            for col,value in enumerate(values):
                cell=QTableWidgetItem(value)
                if col==0:
                    cell.setFlags(cell.flags()|Qt.ItemFlag.ItemIsUserCheckable)
                    cell.setCheckState(Qt.CheckState.Unchecked)
                if col==4:cell.setForeground(QColor(recommendation_color(state)))
                self.table.setItem(row,col,cell)
            self.count_label.setText(str(len(self.entries)))
            if len(self.entries)%100==0:self.status_detail.setText(self.t('found')+': '+str(len(self.entries)))
        elif key=='scan_done':
            self.scan_complete=not bool(obj['cancelled'])
            self.scan_total=int(obj['found']);self.scan_errors=list(obj.get('errors',[]))
            self.set_busy(False if not self.worker else True)
            extra=(' · '.join(obj.get('errors',[])[:2]))
            self.status_label.setText(self.t('scan_finished'))
            self.status_detail.setText(f"{self.t('found')}: {obj['found']}  |  {self.table.rowCount()} visible"+(' · '+extra if extra else ''))
            self.progress.setValue(100 if not obj['cancelled'] else self.progress.value())
        elif key=='image_progress':
            done,total,bad=obj;self.progress.setValue(int(100*done/max(1,total)))
            self.status_detail.setText(f'{file_size(done)} / {file_size(total)} · unreadable: {file_size(bad)}')
        elif key=='image_done':
            self.invalidate_results();self.source=obj['path'];self.mode='metadata';self.source_text.setText(''+self.source)
            self.status_label.setText(self.t('complete'));self.status_detail.setText('SHA-256: '+obj['sha256_image'][:22]+'…')
            QMessageBox.information(self,self.t('complete'),f"{obj['path']}\nSHA-256: {obj['sha256_image']}\nUnreadable bytes: {obj['unreadable_bytes']}")
        elif key=='recover_done':
            self.last_report=obj['report'];self.status_label.setText(self.t('recovery_finished'))
            self.status_detail.setText(f"{obj['saved']} saved · {len(obj['errors'])} errors · {obj['report']}")
            QMessageBox.information(self,self.t('complete'),self.status_detail.text())
        elif key=='preview_done':
            px=QPixmap();px.loadFromData(obj,'PNG')
            self.preview_image.setText('');self.preview_image.setPixmap(px.scaled(330,235,Qt.AspectRatioMode.KeepAspectRatio,Qt.TransformationMode.SmoothTransformation))
        elif key=='wallet_done':
            findings,stats=obj;self.wallet_results(findings,stats)
        elif key=='md_extract_done':
            self.status_label.setText(self.t('complete'))
            self.status_detail.setText(obj['output']+' · SHA-256: '+obj['sha256'][:20]+'…')
            QMessageBox.information(self,self.t('complete'),obj['output']+'\nSHA-256: '+obj['sha256'])
        elif key=='raid_done':
            self.status_label.setText(self.t('complete'))
            out=obj['output'];self.invalidate_results();self.source=out;self.mode='metadata';self.source_text.setText(''+out)
            self.status_detail.setText(out);QMessageBox.information(self,self.t('complete'),out)
        elif key=='paused':
            self.status_label.setText(self.t('idle'));self.status_detail.setText('Stopped: '+str(obj))
        elif key=='failed':
            self.status_label.setText(self.t('error'));self.status_detail.setText(str(obj));QMessageBox.warning(self,self.t('error'),str(obj))
    def invalidate_results(self):
        """A new source invalidates ALL earlier candidates and any imported view-only summary."""
        self.session_snapshot=None;self.scan_complete=False;self.scan_total=0;self.scan_errors=[]
        self.entries.clear();self.table.setRowCount(0)
        self.search.clear();self.count_label.setText('0')
        self.preview_image.setPixmap(QPixmap());self.preview_image.setText(self.t('preview_empty'))
        self.file_detail.setText('')
        if not self.worker:self.set_busy(False)

    def save_scan_session(self):
        if self.worker or self.session_snapshot is not None or not self.scan_complete:return
        filename,_=QFileDialog.getSaveFileName(self,self.t('save_session'),
            'MURDILIMAX-scan-'+datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')+'.mrd-session.json',
            'MURDILIMAX sessions (*.mrd-session.json);;JSON files (*.json)')
        if not filename:return
        try:
            doc=make_session(source=self.source,mode=self.mode,entries=self.entries,
                total=self.scan_total,scan_errors=self.scan_errors)
            store_view_session(filename,doc)
        except (OSError,ValueError) as exc:
            QMessageBox.warning(self,self.t('error'),str(exc));return
        QMessageBox.information(self,self.t('complete'),self.t('session_saved')+'\n\n'+self.t('session_sensitive'))

    def open_scan_session(self):
        if self.worker:return
        filename,_=QFileDialog.getOpenFileName(self,self.t('open_session'),'','MURDILIMAX sessions (*.mrd-session.json);;JSON files (*.json)')
        if not filename:return
        try:
            doc=load_view_session(filename)
        except (OSError,ValueError) as exc:
            QMessageBox.warning(self,self.t('error'),str(exc));return
        self.invalidate_results()
        self.source=''# Never allow recovery/preview from an untrusted cached scan.
        self.session_snapshot=doc
        self.source_text.setText(self.t('session_view')+' · '+doc['source'])
        for row,record in enumerate(doc['entries']):
            self.table.insertRow(row)
            for col,value in enumerate((record['name'],record['path'],file_size(record['size']),
                                        self.t(record['category']),record['state'])):
                cell=QTableWidgetItem(str(value))
                if col==4:cell.setForeground(QColor(recommendation_color(record['state'])))
                self.table.setItem(row,col,cell)
        self.count_label.setText(str(doc['total_found']))
        self.status_label.setText(self.t('session_view'))
        msg=self.t('session_rescan')
        if doc['truncated']:msg+=' · '+str(len(doc['entries']))+' / '+str(doc['total_found'])
        self.status_detail.setText(msg)
        self.set_busy(False)
        QMessageBox.information(self,self.t('session_view'),self.t('session_rescan'))

    def apply_filter(self,text):
        q=text.casefold().strip()
        if self.session_snapshot is not None:
            for row,record in enumerate(self.session_snapshot['entries']):
                self.table.setRowHidden(row,q not in record['path'].casefold())
            return
        for row,item in enumerate(self.entries):
            path=item.path if isinstance(item,Candidate) else item.label
            self.table.setRowHidden(row,q not in path.casefold())
    def show_selection(self):
        rows=self.table.selectionModel().selectedRows() if self.table.selectionModel() else []
        if not rows:return
        row=rows[0].row()
        if self.session_snapshot is not None:
            records=self.session_snapshot['entries']
            if row>=len(records):return
            record=records[row]
            self.preview_image.setPixmap(QPixmap());self.preview_image.setText(self.t('session_view'))
            self.file_detail.setText(record['path']+'\n'+file_size(record['size'])+' · '+record['state']+'\n\n'+self.t('session_rescan'))
            return
        if row>=len(self.entries):return
        item=self.entries[row]
        self.preview_image.setPixmap(QPixmap());self.preview_image.setText(self.t('preview_empty'))
        name=item.path if isinstance(item,Candidate) else item.label
        size=item.size;state=item.state if isinstance(item,Candidate) else 'candidate'
        self.file_detail.setText(f'{name}\n\n{self.t("size")}: {file_size(size)}\n{self.t("condition")}: {state}\n'+(item.reason if isinstance(item,Candidate) else ''))
    def checked(self):
        return selected_items((self.table.item(i,0).checkState()==Qt.CheckState.Checked,self.entries[i])
            for i in range(len(self.entries)) if self.table.item(i,0))
    def recover_selected(self):
        if self.worker:return
        if self.session_snapshot is not None:
            QMessageBox.information(self,self.t('session_view'),self.t('session_rescan'));return
        items=self.checked()
        if not items:QMessageBox.information(self,self.t('restore'),self.t('no_file'));return
        dest=QFileDialog.getExistingDirectory(self,self.t('choose_output'))
        if not dest:return
        try:safe_destination(self.source,dest,self.mode)
        except ValueError as exc:QMessageBox.warning(self,self.t('error'),str(exc));return
        if any(isinstance(item,Candidate) and item.state=='unknown' for item in items):
            if QMessageBox.warning(self,'Allocation unknown',self.t('confirm_unknown'),QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
        self.status_label.setText(self.t('recovering'))
        self.launch('recover',{'items':items,'destination':dest,'source':self.source})
    def preview_selected(self):
        if self.worker:return
        if self.session_snapshot is not None:
            QMessageBox.information(self,self.t('session_view'),self.t('session_rescan'));return
        rows=self.table.selectionModel().selectedRows() if self.table.selectionModel() else []
        if len(rows)!=1:
            QMessageBox.information(self,self.t('preview'),self.t('no_preview'));return
        item=self.entries[rows[0].row()]
        name=item.name if isinstance(item,Candidate) else item.label
        if not supported_preview(name) or (isinstance(item,Hit) and (self.mode!='folder' or item.carved)):
            QMessageBox.information(self,self.t('preview'),self.t('no_preview'));return
        self.launch('preview',{'source':self.source,'mode':self.mode,'item':item})
    def advise_selected(self):
        if self.session_snapshot is not None:
            QMessageBox.information(self,self.t('session_view'),self.t('session_rescan'));return
        rows=self.table.selectionModel().selectedRows() if self.table.selectionModel() else []
        if len(rows)!=1:
            QMessageBox.information(self,self.t('advisor'),self.t('no_file'));return
        item=self.entries[rows[0].row()]
        state=item.state if isinstance(item,Candidate) else 'unknown'
        notes=[]
        if is_physical(self.source):
            notes.append('⚠ Физический HDD/USB: предпочтительно сначала снять образ. / Prefer imaging a physical disk first.')
        if state=='unknown':notes.append('⚠ Неизвестное состояние секторов. Проверьте предпросмотр и целостность извлечённого файла.')
        elif state in ('reallocated','allocated','occupied','overwritten'):
            notes.append('⛔ Кластеры могли быть перезаписаны. Не доверяйте содержимому без проверки.')
        else:notes.append('✓ Метаданные доступны, но это не гарантия целостности файла.')
        if (item.kind if isinstance(item,Candidate) else item.kind)=='Crypto backups':
            notes.append('🔒 Никогда не отправляйте seed-фразы и ключи на сторонние сайты.')
        notes.append('✓ Восстанавливайте только на другой физический носитель.')
        QMessageBox.information(self,self.t('advisor'),self.t('local_advice')+'\n\n'+'\n'.join(notes))
    def make_image(self):
        if is_volume(self.source):
            QMessageBox.information(self,self.t('image_action'),self.t('volume_image_help'));return
        if self.worker:return
        if self.mode=='folder' or not self.source:
            QMessageBox.warning(self,self.t('error'),self.t('no_source'));return
        if is_physical(self.source):
            if QMessageBox.warning(self,'READ ONLY',self.t('confirm_physical'),QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
        dest,_=QFileDialog.getSaveFileName(self,self.t('choose_image_output'),'','Raw disk image (*.img);;All files (*)')
        if not dest:return
        if is_physical(self.source) and Path(dest+'.mrd-state.json').exists():
            QMessageBox.warning(self,self.t('error'),'Cannot resume physical device in this UI without explicit hardware identity confirmation. Use the original verified imaging tool.');return
        self.status_label.setText(self.t('imaging'))
        self.launch('image',{'source':self.source,'destination':dest})
    def wallet_finder(self):
        if self.worker:return
        folder=self.source if self.mode=='folder' and Path(self.source).is_dir() else QFileDialog.getExistingDirectory(self,self.t('wallet_title'))
        if not folder:return
        QMessageBox.information(self,self.t('wallet_title'),self.t('wallet_warning'))
        self.launch('wallet',{'source':folder})
    def wallet_results(self,findings,stats):
        dialog=QDialog(self);dialog.setWindowTitle(self.t('wallet_title'));dialog.resize(800,520)
        l=QVBoxLayout(dialog);l.addWidget(self.label(self.t('wallet_warning')))
        l.addWidget(self.label(f"{stats['matches']} candidates · {stats['visited']} filenames"))
        table=QTableWidget(len(findings),3);table.setHorizontalHeaderLabels([self.t('name'),self.t('type'),self.t('size')])
        table.horizontalHeader().setSectionResizeMode(0,QHeaderView.ResizeMode.Stretch)
        for i,f in enumerate(findings):
            for j,value in enumerate((f.relative_path,f.label,file_size(f.size_bytes))):table.setItem(i,j,QTableWidgetItem(value))
        l.addWidget(table);b=self.button(self.t('ok'),dialog.accept);l.addWidget(b);dialog.exec()
    def raid_builder(self):
        if self.worker:return
        d=QDialog(self);d.setWindowTitle('RAID IMAGE BUILDER · '+VERSION);d.resize(780,540)
        l=QVBoxLayout(d);note=QLabel(self.t('raid_help'));note.setWordWrap(True);l.addWidget(note)
        bar=QHBoxLayout();bar.addWidget(self.label('RAID'))
        level=QComboBox();level.addItems(['0','1','5','6','10']);level.setCurrentText('5');bar.addWidget(level)
        bar.addWidget(self.label('Chunk KiB'))
        chunk=QComboBox();chunk.addItems(['4','8','16','32','64','128','256','512','1024']);chunk.setCurrentText('64');bar.addWidget(chunk)
        bar.addWidget(self.label('Layout'))
        layout=QComboBox();bar.addWidget(layout)
        l.addLayout(bar)
        def set_layout():
            lay=list(RAID5_LAYOUTS) if level.currentText()=='5' else (['fixed-pq-last'] if level.currentText()=='6' else ['near-2'] if level.currentText()=='10' else ['default'])
            layout.clear();layout.addItems(lay)
        level.currentTextChanged.connect(set_layout);set_layout()
        verify=QCheckBox('Verify parity / mirrors');verify.setChecked(True);l.addWidget(verify)
        label=QLabel(self.t('raid_members'));label.setWordWrap(True);l.addWidget(label)
        paths=QPlainTextEdit();l.addWidget(paths,1)
        add=self.button(self.t('add_member'),lambda:None)
        def select_member():
            filename,_=QFileDialog.getOpenFileName(d,self.t('add_member'))
            if filename:paths.appendPlainText(filename)
        add.clicked.disconnect();add.clicked.connect(select_member);l.addWidget(add)
        md_row=QHBoxLayout()
        def md_members():
            return [v.strip() for v in paths.toPlainText().splitlines() if v.strip() and v.strip()!='-']
        def inspect_md():
            members=md_members()
            if not members:
                QMessageBox.warning(d,self.t('error'),'Add Linux MD v1.2 member images first.');return
            try:
                details=inspect_md_set(members)
                lines=[f"UUID: {details['array_uuid']}",f"RAID: {details['level']}",
                       f"Chunk: {details['chunk_bytes']} bytes",f"Expected members: {details['expected_members']}"]
                for row in details['members']:
                    lines.append(f"{Path(row['path']).name}: role={row['role']} offset={row['data_offset_bytes']} bytes")
                lines.append('\\nREAD ONLY: this does not confirm member order or layout.')
                QMessageBox.information(d,'Linux MD 1.2 — READ ONLY','\\n'.join(lines))
            except Exception as exc:QMessageBox.warning(d,self.t('error'),str(exc))
        md_check=self.button('Linux MD 1.2 · '+('Проверить' if self.lang=='ru' else 'Inspect'),inspect_md)
        md_row.addWidget(md_check)
        def export_md():
            members=md_members()
            if len(members)!=1:
                QMessageBox.warning(d,self.t('error'),'Enter exactly one Linux MD member to export its data section.');return
            try: inspect_md_set(members)
            except Exception as exc:QMessageBox.warning(d,self.t('error'),str(exc));return
            dest,_=QFileDialog.getSaveFileName(d,self.t('choose_image_output'),'','Raw disk image (*.img)')
            if not dest:return
            if Path(dest).exists():
                QMessageBox.warning(d,self.t('error'),'Destination already exists.');return
            d.accept();self.status_label.setText('Linux MD 1.2 · data export')
            self.launch('md_extract',{'source':members[0],'destination':dest})
        md_export=self.button('⇣  '+('Извлечь данные MD' if self.lang=='ru' else 'Extract MD data'),export_md)
        md_row.addWidget(md_export)
        l.addLayout(md_row)
        do=self.button(self.t('build_raid'),lambda:None,'primary')
        def submit():
            names=[s.strip() for s in paths.toPlainText().splitlines() if s.strip()]
            if len(names)<2:
                QMessageBox.warning(d,self.t('error'),'Select at least two members; use - for missing.');return
            members=[None if v=='-' else v for v in names]
            dest,_=QFileDialog.getSaveFileName(d,self.t('choose_image_output'),'','Raw disk image (*.img)')
            if not dest:return
            d.accept()
            self.status_label.setText('RAID reconstruction (experimental)')
            self.launch('raid',{'members':members,'destination':dest,'level':int(level.currentText()),
                'chunk':int(chunk.currentText())*1024,'layout':layout.currentText(),'verify':verify.isChecked()})
        do.clicked.disconnect();do.clicked.connect(submit);l.addWidget(do);d.exec()
    def open_report(self):
        if not self.last_report:
            QMessageBox.information(self,self.t('reports'),self.t('no_report'));return
        from PySide6.QtGui import QDesktopServices
        from PySide6.QtCore import QUrl
        QDesktopServices.openUrl(QUrl.fromLocalFile(self.last_report))
    def open_settings(self):
        d=QDialog(self);d.setWindowTitle(self.t('settings_title'))
        v=QVBoxLayout(d);v.addWidget(self.label(self.t('language')))
        lang=QComboBox();lang.addItems(['Русский','English']);lang.setCurrentIndex(0 if self.lang=='ru' else 1)
        v.addWidget(lang);anim=QCheckBox(self.t('motion'));anim.setChecked(self.motion);v.addWidget(anim)
        def save():
            self.lang='ru' if lang.currentIndex()==0 else 'en';self.motion=anim.isChecked()
            self.hero.animated=self.motion
            self.cfg.setValue('language',self.lang);self.cfg.setValue('motion','true' if self.motion else 'false')
            self.retranslate();d.accept()
        v.addWidget(self.button(self.t('ok'),save,'primary'));d.exec()
    def closeEvent(self,event):
        if self.worker and self.worker.isRunning():
            QMessageBox.warning(self,self.t('working'),self.t('confirm_reset'))
            event.ignore();return
        event.accept()


def main():
    capture=None
    launch_args=sys.argv[:]
    if '--capture-ui' in launch_args:
        pos=launch_args.index('--capture-ui')
        if pos+1 >= len(launch_args):raise ValueError('Missing screenshot output path')
        capture=Path(launch_args[pos+1]);del launch_args[pos:pos+2]
    launch_args=[arg for arg in launch_args if arg!='--smoke-test']
    app=QApplication(launch_args)
    app.setApplicationName('MURDILIMAX Recovery')
    app.setOrganizationName('MURDILIMAX')
    app.setStyle('Fusion')
    # Use only a verified installed typeface: Qt QSS does not support browser CSS font stacks.
    app.setFont(select_cyrillic_font())
    validate_cyrillic_font(app.font())
    w=CrystalWindow();w.hero.animated=w.motion
    if '--smoke-test' in sys.argv:
        assert w.table.rowCount()==0 and not w.stop_btn.isEnabled()
        w.lang='ru';w.retranslate();assert 'Восстановление' in w.hero_title.text()
        w.switch_language();assert 'Data recovery' in w.hero_title.text()
        w.close();return 0
    w.show()
    if capture is not None:
        w.resize(int(os.environ.get('MRD_CAPTURE_WIDTH','1180')),700)
        # Genuine EMPTY Qt app screenshot, no fabricated recovered files.
        app.processEvents()
        ok=w.grab().save(str(capture),'PNG')
        w.close()
        if not ok:raise IOError('Could not capture the Qt interface')
        return 0
    return app.exec()

if __name__=='__main__':raise SystemExit(main())
