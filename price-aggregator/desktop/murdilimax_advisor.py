"""Deterministic offline guidance; not an AI diagnosis, no destructive operations."""
from __future__ import annotations
from dataclasses import dataclass
@dataclass(frozen=True)
class Advice:
    severity:str
    title:str
    explanation:str
    next_step:str
def advise(*,state:str='unknown',fs:str='',kind:str='',deleted:bool=True,reason:str='',
           source_physical:bool=False,known_bad_bytes:int=0,format_result:str='')->list[Advice]:
    out=[]
    if source_physical:
        out.append(Advice('caution','Physical device','Reading a failing drive can worsen damage.',
            'Stop for clicking or disconnecting drives; acquire an image to a healthy destination.'))
    if known_bad_bytes>0:
        out.append(Advice('warning','Unreadable source areas',
            f'The acquisition reported {known_bad_bytes:,} unreadable bytes; zero fill is not recovered data.',
            'Review the bad-sector map. A hash of the image cannot prove missing bytes were recovered.'))
    if state in ('allocated','overwritten','occupied'):
        out.append(Advice('danger','Source clusters reused','Some file data may have been overwritten.',
            'Do not trust this candidate without validation; never write to the source.'))
    elif state=='unknown':
        out.append(Advice('caution','Allocation cannot be confirmed',
            'Filesystem metadata cannot prove that the file content is available.',
            'Preview before recovery and verify outputs on a different drive.'))
    elif state=='free' and deleted:
        out.append(Advice('info','Deleted metadata retained',
            'The file extent may remain intact or may be incomplete or fragmented.',
            'Recover elsewhere and validate the contents.'))
    if fs.lower() in ('ext4','ext3') and deleted:
        out.append(Advice('caution','ext4 deletion support limited',
            'Deleted inode and journal recovery is not fully implemented.',
            'Use a read-only disk image and specialist tools for ext4 undelete.'))
    if 'crypt' in kind.casefold() or 'wallet' in kind.casefold():
        out.append(Advice('privacy','Wallet backup — sensitive',
            'A filename match does not verify wallet validity, ownership or funds.',
            'Keep offline; never upload secrets to websites; consult official wallet recovery instructions.'))
    if format_result in ('signature_mismatch','possibly_truncated','read_error','corrupt'):
        out.append(Advice('warning','Content may be damaged',
            'File format verification detected missing or invalid structures.',
            'Compare to independent backups; treat recovered files as untrusted.'))
    if not out:
        out.append(Advice('info','No definite error indicated',
            'A successful metadata or format check is not a guarantee of complete recovery.',
            'Compare against a known-good backup or checksum if available.'))
    return out
