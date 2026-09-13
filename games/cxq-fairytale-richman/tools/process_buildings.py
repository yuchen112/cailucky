"""Prepare independently generated building art for the canvas runtime.

The image service returned its transparency preview as a baked neutral checkerboard.
This removes only the border-connected neutral checker and keeps the generated subject.
"""
from collections import deque
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1] / "assets" / "buildings"


def extract(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    rgb = rgba[:, :, :3].astype(np.int16)
    neutral_light = (rgb.max(axis=2) - rgb.min(axis=2) <= 6) & (rgb.mean(axis=2) >= 232)
    neutral_dark = rgb.max(axis=2) <= 10
    neutral = neutral_light | neutral_dark
    h, w = neutral.shape
    outside = np.zeros((h, w), dtype=np.uint8)
    # UI frames deliberately contain enclosed portrait holes; their baked checker
    # must be removed there as well as around the outer silhouette.
    if image.info.get("cxq_remove_all_neutral"):
        outside[neutral] = 255
        bg = Image.fromarray(outside, "L").filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8))
        rgba[:, :, 3] = np.minimum(rgba[:, :, 3], 255 - np.asarray(bg))
        return Image.fromarray(rgba, "RGBA")
    queue = deque()
    for x in range(w):
        if neutral[0, x]: queue.append((0, x))
        if neutral[h - 1, x]: queue.append((h - 1, x))
    for y in range(h):
        if neutral[y, 0]: queue.append((y, 0))
        if neutral[y, w - 1]: queue.append((y, w - 1))
    while queue:
        y, x = queue.popleft()
        if outside[y, x] or not neutral[y, x]:
            continue
        outside[y, x] = 255
        if y: queue.append((y - 1, x))
        if y + 1 < h: queue.append((y + 1, x))
        if x: queue.append((y, x - 1))
        if x + 1 < w: queue.append((y, x + 1))
    # Expand two pixels over the checker/subject antialias seam, then feather inward.
    bg = Image.fromarray(outside, "L").filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.15))
    alpha = 255 - np.asarray(bg)
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], alpha)
    return Image.fromarray(rgba, "RGBA")


def extract_exact_checker(image: Image.Image) -> Image.Image:
    """Remove baked light checker tiles even inside enclosed character gaps.

    Generated pale hair and clothing are warm tinted, while the preview checker is
    near-perfect neutral gray.  The tighter threshold preserves those subject whites.
    """
    rgba = np.asarray(image.convert("RGBA")).copy()
    rgb = rgba[:, :, :3].astype(np.int16)
    checker = (rgb.max(axis=2) - rgb.min(axis=2) <= 2) & (rgb.mean(axis=2) >= 238)
    bg = Image.fromarray((checker * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.7))
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], 255 - np.asarray(bg))
    return Image.fromarray(rgba, "RGBA")


if __name__ == "__main__":
    sources = [Path(p) for p in sys.argv[1:]] or sorted(ROOT.glob("*.png"))
    for source in sources:
        original = Image.open(source)
        if source.parent.name == "ui": original.info["cxq_remove_all_neutral"] = True
        prepared = extract_exact_checker(original) if source.stem in {"fortune_v1", "misfortune_v1"} else extract(original)
        prepared.thumbnail((1536 if prepared.width > prepared.height * 1.8 else 768, 768), Image.Resampling.LANCZOS)
        target = source.with_suffix(".webp")
        prepared.save(target, "WEBP", quality=90, method=6)
        print(target.name, prepared.size, prepared.getchannel("A").getextrema())
