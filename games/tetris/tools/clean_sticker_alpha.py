from collections import deque
from pathlib import Path
import sys

import numpy as np
from PIL import Image


def clean(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    arr = np.asarray(image).copy()
    rgb = arr[:, :, :3].astype(np.int16)
    hi = rgb.max(axis=2)
    lo = rgb.min(axis=2)
    # Image generation occasionally paints a white/grey transparency grid.
    # Only remove near-neutral, bright pixels connected to the outer edge.
    candidate = (hi >= 230) & ((hi - lo) <= 9)
    h, w = candidate.shape
    outside = np.zeros((h, w), dtype=bool)
    queue = deque()

    def seed(y: int, x: int) -> None:
        if candidate[y, x] and not outside[y, x]:
            outside[y, x] = True
            queue.append((y, x))

    for x in range(w):
        seed(0, x)
        seed(h - 1, x)
    for y in range(h):
        seed(y, 0)
        seed(y, w - 1)
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and candidate[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                queue.append((ny, nx))

    arr[outside, 3] = 0
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 8)
    if not len(xs):
        raise RuntimeError(f"No foreground found in {path}")
    pad = 24
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(w, xs.max() + pad + 1), min(h, ys.max() + pad + 1))
    cropped = Image.fromarray(arr, "RGBA").crop(box)
    cropped.thumbnail((930, 930), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    out.alpha_composite(cropped, ((1024 - cropped.width) // 2, (1024 - cropped.height) // 2))
    out.save(path, optimize=True)


if __name__ == "__main__":
    for value in sys.argv[1:]:
        clean(Path(value))
