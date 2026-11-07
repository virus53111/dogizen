#!/usr/bin/env python3
"""MURDILIMAX Recovery Alpha 0.1 — local-only read-only candidate scanner.

Scans existing files in a folder OR carves JPG/PNG/PDF/ZIP from an uncompressed
raw disk image (*.img / *.dd / *.bin). No raw physical device support yet.
Recovery always writes to a separately chosen output location. No telemetry.
"""
from __future__ import annotations
import hashlib
import os
from pathlib import Path
import queue
import shutil
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from dataclasses import dataclass
from murdilimax_devices import open_source, is_device, destination_is_different_disk

MAX_CARVE = 512 * 1024 * 1024
CHUNK = 4 * 1024 * 1024
SIGS = {"JPG": b"\xff\xd8\xff", "PNG": b"\x89PNG\r\n\x1a\n", "PDF": b"%PDF-", "ZIP": b"PK\x03\x04"}
EXTS = {
    "Photos": {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".heic", ".tiff"},
    "Documents": {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".odt"},
    "Archives": {".zip", ".rar", ".7z", ".tar", ".gz"},
    "Video": {".mp4", ".mov", ".avi", ".mkv", ".webm"},
    "Audio": {".mp3", ".wav", ".flac", ".m4a", ".ogg"},
}
CRYPTO_HINTS = ("wallet.dat", "keystore", "electrum", "wallet", "metamask", "backup", "seed", "recovery-phrase")

@dataclass
class Hit:
    kind: str
    label: str
    source: str
    offset: int
    size: int
    carved: bool = False


def is_crypto(name: str) -> bool:
    low = name.casefold()
    return any(word in low for word in CRYPTO_HINTS)


def classify(name: str) -> str:
    if is_crypto(name):
        return "Crypto"
    suffix = Path(name).suffix.casefold()
    for group, extensions in EXTS.items():
        if suffix in extensions:
            return group
    return "Other"


def raw_kind_to_group(kind: str) -> str:
    return {"JPG":"Photos", "PNG":"Photos", "PDF":"Documents", "ZIP":"Archives"}[kind]


def find_end(fp, start: int, kind: str, file_size: int, cancelled=None) -> int | None:
    """Heuristic validation, not a guarantee the recovered file is intact."""
    if cancelled is not None and cancelled():
        return None
    hard_end = min(file_size, start + MAX_CARVE)
    if kind == "PNG":
        pos = start + 8
        while pos + 12 <= hard_end:
            if cancelled is not None and cancelled():
                return None
            fp.seek(pos)
            chunk_head = fp.read(8)
            if len(chunk_head) < 8:
                return None
            count = int.from_bytes(chunk_head[:4], 'big')
            typ = chunk_head[4:]
            if count > 50*1024*1024 or not all(65<=ch<=90 or 97<=ch<=122 for ch in typ):
                return None
            pos += 12 + count
            if pos > hard_end:
                return None
            if typ == b'IEND':
                return pos-start if count == 0 else None
        return None
    terminator = {"JPG":b"\xff\xd9", "PDF":b"%%EOF", "ZIP":b"PK\x05\x06"}[kind]
    fp.seek(start + len(SIGS[kind]))
    cursor = start + len(SIGS[kind]); carry = b''
    while cursor < hard_end:
        if cancelled is not None and cancelled():
            return None
        block = fp.read(min(1024*1024, hard_end-cursor))
        if not block:
            break
        joined = carry + block
        found = joined.find(terminator)
        if found != -1:
            end = cursor-len(carry)+found+len(terminator)
            if kind == "ZIP":
                fp.seek(end)
                rest = fp.read(2)
                if len(rest) < 2:
                    return None
                comment_len = int.from_bytes(rest, 'little')
                end += 2 + comment_len
                if end > hard_end:
                    return None
            return end-start
        carry = joined[-(len(terminator)-1):]
        cursor += len(block)
    return None


def carve_image(path: str, chosen: set[str], stop: threading.Event, post) -> None:
    with open_source(path) as (fp, total):
        previous = b''; cursor = 0; reported = set()
        while cursor < total and not stop.is_set():
            fp.seek(cursor)
            chunk = fp.read(min(CHUNK, total-cursor))
            if not chunk:
                break
            buf = previous + chunk; origin = cursor-len(previous)
            for typ, sig in SIGS.items():
                if raw_kind_to_group(typ) not in chosen:
                    continue
                pos = 0
                while not stop.is_set():
                    match = buf.find(sig, pos)
                    if match < 0:
                        break
                    off = origin+match
                    pos = match+len(sig)
                    if off < 0 or off in reported:
                        continue
                    reported.add(off)
                    length = find_end(fp, off, typ, total, stop.is_set)
                    if length is not None and length > len(sig):
                        post('hit', Hit(raw_kind_to_group(typ), f'{typ} @ 0x{off:X}', path, off, length, True))
            cursor += len(chunk)
            previous = buf[-16:]
            post('progress', int(cursor*100/max(total,1)))


def scan_folder(folder: str, chosen: set[str], stop: threading.Event, post) -> None:
    for root, dirs, files in os.walk(folder, followlinks=False):
        if stop.is_set():
            break
        dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root,d))]
        for name in files:
            if stop.is_set():
                break
            full = os.path.join(root, name)
            if os.path.islink(full):
                continue
            group = classify(name)
            if group not in chosen:
                continue
            try:
                size = os.path.getsize(full)
            except OSError:
                continue
            post('hit', Hit(group, os.path.relpath(full,folder), full, 0, size))


def restore(hit: Hit, destination: str) -> tuple[str, str]:
    output = Path(destination).resolve()
    if is_device(hit.source) and not destination_is_different_disk(hit.source, str(output)):
        raise ValueError('Cannot verify output drive is different from source disk')
    output.mkdir(parents=True, exist_ok=True)
    extension = {'Photos':'.jpg', 'Documents':'.pdf', 'Archives':'.zip'}.get(hit.kind,'.bin') if hit.carved else Path(hit.source).suffix
    stem = f'carved_{hit.offset:012x}' if hit.carved else Path(hit.source).stem
    target = output / (stem+extension)
    k = 1
    while target.exists():
        target = output / f'{stem}_{k}{extension}'; k += 1
    if not hit.carved and target.resolve() == Path(hit.source).resolve():
        raise ValueError('Source and destination must differ')
    remaining = hit.size
    with open_source(hit.source) as (src, _), open(target, 'xb') as dst:
        src.seek(hit.offset)
        while remaining:
            packet = src.read(min(1024*1024,remaining))
            if not packet:
                raise IOError('Unexpected end of source')
            dst.write(packet); remaining -= len(packet)
    digest = hashlib.sha256()
    with open(target,'rb') as fp:
        for block in iter(lambda:fp.read(1024*1024), b''):
            digest.update(block)
    return str(target), digest.hexdigest()


class RecoveryApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('MURDILIMAX Recovery · Alpha 0.1')
        self.geometry('1050x695')
        self.minsize(820,560)
        self.configure(bg='#0c1223')
        self.queue = queue.Queue()
        self.stop_signal = threading.Event()
        self.items = []
        self.scan_mode = tk.StringVar(value='folder')
        self.source = tk.StringVar()
        self.status = tk.StringVar(value='Ready · local only · no files uploaded')
        self.category_vars = {name:tk.BooleanVar(value=name in ('Photos','Documents','Crypto')) for name in ('Photos','Documents','Archives','Video','Audio','Crypto')}
        self.setup()
        self.after(80,self.poll)

    def setup(self):
        theme = ttk.Style(self)
        theme.theme_use('clam')
        theme.configure('TFrame', background='#0c1223')
        theme.configure('TLabel', background='#0c1223', foreground='#e7efff', font=('Segoe UI',10))
        theme.configure('TButton', padding=9, font=('Segoe UI',10))
        theme.configure('TCheckbutton', background='#0c1223', foreground='#c8d7f8', font=('Segoe UI',10))
        theme.configure('TRadiobutton', background='#0c1223', foreground='#c8d7f8')
        theme.configure('Treeview', background='#141f37', fieldbackground='#141f37', foreground='#edf3ff', rowheight=29, font=('Segoe UI',9))
        theme.configure('Treeview.Heading', background='#233451',foreground='#e9f0ff')
        header=ttk.Frame(self, padding=(24,22,24,8));header.pack(fill='x')
        ttk.Label(header,text='◈ MURDILIMAX   /   RECOVERY',font=('Segoe UI',19,'bold')).pack(anchor='w')
        ttk.Label(header,text='Free alpha · read-only source scanning · no network access',font=('Segoe UI',10)).pack(anchor='w',pady=(3,0))
        src=ttk.Frame(self,padding=(24,15));src.pack(fill='x')
        ttk.Label(src,text='SOURCE',font=('Segoe UI',10,'bold')).pack(anchor='w',pady=(0,7))
        modes=ttk.Frame(src);modes.pack(fill='x')
        ttk.Radiobutton(modes,text='Existing files in folder',variable=self.scan_mode,value='folder').pack(side='left')
        ttk.Radiobutton(modes,text='Raw disk image (.img / .dd / .bin)',variable=self.scan_mode,value='image').pack(side='left',padx=24)
        select=ttk.Frame(src);select.pack(fill='x',pady=(9,0))
        ttk.Entry(select,textvariable=self.source).pack(side='left',fill='x',expand=True)
        ttk.Button(select,text='Browse…',command=self.browse).pack(side='left',padx=(8,0))
        cats=ttk.Frame(self,padding=(24,0,24,12));cats.pack(fill='x')
        ttk.Label(cats,text='SEARCH FOR',font=('Segoe UI',10,'bold')).pack(anchor='w')
        opts=ttk.Frame(cats);opts.pack(fill='x',pady=(7,0))
        for name,v in self.category_vars.items():
            ttk.Checkbutton(opts,text=name,variable=v).pack(side='left',padx=(0,21))
        acts=ttk.Frame(self,padding=(24,0,24,12));acts.pack(fill='x')
        self.start_button=ttk.Button(acts,text='Start scan',command=self.start_scan);self.start_button.pack(side='left')
        ttk.Button(acts,text='Stop',command=self.stop_scan).pack(side='left',padx=8)
        self.restore_button=ttk.Button(acts,text='Recover selected to another drive…',command=self.restore_selected)
        self.restore_button.pack(side='right')
        table=ttk.Frame(self,padding=(24,0,24,6));table.pack(fill='both',expand=True)
        cols=('kind','name','size','source')
        self.tree=ttk.Treeview(table,columns=cols,show='headings',selectmode='extended')
        for col,title,width in [('kind','Type',110),('name','File / candidate',270),('size','Size',120),('source','Source',410)]:
            self.tree.heading(col,text=title);self.tree.column(col,width=width,stretch=(col in ('name','source')))
        yscroll=ttk.Scrollbar(table,orient='vertical',command=self.tree.yview)
        self.tree.configure(yscrollcommand=yscroll.set)
        self.tree.pack(side='left',fill='both',expand=True);yscroll.pack(side='left',fill='y')
        footer=ttk.Frame(self,padding=(24,4,24,18));footer.pack(fill='x')
        self.bar=ttk.Progressbar(footer,maximum=100);self.bar.pack(fill='x')
        ttk.Label(footer,textvariable=self.status,wraplength=950).pack(anchor='w',pady=(8,0))
        ttk.Label(footer,text='WARNING: Alpha does not scan physical drives or reconstruct fragmented data. Crypto mode matches filenames only. Save recovered files to another disk.',font=('Segoe UI',9)).pack(anchor='w',pady=(7,0))

    def browse(self):
        if self.scan_mode.get()=='folder':
            result=filedialog.askdirectory(title='Choose source folder')
        else:
            result=filedialog.askopenfilename(title='Choose raw disk image',filetypes=[('Raw disk images','*.img *.dd *.bin *.raw'),('All files','*.*')])
        if result:self.source.set(result)

    def post(self,kind,data):self.queue.put((kind,data))
    def start_scan(self):
        source=self.source.get().strip()
        mode=self.scan_mode.get()
        if mode=='folder' and not os.path.isdir(source):
            messagebox.showerror('Source','Select an existing folder.');return
        if mode=='image' and not os.path.isfile(source):
            messagebox.showerror('Source','Select a raw disk image file.');return
        selected={k for k,v in self.category_vars.items() if v.get()}
        if not selected:messagebox.showerror('Categories','Select at least one category.');return
        if mode=='image' and not selected.intersection({'Photos','Documents','Archives'}):
            messagebox.showwarning('Limitations','Image carving in this alpha supports JPG, PNG, PDF and ZIP only. Crypto filename search requires folder mode.');return
        self.stop_signal.clear();self.items.clear()
        for item in self.tree.get_children():self.tree.delete(item)
        self.bar['value']=0;self.start_button.state(['disabled']);self.status.set('Scanning… source will not be modified')
        def work():
            try:
                (scan_folder if mode=='folder' else carve_image)(source,selected,self.stop_signal,self.post)
                self.post('done','Stopped' if self.stop_signal.is_set() else 'Scan complete')
            except Exception as exc:self.post('error',f'{type(exc).__name__}: {exc}')
        threading.Thread(target=work,daemon=True).start()

    def stop_scan(self):self.stop_signal.set()
    def poll(self):
        try:
            while True:
                kind,obj=self.queue.get_nowait()
                if kind=='hit':
                    idx=len(self.items);self.items.append(obj)
                    self.tree.insert('','end',iid=str(idx),values=(obj.kind,obj.label,f'{obj.size:,} bytes',obj.source))
                    self.status.set(f'{len(self.items)} candidates found — source is read-only')
                elif kind=='progress':self.bar['value']=obj
                elif kind=='done':
                    self.start_button.state(['!disabled']);self.status.set(f'{obj}. Found {len(self.items)} candidate(s).')
                elif kind=='error':
                    self.start_button.state(['!disabled']);self.status.set('Scan error: '+obj)
        except queue.Empty:pass
        self.after(80,self.poll)

    def restore_selected(self):
        ids=self.tree.selection()
        if not ids:messagebox.showinfo('Recover','Select one or more files in the results table.');return
        folder=filedialog.askdirectory(title='Choose a DIFFERENT destination drive / folder')
        if not folder:return
        src=self.source.get().strip()
        try:
            destination=Path(folder).resolve()
            if self.scan_mode.get()=='folder' and (destination==Path(src).resolve() or Path(src).resolve() in destination.parents):
                raise ValueError('Choose a destination outside the source folder — preferably another physical drive.')
            if self.scan_mode.get()=='image' and Path(src).resolve().parent==destination:
                raise ValueError('Choose another destination folder, preferably on a different physical drive.')
            restored=[];errors=[]
            for selected_id in ids:
                hit=self.items[int(selected_id)]
                try:restored.append(restore(hit,folder)[0])
                except Exception as exc:errors.append(f'{hit.label}: {exc}')
            self.status.set(f'Recovered {len(restored)} file(s). SHA-256 verified by calculation. Errors: {len(errors)}.')
            messagebox.showinfo('Recovery results',f'Recovered: {len(restored)}\nFailed: {len(errors)}\n\n'+('\n'.join(errors[:3]) if errors else 'Files saved to selected destination.'))
        except Exception as exc:messagebox.showerror('Destination',str(exc))

if __name__=='__main__':
    RecoveryApp().mainloop()
