#!/usr/bin/env python3
"""Ground-truth benchmark harness for MURDILIMAX and disk image corpora.

Use only known test images. This does not benchmark third-party programs; those
need equivalent runs and independent verification using identical ground truth.
"""
from __future__ import annotations
import argparse
import hashlib
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import time
from murdilimax_engine import scan_image, recover
from murdilimax_devices import is_physical


def evaluate(manifest_file: str, output_file: str, *, max_candidates: int = 1000, include_unknown: bool = False) -> dict:
    if not 1 <= max_candidates <= 100_000:
        raise ValueError('Invalid max candidates')
    inputfile=Path(manifest_file).resolve(strict=True)
    data=json.loads(inputfile.read_text(encoding='utf-8'))
    cases=data.get('cases')
    if not isinstance(cases,list) or not cases:
        raise ValueError('Manifest must contain nonempty cases list')
    report={'tool':'MURDILIMAX 0.9.1 benchmark', 'utc':datetime.now(timezone.utc).isoformat(), 'scope':'Local known test images only — not a competitor benchmark or real-disk certification', 'real_world_validated':False, 'cases':[]}
    for case in cases:
        if not isinstance(case,dict):raise ValueError('Invalid case entry')
        file=Path(case['image'])
        if not file.is_absolute():file=(inputfile.parent/file).resolve()
        if is_physical(str(file)) or not file.is_file():raise ValueError('Benchmark only accepts existing image files')
        expected=case.get('expected_sha256')
        if not isinstance(expected,list) or not expected or any(not isinstance(x,str) or len(x)!=64 or any(c not in '0123456789abcdefABCDEF' for c in x) for x in expected):
            raise ValueError('expected_sha256 must contain one or more valid full 64-digit hashes')
        expected_counts=Counter(v.lower() for v in expected)
        start=time.monotonic()
        candidates, volumes, warnings=scan_image(str(file), limit=max_candidates)
        restored=Counter();failed=0;attempted=0
        with TemporaryDirectory(prefix='murdilimax-benchmark-') as tmp:
            for cand in candidates[:max_candidates]:
                if not cand.eligible or (cand.state=='unknown' and not include_unknown):continue
                attempted+=1
                try:
                    result=recover(str(file),cand,tmp,allow_unknown=include_unknown)
                    output=Path(result['path']).resolve(strict=True)
                    if Path(tmp).resolve() not in output.parents:
                        raise ValueError('Recovery output escaped benchmark directory')
                    digest=hashlib.sha256()
                    with output.open('rb') as stream:
                        for block in iter(lambda:stream.read(1024*1024),b''):
                            digest.update(block)
                    if digest.hexdigest()!=result.get('sha256'):
                        raise ValueError('Reported digest mismatches recovered bytes')
                    restored[digest.hexdigest()]+=1
                except (ValueError,OSError,IOError):failed+=1
        matched=sum(min(restored[h],cnt) for h,cnt in expected_counts.items())
        good=sum(restored.values())
        case_report={'name':case.get('name',file.name),'source':str(file),'expected_count':sum(expected_counts.values()),
                     'candidates':len(candidates),'attempted_recoveries':attempted,'successful_recoveries':good,
                     'failed_recoveries':failed,'exact_content_matches':matched,
                     'recall':round(matched/max(1,sum(expected_counts.values())),4),
                     'precision_vs_manifest':round(matched/max(1,good),4),
                     'elapsed_seconds':round(time.monotonic()-start,3),
                     'warnings':warnings,
                     'note':'Precision assumes the supplied expected hash list fully enumerates recoverable files.'}
        report['cases'].append(case_report)
    out=Path(output_file).resolve()
    if out.exists():raise FileExistsError('Benchmark refuses to overwrite an existing report')
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return report


def main():
    parser=argparse.ArgumentParser(description='MURDILIMAX 0.4 ground-truth benchmark')
    parser.add_argument('manifest',help='JSON corpus manifest with cases [{image, expected_sha256:[...]}]')
    parser.add_argument('--out',default='murdilimax-benchmark-report.json')
    parser.add_argument('--max-candidates',type=int,default=1000)
    parser.add_argument('--include-unknown',action='store_true',help='Recover candidates with uncertain allocation in temporary output')
    args=parser.parse_args()
    r=evaluate(args.manifest,args.out,max_candidates=args.max_candidates,include_unknown=args.include_unknown)
    print(json.dumps(r['cases'],ensure_ascii=False,indent=2))

if __name__=='__main__':main()
