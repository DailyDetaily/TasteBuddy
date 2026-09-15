#!/usr/bin/env python3
"""Compile and execute the production data core; syntax parsing is NOT an iOS build."""
from __future__ import annotations
import argparse
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path)
    parser.add_argument('--tests', type=Path)
    parser.add_argument('--native-build', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    source = args.source or root / 'ios/TasteBuddy/Features/Home/HomeSummaryComponents.swift'
    tests = args.tests or Path(__file__).with_name('TasteDataCoreTests.swift')
    swiftc = shutil.which('swiftc')
    if not swiftc:
        raise RuntimeError('swiftc is required. No tests were run.')
    text = source.read_text(encoding='utf-8')
    start, end = '// TASTE_DATA_CORE_BEGIN', '// TASTE_DATA_CORE_END'
    if text.count(start) != 1 or text.count(end) != 1:
        raise RuntimeError('Expected one production core region; refusing to test a surrogate.')
    core = 'import Foundation\n' + text.split(start, 1)[1].split(end, 1)[0]
    with tempfile.TemporaryDirectory(prefix='taste-data-tests-') as temp:
        folder = Path(temp)
        swift = folder / 'Core.swift'
        binary = folder / 'core-tests'
        swift.write_text(core, encoding='utf-8')
        subprocess.run([swiftc, str(swift), str(tests), '-o', str(binary)], check=True)
        subprocess.run([str(binary)], check=True)
    subprocess.run([swiftc, '-frontend', '-parse', str(source)], check=True)
    print('SWIFT_SYNTAX_PARSE_OK (not SwiftUI type checking or an iOS build)')
    checks = {
        'five category rail': 'ForEach(TDCategory.allCases)',
        'existing route adapter': 'kind.dataCategory',
        'first and repeat toggles': 'ForEach(TDDimension.allCases)',
        'account invalidation': '.onChange(of: appModel.memoryAccountGeneration)',
        'discard cancelled result': 'guard !Task.isCancelled, key == renderKey',
        'current original match': 'atom.selectionEvidence == row.selectionEvidence',
        'revision-aware sources': 'HomeArchiveSources(entries: entries, snapshot: snapshot',
        'existing discovery details': 'HomeDiscoveryDetailView(discoveryID:',
        'discovery snooze': 'appModel.suppressHomeDiscovery(id:',
        'original record edit': 'FoodMemoryDetailView(entryID:',
    }
    for name, needle in checks.items():
        if needle not in text:
            raise RuntimeError(f'Missing integration anchor: {name}')
    print(f'INTEGRATION_SOURCE_CHECKS_OK {len(checks)} (source checks, not runtime UI tests)')
    if args.native_build:
        if sys.platform != 'darwin' or not shutil.which('xcodebuild'):
            raise RuntimeError('Native build requires macOS and Xcode; it was NOT run.')
        subprocess.run(['xcodebuild', '-project', str(root/'ios/TasteBuddy.xcodeproj'),
                        '-scheme', 'TasteBuddy', '-sdk', 'iphonesimulator',
                        '-destination', 'generic/platform=iOS Simulator',
                        'CODE_SIGNING_ALLOWED=NO', 'build'], check=True)
    else:
        print('IOS_BUILD_NOT_RUN; use --native-build on macOS with Xcode.')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f'VALIDATION_FAILED: {exc}', file=sys.stderr)
        raise SystemExit(1)
