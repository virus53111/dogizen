"""Independent synthetic-image tests for RAID stage 3. No physical disks touched."""
import hashlib
import itertools
from pathlib import Path
import tempfile
import unittest

from murdilimax_raid import assemble, _raid5_order, probe_raid5_start

CHUNK = 4096


def gf2mul(a, b):
    result = 0
    for _ in range(8):
        if b & 1:
            result ^= a
        high = a & 0x80
        a = (a << 1) & 0xff
        if high:
            a ^= 0x1d
        b >>= 1
    return result


def coeff(power):
    result = 1
    for _ in range(power):
        result = gf2mul(result, 2)
    return result


def xor_blocks(blocks):
    result = bytearray(len(blocks[0]))
    for block in blocks:
        for i, b in enumerate(block):
            result[i] ^= b
    return bytes(result)


def blocks_for_stripe(stripe, data_count):
    return [bytes(((i * 61 + stripe * 13 + x * 17) & 255) for x in range(CHUNK)) for i in range(data_count)]


class RaidStage3Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def put(self, name, content):
        p = self.root / name
        p.write_bytes(content)
        return str(p)

    def verify(self, members, level, expected, **opts):
        out = str(self.root / 'out.img')
        Path(out).unlink(missing_ok=True)
        result = assemble(members, out, level, CHUNK, True, **opts)
        self.assertEqual(Path(out).read_bytes(), expected)
        self.assertEqual(result['sha256'], hashlib.sha256(expected).hexdigest())
        self.assertFalse(Path(out + '.mrd-part').exists())
        return result

    def raid5(self, layout='left-symmetric', n=4, stripes=4):
        mem = [bytearray() for _ in range(n)]
        logical = bytearray()
        for stripe in range(stripes):
            data = blocks_for_stripe(stripe, n-1)
            parity, order = _raid5_order(n, stripe, layout)
            for i, block in zip(order, data):
                mem[i] += block
            mem[parity] += xor_blocks(data)
            logical += b''.join(data)
        return [self.put('m%d.img'%i, block) for i,block in enumerate(mem)], bytes(logical)

    def test_raid5_all_six_layouts(self):
        for layout in ('left-symmetric','left-asymmetric','right-symmetric','right-asymmetric','parity-first','parity-last'):
            with self.subTest(layout=layout):
                members, expected = self.raid5(layout)
                self.verify(members, 5, expected, layout=layout)

    def test_raid5_each_missing_position(self):
        members, expected = self.raid5('right-asymmetric')
        for i in range(4):
            with self.subTest(missing=i):
                trial = members.copy();trial[i] = None
                output = str(self.root/'out.img');Path(output).unlink(missing_ok=True)
                result = assemble(trial, output, 5, CHUNK, True, layout='right-asymmetric')
                self.assertEqual(Path(output).read_bytes(), expected)
                self.assertEqual(result['missing'], [i])

    def raid6(self, n=5, stripes=3):
        mem = [bytearray() for _ in range(n)]
        logical = bytearray()
        for s in range(stripes):
            data = blocks_for_stripe(s, n - 2)
            p = xor_blocks(data)
            q = bytearray(CHUNK)
            for di, block in enumerate(data):
                coef = coeff(di)
                for k, b in enumerate(block):
                    q[k] ^= gf2mul(coef, b)
            for i, block in enumerate(data + [p, bytes(q)]):
                mem[i] += block
            logical += b''.join(data)
        return [self.put('r6m%d.img'%i,block) for i,block in enumerate(mem)], bytes(logical)

    def test_raid6_all_combinations_of_two_missing(self):
        members, expected = self.raid6()
        for missing in itertools.combinations(range(5),2):
            with self.subTest(missing=missing):
                candidate = members.copy()
                for i in missing:candidate[i] = '-'
                result = self.verify(candidate,6,expected,layout='fixed-pq-last')
                self.assertEqual(result['missing'],list(missing))

    def test_raid6_one_missing_and_intact(self):
        members, expected = self.raid6()
        for missing in range(5):
            with self.subTest(missing=missing):
                trial = members.copy();trial[missing]=None
                self.verify(trial,6,expected,layout='fixed-pq-last')
        intact = self.verify(members,6,expected,layout='fixed-pq-last')
        self.assertEqual(intact['verified_stripes'],3)

    def test_raid6_parity_mismatch_is_atomic(self):
        members, expected = self.raid6()
        corrupt = bytearray(Path(members[4]).read_bytes());corrupt[7] ^= 0xFF
        members[4] = self.put('corrupt.img', corrupt)
        out = str(self.root/'bad.img')
        with self.assertRaisesRegex(ValueError,'Q parity mismatch'):
            assemble(members,out,6,CHUNK,True,layout='fixed-pq-last')
        self.assertFalse(Path(out).exists())
        self.assertFalse(Path(out+'.mrd-part').exists())

    def test_raid10_near2_losing_one_per_mirror_pair(self):
        mem = [bytearray() for _ in range(6)]
        expected = bytearray()
        for stripe in range(3):
            data = blocks_for_stripe(stripe,3)
            expected += b''.join(data)
            for pair, block in enumerate(data):
                mem[2*pair]+=block;mem[2*pair+1]+=block
        paths = [self.put('r10%d.img'%i,b) for i,b in enumerate(mem)]
        trial = paths.copy();trial[0]=None;trial[3]='-';trial[5]=None
        self.verify(trial,10,bytes(expected),layout='near-2')
        self.verify(paths,10,bytes(expected),layout='near-2')
        trial[1]=None
        with self.assertRaisesRegex(ValueError,'mirror pair'):
            assemble(trial,str(self.root/'unrecoverable.img'),10,CHUNK,layout='near-2')

    def test_raid1_mirror_mismatch(self):
        first = self.put('one.img',b'a'*CHUNK)
        second = self.put('two.img',b'b'*CHUNK)
        with self.assertRaisesRegex(ValueError,'disagree'):
            assemble([first,second],str(self.root/'bad.img'),1,CHUNK,True)
        self.assertFalse((self.root/'bad.img').exists())

    def test_raid5_probe_is_only_weak_hint(self):
        members, _ = self.raid5('left-symmetric', 3, 1)
        # Set a recognizable NTFS volume boot sector in first logical data chunk.
        first_member = _raid5_order(3,0,'left-symmetric')[1][0]
        data = bytearray(Path(members[first_member]).read_bytes())
        data[0:3]=b'\xeb\x52\x90';data[3:11]=b'NTFS    '
        data[11:13] = (512).to_bytes(2,'little')
        data[510:512]=b'\x55\xaa'
        Path(members[first_member]).write_bytes(data)
        hints=probe_raid5_start(members,CHUNK)
        self.assertTrue(any(h['signature']=='NTFS' and h['confidence']=='weak_boot_signature_only' for h in hints))

    def test_raid6_rejects_unknown_vendor_layout(self):
        members, _ = self.raid6()
        with self.assertRaisesRegex(ValueError,'fixed-pq-last'):
            assemble(members,str(self.root/'nope.img'),6,CHUNK,layout='left-symmetric')

    def test_not_overwriting_source_or_output(self):
        members,expected=self.raid6()
        with self.assertRaisesRegex(ValueError,'overwrite'):
            assemble(members,members[0],6,CHUNK)
        output=self.root/'already.img';output.write_bytes(b'important')
        with self.assertRaises(FileExistsError):
            assemble(members,str(output),6,CHUNK)
        self.assertEqual(output.read_bytes(),b'important')

if __name__=='__main__':unittest.main()
