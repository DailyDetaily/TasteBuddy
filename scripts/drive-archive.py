#!/usr/bin/env python3
"""Find and safely restore the project's verified Google Drive archive."""
import argparse
import base64
import ctypes
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / 'output/storage/google-drive-20261023/manifest.json'
REGISTRY = ROOT / 'docs/operations/google-drive-archives.json'


def darwin_xattrs():
    lib = ctypes.CDLL('/usr/lib/libSystem.B.dylib', use_errno=True)
    lib.listxattr.argtypes = [ctypes.c_char_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_int]
    lib.listxattr.restype = ctypes.c_ssize_t
    lib.getxattr.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_uint32, ctypes.c_int]
    lib.getxattr.restype = ctypes.c_ssize_t
    lib.setxattr.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_uint32, ctypes.c_int]
    lib.setxattr.restype = ctypes.c_int
    return lib


def read_xattrs(path):
    if hasattr(os, 'listxattr'):
        values = {name: os.getxattr(path, name) for name in os.listxattr(path)}
    elif sys.platform == 'darwin':
        lib, name = darwin_xattrs(), os.fsencode(path)
        count = lib.listxattr(name, None, 0, 0)
        if count < 0:
            raise OSError(ctypes.get_errno(), 'Cannot read extended attributes')
        names = ctypes.create_string_buffer(count)
        if lib.listxattr(name, names, count, 0) != count:
            raise OSError(ctypes.get_errno(), 'Extended attributes changed during read')
        values = {}
        for key in names.raw.rstrip(b'\0').split(b'\0') if count else []:
            size = lib.getxattr(name, key, None, 0, 0, 0)
            if size < 0:
                raise OSError(ctypes.get_errno(), 'Cannot read extended attribute')
            value = ctypes.create_string_buffer(size)
            if lib.getxattr(name, key, value, size, 0, 0) != size:
                raise OSError(ctypes.get_errno(), 'Extended attribute changed during read')
            values[os.fsdecode(key)] = value.raw
    else:
        values = {}
    return {key: base64.b64encode(value).decode('ascii') for key, value in values.items()}


def write_xattrs(path, values):
    for key, encoded in values.items():
        # macOS assigns provenance to the new file and may ignore attempts to
        # copy it. Keep its original value in the manifest for reference.
        if sys.platform == 'darwin' and key == 'com.apple.provenance':
            continue
        value = base64.b64decode(encoded, validate=True)
        if hasattr(os, 'setxattr'):
            os.setxattr(path, key, value)
        elif sys.platform == 'darwin':
            lib = darwin_xattrs()
            if lib.setxattr(os.fsencode(path), os.fsencode(key), value, len(value), 0, 0) != 0:
                raise OSError(ctypes.get_errno(), 'Cannot restore extended attribute')
        else:
            raise ValueError('This system cannot restore the saved extended attributes.')


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def safe_target(root, relative):
    rel = PurePosixPath(relative)
    if not relative or not rel.parts or rel.is_absolute() or '..' in rel.parts or '\\' in relative:
        raise ValueError(f'Unsafe archive path: {relative}')
    if rel.parts[0] not in ('output', 'brand-launch', 'build'):
        raise ValueError(f'Unexpected archive root: {relative}')
    root = Path(root).resolve()
    current = root
    for part in rel.parts:
        current = current / part
        if current.is_symlink():
            raise ValueError(f'Refusing symlink: {current}')
    if not current.is_relative_to(root):
        raise ValueError(f'Path escapes project: {relative}')
    return current


def restore(archive, package, root, query='', dry_run=False):
    archive = Path(archive)
    if archive.stat().st_size != package['bytes'] or digest(archive) != package['sha256']:
        raise ValueError('Archive checksum does not match the saved manifest.')
    selected = [f for f in package['files'] if query.casefold() in f['path'].casefold()]
    if not selected:
        raise ValueError('No files matched. Use find to check the original path.')
    restored = skipped = 0
    with zipfile.ZipFile(archive) as source:
        names = source.namelist()
        if len(names) != len(set(names)):
            raise ValueError('Duplicate ZIP entry names are not allowed.')
        pending = []
        for record in selected:
            target = safe_target(root, record['path'])
            info = source.getinfo(record.get('member', record['path']))
            if stat.S_ISLNK(info.external_attr >> 16) or info.file_size != record['bytes']:
                raise ValueError(f'Invalid ZIP entry: {record["path"]}')
            if target.exists():
                if not target.is_file() or digest(target) != record['sha256']:
                    raise ValueError(f'Local content differs; nothing overwritten: {target}')
                skipped += 1
            else:
                pending.append((record, target))
        if dry_run:
            return {'would_restore': len(pending), 'already_present': skipped}
        for record, target in pending:
            target.parent.mkdir(parents=True, exist_ok=True)
            safe_target(root, record['path'])
            fd, name = tempfile.mkstemp(prefix='.drive-restore-', dir=target.parent)
            temp = Path(name)
            try:
                h = hashlib.sha256()
                with os.fdopen(fd, 'wb') as output, source.open(record.get('member', record['path'])) as input_stream:
                    for block in iter(lambda: input_stream.read(1024 * 1024), b''):
                        h.update(block)
                        output.write(block)
                    output.flush()
                    os.fsync(output.fileno())
                if h.hexdigest() != record['sha256']:
                    raise ValueError(f'File checksum mismatch: {record["path"]}')
                safe_target(root, record['path'])
                # Atomic no-clobber publication: a newly created local file wins.
                os.chmod(temp, record.get('mode', 0o644) & 0o777)
                write_xattrs(temp, record.get('xattrs', {}))
                os.utime(temp, ns=(record['mtime_ns'], record['mtime_ns']))
                os.link(temp, target)
                restored += 1
            finally:
                temp.unlink(missing_ok=True)
        if not query:
            for relative in package.get('empty_directories', []):
                safe_target(root, relative).mkdir(parents=True, exist_ok=True)
    return {'restored': restored, 'already_present': skipped}


def locate(package, manifest_path, supplied):
    supplied_path = Path(supplied).expanduser() if supplied else None
    if supplied_path and supplied_path.is_file() and (supplied_path.name == package['name'] or supplied_path.suffix.lower() == '.zip'):
        return supplied_path, False
    folders = [manifest_path.parent / 'packages', Path.home() / 'Downloads']
    if supplied_path:
        folders.insert(0, supplied_path if supplied_path.is_dir() else supplied_path.parent)
    cloud = Path.home() / 'Library/CloudStorage'
    if cloud.exists():
        for account in cloud.glob('GoogleDrive-*'):
            for drive in account.iterdir():
                if not drive.name.startswith('.'):
                    folders.append(drive / 'Taste Buddy Project Archive')
    whole = next((folder / package['name'] for folder in folders if (folder / package['name']).is_file()), None)
    if whole:
        return whole, False
    parts = package.get('parts', [])
    located = []
    for part in parts:
        path = next((folder / part['name'] for folder in folders if (folder / part['name']).is_file()), None)
        if not path:
            return None, False
        if path.stat().st_size != part['bytes'] or digest(path) != part['sha256']:
            raise ValueError(f'Archive part checksum mismatch: {part["name"]}')
        located.append(path)
    if not located:
        return None, False
    fd, name = tempfile.mkstemp(prefix='taste-buddy-drive-', suffix='.zip')
    combined = Path(name)
    try:
        with os.fdopen(fd, 'wb') as output:
            for path in located:
                with path.open('rb') as stream:
                    for block in iter(lambda: stream.read(1024 * 1024), b''):
                        output.write(block)
        if digest(combined) != package['sha256']:
            raise ValueError('Combined archive checksum mismatch.')
    except BaseException:
        combined.unlink(missing_ok=True)
        raise
    return combined, True


def print_links(package):
    parts = package.get('parts', [])
    if parts:
        for part in parts:
            print(f'  {part["name"]}: {part.get("drive", {}).get("url", "Upload pending")}')
    else:
        print(f'  {package.get("drive", {}).get("url", "Upload pending")}')


def load_manifests(explicit=None, root=ROOT, registry=REGISTRY):
    """Keep old packages discoverable when new archive batches are added."""
    if explicit:
        paths = [Path(explicit)]
    elif Path(registry).is_file():
        paths = []
        for relative in json.loads(Path(registry).read_text())['manifests']:
            path = (Path(root) / relative).resolve()
            if not path.is_relative_to(Path(root).resolve()):
                raise ValueError(f'Manifest escapes project: {relative}')
            paths.append(path)
    else:
        paths = [Path(root) / DEFAULT_MANIFEST.relative_to(ROOT)]
    manifests = [(path, json.loads(path.read_text())) for path in paths]
    names = [p['name'] for _, manifest in manifests for p in manifest['archives']]
    if len(names) != len(set(names)):
        raise ValueError('Duplicate package names across manifests are not allowed.')
    return manifests


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, help='Search one manifest instead of the archive registry')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('list', help='List packages and Drive links')
    find = sub.add_parser('find', help='Find original paths by a word or path fragment')
    find.add_argument('query')
    restore_parser = sub.add_parser('restore', help='Restore a downloaded ZIP without overwriting local changes')
    restore_parser.add_argument('package', help='Exact package name from list/find')
    restore_parser.add_argument('--from', dest='source', help='Downloaded ZIP path; otherwise check Downloads and Drive')
    restore_parser.add_argument('--match', default='', help='Only restore matching original paths')
    restore_parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    manifests = load_manifests(args.manifest)
    packages = [(path, package) for path, manifest in manifests for package in manifest['archives']]
    if args.command in ('list', 'find'):
        query = getattr(args, 'query', '').casefold()
        for _, package in packages:
            matches = [f for f in package['files'] if query in f['path'].casefold()]
            if not matches:
                continue
            print(f'{package["name"]}  {len(matches)} files  {package["bytes"] / 1e6:.1f} MB')
            print_links(package)
            if args.command == 'find':
                # Collapse internal XCTest records to their complete result bundle.
                paths = set()
                for item in matches:
                    path = item['path']
                    paths.add(path.split('.xcresult/')[0] + '.xcresult/' if '.xcresult/' in path else path)
                for path in sorted(paths)[:40]:
                    print(f'  {path}')
                if len(paths) > 40:
                    print(f'  ... {len(paths) - 40} more paths')
        return
    found = next(((path, p) for path, p in packages if p['name'] == args.package), None)
    if not found:
        parser.error('Unknown package. Run list or find first.')
    manifest_path, package = found
    archive, temporary = locate(package, manifest_path, args.source)
    if not archive:
        print('Download every part listed below into Downloads, then repeat this command:')
        print_links(package)
        parser.exit(1)
    try:
        print(json.dumps(restore(archive, package, ROOT, args.match, args.dry_run), ensure_ascii=False))
    finally:
        if temporary:
            archive.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
