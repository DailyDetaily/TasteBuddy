"""Terminal-led circular brushes, clipped to the original glyph ink."""
import heapq
import json
import math
import sys
from pathlib import Path
import numpy as np
from PIL import Image


def squared_distance_1d(values):
    """Lower envelope of parabolas: exact Euclidean, not an octagonal metric."""
    size = len(values)
    sites = np.zeros(size, dtype=int)
    edges = np.empty(size + 1)
    result = np.empty(size)
    last = 0
    edges[0], edges[1] = -np.inf, np.inf
    for point in range(1, size):
        def intersection(site):
            return ((values[point] + point * point)
                    - (values[site] + site * site)) / (2 * (point - site))
        edge = intersection(sites[last])
        while edge <= edges[last]:
            last -= 1
            edge = intersection(sites[last])
        last += 1
        sites[last] = point
        edges[last], edges[last + 1] = edge, np.inf
    last = 0
    for point in range(size):
        while edges[last + 1] < point:
            last += 1
        result[point] = (point - sites[last]) ** 2 + values[sites[last]]
    return result


def brush_radii(inside):
    distance = np.where(inside, 1e10, 0.)
    for row in range(distance.shape[0]):
        distance[row, :] = squared_distance_1d(distance[row, :])
    for col in range(distance.shape[1]):
        distance[:, col] = squared_distance_1d(distance[:, col])
    # Distances are between pixel centers; the boundary is half a pixel closer.
    return np.maximum(0, np.sqrt(distance) - .5)


def round_brush_arrival(inside, distances):
    """Sweep inscribed disks along the original terminal-to-interior flow.

    Each disk activates at its center's geodesic arrival. Their union forms
    convex round caps at moving fronts, including on thick stems and bowls.
    The radius follows the local ink width, so disks cannot cross a counter.
    A two-pixel lattice is only 0.25 SVG units at the generator's 8x resolution.
    """
    radii = brush_radii(inside)
    arrival = distances.copy()
    height, width = inside.shape
    rows, cols = np.indices(inside.shape)
    centers = np.argwhere(inside & (radii >= 1) & (rows % 2 == 0) & (cols % 2 == 0))
    for row, col in centers:
        # Subpixel overlap covers sampling gaps; the source ink still clips it.
        radius = radii[row, col] + .75
        extent = math.ceil(radius)
        top, bottom = max(0, row - extent), min(height, row + extent + 1)
        left, right = max(0, col - extent), min(width, col + extent + 1)
        yy, xx = np.ogrid[top - row:bottom - row, left - col:right - col]
        disk = xx * xx + yy * yy <= radius * radius
        patch = arrival[top:bottom, left:right]
        np.minimum(patch, np.where(disk, distances[row, col], np.inf), out=patch)
    # Grow initial terminal dots continuously from zero, rather than exposing
    # an entire brush footprint on the first nonzero frame.
    arrival = np.maximum(arrival, distances * .25)
    arrival[~inside] = np.inf
    return arrival


config_path = Path(sys.argv[1])
results = []
for item in json.loads(config_path.read_text()):
    coverage = np.asarray(Image.open(item["mask"]).convert("L"))
    inside = coverage >= 8
    height, width = inside.shape
    distances = np.full((height, width), np.inf)
    queue = []
    sources = []
    for x, y in item["terminals"]:
        col = round((x - item["x"]) * item["scale"] - .5)
        row = round((y - item["y"]) * item["scale"] - .5)
        if not inside[row, col]:
            raise ValueError(f'{item["name"]}: terminal {(x, y)} lies outside its glyph')
        distances[row, col] = 0
        sources.append([row, col])
        heapq.heappush(queue, (0, row, col))
    neighbors = [(dy, dx, math.hypot(dx, dy)) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]
    while queue:
        distance, row, col = heapq.heappop(queue)
        if distance != distances[row, col]:
            continue
        for dy, dx, step in neighbors:
            yy, xx = row + dy, col + dx
            if 0 <= yy < height and 0 <= xx < width and inside[yy, xx]:
                new_distance = distance + step
                if new_distance < distances[yy, xx]:
                    distances[yy, xx] = new_distance
                    heapq.heappush(queue, (new_distance, yy, xx))
    if not np.isfinite(distances[inside]).all():
        raise ValueError(f'{item["name"]}: unreachable ink; inspect source geometry or missing terminals')
    distances = round_brush_arrival(inside, distances)
    longest = float(distances[inside].max())
    field = np.zeros(inside.shape, dtype=np.uint8)
    field[inside] = np.rint(255 - 254 * distances[inside] / longest).astype(np.uint8)
    Image.fromarray(field).save(item["destination"], optimize=True)
    result = {**item, "frontShape": "round-brush", "maxDistance": longest / item["scale"], "terminalCount": len(sources),
              "inkPixels": int(inside.sum()), "unreachablePixels": 0, "terminalPixels": sources}
    results.append(result)
    print(f'{item["name"]}: {len(sources)} terminals, {result["maxDistance"]:.1f} SVG units to last fill', flush=True)
config_path.with_name("propagation-result.json").write_text(json.dumps(results, indent=2))
