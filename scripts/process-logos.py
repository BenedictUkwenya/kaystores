"""Convert Kay logo PDFs to transparent PNGs for light/dark UI."""
from __future__ import annotations

import os
from shutil import copyfile

import numpy as np
import pymupdf
from PIL import Image

SRC_DIR = r"c:\Users\user\Desktop\kay_Stores\public\images"
OUT_DIR = r"c:\Users\user\Desktop\kay_Stores\public\brand"

# Dominant palette from the PDFs
GOLD = np.array([205, 149, 49], dtype=np.float32)
INK = np.array([28, 26, 24], dtype=np.float32)

JOBS = [
    ("Logo Main 4.pdf", "kay-logo-light.png", "light"),  # black mark on gold
    ("Logo Main 1.pdf", "kay-logo-dark.png", "dark"),  # gold mark on black
]


def color_dist(arr: np.ndarray, color: np.ndarray) -> np.ndarray:
    diff = arr[:, :, :3].astype(np.float32) - color
    return np.sqrt(np.sum(diff * diff, axis=2))


def process_light(arr: np.ndarray) -> np.ndarray:
    """Keep near-black ink; remove gold + white paper."""
    d_ink = color_dist(arr, INK)
    d_gold = color_dist(arr, GOLD)
    r = arr[:, :, 0].astype(np.float32)
    g = arr[:, :, 1].astype(np.float32)
    b = arr[:, :, 2].astype(np.float32)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

    # ink if closer to ink than gold, and not too bright
    is_ink = (d_ink < d_gold) & (d_ink < 80) & (lum < 120)
    alpha = np.zeros(lum.shape, dtype=np.uint8)
    alpha[is_ink] = 255
    # soft edges
    soft = (d_ink < 110) & (d_ink >= 80) & (d_ink < d_gold)
    alpha[soft] = ((110 - d_ink[soft]) / 30 * 255).astype(np.uint8)

    out = np.zeros_like(arr)
    out[is_ink | soft, 0] = 0
    out[is_ink | soft, 1] = 0
    out[is_ink | soft, 2] = 0
    out[:, :, 3] = alpha
    return out


def process_dark(arr: np.ndarray) -> np.ndarray:
    """Keep gold mark; remove near-black + white paper."""
    d_gold = color_dist(arr, GOLD)
    d_ink = color_dist(arr, INK)
    r = arr[:, :, 0].astype(np.float32)
    g = arr[:, :, 1].astype(np.float32)
    b = arr[:, :, 2].astype(np.float32)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

    is_gold = (d_gold < d_ink) & (d_gold < 90) & (lum > 40)
    alpha = np.zeros(lum.shape, dtype=np.uint8)
    alpha[is_gold] = 255
    soft = (d_gold < 120) & (d_gold >= 90) & (d_gold < d_ink)
    alpha[soft] = ((120 - d_gold[soft]) / 30 * 255).astype(np.uint8)

    out = arr.copy()
    # preserve gold color on opaque pixels
    out[:, :, 3] = alpha
    # clear rgb where transparent
    clear = alpha == 0
    out[clear, 0] = 0
    out[clear, 1] = 0
    out[clear, 2] = 0
    return out


def trim(arr: np.ndarray) -> np.ndarray:
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 10)
    if len(xs) == 0:
        return arr
    pad = 4
    l = max(0, int(xs.min()) - pad)
    r = min(arr.shape[1], int(xs.max()) + pad + 1)
    t = max(0, int(ys.min()) - pad)
    b = min(arr.shape[0], int(ys.max()) + pad + 1)
    return arr[t:b, l:r]


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for pdf_name, out_name, mode in JOBS:
        path = os.path.join(SRC_DIR, pdf_name)
        doc = pymupdf.open(path)
        page = doc[0]
        pix = page.get_pixmap(matrix=pymupdf.Matrix(3, 3), alpha=False)
        tmp = os.path.join(OUT_DIR, f"_tmp_{out_name}")
        pix.save(tmp)
        img = Image.open(tmp)
        arr = np.array(img.convert("RGBA"))
        print(pdf_name, "in", arr.shape)
        arr = process_light(arr) if mode == "light" else process_dark(arr)
        arr = trim(arr)
        out = Image.fromarray(arr, "RGBA")
        max_side = 1024
        if max(out.size) > max_side:
            out.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        out_path = os.path.join(OUT_DIR, out_name)
        out.save(out_path, "PNG", optimize=True)
        os.remove(tmp)
        opaque = float((np.array(out)[:, :, 3] > 10).mean() * 100)
        print(f"saved {out_path} {out.size} opaque%{opaque:.1f}")
        doc.close()

    copyfile(
        os.path.join(OUT_DIR, "kay-logo-light.png"),
        os.path.join(OUT_DIR, "kay-logo.png"),
    )
    print("done")


if __name__ == "__main__":
    main()
