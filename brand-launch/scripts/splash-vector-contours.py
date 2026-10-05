"""Build-time vectorisation of the approved rounded terminal-fill field.

Apps receive only SVG vector paths. No image, movie, canvas bitmap or field map
is loaded at runtime. Final glyph silhouettes remain the original Bezier paths.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image


def simplify(points, tolerance=0.45):
    if len(points) < 4:
        return points
    keep = {0, len(points) - 1}
    stack = [(0, len(points) - 1)]
    while stack:
        lo, hi = stack.pop()
        if hi <= lo + 1:
            continue
        a, b = points[lo], points[hi]
        v = b - a
        length = np.dot(v, v)
        samples = points[lo + 1:hi]
        t = np.clip(((samples - a) @ v) / length, 0, 1) if length else np.zeros(len(samples))
        distances = np.sum((samples - (a + t[:, None] * v)) ** 2, axis=1)
        i = int(np.argmax(distances))
        if distances[i] > tolerance * tolerance:
            pivot = lo + 1 + i
            keep.add(pivot)
            stack.extend([(lo, pivot), (pivot, hi)])
    return points[sorted(keep)]


def contours(field, level):
    a = np.pad(field.astype(float), 1)
    h, w = a.shape
    tl, tr, br, bl = a[:-1, :-1], a[:-1, 1:], a[1:, 1:], a[1:, :-1]
    cases = (tl >= level).astype(np.uint8) + 2 * (tr >= level) + 4 * (br >= level) + 8 * (bl >= level)
    lookup = {1: [(3, 0)], 2: [(0, 1)], 3: [(3, 1)], 4: [(1, 2)],
              6: [(0, 2)], 7: [(3, 2)], 8: [(2, 3)], 9: [(0, 2)],
              11: [(1, 2)], 12: [(3, 1)], 13: [(0, 1)], 14: [(3, 0)]}
    adjacency, coords = {}, {}
    def edge(y, x, which):
        if which == 0:
            key, x1, y1, x2, y2 = y * (w - 1) + x, x, y, x + 1, y
        elif which == 2:
            key, x1, y1, x2, y2 = (y + 1) * (w - 1) + x, x, y + 1, x + 1, y + 1
        elif which == 1:
            key, x1, y1, x2, y2 = h * (w - 1) + y * w + x + 1, x + 1, y, x + 1, y + 1
        else:
            key, x1, y1, x2, y2 = h * (w - 1) + y * w + x, x, y, x, y + 1
        if key not in coords:
            v1, v2 = a[y1, x1], a[y2, x2]
            t = (level - v1) / (v2 - v1) if v2 != v1 else 0.5
            coords[key] = (x1 + t * (x2 - x1) - 0.5, y1 + t * (y2 - y1) - 0.5)
        return key
    for y, x in zip(*np.where((cases != 0) & (cases != 15))):
        case = int(cases[y, x])
        if case in (5, 10):
            inside = (tl[y, x] + tr[y, x] + br[y, x] + bl[y, x]) / 4 >= level
            pairs = ([(3, 2), (0, 1)] if inside else [(3, 0), (1, 2)]) if case == 5 else ([(0, 3), (1, 2)] if inside else [(0, 1), (2, 3)])
        else:
            pairs = lookup[case]
        for u, v in pairs:
            u, v = edge(y, x, u), edge(y, x, v)
            adjacency.setdefault(u, []).append(v)
            adjacency.setdefault(v, []).append(u)
    result = []
    remaining = set(adjacency)
    while remaining:
        start = next(iter(remaining)); current, previous = start, None
        loop = []
        while True:
            loop.append(coords[current]); remaining.discard(current)
            neighbors = adjacency[current]
            assert len(neighbors) == 2, "Contour must be a closed manifold"
            nxt = neighbors[0] if neighbors[0] != previous else neighbors[1]
            previous, current = current, nxt
            if current == start:
                break
        if len(loop) >= 3:
            points = np.array(loop + [loop[0]])
            result.append(simplify(points))
    return result


data = json.loads(Path(sys.argv[1]).read_text())
for glyph in data['glyphs']:
    mapping = glyph.pop('map')
    field = np.asarray(Image.open(mapping['file']).convert('L'))
    paths = ['']
    for step in range(1, data['maskSteps']):
        progress = (step / data['maskSteps']) ** 1.6
        loops = contours(field, 255 * (1 - progress))
        pieces = []
        for points in loops:
            points[:, 0] = mapping['x'] + points[:, 0] * mapping['width'] / field.shape[1]
            points[:, 1] = mapping['y'] + points[:, 1] * mapping['height'] / field.shape[0]
            # Quantize absolute positions first, then delta-encode them without
            # cumulative drift. 0.01 SVG unit is below 0.004pt on the splash.
            quantized = np.rint(points[:-1] * 100).astype(int)
            def fmt(value):
                return f'{value / 100:.2f}'.rstrip('0').rstrip('.')
            piece = f'M{fmt(quantized[0, 0])} {fmt(quantized[0, 1])}'
            previous_command = ''
            for delta in np.diff(quantized, axis=0):
                dx, dy = map(int, delta)
                if dx == 0 and dy == 0:
                    continue
                command, values = ('v', fmt(dy)) if dx == 0 else ('h', fmt(dx)) if dy == 0 else ('l', f'{fmt(dx)} {fmt(dy)}')
                piece += (' ' if command == previous_command else command) + values
                previous_command = command
            pieces.append(piece + 'Z')
        paths.append(''.join(pieces))
    paths.append('')  # Full endpoint uses the original unmasked Bezier outline.
    glyph['masks'] = paths
    print(f"Vector glyph {glyph['index']}: {len(paths)} states", flush=True)
payload = json.dumps(data, separators=(',', ':')) + '\n'
for destination in sys.argv[2:]:
    Path(destination).parent.mkdir(parents=True, exist_ok=True)
    Path(destination).write_text(payload)
print(f'Runtime vector data: {len(payload.encode())} bytes')
