#!/usr/bin/env python3
"""Synthetic recovery quality gate. Does NOT validate real damaged drives."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import struct
import tempfile
import time
from murdilimax_engine import scan_image, recover
from test_engine import ntfs_fixture, exfat_fixture
from test_stage2_metadata import Stage2MetadataTests
from test_stage4_ext4 import ext4_fixture, BS

NTFS_DATA=b'\xff\xd8\xff'+b'A'*509+b'B'*188
EXT4_FILES={'photo.jpg':b'PHOTO-YES!','folder/readme.txt':b'Hello World!',
            'sparse.bin':b'Z'*BS+bytes(BS)+b'Y'*BS}

def _case(name,path,expect=None,absent=None,blocked=None,fs=None):
    return {'name':name,'image':path,'expect':expect or {},'absent':absent or set(),
            'blocked':blocked or set(),'expected_fs':fs}

def build_fixtures(folder:Path)->list[dict]:
    """All inputs are generated synthetic files, never physical disks."""
    c=[]
    p=folder/'ntfs-fragmented.img';ntfs_fixture(p)
    c.append(_case('ntfs_deleted_fragmented',p,{'lost.jpg':NTFS_DATA},fs='NTFS'))
    p=folder/'ntfs-mbr.img';ntfs_fixture(p,partition=True)
    c.append(_case('ntfs_mbr_partition',p,{'lost.jpg':NTFS_DATA},fs='NTFS'))
    p=folder/'ntfs-occupied.img';ntfs_fixture(p,used=True)
    c.append(_case('ntfs_reallocated_blocked',p,blocked={'lost.jpg'},fs='NTFS'))
    p=folder/'ntfs-deleted-folder.img';ntfs_fixture(p,nested=True)
    raw=bytearray(p.read_bytes())
    struct.pack_into('<Q',raw,4*512+16*1024+0x38+24,14|(5<<48))
    struct.pack_into('<H',raw,4*512+14*1024+16,5)
    p.write_bytes(raw)
    c.append(_case('ntfs_deleted_folder',p,{'LostFolder/lost.jpg':NTFS_DATA},fs='NTFS'))
    p=folder/'ntfs-stale-parent.img';ntfs_fixture(p,nested=True)
    raw=bytearray(p.read_bytes())
    struct.pack_into('<Q',raw,4*512+16*1024+0x38+24,14|(5<<48))
    struct.pack_into('<H',raw,4*512+14*1024+16,6)
    p.write_bytes(raw)
    c.append(_case('ntfs_stale_parent_not_reused',p,{'lost.jpg':NTFS_DATA},
                   absent={'LostFolder/lost.jpg'},fs='NTFS'))
    p=folder/'exfat-deleted.img';content=exfat_fixture(p)
    c.append(_case('exfat_deleted_file',p,{'old.jpg':content},fs='exFAT'))
    p=folder/'exfat-reallocated.img';exfat_fixture(p,used=True)
    c.append(_case('exfat_reallocated_blocked',p,blocked={'old.jpg'},fs='exFAT'))
    p=folder/'exfat-nested.img';exfat_fixture(p)
    raw=bytearray(p.read_bytes());nested=Stage2MetadataTests.add_exfat_directory(raw)
    p.write_bytes(raw)
    c.append(_case('exfat_nested_deleted',p,{'old.jpg':content,'Gone/baby.jpg':nested},fs='exFAT'))
    p=folder/'exfat-stale-folder.img';exfat_fixture(p)
    raw=bytearray(p.read_bytes());Stage2MetadataTests.add_exfat_directory(raw,reused=True)
    p.write_bytes(raw)
    c.append(_case('exfat_reused_directory_not_scanned',p,{'old.jpg':content},
                   absent={'Gone/baby.jpg'},fs='exFAT'))
    p=folder/'ext4-regular.img';p.write_bytes(ext4_fixture())
    c.append(_case('ext4_existing_and_sparse',p,EXT4_FILES,fs='ext4'))
    p=folder/'ext4-partition.img';p.write_bytes(ext4_fixture(1024*1024))
    c.append(_case('ext4_partitioned_existing',p,EXT4_FILES,fs='ext4'))
    p=folder/'ext4-corrupt-extent.img';raw=bytearray(ext4_fixture())
    struct.pack_into('<I',raw,20*BS+12+8,10_000)
    p.write_bytes(raw)
    c.append(_case('ext4_corrupt_extent_rejected',p,absent={'photo.jpg'},fs='ext4'))
    return c

def run_quality_gate(output_file:str|Path,*,require_pass:bool=False)->dict:
    out=Path(output_file).resolve()
    if out.exists():raise FileExistsError('Refusing to overwrite existing quality report')
    out.parent.mkdir(parents=True,exist_ok=True)
    report={'suite':'MURDILIMAX synthetic recovery quality gate',
            'generated_utc':datetime.now(timezone.utc).isoformat(),
            'scope':'SYNTHETIC FIXTURES ONLY — NOT REAL DISK OR COMPETITOR TESTS',
            'real_world_validated':False,'competitor_comparison_performed':False,'cases':[]}
    with tempfile.TemporaryDirectory(prefix='murdilimax-lab-') as root:
        workspace=Path(root)
        for case in build_fixtures(workspace):
            start=time.monotonic();errors=[];matched=[];blocked=[]
            try:
                hits,parts,warnings=scan_image(case['image'])
                paths={c.path for c in hits}
                fs={part.fs for part in parts}
                if case['expected_fs'] not in fs:errors.append('Filesystem not detected')
                for name in case['absent']:
                    if name in paths:errors.append('Incorrectly exposed '+name)
                for name in case['blocked']:
                    found=[h for h in hits if h.path==name]
                    if len(found)!=1 or found[0].eligible:
                        errors.append('Occupied source not rejected: '+name)
                    else:
                        try:
                            recover(case['image'],found[0],workspace/('blocked-'+case['name']))
                        except ValueError:blocked.append(name)
                        else:errors.append('Unsafe recovery succeeded: '+name)
                for name,expected in case['expect'].items():
                    found=[h for h in hits if h.path==name]
                    if len(found)!=1 or not found[0].eligible:
                        errors.append('Expected eligible candidate missing: '+name);continue
                    destination=workspace/('restored-'+case['name'])
                    result=recover(case['image'],found[0],destination,allow_unknown=True)
                    realpath=Path(result['path'])
                    contents=realpath.read_bytes()
                    verified_hash=sha256(contents).hexdigest()
                    expected_hash=sha256(expected).hexdigest()
                    if (contents!=expected or verified_hash!=expected_hash or
                        result.get('sha256')!=verified_hash or
                        realpath.relative_to(destination)!=Path(*name.split('/'))):
                        errors.append('Output mismatch: '+name)
                    else:
                        matched.append({'file':name,'bytes':len(contents),'sha256':verified_hash})
                row={'name':case['name'],'passed':not errors,'expected_exact_files':len(case['expect']),
                     'matched_exact_files':len(matched),'expected_blocked':len(case['blocked']),
                     'blocked_as_expected':len(blocked),'unexpected_candidates_checked':len(case['absent']),
                     'detected_filesystems':sorted(fs),'scan_warnings':warnings,
                     'recovered':matched,'errors':errors,'elapsed_seconds':round(time.monotonic()-start,3)}
            except Exception as e:
                row={'name':case['name'],'passed':False,'errors':[type(e).__name__+': '+str(e)],
                     'elapsed_seconds':round(time.monotonic()-start,3)}
            report['cases'].append(row)
    summary={'cases_total':len(report['cases']),
             'cases_passed':sum(c['passed'] for c in report['cases']),
             'files_exact_expected':sum(c.get('expected_exact_files',0) for c in report['cases']),
             'files_exact_matched':sum(c.get('matched_exact_files',0) for c in report['cases']),
             'unsafe_recovery_blocks_expected':sum(c.get('expected_blocked',0) for c in report['cases']),
             'unsafe_recovery_blocks_verified':sum(c.get('blocked_as_expected',0) for c in report['cases'])}
    summary['passed']=summary['cases_total']==summary['cases_passed']
    report['summary']=summary
    staged=out.with_name(out.name+'.tmp')
    staged.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    staged.replace(out)
    if require_pass and not summary['passed']:
        raise RuntimeError('Synthetic quality gate failed — inspect report')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description='Synthetic image regression gate; NOT a real-disk test')
    parser.add_argument('--out',default='QUALITY-REPORT.json')
    a=parser.parse_args()
    print(json.dumps(run_quality_gate(a.out,require_pass=True)['summary'],indent=2))
