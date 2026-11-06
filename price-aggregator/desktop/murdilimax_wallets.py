"""Conservative local filename-only wallet backup finder. No secret reading or network."""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from collections.abc import Callable
import os, re
MAX_VISITED=300_000
MAX_RESULTS=20_000
MAX_NAME=255
@dataclass(frozen=True)
class WalletFinding:
    relative_path:str
    label:str
    size_bytes:int
    evidence:str
    def display(self):
        return {'name':self.relative_path,'family':self.label,'size_bytes':self.size_bytes,
                'evidence':self.evidence,'note':'Filename match only; no secrets inspected.'}
def recognize_backup(filename:str,parent:str='')->tuple[str,str]|None:
    name=filename.casefold().strip()
    folder=parent.casefold().replace('\\','/')
    if not name or len(name)>MAX_NAME:return None
    if name=='wallet.dat' or re.fullmatch(r'wallet(?:-[0-9]{4,}|_[0-9]{4,})?\.dat',name):
        return 'Bitcoin Core','wallet.dat-style backup name'
    if name.endswith('.wallet') or name=='default_wallet' or name.startswith('electrum_wallet_'):
        return 'Electrum / compatible wallet','wallet filename or extension'
    if re.fullmatch(r'utc--[^/\\]{8,220}',name) and ('keystore' in folder or 'ethereum' in folder):
        return 'Ethereum keystore','UTC-- filename in known keystore directory'
    if (name.startswith('keystore--') and name.endswith('.json')) or re.fullmatch(r'utc--[^/\\]{8,220}\.json',name):
        return 'Ethereum keystore','keystore filename pattern'
    if name in ('exodus.wallet','wallet.backup','wallet.aes.json'):
        return 'Wallet backup','known wallet backup name'
    if name.endswith(('.json','.dat','.bak')) and 'wallets' in folder and ('electrum' in folder or 'keystore' in folder) and name not in ('config.json','settings.json'):
        return 'Wallet data in wallet directory','wallet-specific parent folder'
    return None
def discover_wallet_backups(root:str|os.PathLike[str],*,cancelled:Callable[[],bool]|None=None,
                            max_visited:int=MAX_VISITED,max_results:int=MAX_RESULTS)->tuple[list[WalletFinding],dict]:
    root_path=Path(root).resolve(strict=True)
    if not root_path.is_dir():raise ValueError('Wallet discovery accepts a directory only')
    findings=[];visited=0;skipped=0;errors=0;cancelled_flag=False;limited=False
    def onerror(_):
        nonlocal errors
        errors+=1
    for parent,dirs,files in os.walk(root_path,topdown=True,followlinks=False,onerror=onerror):
        if cancelled and cancelled():cancelled_flag=True;break
        dirs[:]=[d for d in dirs if not os.path.islink(os.path.join(parent,d))]
        for name in files:
            if cancelled and cancelled():cancelled_flag=True;break
            visited+=1
            if visited>max_visited:limited=True;break
            full=os.path.join(parent,name)
            if os.path.islink(full):skipped+=1;continue
            found=recognize_backup(name,os.path.relpath(parent,str(root_path)))
            if not found:continue
            try:size=os.stat(full,follow_symlinks=False).st_size
            except OSError:skipped+=1;continue
            findings.append(WalletFinding(os.path.relpath(full,str(root_path)),found[0],size,found[1]))
            if len(findings)>=max_results:limited=True;break
        if limited or cancelled_flag:break
    return findings,{'visited':min(visited,max_visited),'matches':len(findings),'skipped':skipped,
                     'errors':errors,'cancelled':cancelled_flag,'limit_reached':limited,
                     'method':'filename-only; no secret extraction'}
