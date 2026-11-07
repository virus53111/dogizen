"""MURDILIMAX 0.9 synthetic tests; no private wallet material used."""
import tempfile,sqlite3,struct,unittest
from pathlib import Path
from murdilimax_advisor import advise
from murdilimax_wallets import recognize_backup,discover_wallet_backups
from murdilimax_deepcheck import assess_deep
class WalletTests(unittest.TestCase):
    def test_core(self):self.assertEqual(recognize_backup('wallet.dat')[0],'Bitcoin Core')
    def test_electrum(self):self.assertIsNotNone(recognize_backup('default_wallet'))
    def test_keystore(self):self.assertIsNotNone(recognize_backup('UTC--2022-xxxx','ethereum/keystore'))
    def test_not_generic(self):
        for n in ('backup.zip','my-seed.txt','wallet_ideas.txt','keystore.txt','config.json','private_keys.txt'):
            self.assertIsNone(recognize_backup(n),n)
    def test_symlink_not_followed(self):
        with tempfile.TemporaryDirectory() as d:
            a=Path(d)/'source';a.mkdir();(a/'wallet.dat').write_bytes(b'fixture')
            other=Path(d)/'other';other.mkdir();(other/'wallet.dat').write_bytes(b'fixture')
            try:(a/'external').symlink_to(other,target_is_directory=True)
            except (NotImplementedError,OSError):self.skipTest('symlinks unavailable')
            found,_=discover_wallet_backups(a)
            self.assertEqual(len(found),1)
            self.assertEqual(found[0].relative_path,'wallet.dat')
    def test_limit(self):
        with tempfile.TemporaryDirectory() as d:
            for i in range(7):(Path(d)/f'plain{i}.txt').write_text('x')
            found,stats=discover_wallet_backups(d,max_visited=3)
            self.assertEqual(found,[]);self.assertTrue(stats['limit_reached'])
    def test_cancel(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/'wallet.dat').write_bytes(b'fixture')
            found,stats=discover_wallet_backups(d,cancelled=lambda:True)
            self.assertEqual(found,[]);self.assertTrue(stats['cancelled'])
    def test_requires_folder(self):
        with tempfile.TemporaryDirectory() as d:
            file=Path(d)/'data';file.write_bytes(b'x')
            with self.assertRaises(ValueError):discover_wallet_backups(file)
    def test_no_secret_read(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/'wallet.dat').write_bytes(b'NEVER_EVER_REPORT_THIS_VALUE')
            found,stats=discover_wallet_backups(d)
            self.assertNotIn('NEVER_EVER_REPORT_THIS_VALUE',repr(found)+repr(stats))
class AdvisorTests(unittest.TestCase):
    def test_unreadable(self):self.assertTrue(any(x.severity=='warning' for x in advise(known_bad_bytes=512)))
    def test_wallet_privacy(self):self.assertTrue(any(x.severity=='privacy' for x in advise(kind='Crypto backups',state='free')))
    def test_ext4_caution(self):self.assertTrue(any('ext4' in x.title for x in advise(fs='ext4',deleted=True)))
    def test_no_guarantees(self):self.assertIn('not a guarantee',advise(state='free',deleted=False)[0].explanation)
class DeepChecks(unittest.TestCase):
    def test_sqlite(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'db.sqlite'
            db=sqlite3.connect(p);db.execute('create table t(x integer)');db.execute('insert into t values(5)');db.commit();db.close()
            self.assertEqual(assess_deep(str(p))['result'],'validated_structure')
    def test_bad_sqlite(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'db.sqlite';p.write_bytes(b'not sqlite')
            self.assertEqual(assess_deep(str(p))['result'],'signature_mismatch')
    def test_mp4_boxes(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'video.mp4'
            p.write_bytes(struct.pack('>I4s',16,b'ftyp')+b'isom0000'+struct.pack('>I4s',8,b'moov')+struct.pack('>I4s',9,b'mdat')+b'A')
            self.assertEqual(assess_deep(str(p))['result'],'plausible')
    def test_bad_mp4(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'video.mp4';p.write_bytes(struct.pack('>I4s',10000,b'ftyp')+b'xxxx')
            self.assertEqual(assess_deep(str(p))['result'],'possibly_truncated')
    def test_unknown(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'data.unknown';p.write_bytes(b'x')
            self.assertEqual(assess_deep(str(p))['result'],'not_checked')
if __name__=='__main__':unittest.main()
