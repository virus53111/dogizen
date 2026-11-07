"""Experimental, READ-ONLY RAID image reconstruction for MURDILIMAX 0.7.

Explicitly configured image members only. No automatic NAS discovery or repair
of physical drives. Supported:
- RAID 0, 1
- RAID 5: md-style symmetric/asymmetric left/right, parity-first/last
- RAID 6: *fixed* P/Q on final two members, GF(2^8) polynomial 0x11d
- RAID 10: near=2 mirror pairs in explicit disk order

RAID6 fixed P/Q is NOT a drop-in mapping for every Linux md, Synology, QNAP,
DDF or proprietary array. Misconfigured input can yield incorrect output.
"""
from __future__ import annotations
import argparse
import hashlib
import itertools
import json
import os
from pathlib import Path
from contextlib import ExitStack

MIN_CHUNK = 4096
MAX_CHUNK = 1024 * 1024
MAX_MEMBERS = 32
RAID5_LAYOUTS = ('left-symmetric', 'left-asymmetric', 'right-symmetric', 'right-asymmetric', 'parity-first', 'parity-last')


def _xor(a: bytes, b: bytes) -> bytes:
    if len(a) != len(b):
        raise ValueError('Unequal RAID chunk lengths')
    return bytes(x ^ y for x, y in zip(a, b))


def _mul(a: int, b: int) -> int:
    out = 0
    while b:
        if b & 1:
            out ^= a
        a <<= 1
        if a & 0x100:
            a ^= 0x11D
        b >>= 1
    return out


def _pow(a: int, n: int) -> int:
    result = 1
    while n:
        if n & 1:
            result = _mul(result, a)
        a = _mul(a, a)
        n >>= 1
    return result


def _inv(a: int) -> int:
    if not a:
        raise ValueError('No inverse for zero')
    return _pow(a, 254)


_TABLES: dict[int, bytes] = {}


def _scale(block: bytes, factor: int) -> bytes:
    if factor == 0:
        return bytes(len(block))
    if factor == 1:
        return block
    table = _TABLES.get(factor)
    if table is None:
        table = bytes(_mul(x, factor) for x in range(256))
        _TABLES[factor] = table
    return block.translate(table)


def _read_chunk(fp, stripe: int, chunk: int) -> bytes:
    fp.seek(stripe * chunk)
    data = fp.read(chunk)
    if len(data) != chunk:
        raise IOError(f'RAID member truncated at stripe {stripe}')
    return data


def _raid5_order(n: int, stripe: int, layout: str) -> tuple[int, list[int]]:
    if layout not in RAID5_LAYOUTS:
        raise ValueError(f'Unsupported RAID5 layout: {layout}')
    if layout == 'parity-first':
        parity = 0
    elif layout == 'parity-last':
        parity = n - 1
    elif layout.startswith('left-'):
        parity = (n - 1 - stripe % n) % n
    else:
        parity = stripe % n
    if layout.endswith('symmetric') and not layout.endswith('asymmetric'):
        order = [(parity + 1 + i) % n for i in range(n - 1)]
    else:
        order = [i for i in range(n) if i != parity]
    return parity, order


def _raid6_recover(pieces: list[bytes | None], chunk: int, verify: bool) -> tuple[list[bytes], bool]:
    # Fixed layout: D0..Dk-1, P, Q; Q=sum((2**i)*Di) in GF(256).
    data_count = len(pieces) - 2
    data = pieces[:data_count]
    p, q = pieces[-2:]
    missing = [i for i, block in enumerate(data) if block is None]
    if len(missing) > 2:
        raise ValueError('RAID6 cannot recover more than two missing data members')
    p_calc = bytes(chunk)
    q_calc = bytes(chunk)
    for i, block in enumerate(data):
        if block is not None:
            p_calc = _xor(p_calc, block)
            q_calc = _xor(q_calc, _scale(block, _pow(2, i)))
    if len(missing) == 1:
        i = missing[0]
        if p is not None:
            data[i] = _xor(p_calc, p)
        elif q is not None:
            data[i] = _scale(_xor(q_calc, q), _inv(_pow(2, i)))
        else:
            raise ValueError('RAID6: no parity left to recover missing data')
    elif len(missing) == 2:
        if p is None or q is None:
            raise ValueError('RAID6: two missing data members need both parity blocks')
        a, b = missing
        delta_p = _xor(p, p_calc)
        delta_q = _xor(q, q_calc)
        ca, cb = _pow(2, a), _pow(2, b)
        recovered_a = _scale(_xor(delta_q, _scale(delta_p, cb)), _inv(ca ^ cb))
        data[a] = recovered_a
        data[b] = _xor(delta_p, recovered_a)
    if any(block is None for block in data):
        raise ValueError('RAID6 data reconstruction incomplete')
    verified = False
    if verify:
        computed_p = bytes(chunk)
        computed_q = bytes(chunk)
        for i, block in enumerate(data):
            computed_p = _xor(computed_p, block)
            computed_q = _xor(computed_q, _scale(block, _pow(2, i)))
        if p is not None and computed_p != p:
            raise ValueError('RAID6 P parity mismatch')
        if q is not None and computed_q != q:
            raise ValueError('RAID6 Q parity mismatch')
        # When two data chunks are missing, P and Q are both used to solve them:
        # the check is then an identity, not independent evidence.
        verified = (len(missing) == 0 and (p is not None or q is not None)) or (len(missing) == 1 and p is not None and q is not None)
    return data, verified


def _inspect_members(members: list[str | None], output: str, level: int, chunk: int, layout: str):
    n = len(members)
    if level not in (0, 1, 5, 6, 10):
        raise ValueError('RAID level must be one of 0, 1, 5, 6, 10')
    if not (MIN_CHUNK <= chunk <= MAX_CHUNK) or (chunk & (chunk - 1)):
        raise ValueError('Chunk must be a power of 2 from 4 KiB to 1 MiB')
    if n > MAX_MEMBERS or n < (4 if level in (6, 10) else 3 if level == 5 else 2):
        raise ValueError('Unsupported member count for selected RAID level')
    if level == 10 and n % 2:
        raise ValueError('RAID10 near=2 requires an even number of members')
    if level == 5 and layout not in RAID5_LAYOUTS:
        raise ValueError('Unsupported RAID5 layout')
    if level == 6 and layout != 'fixed-pq-last':
        raise ValueError('RAID6 supports fixed-pq-last only; Linux md layouts are not interchangeable')
    if level == 10 and layout != 'near-2':
        raise ValueError('RAID10 supports near-2 only')
    missing = [i for i, m in enumerate(members) if m is None or m == '-']
    if level == 0 and missing or level == 1 and len(missing) >= n or level == 5 and len(missing) > 1 or level == 6 and len(missing) > 2:
        raise ValueError('Too many missing RAID members')
    if level == 10 and any(all(i in missing for i in (j, j + 1)) for j in range(0, n, 2)):
        raise ValueError('RAID10 missing both members of one mirror pair')
    real = [Path(m).resolve() for m in members if m is not None and m != '-']
    if len(set(real)) != len(real):
        raise ValueError('Duplicate member image')
    out = Path(output).resolve()
    if out in real:
        raise ValueError('Output must not overwrite an input image')
    # Require equal-size, raw, chunk-aligned members; we cannot infer metadata offsets.
    # Do not silently assemble Linux MD images at the wrong byte offset.
    from murdilimax_md import probe_md12
    if any(probe_md12(str(p)) is not None for p in real):
        raise ValueError('Linux MD v1.2 metadata detected; inspect and extract DATA portions with murdilimax_md.py before assembling')
    sizes = [os.path.getsize(p) for p in real]
    if not sizes or min(sizes) < chunk or len(set(sizes)) != 1 or sizes[0] % chunk:
        raise ValueError('Members must have equal sizes aligned to RAID chunk size')
    stripes = sizes[0] // chunk
    if stripes > 100_000_000:
        raise ValueError('Excessive RAID image size')
    return missing, out, stripes, n


def assemble(members: list[str | None], out_path: str, level: int, chunk: int = 65536,
             verify_parity: bool = False, *, layout: str | None = None, progress=None):
    """Assemble a NEW logical image from existing member images without writing to sources.

    A temporary .part is used. On mismatch or error it is removed; the destination
    appears only after a complete, checked assembly. The output path must not exist.
    """
    if layout is None:
        layout = 'left-symmetric' if level == 5 else 'fixed-pq-last' if level == 6 else 'near-2' if level == 10 else 'default'
    missing, out, stripes, n = _inspect_members(members, out_path, level, chunk, layout)
    if out.exists():
        raise FileExistsError('Output file already exists')
    tmp = out.with_name(out.name + '.mrd-part')
    if tmp.exists():
        raise FileExistsError('Previous incomplete output exists; move it before starting')
    tmp.parent.mkdir(parents=True, exist_ok=True)
    sha = hashlib.sha256()
    verified_count = 0
    warning = ''
    if level == 6:
        warning = 'RAID6 fixed P/Q layout only; not verified against vendor NAS metadata'
    if level == 10:
        warning = 'RAID10 near=2 pair ordering must be provided explicitly'
    try:
        with ExitStack() as stack:
            files = [None if member is None or member == '-' else stack.enter_context(open(member, 'rb', buffering=1024 * 1024)) for member in members]
            with open(tmp, 'xb') as dst:
                for stripe in range(stripes):
                    if level == 1:
                        blocks = [_read_chunk(f, stripe, chunk) for f in files if f is not None]
                        if verify_parity and any(b != blocks[0] for b in blocks[1:]):
                            raise ValueError(f'RAID1 mirrors disagree at stripe {stripe}')
                        if verify_parity and len(blocks) >= 2:
                            verified_count += 1
                        data_blocks = [blocks[0]]
                    elif level == 10:
                        data_blocks = []
                        for j in range(0, n, 2):
                            copies = [_read_chunk(f, stripe, chunk) for f in files[j:j + 2] if f is not None]
                            if verify_parity and len(copies) == 2:
                                if copies[0] != copies[1]:
                                    raise ValueError(f'RAID10 mirror pair {j//2} disagrees at stripe {stripe}')
                            data_blocks.append(copies[0])
                        if verify_parity and not missing:
                            verified_count += 1
                    else:
                        pieces = [None if f is None else _read_chunk(f, stripe, chunk) for f in files]
                        if level == 0:
                            data_blocks = pieces
                        elif level == 5:
                            parity, order = _raid5_order(n, stripe, layout)
                            if missing:
                                reconstructed = bytes(chunk)
                                for piece in pieces:
                                    if piece is not None:
                                        reconstructed = _xor(reconstructed, piece)
                                pieces[missing[0]] = reconstructed
                            if verify_parity and not missing:
                                checksum = bytes(chunk)
                                for piece in pieces:
                                    checksum = _xor(checksum, piece)
                                if any(checksum):
                                    raise ValueError(f'RAID5 parity mismatch at stripe {stripe}')
                                verified_count += 1
                            data_blocks = [pieces[i] for i in order]
                        else:
                            try:
                                data_blocks, verified = _raid6_recover(pieces, chunk, verify_parity)
                            except ValueError as e:
                                raise ValueError(f'RAID6 stripe {stripe}: {e}') from e
                            verified_count += int(verified)
                    for block in data_blocks:
                        dst.write(block)
                        sha.update(block)
                    if progress and stripe % 16 == 0:
                        progress(stripe + 1, stripes)
                dst.flush()
                os.fsync(dst.fileno())
        os.replace(tmp, out)
    except BaseException:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            pass
        raise
    return {
        'level': level, 'layout': layout, 'stripe_bytes': chunk, 'members': n,
        'missing': missing, 'bytes': out.stat().st_size, 'sha256': sha.hexdigest(),
        'output': str(out), 'verified_stripes': verified_count, 'total_stripes': stripes,
        'warning': warning,
    }


def probe_raid5_start(members: list[str], chunk: int = 65536, limit_members: int = 5) -> list[dict]:
    """Read-only HINTS for RAID5 order/layout if filesystem boot sector is at byte 0.

    Nothing is inferred if no strongly recognizable boot header is present; valid
    arrays often start with a partition table or metadata, and will not be found.
    This is NOT vendor NAS auto-assembly. Never use suggestions without verifying.
    """
    n = len(members)
    if n < 3 or n > limit_members:
        raise ValueError('RAID5 hint search supports 3-5 known image members only')
    real = [Path(p).resolve() for p in members]
    if len(set(real)) != n or any(not p.is_file() for p in real):
        raise ValueError('Provide distinct existing member images')
    if chunk < MIN_CHUNK or chunk > MAX_CHUNK or chunk & (chunk - 1):
        raise ValueError('Invalid chunk size')
    heads = []
    for p in real:
        with open(p, 'rb') as f:
            heads.append(f.read(512))
    candidates = []
    for layout in RAID5_LAYOUTS:
        _, order = _raid5_order(n, 0, layout)
        for perm in itertools.permutations(range(n)):
            first = heads[perm[order[0]]]
            if len(first) < 512 or first[510:512] != b'\x55\xaa':
                continue
            sector = int.from_bytes(first[11:13], 'little')
            if first[3:11] in (b'NTFS    ', b'EXFAT   ') and sector in (512, 1024, 2048, 4096):
                candidates.append({'layout': layout, 'member_order': list(perm),
                                   'signature': first[3:11].decode('ascii').strip(),
                                   'confidence': 'weak_boot_signature_only'})
    # Remove equivalent candidates differing only in disk ordering beyond first block.
    unique = {}
    for candidate in candidates:
        index = candidate['member_order'][_raid5_order(n, 0, candidate['layout'])[1][0]]
        unique.setdefault((index, candidate['signature']), candidate)
    return list(unique.values())


def main():
    cli = argparse.ArgumentParser(description='Build RAID image from READ-ONLY member images; explicit parameters mandatory')
    cli.add_argument('--level', required=True, type=int, choices=(0, 1, 5, 6, 10))
    cli.add_argument('--chunk-kib', type=int, default=64)
    cli.add_argument('--layout', help='RAID5 left/right symmetric/asymmetric or parity-first/last; RAID6 fixed-pq-last; RAID10 near-2')
    cli.add_argument('--output', required=True)
    cli.add_argument('--verify-parity', action='store_true')
    cli.add_argument('members', nargs='+', help='Ordered image paths; use - for a missing member')
    a = cli.parse_args()
    print(json.dumps(assemble(a.members, a.output, a.level, a.chunk_kib * 1024,
                              a.verify_parity, layout=a.layout), indent=2))


if __name__ == '__main__':
    main()
