"""Extract the local Kalice outlines, then find stroke ends for its fill fields."""
import hashlib
import json
import math
import string
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def outlines(root):
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.ttLib import TTFont

    source = root / 'public/fonts/Kalice-Trial-Regular.otf'
    font = TTFont(source)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale = 100 / font['head'].unitsPerEm
    chars = string.ascii_letters + string.digits + ' .,!?;:\'"()-–—’‘“”'
    result = {}
    for char in chars:
        name = cmap.get(ord(char))
        if name is None:
            continue
        svg = SVGPathPen(glyphs, ntos=lambda n: f'{n:.4f}'.rstrip('0').rstrip('.') if n else '0')
        bounds = BoundsPen(glyphs)
        transform = (scale, 0, 0, -scale, 0, 0)
        glyphs[name].draw(TransformPen(svg, transform))
        glyphs[name].draw(TransformPen(bounds, transform))
        box = bounds.bounds or (0, 0, 0, 0)
        x, y = math.floor(box[0]) - 2, math.floor(box[1]) - 2
        result[char] = {
            'index': ord(char), 'name': name, 'd': svg.getCommands(),
            'advance': font['hmtx'][name][0] * scale,
            'x': x, 'y': y, 'width': math.ceil(box[2]) + 2 - x,
            'height': math.ceil(box[3]) + 2 - y,
        }

    # Preserve Kalice's pair spacing as well as its exact letter outlines.
    kern = {}
    if 'GPOS' in font:
        lookups = font['GPOS'].table.LookupList.Lookup
        tables = []
        for lookup in lookups:
            for sub in lookup.SubTable:
                if lookup.LookupType == 2:
                    tables.append(sub)
                elif lookup.LookupType == 9 and sub.ExtensionLookupType == 2:
                    tables.append(sub.ExtSubTable)
        for left, a in result.items():
            for right, b in result.items():
                value = 0
                for table in tables:
                    if a['name'] not in table.Coverage.glyphs:
                        continue
                    if table.Format == 1:
                        pairs = table.PairSet[table.Coverage.glyphs.index(a['name'])]
                        for pair in pairs.PairValueRecord:
                            if pair.SecondGlyph == b['name']:
                                value += getattr(pair.Value1, 'XAdvance', 0)
                    elif table.Format == 2:
                        c1 = table.ClassDef1.classDefs.get(a['name'], 0)
                        c2 = table.ClassDef2.classDefs.get(b['name'], 0)
                        value += getattr(table.Class1Record[c1].Class2Record[c2].Value1, 'XAdvance', 0)
                if value:
                    kern[left + right] = value * scale
    return {'em': 100, 'fontHash': hashlib.sha256(source.read_bytes()).hexdigest(), 'glyphs': result, 'kerning': kern}


def skeleton(ink):
    """Zhang-Suen thinning; all seed pixels remain inside the actual outline."""
    image = np.pad(ink.astype(np.uint8), 1)
    while True:
        changed = False
        for step in (0, 1):
            p = [image[:-2, 1:-1], image[:-2, 2:], image[1:-1, 2:], image[2:, 2:],
                 image[2:, 1:-1], image[2:, :-2], image[1:-1, :-2], image[:-2, :-2]]
            neighbors = sum(p)
            transitions = sum((p[i] == 0) & (p[(i + 1) % 8] == 1) for i in range(8))
            if step == 0:
                safe = (p[0] * p[2] * p[4] == 0) & (p[2] * p[4] * p[6] == 0)
            else:
                safe = (p[0] * p[2] * p[6] == 0) & (p[0] * p[4] * p[6] == 0)
            remove = (image[1:-1, 1:-1] == 1) & (neighbors >= 2) & (neighbors <= 6) & (transitions == 1) & safe
            if remove.any():
                image[1:-1, 1:-1][remove] = 0
                changed = True
        if not changed:
            return image[1:-1, 1:-1].astype(bool)


def terminals(config):
    for item in config:
        ink = np.asarray(Image.open(item['mask']).convert('L')) >= 8
        thin = skeleton(ink)
        padded = np.pad(thin.astype(np.uint8), 1)
        neighbors = sum(padded[dy:dy + ink.shape[0], dx:dx + ink.shape[1]]
                        for dy in range(3) for dx in range(3) if (dy, dx) != (1, 1))
        ends = thin & (neighbors <= 1)
        remaining = ink.copy()
        seeds = []
        while remaining.any():
            row, col = np.argwhere(remaining)[0]
            pending, component = [(int(row), int(col))], []
            remaining[row, col] = False
            while pending:
                y, x = pending.pop()
                component.append((y, x))
                for dy, dx in ((-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < ink.shape[0] and 0 <= xx < ink.shape[1] and remaining[yy, xx]:
                        remaining[yy, xx] = False
                        pending.append((yy, xx))
            local = [(y, x) for y, x in component if ends[y, x]]
            if not local:
                # Closed bowls start at their top stroke; dots have their own seed.
                candidates = [(y, x) for y, x in component if thin[y, x]] or component
                local = [min(candidates)]
            seeds.extend(local)
        item['terminals'] = [[item['x'] + (x + .5) / item['scale'], item['y'] + (y + .5) / item['scale']] for y, x in seeds]
        item['seedHash'] = hashlib.sha256(json.dumps(item['terminals']).encode()).hexdigest()
    return config


if __name__ == '__main__':
    mode, source, destination = sys.argv[1:]
    result = outlines(Path(source)) if mode == 'outlines' else terminals(json.loads(Path(source).read_text()))
    Path(destination).write_text(json.dumps(result, ensure_ascii=False, indent=2))
