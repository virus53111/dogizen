#!/usr/bin/env python3
"""Neutral SHA-256 comparison of independently supplied recovery output folders.
Does not run other tools; never claims field-validation or comparative superiority.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path

HEX=set('0123456789abcdef')

def _hash(path:Path)->str:
    dig=sha256()
    with path.open('rb') as f:
        for data in iter(lambda:f.read(1024*1024),b''):dig.update(data)
    return dig.hexdigest()

def evaluate_comparison(manifest_path:str|Path,out_path:str|Path,*,file_limit:int=20000)->dict:
    if not 1<=file_limit<=100000:raise ValueError('Invalid file_limit')
    out=Path(out_path).resolve()
    if out.exists():raise FileExistsError('Comparison report already exists; refusing to overwrite')
    manifest=Path(manifest_path).resolve(strict=True)
    data=json.loads(manifest.read_text(encoding='utf-8'))
    cases=data.get('cases')
    if not isinstance(cases,list) or not cases:raise ValueError('Manifest needs cases')
    report={'type':'independent output hash comparison',
            'utc':datetime.now(timezone.utc).isoformat(),
            'scope':'Only supplied output files are tested, no recovery products are executed or independently certified',
            'cases':[]}
    for case in cases:
        if not isinstance(case,dict) or not isinstance(case.get('id'),str) or not case['id'].strip():
            raise ValueError('Case needs nonempty id')
        truth=case.get('expected_sha256')
        if not isinstance(truth,list) or not truth or len(truth)>file_limit or any(
            not isinstance(x,str) or len(x)!=64 or not set(x.lower())<=HEX for x in truth):
            raise ValueError('Each case needs valid expected_sha256 hash inventory')
        expected=Counter(x.lower() for x in truth)
        runs=case.get('runs')
        if not isinstance(runs,list) or not runs:raise ValueError('Case requires tool runs')
        reported=[];seen=set()
        for run in runs:
            if not isinstance(run,dict) or not isinstance(run.get('tool'),str) or not run['tool'].strip():
                raise ValueError('Each run needs tool name')
            name=run['tool'].strip()
            if name in seen:raise ValueError('Duplicate tool')
            seen.add(name)
            directory=Path(run['output_dir'])
            if not directory.is_absolute():directory=manifest.parent/directory
            directory=directory.resolve(strict=True)
            if not directory.is_dir():raise ValueError('Output dir not a directory')
            files=[]
            for entry in directory.rglob('*'):
                if entry.is_symlink():raise ValueError('Symlink in output refused')
                if entry.is_file():
                    files.append(entry)
                    if len(files)>file_limit:raise ValueError('Output file limit exceeded')
            got=Counter(_hash(path) for path in files)
            exact=sum(min(got[digest],count) for digest,count in expected.items())
            reported.append({'tool':name,'output_files':len(files),
                             'exact_matches':exact,'expected_count':sum(expected.values()),
                             'exact_recall':round(exact/sum(expected.values()),5),
                             'unmatched_output_files':len(files)-exact,
                             'note':'Unmatched output is not necessarily false: truth inventory may be incomplete.'})
        report['cases'].append({'case_id':case['id'],'runs':reported})
    out.parent.mkdir(parents=True,exist_ok=True)
    temp=out.with_name(out.name+'.tmp')
    temp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temp.replace(out)
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser(description='Local fair comparison of recovered outputs')
    p.add_argument('manifest');p.add_argument('--out',default='COMPARISON-REPORT.json')
    a=p.parse_args()
    r=evaluate_comparison(a.manifest,a.out)
    print('Compared cases:',len(r['cases']))
