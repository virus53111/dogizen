#!/usr/bin/env python3
"""MURDILIMAX Recovery v0.2 graphical launcher (requires standard Python Tkinter).
All scans local; no internet, accounts, payments or direct physical-device writing.
"""
from __future__ import annotations
import os, queue, threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from murdilimax_engine import scan_image, recover, Candidate, ScanCancelled
from murdilimax_recovery_alpha import scan_folder, carve_image, restore as restore_carved, Hit

CATEGORIES=('Photos','Documents','Archives','Video','Audio','Crypto backups','Other')

class App(tk.Tk):
    def __init__(self):
        super().__init__();self.title('MURDILIMAX Recovery v0.2 — NTFS + exFAT')
        self.geometry('1150x780');self.minsize(880,630)
        self.configure(bg='#0b1121')
        self.items=[];self.events=queue.Queue();self.stop_event=threading.Event()
        self.mode=tk.StringVar(value='metadata');self.source=tk.StringVar();self.note=tk.StringVar(value='Ready. All analysis is performed locally and read-only.')
        self.filter={c:tk.BooleanVar(value=c in ('Photos','Documents','Crypto backups','Archives')) for c in CATEGORIES}
        self.style();self.layout();self.after(85,self.process_events)
    def style(self):
        s=ttk.Style(self);s.theme_use('clam')
        s.configure('TFrame',background='#0b1121');s.configure('TLabel',background='#0b1121',foreground='#d9e7ff',font=('Segoe UI',10))
        s.configure('TButton',font=('Segoe UI',10),padding=10)
        s.configure('TEntry',padding=8)
        s.configure('TRadiobutton',background='#0b1121',foreground='#c3d5f4',font=('Segoe UI',10))
        s.configure('TCheckbutton',background='#0b1121',foreground='#c3d5f4',font=('Segoe UI',10))
        s.configure('Treeview',background='#121f37',fieldbackground='#121f37',foreground='#e8f4ff',rowheight=28, font=('Segoe UI',9),borderwidth=0)
        s.configure('Treeview.Heading',background='#223554',foreground='#f1f6ff',font=('Segoe UI',9,'bold'))
    def layout(self):
        top=ttk.Frame(self,padding=(24,20,24,8));top.pack(fill='x')
        ttk.Label(top,text='◈  MURDILIMAX   RECOVERY',font=('Segoe UI',22,'bold')).pack(anchor='w')
        ttk.Label(top,text='Local Recovery Engine 0.2    ·    NTFS deleted MFT records    ·    exFAT deleted entries    ·    raw signature carving',font=('Segoe UI',10)).pack(anchor='w',pady=3)
        area=ttk.Frame(self,padding=(24,8));area.pack(fill='x')
        ttk.Label(area,text='SCAN MODE',font=('Segoe UI',9,'bold')).pack(anchor='w')
        row=ttk.Frame(area);row.pack(fill='x',pady=(5,8))
        for value,label in [('metadata','Deleted files: NTFS / exFAT image'),('carve','Signature scan: JPG / PNG / PDF / ZIP'),('folder','Existing files / wallet backup filenames')]:
            ttk.Radiobutton(row,text=label,variable=self.mode,value=value).pack(side='left',padx=(0,19))
        choose=ttk.Frame(area);choose.pack(fill='x')
        ttk.Entry(choose,textvariable=self.source).pack(side='left',fill='x',expand=True)
        ttk.Button(choose,text='Browse source…',command=self.browse).pack(side='left',padx=(8,0))
        group=ttk.Frame(self,padding=(24,10));group.pack(fill='x')
        ttk.Label(group,text='FILE CATEGORIES',font=('Segoe UI',9,'bold')).pack(anchor='w')
        wrap=ttk.Frame(group);wrap.pack(fill='x',pady=(8,0))
        for cat,var in self.filter.items():ttk.Checkbutton(wrap,text=cat,variable=var).pack(side='left',padx=(0,17))
        actions=ttk.Frame(self,padding=(24,5));actions.pack(fill='x')
        self.start_button=ttk.Button(actions,text='SCAN SOURCE',command=self.scan);self.start_button.pack(side='left')
        ttk.Button(actions,text='Cancel',command=lambda:self.stop_event.set()).pack(side='left',padx=(8,0))
        ttk.Button(actions,text='RECOVER SELECTED →',command=self.recover_selected).pack(side='right')
        tableframe=ttk.Frame(self,padding=(24,8));tableframe.pack(fill='both',expand=True)
        cols=('fs','kind','name','bytes','state','reason')
        self.tree=ttk.Treeview(tableframe,columns=cols,show='headings',selectmode='extended')
        for col,ttl,w in [('fs','FS',85),('kind','Type',130),('name','Path / filename',285),('bytes','Bytes',105),('state','Allocation',115),('reason','Assessment',330)]:
            self.tree.heading(col,text=ttl);self.tree.column(col,width=w,stretch=col in ('name','reason'))
        v=ttk.Scrollbar(tableframe,orient='vertical',command=self.tree.yview)
        self.tree.configure(yscrollcommand=v.set)
        self.tree.pack(side='left',fill='both',expand=True);v.pack(side='left',fill='y')
        footer=ttk.Frame(self,padding=(24,4,24,18));footer.pack(fill='x')
        self.progress=ttk.Progressbar(footer,maximum=100);self.progress.pack(fill='x')
        ttk.Label(footer,textvariable=self.note,wraplength=1000).pack(anchor='w',pady=(7,2))
        ttk.Label(footer,text='CAUTION: not tested on damaged drives. Use a forensic image. Reallocated clusters are blocked; unknown allocation requires confirmation. No seed phrase extraction.',font=('Segoe UI',9),wraplength=1080).pack(anchor='w')
    def browse(self):
        selected=filedialog.askdirectory() if self.mode.get()=='folder' else filedialog.askopenfilename(filetypes=[('Disk images','*.img *.dd *.bin *.raw'),('All files','*.*')])
        if selected:self.source.set(selected)
    def post(self,typ,obj):self.events.put((typ,obj))
    def scan(self):
        mode=self.mode.get();path=self.source.get().strip()
        if not (os.path.isdir(path) if mode=='folder' else os.path.isfile(path)):
            messagebox.showerror('Source','Choose an existing '+('folder' if mode=='folder' else 'raw image'));return
        chosen={c for c,var in self.filter.items() if var.get()}
        if not chosen:messagebox.showerror('Categories','Select at least one file category');return
        if mode=='carve' and not chosen.intersection({'Photos','Documents','Archives'}):
            messagebox.showwarning('Unsupported category','Raw signature scanning currently supports JPG, PNG, PDF, ZIP only.');return
        self.items=[]
        for node in self.tree.get_children():self.tree.delete(node)
        self.stop_event.clear();self.start_button.state(['disabled']);self.note.set('Reading source…');self.progress['value']=0
        def worker():
            try:
                if mode=='metadata':
                    def progress(a,b):
                        if self.stop_event.is_set():raise ScanCancelled()
                        self.post('progress',int(100*a/max(1,b)))
                    result,vol,errors=scan_image(path,progress=progress)
                    for c in result:
                        if not chosen or c.kind in chosen:self.post('hit',c)
                    self.post('done',f'Completed. Volumes: {len(vol)}. '+('; '.join(errors) if errors else ''))
                else:
                    def bridge(kind,obj):
                        if kind=='hit':
                            label='Crypto backups' if obj.kind=='Crypto' else obj.kind
                            if label in chosen:self.post('hit',obj)
                        else:self.post(kind,obj)
                    if mode=='folder':
                        subset={(c if c!='Crypto backups' else 'Crypto') for c in chosen}
                        scan_folder(path,subset,self.stop_event,bridge)
                    else:
                        carve_image(path,chosen,self.stop_event,bridge)
                    self.post('done','Stopped.' if self.stop_event.is_set() else 'Scan completed.')
            except ScanCancelled:self.post('done','Cancelled.')
            except Exception as e:self.post('error',str(e))
        threading.Thread(target=worker,daemon=True).start()
    def process_events(self):
        try:
            for _ in range(500):
                kind,obj=self.events.get_nowait()
                if kind=='hit':
                    ix=len(self.items);self.items.append(obj)
                    if isinstance(obj,Candidate):
                        values=(obj.fs,obj.kind,obj.path,f'{obj.size:,}',obj.state,obj.reason)
                    else:values=('folder / carve',obj.kind,obj.label,f'{obj.size:,}','candidate','Signature / existing file')
                    self.tree.insert('','end',iid=str(ix),values=values)
                    self.note.set(f'{len(self.items)} candidates shown. Source is read-only.')
                elif kind=='progress':self.progress['value']=obj
                elif kind=='done':self.start_button.state(['!disabled']);self.note.set(f'{obj} {len(self.items)} candidate(s).')
                elif kind=='error':self.start_button.state(['!disabled']);self.note.set('Error: '+obj)
        except queue.Empty:pass
        self.after(85,self.process_events)
    def recover_selected(self):
        indices=self.tree.selection()
        if not indices:messagebox.showinfo('Recovery','Select at least one file');return
        dest=filedialog.askdirectory(title='Choose output folder on ANOTHER physical disk')
        if not dest:return
        src=Path(self.source.get()).resolve();d=Path(dest).resolve()
        if (src.is_dir() and (d==src or src in d.parents)) or (src.is_file() and d==src.parent):
            messagebox.showerror('Unsafe destination','Choose a different output folder, ideally on another physical drive.');return
        items=[self.items[int(i)] for i in indices]
        if any(isinstance(c,Candidate) and c.state=='unknown' for c in items):
            confirmed=messagebox.askyesno('Unverified allocation','Some files have unknown allocation status. Their contents may be overwritten or corrupted. Recover them anyway?')
            if not confirmed:return
        saved=[];failed=[]
        for c in items:
            try:
                if isinstance(c,Candidate):
                    outcome=recover(src,c,d,allow_unknown=True)
                    saved.append(outcome['path'])
                else:saved.append(restore_carved(c,str(d))[0])
            except Exception as exc:failed.append(f'{c.name if isinstance(c,Candidate) else c.label}: {exc}')
        self.note.set(f'Recovered {len(saved)}, failed {len(failed)}. See selected destination.')
        messagebox.showinfo('Recovery completed',f'Saved: {len(saved)}\nFailed: {len(failed)}\n\n'+'\n'.join(failed[:4]))

if __name__=='__main__':App().mainloop()