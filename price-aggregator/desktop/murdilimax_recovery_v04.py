#!/usr/bin/env python3
"""MURDILIMAX Recovery v0.8 graphical launcher (requires standard Python Tkinter).
All scans local; no internet, accounts, payments or direct physical-device writing.
"""
from __future__ import annotations
import os, queue, threading, json
from datetime import datetime, timezone
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from murdilimax_engine import scan_image, recover, Candidate, ScanCancelled
from murdilimax_devices import is_physical, enumerate_drives, destination_is_different_disk
from murdilimax_raid import assemble, probe_raid5_start, RAID5_LAYOUTS
from murdilimax_md import inspect_md_set, extract_md_member
from murdilimax_imager import image_source, ImagingCancelled, SourceReadLimitExceeded
from murdilimax_validate import assess_file
from murdilimax_preview import preview_bytes, decode_preview
from murdilimax_recovery_alpha import scan_folder, carve_image, restore as restore_carved, Hit

CATEGORIES=('Photos','Documents','Archives','Video','Audio','Crypto backups','Other')

class App(tk.Tk):
    def __init__(self):
        super().__init__();self.title('MURDILIMAX Recovery v0.8 — NTFS · exFAT · ext4 · RAID · Safe imaging')
        self.geometry('1180x800');self.minsize(900,650)
        self.busy=False
        self.configure(bg='#0b1121')
        self.items=[];self.events=queue.Queue();self.stop_event=threading.Event()
        self.mode=tk.StringVar(value='metadata');self.source=tk.StringVar();self.deep=tk.BooleanVar(value=True);self.salvage=tk.BooleanVar(value=True);self.note=tk.StringVar(value='Ready. All analysis is performed locally and read-only.')
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
        ttk.Label(top,text='Recovery Engine 0.8    ·    NTFS / exFAT / ext4    ·    RAID 0/1/5/6/10    ·    safe imaging',font=('Segoe UI',10)).pack(anchor='w',pady=3)
        area=ttk.Frame(self,padding=(24,8));area.pack(fill='x')
        ttk.Label(area,text='SCAN MODE',font=('Segoe UI',9,'bold')).pack(anchor='w')
        modes=[('metadata','NTFS/exFAT deleted files + ext4 existing files (image)'),('carve','Signature scan: JPG / PNG / PDF / ZIP'),('folder','Existing files / wallet backup filenames'),('physical','Physical HDD/USB (metadata)'),('physical-carve','Physical HDD/USB (signatures)')]
        for group in (modes[:3],modes[3:]):
            row=ttk.Frame(area);row.pack(fill='x',pady=(5,1))
            for value,label in group:
                ttk.Radiobutton(row,text=label,variable=self.mode,value=value).pack(side='left',padx=(0,20))
        choose=ttk.Frame(area);choose.pack(fill='x')
        ttk.Entry(choose,textvariable=self.source).pack(side='left',fill='x',expand=True)
        ttk.Button(choose,text='Browse source…',command=self.browse).pack(side='left',padx=(8,0))
        ttk.Checkbutton(area,text='Deep scan: find lost partitions (may be slow on large drives)',variable=self.deep).pack(anchor='w',pady=(7,0))
        ttk.Checkbutton(area,text='Attempt damaged NTFS MFT salvage if primary MFT cannot be read (experimental)',variable=self.salvage).pack(anchor='w',pady=(3,0))
        group=ttk.Frame(self,padding=(24,10));group.pack(fill='x')
        ttk.Label(group,text='FILE CATEGORIES',font=('Segoe UI',9,'bold')).pack(anchor='w')
        wrap=ttk.Frame(group);wrap.pack(fill='x',pady=(8,0))
        for cat,var in self.filter.items():ttk.Checkbutton(wrap,text=cat,variable=var).pack(side='left',padx=(0,17))
        actions=ttk.Frame(self,padding=(24,5));actions.pack(fill='x')
        self.start_button=ttk.Button(actions,text='SCAN SOURCE',command=self.scan);self.start_button.pack(side='left')
        ttk.Button(actions,text='CANCEL / PAUSE',command=lambda:self.stop_event.set()).pack(side='left',padx=(8,0))
        self.image_button=ttk.Button(actions,text='SAFE DISK IMAGE…',command=self.safe_image);self.image_button.pack(side='left',padx=(9,0))
        self.restore_button=ttk.Button(actions,text='RECOVER SELECTED →',command=self.recover_selected);self.restore_button.pack(side='right')
        self.preview_button=ttk.Button(actions,text='PREVIEW PHOTO…',command=self.preview_selected);self.preview_button.pack(side='right',padx=(0,10))
        self.raid_button=ttk.Button(actions,text='RAID BUILDER…',command=self.raid_builder);self.raid_button.pack(side='right',padx=(0,10))
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
        ttk.Label(footer,text='CAUTION: raw physical disk reading is not yet field-validated. For clicking or disconnecting disks, use a professional laboratory / GNU ddrescue. No source writes; no secret extraction.',font=('Segoe UI',9),wraplength=1080).pack(anchor='w')
    def browse(self):
        if self.mode.get().startswith('physical'):
            disks=enumerate_drives()
            if not disks:
                messagebox.showerror('Windows drives','No accessible disks. On Windows, administrator permission may be required.');return
            dialog=tk.Toplevel(self);dialog.title('Select PHYSICAL source · READ ONLY');dialog.geometry('650x330');dialog.transient(self);dialog.grab_set()
            ttk.Label(dialog,text='Choose a SOURCE disk — ensure the number and capacity match your device.',wraplength=600).pack(anchor='w',padx=15,pady=14)
            table=ttk.Treeview(dialog,columns=('path','size'),show='headings',height=7)
            table.heading('path',text='Windows device');table.heading('size',text='Capacity')
            table.column('path',width=320);table.column('size',width=160)
            for i,d in enumerate(disks):table.insert('','end',iid=str(i),values=(d['path'],f"{d['size']/1024**3:,.2f} GiB"))
            table.pack(fill='both',expand=True,padx=15)
            def confirm():
                ids=table.selection()
                if ids and messagebox.askyesno('Confirm read-only scan','This reads many sectors from the selected physical disk. Do not scan failing disks; image them first. Continue?',parent=dialog):
                    self.source.set(disks[int(ids[0])]['path']);dialog.destroy()
            ttk.Button(dialog,text='Use selected disk',command=confirm).pack(pady=12)
            return
        selected=filedialog.askdirectory() if self.mode.get()=='folder' else filedialog.askopenfilename(filetypes=[('Disk images','*.img *.dd *.bin *.raw'),('All files','*.*')])
        if selected:self.source.set(selected)

    def set_busy(self, busy: bool):
        self.busy=busy
        for button in (self.start_button,self.image_button,self.restore_button,self.preview_button,self.raid_button):
            button.state(['disabled'] if busy else ['!disabled'])

    def safe_image(self):
        if self.busy:return
        source=self.source.get().strip()
        if self.mode.get()=='folder' or not source:
            messagebox.showwarning('Imaging source','Select a disk image or physical HDD/USB first.');return
        if not is_physical(source) and not Path(source).is_file():
            messagebox.showerror('Imaging source','Select a valid image file or Windows physical disk.');return
        if is_physical(source) and not messagebox.askyesno('Physical disk safety',
            'This copies many sectors from a PHYSICAL DEVICE. Even read-only access can worsen a failing drive. Stop if the disk clicks, overheats or disconnects. Continue?'):
            return
        dest=filedialog.asksaveasfilename(title='Save NEW image to a DIFFERENT physical disk',
                 defaultextension='.img',filetypes=[('Raw disk image','*.img'),('All files','*.*')])
        if not dest:return
        sidecar=Path(dest+'.mrd-state.json')
        resume_physical=False
        if sidecar.exists() and is_physical(source):
            resume_physical=messagebox.askyesno('Resume physical disk',
                'Resume ONLY if this is the SAME drive. Recovery checks the hardware serial, geometry and checkpoint hash; disks with no stable serial cannot be resumed. Continue?')
            if not resume_physical:return
        self.stop_event.clear();self.progress['value']=0;self.set_busy(True)
        self.note.set('Acquisition started. Source is read-only. Cancel saves a resumable checkpoint.')
        def worker():
            try:
                result=image_source(source,dest,cancel=self.stop_event,
                    progress=lambda done,total,bad:self.post('image_progress',(done,total,bad)),
                    allow_resume_physical=resume_physical)
                self.post('image_done',result)
            except ImagingCancelled as exc:self.post('image_paused',str(exc))
            except (OSError,ValueError,SourceReadLimitExceeded) as exc:self.post('image_error',str(exc))
        threading.Thread(target=worker,daemon=True).start()

    def raid_builder(self):
        if self.busy: return
        dialog=tk.Toplevel(self)
        dialog.title('MURDILIMAX · Experimental RAID image builder 0.8')
        dialog.geometry('780x670')
        dialog.transient(self)
        ttk.Label(dialog,text='Experimental RAID 0 / 1 / 5 / 6 / 10 image reconstruction',
                  font=('Segoe UI',13,'bold')).pack(anchor='w',padx=16,pady=(16,6))
        ttk.Label(dialog,text='Only use previously acquired raw member IMAGES, never physical disks. '
                  'Order, parity layout and stripe size must match the original array. '
                  'RAID6 supports fixed-P/Q-last ONLY, not generic Linux MD or vendor NAS layouts.',
                  wraplength=740).pack(anchor='w',padx=16)
        head=ttk.Frame(dialog,padding=(16,12));head.pack(fill='x')
        ttk.Label(head,text='Level:').pack(side='left')
        lvl=tk.StringVar(value='5')
        level_box=ttk.Combobox(head,textvariable=lvl,values=['0','1','5','6','10'],state='readonly',width=5)
        level_box.pack(side='left',padx=(8,18))
        ttk.Label(head,text='Chunk (KiB):').pack(side='left')
        stripe=tk.StringVar(value='64')
        ttk.Combobox(head,textvariable=stripe,
                     values=['4','8','16','32','64','128','256','512','1024'],
                     state='readonly',width=7).pack(side='left',padx=(8,18))
        ttk.Label(head,text='Layout:').pack(side='left')
        layout=tk.StringVar(value='left-symmetric')
        layout_box=ttk.Combobox(head,textvariable=layout,state='readonly',width=20)
        layout_box.pack(side='left',padx=8)
        verify=tk.BooleanVar(value=True)
        ttk.Checkbutton(dialog,text='Verify available P/Q parity or matching mirrors before publishing output',
                        variable=verify).pack(anchor='w',padx=17)
        def layouts(_event=None):
            level=int(lvl.get())
            options=list(RAID5_LAYOUTS) if level==5 else ['fixed-pq-last'] if level==6 else ['near-2'] if level==10 else ['default']
            layout_box.configure(values=options)
            layout.set(options[0])
        level_box.bind('<<ComboboxSelected>>',layouts)
        ttk.Label(dialog,text='Member images in PHYSICAL DISK ORDER, one path per line. '
                  'Use - for a missing RAID5/6/10 member:',wraplength=740).pack(anchor='w',padx=16,pady=(13,0))
        editor=tk.Text(dialog,height=10,width=65,bg='#172541',fg='white',insertbackground='white')
        editor.pack(fill='both',expand=True,padx=16,pady=8)
        bar=ttk.Frame(dialog,padding=(16,0));bar.pack(fill='x')
        def add_image():
            filename=filedialog.askopenfilename(parent=dialog,title='Select existing RAID member image')
            if filename: editor.insert('end',filename+'\n')
        ttk.Button(bar,text='Add member image…',command=add_image).pack(side='left')
        def inspect_md():
            paths=[v.strip() for v in editor.get('1.0','end').splitlines() if v.strip() and v.strip()!='-']
            try:
                result=inspect_md_set(paths)
                devices='\n'.join('Image '+str(i)+': role='+str(d['role'])+', data offset='+str(d['data_offset_bytes'])+' bytes'
                                  for i,d in enumerate(result['members']))
                messagebox.showinfo('Linux MD 1.2 metadata (READ ONLY)',
                   'Matching array UUID: '+result['array_uuid']+'\nLevel: '+str(result['level'])
                   +'\nChunk: '+str(result['chunk_bytes'])+' bytes\n'
                   +devices+'\n\nDoes NOT prove disk order or vendor layout. '
                   'Use Export MD member data… for data-only images.',parent=dialog)
            except Exception as exc: messagebox.showerror('MD metadata',str(exc),parent=dialog)
        ttk.Button(bar,text='Inspect Linux MD metadata',command=inspect_md).pack(side='left',padx=8)
        def extract_one():
            paths=[v.strip() for v in editor.get('1.0','end').splitlines() if v.strip() and v.strip()!='-']
            if len(paths)!=1:
                messagebox.showinfo('MD member export','For safe export, enter one MD member image in the list at a time.',parent=dialog);return
            dest=filedialog.asksaveasfilename(parent=dialog,title='Save extracted MD member DATA to a NEW file',
                defaultextension='.img',filetypes=[('Raw image','*.img')])
            if not dest:return
            msg.set('Exporting data-only image. Original remains read-only…')
            def worker():
                try:
                    report=extract_md_member(paths[0],dest)
                    self.after(0,lambda:msg.set('MD data-only image saved: '+report['output']+'. Recheck member order before building.'))
                except Exception as exc:
                    err=str(exc)
                    self.after(0,lambda:msg.set('Export failed: '+err))
            threading.Thread(target=worker,daemon=True).start()
        ttk.Button(bar,text='Export MD member DATA…',command=extract_one).pack(side='left')
        msg=tk.StringVar(value='No changes will be made to the member images.')
        ttk.Label(dialog,textvariable=msg,wraplength=740).pack(anchor='w',padx=16,pady=(12,6))
        builder=ttk.Frame(dialog,padding=(16,2));builder.pack(fill='x')
        def recommend():
            paths=[v.strip() for v in editor.get('1.0','end').splitlines() if v.strip()]
            if len(paths)>5 or any(v=='-' for v in paths) or lvl.get()!='5':
                messagebox.showinfo('RAID hints','Available only for RAID5 with 3–5 existing images; no missing members.',parent=dialog);return
            try:
                candidates=probe_raid5_start(paths,int(stripe.get())*1024)
                if not candidates:
                    text='No recognizable NTFS/exFAT filesystem boot header at logical byte zero. This is common for partitioned NAS images.'
                else:
                    first=candidates[0]
                    text=('WEAK HINT ONLY, NOT A VALIDATED ARRAY.\n'
                          f'Possible layout: {first["layout"]}, member indices: {first["member_order"]}.\n'
                          'Only the first boot sector was matched; verify the entire image independently.')
                messagebox.showinfo('Experimental RAID5 hints',text,parent=dialog)
            except Exception as exc:messagebox.showerror('RAID hint error',str(exc),parent=dialog)
        ttk.Button(builder,text='Suggest RAID5 starting layout (weak hint)',command=recommend).pack(side='left')
        def build():
            paths=[v.strip() for v in editor.get('1.0','end').splitlines() if v.strip()]
            if any(not Path(p).is_file() for p in paths if p!='-'):
                messagebox.showerror('RAID inputs','Choose existing member image files only.',parent=dialog);return
            dest=filedialog.asksaveasfilename(parent=dialog,title='Save NEW reconstructed image to a healthy disk',
                    defaultextension='.img',filetypes=[('Raw image','*.img')])
            if not dest:return
            if not messagebox.askyesno('Confirm EXPERIMENTAL reconstruction',
                'Incorrect order or layout may produce a convincingly structured but WRONG filesystem. '
                'This tool cannot infer Synology/QNAP/DDF RAID layouts. Continue?',parent=dialog):return
            build_button.state(['disabled']);hint_button.state(['disabled'])
            msg.set('Read-only reconstruction running. This can require a long time for large images…')
            level=int(lvl.get());chunk=int(stripe.get())*1024;chosen_layout=layout.get();check=verify.get()
            def go():
                try:
                    result=assemble(paths,dest,level,chunk,check,layout=chosen_layout)
                    def done():
                        msg.set('Reconstruction complete. Verified stripes: '
                                +str(result['verified_stripes'])+'/'+str(result['total_stripes'])
                                +'. SHA-256: '+result['sha256'][:20]+'…')
                        self._raid_complete(dialog,msg,result['output'])
                        build_button.state(['!disabled']);hint_button.state(['!disabled'])
                    self.after(0,done)
                except Exception as exc:
                    err=str(exc)
                    def fail():
                        msg.set('RAID error: '+err)
                        build_button.state(['!disabled']);hint_button.state(['!disabled'])
                    self.after(0,fail)
            threading.Thread(target=go,daemon=True).start()
        hint_button=builder.winfo_children()[0]
        build_button=ttk.Button(dialog,text='BUILD NEW READ-ONLY RAID IMAGE',command=build)
        build_button.pack(pady=(8,16))

    def _raid_complete(self,dialog,message,result):
        message.set('RAID image created: '+result)
        self.source.set(result);self.mode.set('metadata')
        messagebox.showinfo('RAID image built','The reconstructed image is now selected. Use Scan Source to analyze it.',parent=dialog)
    def post(self,typ,obj):self.events.put((typ,obj))
    def scan(self):
        if self.busy:return
        mode=self.mode.get();path=self.source.get().strip()
        deep=self.deep.get();salvage=self.salvage.get()
        if not (os.path.isdir(path) if mode=='folder' else (is_physical(path) if mode.startswith('physical') else os.path.isfile(path))):
            messagebox.showerror('Source','Choose an existing '+('folder' if mode=='folder' else 'raw image'));return
        chosen={c for c,var in self.filter.items() if var.get()}
        if not chosen:messagebox.showerror('Categories','Select at least one file category');return
        if mode in ('carve','physical-carve') and not chosen.intersection({'Photos','Documents','Archives'}):
            messagebox.showwarning('Unsupported category','Raw signature scanning currently supports JPG, PNG, PDF, ZIP only.');return
        self.items=[]
        for node in self.tree.get_children():self.tree.delete(node)
        self.stop_event.clear();self.set_busy(True);self.note.set('Reading source…');self.progress['value']=0
        def worker():
            try:
                if mode in ('metadata','physical'):
                    def progress(a,b):
                        if self.stop_event.is_set():raise ScanCancelled()
                        self.post('progress',int(100*a/max(1,b)))
                    result,vol,errors=scan_image(path,progress=progress,deep_partitions=deep,salvage_mft=salvage)
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
                elif kind=='done':self.set_busy(False);self.note.set(f'{obj} {len(self.items)} candidate(s).')
                elif kind=='error':self.set_busy(False);self.note.set('Error: '+obj)
                elif kind=='image_progress':
                    done,total,bad=obj;self.progress['value']=int(done*100/max(1,total))
                    self.note.set(f'Imaging: {done:,}/{total:,} bytes · unreadable: {bad:,} bytes. Cancel keeps checkpoint.')
                elif kind=='image_done':
                    self.set_busy(False);self.progress['value']=100
                    self.source.set(obj['path']);self.mode.set('metadata')
                    self.note.set('Image complete: '+obj['path']+' | SHA256: '+obj['sha256_image'][:20]+'…')
                    messagebox.showinfo('Safe image complete',f"Image: {obj['path']}\nUnreadable bytes: {obj['unreadable_bytes']:,}\nSHA256: {obj['sha256_image']}\nReport: {obj['report']}\n\nImage is now selected for scanning.")
                elif kind in ('image_error','image_paused'):
                    self.set_busy(False);self.note.set(('Imaging paused: ' if kind=='image_paused' else 'Imaging error: ')+obj)
                    if kind=='image_error':messagebox.showwarning('Image incomplete',obj)
                elif kind=='preview_done':
                    self.set_busy(False)
                    label,state,picture=obj
                    self.note.set('Photo preview loaded. Source remains read-only; no file was saved.')
                    self.display_photo_preview(label,state,picture)
                elif kind=='preview_error':
                    self.set_busy(False)
                    self.note.set('Preview unavailable: '+obj)
                    messagebox.showwarning('Photo preview',obj)
                elif kind=='restore_progress':
                    current,total=obj;self.progress['value']=int(current*100/max(1,total))
                elif kind=='restore_done':
                    self.set_busy(False)
                    saved,failed,cancelled,reportpath=obj
                    self.note.set(f'Recovery ended: {len(saved)} saved, {len(failed)} failed. Report: {reportpath}')
                    messagebox.showinfo('Recovery results',f'Saved: {len(saved)}\nFailed: {len(failed)}\nCancelled: {cancelled}\nReport: {reportpath}\n\n'+'\n'.join(failed[:4]))
        except queue.Empty:pass
        self.after(85,self.process_events)
    def preview_selected(self):
        """Preview bounded photo candidate in a worker thread; never recover to disk."""
        if self.busy:return
        selected=self.tree.selection()
        if len(selected)!=1:
            messagebox.showinfo('Preview','Select one filesystem metadata photo first.');return
        candidate=self.items[int(selected[0])]
        if not isinstance(candidate,Candidate):
            messagebox.showinfo('Preview','Photo preview currently supports NTFS/exFAT metadata results only.');return
        source=self.source.get().strip()
        self.set_busy(True);self.note.set('Reading limited photo preview locally (max 12 MiB)…')
        def worker():
            try:
                data=preview_bytes(source,candidate)
                picture=decode_preview(data)
                self.post('preview_done',(candidate.path,candidate.state,picture))
            except Exception as exc:self.post('preview_error',str(exc))
        threading.Thread(target=worker,daemon=True).start()

    def display_photo_preview(self,label,state,picture):
        from PIL import ImageTk
        dialog=tk.Toplevel(self)
        dialog.title('MURDILIMAX · Photo preview — UNVERIFIED RECOVERED CONTENT')
        dialog.geometry('790x590');dialog.minsize(560,400)
        dialog.configure(bg='#111b31')
        ttk.Label(dialog,text='PREVIEW ONLY · FILE NOT SAVED',font=('Segoe UI',13,'bold')).pack(padx=18,pady=(18,4))
        ttk.Label(dialog,text='File: '+label,wraplength=740).pack(padx=18,pady=3)
        ttk.Label(dialog,text='Allocation: '+state+' · visual preview does not guarantee integrity',wraplength=740).pack(padx=18,pady=3)
        thumbnail=ImageTk.PhotoImage(picture,master=dialog)
        panel=tk.Label(dialog,image=thumbnail,bg='#111b31')
        panel.image=thumbnail  # keep Tcl image alive
        panel.pack(fill='both',expand=True,padx=20,pady=18)
        ttk.Button(dialog,text='Close',command=dialog.destroy).pack(pady=(0,16))

    def recover_selected(self):
        if self.busy:return
        indices=self.tree.selection()
        if not indices:messagebox.showinfo('Recovery','Select at least one file');return
        dest=filedialog.askdirectory(title='Choose output folder on ANOTHER physical disk')
        if not dest:return
        raw=self.source.get()
        src=raw if is_physical(raw) else Path(raw).resolve()
        d=Path(dest).resolve()
        if is_physical(raw) and not destination_is_different_disk(raw,str(d)):
            messagebox.showerror('Unsafe destination','Cannot prove output drive is different. Recovery blocked.');return
        if not is_physical(raw) and ((src.is_dir() and (d==src or src in d.parents)) or (src.is_file() and d==src.parent)):
            messagebox.showerror('Unsafe destination','Choose a different output folder, ideally on another physical drive.');return
        items=[self.items[int(i)] for i in indices]
        if any(isinstance(c,Candidate) and c.state=='unknown' for c in items):
            if not messagebox.askyesno('Unverified allocation','Some files have unknown allocation status. Their contents may be damaged. Recover anyway?'):return
        self.stop_event.clear();self.set_busy(True);self.progress['value']=0
        self.note.set(f'Recovering {len(items)} selected files in background…')
        def worker():
            saved=[];failed=[];cancelled=False
            for i,c in enumerate(items):
                if self.stop_event.is_set():cancelled=True;break
                try:
                    if isinstance(c,Candidate):
                        outcome=recover(src,c,d,allow_unknown=True,cancel=self.stop_event.is_set)
                        saved.append({'source':c.path,'result':outcome,'format_check':assess_file(outcome['path'])})
                    else:
                        path,sha=restore_carved(c,str(d))
                        saved.append({'source':c.label,'result':{'path':path,'sha256':sha},'format_check':assess_file(path)})
                except ScanCancelled:cancelled=True;break
                except Exception as exc:failed.append(f'{c.name if isinstance(c,Candidate) else c.label}: {exc}')
                self.post('restore_progress',(i+1,len(items)))
            reportpath=None
            try:
                stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
                reportpath=str(d/('MURDILIMAX-recovery-'+stamp+'.json'))
                report={'application':'MURDILIMAX Recovery 0.8','created_utc':stamp,
                        'source':str(src),'saved':saved,'errors':failed,'cancelled':cancelled,
                        'note':'Recovery report contains filenames and hashes; keep it private if filenames are sensitive.'}
                with open(reportpath,'x',encoding='utf-8') as f:
                    json.dump(report,f,ensure_ascii=False,indent=2)
            except Exception as exc:
                failed.append(f'Could not write audit report: {exc}')
                reportpath='not available'
            self.post('restore_done',(saved,failed,cancelled,reportpath))
        threading.Thread(target=worker,daemon=True).start()

if __name__=='__main__':App().mainloop()
