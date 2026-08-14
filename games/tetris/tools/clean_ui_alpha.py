from collections import deque
from pathlib import Path
import sys

import numpy as np
from PIL import Image


for raw in sys.argv[1:]:
    path = Path(raw)
    arr = np.asarray(Image.open(path).convert("RGBA")).copy()
    rgb = arr[:, :, :3].astype(np.int16)
    hi, lo = rgb.max(2), rgb.min(2)
    candidate = (hi >= 230) & ((hi - lo) <= 10)
    h, w = candidate.shape
    outside = np.zeros((h, w), dtype=bool)
    q = deque()
    for y, x in [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]:
        if candidate[y, x] and not outside[y, x]:
            outside[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= ny < h and 0 <= nx < w and candidate[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((ny, nx))
    arr[outside, 3] = 0
    ys, xs = np.where(arr[:, :, 3] > 8)
    if not len(xs):
        raise RuntimeError(f"No foreground: {path}")
    pad = 14
    box = (max(0, xs.min()-pad), max(0, ys.min()-pad), min(w, xs.max()+pad+1), min(h, ys.max()+pad+1))
    Image.fromarray(arr, "RGBA").crop(box).save(path, optimize=True)
