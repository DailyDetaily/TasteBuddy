import hashlib
import importlib.util
import json
import base64
import subprocess
import sys
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('drive_archive', Path(__file__).with_name('drive-archive.py'))
archive = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archive)


class RestoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'project'
        self.root.mkdir()
        self.zip = self.base / 'test.zip'
        self.relative = 'output/example/file.bin'
        self.body = b'archived evidence\x00\xff'
        with zipfile.ZipFile(self.zip, 'w') as z:
            z.writestr(self.relative, self.body)
        self.package = {'bytes': self.zip.stat().st_size, 'sha256': archive.digest(self.zip), 'files': [
            {'path': self.relative, 'bytes': len(self.body), 'sha256': hashlib.sha256(self.body).hexdigest(),
             'mtime_ns': 1700000000000000000, 'mode': 0o644}]}

    def test_restore_and_idempotency(self):
        self.assertEqual(archive.restore(self.zip, self.package, self.root)['restored'], 1)
        self.assertEqual((self.root / self.relative).read_bytes(), self.body)
        self.assertEqual(archive.restore(self.zip, self.package, self.root)['already_present'], 1)

    def test_dry_run(self):
        self.assertEqual(archive.restore(self.zip, self.package, self.root, dry_run=True)['would_restore'], 1)
        self.assertFalse((self.root / self.relative).exists())

    def test_conflict_preserves_local_content(self):
        target = self.root / self.relative
        target.parent.mkdir(parents=True)
        target.write_bytes(b'new work')
        with self.assertRaisesRegex(ValueError, 'Local content differs'):
            archive.restore(self.zip, self.package, self.root)
        self.assertEqual(target.read_bytes(), b'new work')

    def test_corrupt_archive(self):
        self.zip.write_bytes(self.zip.read_bytes() + b'corrupt')
        with self.assertRaisesRegex(ValueError, 'Archive checksum'):
            archive.restore(self.zip, self.package, self.root)

    def test_corrupt_member_hash(self):
        self.package['files'][0]['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'File checksum'):
            archive.restore(self.zip, self.package, self.root)
        self.assertFalse((self.root / self.relative).exists())

    def test_traversal(self):
        for path in ('../escape', '/tmp/escape', 'output/../../escape', 'src/app.tsx'):
            with self.assertRaises(ValueError):
                archive.safe_target(self.root, path)

    def test_symlink_parent(self):
        outside = self.base / 'outside'
        outside.mkdir()
        (self.root / 'output').symlink_to(outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            archive.restore(self.zip, self.package, self.root)
        self.assertEqual(list(outside.iterdir()), [])

    def test_split_archive_reassembly(self):
        self.package['name'] = 'example.zip'
        parts = []
        body = self.zip.read_bytes()
        for i, chunk in enumerate((body[:40], body[40:])):
            path = self.base / f'example.zip.{i+1:03}'
            path.write_bytes(chunk)
            parts.append({'name': path.name, 'bytes': len(chunk), 'sha256': archive.digest(path)})
        self.package['parts'] = parts
        combined, temporary = archive.locate(self.package, self.base / 'manifest.json', str(self.base))
        self.assertTrue(temporary)
        try:
            self.assertEqual(archive.restore(combined, self.package, self.root)['restored'], 1)
        finally:
            combined.unlink()
        (self.base / parts[0]['name']).write_bytes(b'wrong')
        with self.assertRaisesRegex(ValueError, 'part checksum'):
            archive.locate(self.package, self.base / 'manifest.json', str(self.base))

    def test_shared_member_restores_independent_paths_and_metadata(self):
        record = self.package['files'][0]
        record['member'] = 'objects/' + record['sha256']
        other = {**record, 'path': 'build/old-preview/file.bin', 'mode': 0o600,
                 'mtime_ns': record['mtime_ns'] - 1000000000}
        self.package['files'].append(other)
        with zipfile.ZipFile(self.zip, 'w') as z:
            z.writestr(record['member'], self.body)
        self.package.update(bytes=self.zip.stat().st_size, sha256=archive.digest(self.zip))
        self.assertEqual(archive.restore(self.zip, self.package, self.root)['restored'], 2)
        first, second = self.root / record['path'], self.root / other['path']
        self.assertEqual(first.read_bytes(), second.read_bytes())
        self.assertNotEqual(first.stat().st_ino, second.stat().st_ino)
        self.assertEqual(second.stat().st_mode & 0o777, 0o600)
        self.assertEqual(second.stat().st_mtime_ns, other['mtime_ns'])
        first.write_bytes(b'new local work')
        self.assertEqual(second.read_bytes(), self.body)

    def test_registry_includes_old_and_new_manifests(self):
        registry = self.base / 'registry.json'
        registry.write_text(json.dumps({'manifests': ['old.json', 'new.json']}))
        for name in ('old', 'new'):
            (self.root / f'{name}.json').write_text(json.dumps({'archives': [{'name': name + '.zip'}]}))
        loaded = archive.load_manifests(root=self.root, registry=registry)
        self.assertEqual([m['archives'][0]['name'] for _, m in loaded], ['old.zip', 'new.zip'])
        explicit = archive.load_manifests(self.root / 'new.json', root=self.root, registry=registry)
        self.assertEqual(len(explicit), 1)
        self.assertEqual(explicit[0][1]['archives'][0]['name'], 'new.zip')

    def test_registry_rejects_escaping_paths(self):
        registry = self.base / 'registry.json'
        registry.write_text(json.dumps({'manifests': ['../outside.json']}))
        with self.assertRaisesRegex(ValueError, 'escapes project'):
            archive.load_manifests(root=self.root, registry=registry)

    def test_registry_rejects_ambiguous_package_names(self):
        registry = self.base / 'registry.json'
        registry.write_text(json.dumps({'manifests': ['old.json', 'new.json']}))
        for name in ('old', 'new'):
            (self.root / f'{name}.json').write_text(json.dumps({'archives': [{'name': 'same.zip'}]}))
        with self.assertRaisesRegex(ValueError, 'Duplicate package names'):
            archive.load_manifests(root=self.root, registry=registry)

    @unittest.skipUnless(sys.platform == 'darwin', 'Mac extended attribute preservation')
    def test_restores_mac_extended_attribute(self):
        value = b'archive metadata\x00\xff'
        self.package['files'][0]['xattrs'] = {'com.tastebuddy.archive-test': base64.b64encode(value).decode()}
        archive.restore(self.zip, self.package, self.root)
        raw = subprocess.check_output(['/usr/bin/xattr', '-px', 'com.tastebuddy.archive-test', str(self.root / self.relative)])
        self.assertEqual(bytes.fromhex(raw.decode()), value)


if __name__ == '__main__':
    unittest.main()
