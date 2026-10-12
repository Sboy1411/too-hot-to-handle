#!/usr/bin/env python3
"""
TOO HOT TO HANDLE, concept 3 "TWO-WAY MIRROR": a fusion of revision 2 (concept 1, chrome and fire)
and the viral cut (concept 2, the thermal camera).

One camera with two sensors watches the same performance, and each line is seen by the sensor that
suits it best:
  A  = revision 2, visible light         (the finished revision 2 master)
  B  = the viral cut, thermal            (the finished viral master, with the PSH / BOLO BEATS ending)
  AT = revision 2 seen through the thermal sensor: same layout, false colour, softer and grainier
The sensor switches are scans, heat fronts, melts and glitches on the music. Every chrome mirror
in A shows the thermal camera's view inside its glass (lens mask: the TooHotMirrorMask composition),
and the walk-in door opens onto the thermal world.

Both masters share the audio and the word timings, so frame n of one is frame n of the other.

  python3 fusion/fuse.py --a REV2.mp4 --b VIRAL.mp4 --masks out/fusion/mask --out out/fusion/TooHotFusion.mp4
  python3 fusion/fuse.py ... --from 58 --to 92.5      # a preview range (audio is cut to match)
"""
import argparse
import glob
import math
import os
import re
import subprocess
import sys
import time

import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter

W, H, FPS = 1920, 1080, 30


# ───────────────────────── timing helpers (as in src/lib/time.ts and src/viral/story.ts) ─────────────────────────
def clamp(v, a=0.0, b=1.0):
    return a if v < a else b if v > b else v


def ease_io(p):
    return 4 * p * p * p if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def ease_out(p):
    return 1 - (1 - p) ** 3


def smoothstep(e0, e1, x):
    s = np.clip((x - e0) / (e1 - e0), 0, 1)
    return s * s * (3 - 2 * s)


BPM, PHASE = 154, 0.396
PERIOD = 60 / BPM


def beat(k):
    return PHASE + k * PERIOD


# ───────────────────────── thermal palettes (copied from src/viral/thermal.tsx) ─────────────────────────
PALETTES = {
    'IRONBOW': [[0, 4, 3, 16], [0.1, 28, 4, 84], [0.24, 92, 6, 148], [0.39, 168, 14, 138], [0.53, 222, 48, 72],
                [0.66, 246, 106, 14], [0.8, 255, 178, 8], [0.92, 255, 232, 96], [1, 255, 255, 240]],
    'ARCTIC': [[0, 2, 4, 14], [0.16, 8, 22, 66], [0.34, 16, 66, 146], [0.52, 40, 140, 214], [0.68, 120, 210, 244],
               [0.82, 214, 244, 255], [0.92, 255, 236, 190], [1, 255, 255, 255]],
    'LAVA': [[0, 6, 0, 0], [0.18, 52, 0, 4], [0.36, 140, 8, 0], [0.52, 220, 52, 0], [0.67, 255, 122, 0],
             [0.82, 255, 200, 50], [0.93, 255, 240, 160], [1, 255, 255, 236]],
    'RAINBOW': [[0, 0, 0, 6], [0.13, 44, 0, 120], [0.27, 0, 56, 250], [0.41, 0, 196, 224], [0.54, 0, 228, 92],
                [0.66, 236, 240, 0], [0.79, 255, 112, 0], [0.9, 255, 10, 60], [1, 255, 255, 255]],
    'WHITEHOT': [[0, 2, 4, 6], [0.5, 112, 118, 124], [0.85, 222, 230, 236], [1, 250, 252, 255]],
    'BLACKHOT': [[0, 236, 234, 228], [0.45, 150, 148, 144], [0.8, 40, 38, 36], [1, 4, 4, 4]],
    'SCANDAL': [[0, 6, 0, 12], [0.2, 52, 0, 84], [0.4, 156, 0, 128], [0.58, 255, 28, 118], [0.76, 255, 128, 186],
                [0.9, 255, 214, 230], [1, 255, 252, 252]],
    'GOLD': [[0, 5, 2, 0], [0.22, 60, 20, 0], [0.45, 168, 82, 6], [0.64, 236, 150, 30], [0.8, 255, 206, 96],
             [0.92, 255, 238, 186], [1, 255, 252, 240]],
    'OVERLOAD': [[0, 60, 0, 0], [0.14, 210, 24, 0], [0.32, 255, 132, 0], [0.5, 255, 222, 110], [0.7, 255, 250, 220],
                 [1, 255, 255, 255]],
}
_X = np.linspace(0, 1, 256)
LUTS = {k: np.stack([np.interp(_X, [s[0] for s in v], [s[c] for s in v]) for c in (1, 2, 3)], -1).astype(np.float32)
        for k, v in PALETTES.items()}

# The viral cut's palette timeline (src/viral/story.ts), so AT is coloured exactly like B at the same moment.
PAL_TIMELINE = [
    (0, 'IRONBOW', 0), (15.86, 'WHITEHOT', 0), (19.87, 'IRONBOW', 0), (34.3, 'ARCTIC', 0), (42.474, 'RAINBOW', 0),
    (47.14, 'IRONBOW', 0), (54.75, 'LAVA', 0), (56.5, 'IRONBOW', 0), (58.6, 'GOLD', 0), (63.0, 'IRONBOW', 0),
    (66.27, 'LAVA', 1.2), (75.55, 'RAINBOW', 0), (77.05, 'SCANDAL', 0), (79.6, 'LAVA', 0.9), (80.667, 'OVERLOAD', 0),
    (81.25, 'LAVA', 0), (83.9, 'IRONBOW', 0), (89.2, 'SCANDAL', 0), (92.15, 'IRONBOW', 0), (93.62, 'LAVA', 0),
    (95.12, 'RAINBOW', 0), (96.72, 'WHITEHOT', 0), (98.12, 'ARCTIC', 0), (99.82, 'IRONBOW', 0), (101.33, 'GOLD', 0),
    (102.86, 'ARCTIC', 0), (105.08, 'GOLD', 0), (111.25, 'LAVA', 0.8), (114.5, 'SCANDAL', 0), (118.07, 'OVERLOAD', 0),
    (118.6, 'LAVA', 0), (129.9, 'ARCTIC', 0), (136.78, 'IRONBOW', 0),
]
STROBE = ['LAVA', 'IRONBOW', 'SCANDAL', 'RAINBOW', 'GOLD', 'LAVA', 'OVERLOAD', 'IRONBOW']
GLITCHES = [(40.38, 40.95), (75.6, 76.0), (118.07, 118.4)]
FLICKER = ['RAINBOW', 'WHITEHOT', 'ARCTIC', 'IRONBOW']
WILD = (118.07, 129.95)


def palette_at(t):
    i = 0
    while i < len(PAL_TIMELINE) - 1 and PAL_TIMELINE[i + 1][0] <= t:
        i += 1
    for g0, g1 in GLITCHES:
        if g0 <= t < g1:
            return [(FLICKER[int((t - g0) * 4) % len(FLICKER)], 1.0)]
    if WILD[0] <= t < WILD[1] and t >= 118.6:
        return [(STROBE[(math.floor((t - PHASE) / PERIOD) // 2) % len(STROBE)], 1.0)]
    t0, name, xf = PAL_TIMELINE[i]
    p = ease_io(clamp((t - t0) / xf)) if xf > 0 else 1
    if p >= 1 or i == 0:
        return [(name, 1.0)]
    return [(PAL_TIMELINE[i - 1][1], 1 - p), (name, p)]


def lut_for(blend):
    tot = sum(w for _, w in blend) or 1
    return np.clip(sum(LUTS[n] * w for n, w in blend) / tot, 0, 255).astype(np.uint8)


# ───────────────────────── the edit ─────────────────────────
# (time, source, transition, seconds, options). The transition runs from `time` into `source`.
#   scan     a sensor scan bar sweeps across; 'lr' = the new view comes in from the left
#   heat     a heat front spreads from point c: A turns into its own thermal image (AT)
#   melt     the heated A image drips off the frame, column by column, and B is behind it
#   glitch   the frame tears into bands of both sensors, then settles
#   door     the walk-in doorway's thermal window floods the whole frame
#   cut      a hard cut, always hidden under a flash
def drop_fight():
    """The drop: the two sensors fight over the frame, a switch every bar, then every two beats."""
    ks = [310, 314, 318, 322, 324, 326, 328]  # beat 310 = the drop at 121.17 s
    out = []
    for j, k in enumerate(ks):
        out.append((beat(k) - 0.06, 'B' if j % 2 == 0 else 'A', 'scan', 0.22, {'dir': 'lr' if j % 2 == 0 else 'rl'}))
    return out


EDL = [
    (0.0, 'B', None, 0, {}),                              # the thermal camera boots, the title glows
    (2.2, 'A', 'scan', 0.36, {'dir': 'rl'}),              # "yeah…": the visible world; the mirror shows the heat
    (9.62, 'B', 'door', 0.34, {}),                        # drums: the doorway's heat floods the room
    (12.72, 'A', 'scan', 0.36, {'dir': 'rl'}),            # weather widget
    (15.78, 'B', 'scan', 0.36, {'dir': 'lr'}),            # scanning subject… the brand
    (21.86, 'A', 'scan', 0.36, {'dir': 'rl'}),            # trademark, feed, headline, spotlight, the mirror flex
    (39.64, 'B', 'glitch', 0.3, {}),                      # glitch in the plan, trend, follow, solo
    (52.93, 'A', 'scan', 0.36, {'dir': 'rl'}),            # protocol, danger zone
    (56.46, 'B', 'scan', 0.36, {'dir': 'lr'}),            # bold letters
    (58.55, 'A', 'scan', 0.36, {'dir': 'rl'}),            # classy, vinyl, final… TOO HOT TO HANDLE in chrome
    (67.55, 'AT', 'heat', 0.7, {'c': (960, 470)}),        # "handle": the title heats up in place
    (69.28, 'B', 'melt', 0.55, {}),                       # "ho jaave na koi scandal": the hot title melts away
    (72.24, 'A', 'scan', 0.36, {'dir': 'rl'}),            # candle
    (74.32, 'AT', 'heat', 0.6, {'c': (250, 700)}),        # "fire": heat spreads out of the flame
    (75.45, 'B', 'glitch', 0.3, {}),                      # scramble, smile, the overload
    (80.82, 'A', 'cut', 0, {}),                           # under the big flash: HANDLE in fire
    (83.88, 'B', 'scan', 0.36, {'dir': 'lr'}),            # playlist, angles, POP freeze
    (92.08, 'A', 'scan', 0.3, {'dir': 'rl'}),             # show stopper
    (93.56, 'B', 'scan', 0.3, {'dir': 'lr'}),             # spark
    (95.08, 'A', 'scan', 0.3, {'dir': 'rl'}),             # scene
    (96.66, 'B', 'scan', 0.3, {'dir': 'lr'}),             # timing
    (98.04, 'A', 'scan', 0.3, {'dir': 'rl'}),             # mirror best friend (thermal reflection)
    (99.78, 'B', 'scan', 0.3, {'dir': 'lr'}),             # yes man, reason, fan
    (105.04, 'A', 'scan', 0.36, {'dir': 'rl'}),           # hook 2 in chrome
    (106.45, 'AT', 'heat', 0.7, {'c': (960, 520)}),       # "handle…" heats up
    (108.05, 'B', 'melt', 0.55, {}),                      # gold scandal, candles, POP freeze
    (118.2, 'A', 'cut', 0, {}),                           # under the 1:58 slam: the scandal wall
    *drop_fight(),
    (129.86, 'A', 'scan', 0.4, {'dir': 'rl'}),            # reboot: the mirror, with his heat inside
    (138.2, 'B', 'scan', 0.5, {'dir': 'lr'}),             # the title is scanned into heat; PSH; BOLO BEATS
]
EDL.sort(key=lambda e: e[0])

# Mirror lenses: what the thermal camera sees, mapped into the glass of each chrome mirror in A.
#   box   the mirror's glass in A (left, top, right, bottom), as the mask clips draw it
#   c, s  the point of B shown at the glass centre, and B's scale inside the glass
#   flip  mirror B left to right; fade: seconds the lens takes to come up through dark glass
#   xin   instead of a fade, a crossfade from the lens before it in the same mirror
LENSES = [
    dict(t0=3.1, t1=7.7, box=(658, 168, 1261, 911), c=(466, 530), s=0.62, flip=False, fade=0.3),   # mirror vi hai jealous
    dict(t0=34.17, t1=37.08, box=(147, 178, 691, 901), c=(961, 565), s=0.4, flip=True, fade=0.3),  # FLEX, reflected
    dict(t0=37.08, t1=40.2, box=(343, 198, 1576, 881), c=(1010, 585), s=0.68, flip=False, fade=0.3),  # reflection, stress
    dict(t0=98.05, t1=100.4, box=(208, 198, 711, 881), c=(1440, 475), s=0.55, flip=False, fade=0.25),  # best friend's reflection
    dict(t0=129.78, t1=133.95, box=(648, 153, 1271, 926), c=(1426, 535), s=0.66, flip=True, fade=0.3),  # flex karaan
    dict(t0=133.75, t1=136.8, box=(648, 153, 1271, 926), c=(960, 545), s=0.42, flip=False, xin=0.15),  # reflection, the kiss; on the
    # band's return the mirror flips back to visible light for its exit (B's title is coming up behind it)
]

# The walk-in doorway: a window onto B over A's door of light, which then floods the frame.
DOOR = dict(t_in=7.42, fade=0.45, x0=1235, x1=1770, y0=120, soft=80, grow_at=9.62, grow=0.34)

# B's HUD, cleared out of what a mirror shows (left, top, right, bottom)
B_HUD = [(20, 15, 440, 140), (1460, 15, 1900, 205), (1790, 290, 1900, 790), (20, 925, 580, 1065),
         (1420, 925, 1900, 1065), (560, 40, 1360, 122), (660, 895, 1310, 945)]

TINT_THERMAL = np.array([0.72, 0.9, 1.0], np.float32)
TINT_VISIBLE = np.array([1.0, 0.8, 0.52], np.float32)


# ───────────────────────── image operations ─────────────────────────
COLS = np.arange(W, dtype=np.float32)
_dist_cache = {}


def dist_map(c):
    if c not in _dist_cache:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        _dist_cache[c] = np.hypot(xx - c[0], yy - c[1])
    return _dist_cache[c]


def mix(X, Y, w):
    """X→Y by weight w (scalar or HxW)."""
    if np.isscalar(w):
        if w <= 0:
            return X
        if w >= 1:
            return Y
        return (X.astype(np.float32) * (1 - w) + Y.astype(np.float32) * w).astype(np.uint8)
    w = w[..., None].astype(np.float32)
    return (X.astype(np.float32) * (1 - w) + Y.astype(np.float32) * w + 0.5).astype(np.uint8)


def add_light(img, g_cols, tint, lo, hi):
    """Additive light on columns lo:hi; g_cols holds the per-column strength."""
    if hi <= lo:
        return img
    band = img[:, lo:hi].astype(np.float32) + (g_cols[None, :, None] * tint[None, None, :] * 255)
    img[:, lo:hi] = np.clip(band, 0, 255).astype(np.uint8)
    return img


def scan(X, Y, p, direction, tint):
    e = ease_io(p)
    G = 140
    if direction == 'lr':
        xb = -G + e * (W + 2 * G)
        new = COLS < xb
    else:
        xb = W + G - e * (W + 2 * G)
        new = COLS > xb
    out = np.where(new[None, :, None], Y, X)
    lo, hi = int(max(0, xb - 300)), int(min(W, xb + 300))
    if hi > lo:
        c = COLS[lo:hi]
        d = np.abs(c - xb)
        g = 0.95 * np.exp(-d / 5) + 0.32 * np.exp(-d / 38)
        behind = (c < xb) if direction == 'lr' else (c > xb)
        g = g + behind * 0.16 * np.exp(-d / 120)
        out = add_light(out, g.astype(np.float32), tint, lo, hi)
    return out


def heat_front(X, Y, p, c, lut):
    """Y (the thermal view) spreads out of point c over X, behind a hot rim."""
    D = dist_map(c)
    rmax = max(math.hypot(c[0] - x, c[1] - y) for x in (0, W) for y in (0, H)) + 160
    r = ease_out(p) * rmax
    soft = 120.0
    w = 1 - smoothstep(r - soft, r, D)
    out = mix(X, Y, w)
    rim = np.exp(-((D - r) / 34.0) ** 2) * (0.75 * (1 - p) + 0.15)
    hot = lut[236].astype(np.float32) / 255
    out = np.clip(out.astype(np.float32) + rim[..., None] * hot[None, None, :] * 255, 0, 255).astype(np.uint8)
    return out


def glitch(X, Y, p, f):
    rng = np.random.default_rng(7919 + f)
    out = np.empty_like(X)
    y = 0
    e = ease_io(p)
    while y < H:
        h = int(rng.integers(14, 96))
        sl = slice(y, min(H, y + h))
        src = Y if rng.random() < e * 1.08 else X
        band = src[sl]
        if rng.random() < 0.6 * (1 - e):
            band = np.roll(band, int(rng.integers(-56, 57)), axis=1)
        out[sl] = band
        y += h
    if e < 0.85:
        out[..., 0] = np.roll(out[..., 0], 5, axis=1)
        out[..., 2] = np.roll(out[..., 2], -5, axis=1)
    return out


_drip_cache = {}


def melt(X, Y, p, lut, seed):
    """X slides down off the frame in drips (each column falls at its own speed) with a hot edge; Y shows above."""
    if seed not in _drip_cache:
        rng = np.random.default_rng(seed)
        knots = rng.random(W // 96 + 3)
        n = np.interp(COLS / 96, np.arange(len(knots)), knots)
        n = gaussian_filter(n, 18, mode='nearest')
        n = (n - n.min()) / (n.max() - n.min() + 1e-6)
        _drip_cache[seed] = n.astype(np.float32)
    n = _drip_cache[seed]
    e = p ** 1.7
    d = ((H + 80) * np.clip(e * (0.75 + 0.5 * n) / 0.75, 0, 1.2)).astype(np.int32)
    rows = np.arange(H, dtype=np.int32)[:, None] - d[None, :]
    keep = rows >= 0
    src = X[np.clip(rows, 0, H - 1), np.arange(W)[None, :]]
    out = np.where(keep[..., None], src, Y).astype(np.float32)
    edge = np.exp(-((rows.astype(np.float32)) / 9.0) ** 2) * (rows > -30) * (1 - p * 0.6)
    hot = lut[236].astype(np.float32)
    out += edge[..., None] * hot[None, None, :] * 0.9
    return np.clip(out, 0, 255).astype(np.uint8)


LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32) / 255


def thermal(a, t, f):
    """Revision 2's frame through the thermal sensor: half resolution, a heat bloom, grain, the B palette."""
    small = a.reshape(H // 2, 2, W // 2, 2, 3).astype(np.float32).mean(axis=(1, 3))
    L = small @ LUMA
    hot = Image.fromarray((np.clip(L - 0.5, 0, 0.5) * 510).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))
    bloom = np.asarray(hot, np.float32) / 255
    rng = np.random.default_rng(31 + f)
    v = L * 0.96 + 0.1 + bloom * 0.55 + rng.normal(0, 0.016, L.shape).astype(np.float32)
    lut = lut_for(palette_at(t))
    rgb = lut[np.clip(v * 255, 0, 255).astype(np.uint8)]
    return np.asarray(Image.fromarray(rgb).resize((W, H), Image.BILINEAR)), lut


_hud_alpha = None


def hud_alpha():
    """Where B's HUD sits, feathered (H x W, 0..1)."""
    global _hud_alpha
    if _hud_alpha is None:
        arr = np.zeros((H, W), np.uint8)
        for x0, y0, x1, y1 in B_HUD:
            arr[y0:y1, x0:x1] = 255
        m = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(10))
        _hud_alpha = np.asarray(m, np.float32) / 255
    return _hud_alpha


S8 = 8          # the background fill is worked out at 1/8 resolution
PAD8 = 140      # and extended this far (in 1/8 pixels) past B's edges


class BPrep:
    """B with its HUD painted out by the surrounding background, plus that background as a smooth field that
    carries on past the frame edges (for what a mirror shows when it frames more than B has)."""

    def __init__(self, b, f):
        small = b.reshape(H // S8, S8, W // S8, S8, 3).astype(np.float32).mean(axis=(1, 3))
        keep = np.ones(small.shape[:2], np.float32)
        for x0, y0, x1, y1 in B_HUD:
            keep[y0 // S8:(y1 + S8 - 1) // S8, x0 // S8:(x1 + S8 - 1) // S8] = 0
        num = np.stack([gblur(small[..., c] * keep, 6) for c in range(3)], -1)
        den = gblur(keep, 6)[..., None]
        fill = num / np.maximum(den, 1e-3)
        fill = np.where(den > 0.02, fill, small)
        self.fill_small = np.pad(fill, ((PAD8, PAD8), (PAD8, PAD8), (0, 0)), mode='edge')
        up = np.asarray(Image.fromarray(np.clip(fill, 0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32)
        ha = hud_alpha()[..., None]
        rng = np.random.default_rng(1009 + f)
        grain = rng.normal(0, 1.2, (H, W, 1)).astype(np.float32)
        self.clean = np.clip(b * (1 - ha) + (up + grain) * ha, 0, 255).astype(np.uint8)
        self.f = f


def gblur(a, sigma):
    return gaussian_filter(a.astype(np.float32), sigma, mode='nearest')


_valid = None


def lens_content(prep, bw, bh, spec):
    """What the glass shows: B mapped by the spec into a bw x bh box."""
    global _valid
    cx, cy = spec['c']
    k = 1 / spec['s']
    sx = -k if spec['flip'] else k
    data = (sx, 0, cx - sx * bw / 2, 0, k, cy - k * bh / 2)
    img = np.asarray(Image.fromarray(prep.clean).transform((bw, bh), Image.AFFINE, data, Image.BILINEAR), np.float32)
    if _valid is None:
        v = np.zeros((H, W), np.uint8)
        v[2:-2, 2:-2] = 255
        _valid = Image.fromarray(v).filter(ImageFilter.GaussianBlur(14))
    val = np.asarray(_valid.transform((bw, bh), Image.AFFINE, data, Image.BILINEAR), np.float32)[..., None] / 255
    d8 = (sx / S8, 0, (cx - sx * bw / 2) / S8 + PAD8, 0, k / S8, (cy - k * bh / 2) / S8 + PAD8)
    fs = prep.fill_small
    fill = np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(fs[..., c])).transform((bw, bh), Image.AFFINE, d8, Image.BILINEAR), np.float32)
                     for c in range(3)], -1)
    if val.min() < 0.999:
        rng = np.random.default_rng(prep.f * 7 + bw)
        fill = fill + rng.normal(0, 1.2, (bh, bw, 1)).astype(np.float32)
    img = img * val + fill * (1 - val)
    shade, hi = lens_shade(bw, bh)
    return np.clip(img * shade + hi * 255, 0, 255)


_shade_cache = {}


def lens_shade(bw, bh):
    """Inner shadow of the mirror glass, plus a soft highlight top-left."""
    k = (bw, bh)
    if k not in _shade_cache:
        yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
        e = np.sqrt(((xx - bw / 2) / (bw / 2)) ** 2 + ((yy - bh / 2) / (bh / 2)) ** 2)
        shade = 1 - 0.55 * smoothstep(0.7, 1.02, e)
        hi = 0.07 * np.exp(-(((xx - bw * 0.3) / (bw * 0.3)) ** 2 + ((yy - bh * 0.22) / (bh * 0.2)) ** 2))
        _shade_cache[k] = (shade[..., None], hi[..., None])
    return _shade_cache[k]


def lens_active(m, t):
    return m is not None and m.max() >= 6 and any(L['t0'] <= t < L['t1'] for L in LENSES)


def door_active(t):
    return DOOR['t_in'] <= t < DOOR['grow_at'] + DOOR['grow'] + 0.05


def apply_lens(a, prep, m, t):
    """Each active lens replaces the glass of its mirror with the thermal view. The mask's brightness is the
    mirror scene's own opacity, so the lens follows A's fades; A's glass (and its words) never shows through."""
    if not lens_active(m, t):
        return a
    specs = [L for L in LENSES if L['t0'] <= t < L['t1']]
    prep = prep()
    out = a.astype(np.float32)
    for L in specs:
        zx0, zy0, zx1, zy1, matte = lens_zone(L['box'])
        zone = m[zy0:zy1, zx0:zx1].astype(np.float32) * matte  # only this mirror, even while two overlap
        if zone.max() < 6:
            continue
        lit = zone > zone.max() * 0.5
        mx = float(np.median(zone[::2, ::2][lit[::2, ::2]]))  # the glass level (the clip's edge ringing overshoots it)
        ys, xs = np.where(lit)
        x0, x1 = int(xs.min()), int(xs.max()) + 1
        y0, y1 = int(ys.min()), int(ys.max()) + 1
        op = mx / 255
        shape = np.clip(zone[y0:y1, x0:x1] / mx, 0, 1)[..., None]
        x0, x1, y0, y1 = x0 + zx0, x1 + zx0, y0 + zy0, y1 + zy0
        content = lens_content(prep, x1 - x0, y1 - y0, L)
        region = out[y0:y1, x0:x1]
        if 'xin' in L and t < L['t0'] + L['xin']:
            w = ease_io(clamp((t - L['t0']) / L['xin']))
            inner = region * (1 - w * op) + content * (w * op)
        else:
            # Coming up (and when A fades the mirror out) the lens passes through the glass's own flat colour,
            # never through A's words.
            e = op * (ease_io(clamp((t - L['t0']) / L['fade'])) if 'fade' in L else 1)
            inside = shape[::4, ::4, 0] > 0.5
            flat = np.median(region[::4, ::4][inside], axis=0) if inside.any() else np.zeros(3, np.float32)
            inner = content * e + flat[None, None, :] * (1 - e)
        out[y0:y1, x0:x1] = region * (1 - shape) + inner * shape
    return (out + 0.5).astype(np.uint8)


_zones = {}


def lens_zone(box):
    """The search zone around a mirror's glass, and a soft elliptical matte a little larger than the glass."""
    if box not in _zones:
        bx0, by0, bx1, by1 = box
        zx0, zy0, zx1, zy1 = max(0, bx0 - 40), max(0, by0 - 40), min(W, bx1 + 40), min(H, by1 + 40)
        yy, xx = np.mgrid[zy0:zy1, zx0:zx1].astype(np.float32)
        cx, cy, rx, ry = (bx0 + bx1) / 2, (by0 + by1) / 2, (bx1 - bx0) / 2 + 30, (by1 - by0) / 2 + 30
        r = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
        _zones[box] = (zx0, zy0, zx1, zy1, 1 - smoothstep(0.97, 1.0, r))
    return _zones[box]


def apply_door(a, b, prep, t):
    d = DOOR
    if not door_active(t):
        return a
    prep = prep()
    on = ease_io(clamp((t - d['t_in']) / d['fade']))
    g = ease_io(clamp((t - d['grow_at']) / d['grow']))
    x0 = d['x0'] - g * (d['x0'] + 400)
    x1 = d['x1'] + g * (W - d['x1'] + 400)
    y0 = d['y0'] - g * (d['y0'] + 400)
    soft = d['soft'] * (1 + 2 * g)
    wx = smoothstep(x0 - soft, x0 + soft, COLS) * (1 - smoothstep(x1 - soft, x1 + soft, COLS))
    wy = smoothstep(y0 - soft, y0 + soft, np.arange(H, dtype=np.float32))
    w = np.clip(wy[:, None] * wx[None, :] * on + g, 0, 1)
    return mix(a, mix(prep.clean, b, g), w)


# ───────────────────────── IO ─────────────────────────
class Reader:
    def __init__(self, path, start, count, gray=False):
        self.n = W * H * (1 if gray else 3)
        self.shape = (H, W) if gray else (H, W, 3)
        fmt = 'gray' if gray else 'rgb24'
        cmd = ['ffmpeg', '-v', 'error', '-ss', f'{max(0, start - 0.5) / FPS:.6f}', '-i', path, '-frames:v', str(count), '-fps_mode', 'passthrough',
               '-vf', 'scale=in_color_matrix=bt709:in_range=tv', '-f', 'rawvideo', '-pix_fmt', fmt, '-']
        self.p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=self.n * 4)

    def read(self):
        buf = self.p.stdout.read(self.n)
        if len(buf) < self.n:
            return None
        return np.frombuffer(buf, np.uint8).reshape(self.shape)

    def close(self):
        self.p.stdout.close()
        self.p.wait()


def nframes(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries',
                          'stream=nb_read_packets', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout
    return int(out.strip())


class Masks:
    """Mirror masks rendered as clips named m_<first>-<last>.mp4."""

    def __init__(self, folder):
        self.ranges = []
        for p in sorted(glob.glob(os.path.join(folder, 'm_*.mp4'))):
            a, b = map(int, re.match(r'm_(\d+)-(\d+)\.mp4', os.path.basename(p)).groups())
            self.ranges.append((a, b, p))
        self.cur, self.next = None, None

    def get(self, f):
        if self.cur is None or self.next != f:
            if self.cur:
                self.cur.close()
                self.cur = None
            for a, b, p in self.ranges:
                if a <= f <= b:
                    self.cur = Reader(p, f - a, b - f + 1, gray=True)
                    break
        if self.cur is None:
            return None
        self.next = f + 1
        m = self.cur.read()
        if m is None:
            self.cur.close()
            self.cur = None
        return m


# ───────────────────────── main ─────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--a', required=True, help='revision 2 master')
    ap.add_argument('--b', required=True, help='viral master (its audio is used)')
    ap.add_argument('--masks', required=True, help='folder with the TooHotMirrorMask clips')
    ap.add_argument('--out', required=True)
    ap.add_argument('--from', dest='t0', type=float, default=0.0)
    ap.add_argument('--to', dest='t1', type=float, default=None)
    ap.add_argument('--crf', type=int, default=14)
    ap.add_argument('--preset', default='slow')
    ap.add_argument('--stills', default='', help='comma-separated seconds: write PNGs instead of a video')
    ap.add_argument('--video-only', action='store_true', help='no audio (for the parallel chunks of a full render)')
    args = ap.parse_args()

    nb, na = nframes(args.b), nframes(args.a)
    stills = [float(s) for s in args.stills.split(',') if s]
    if stills:
        frames = sorted({int(round(s * FPS)) for s in stills})
    else:
        f0 = int(round(args.t0 * FPS))
        f1 = nb if args.t1 is None else min(nb, int(round(args.t1 * FPS)))
        frames = list(range(f0, f1))

    times = [e[0] for e in EDL]
    masks = Masks(args.masks)
    enc = None
    if not stills:
        dur = len(frames) / FPS
        full = frames[0] == 0 and frames[-1] == nb - 1
        audio = (['-i', args.b] if full else ['-ss', f'{frames[0] / FPS:.6f}', '-t', f'{dur:.6f}', '-i', args.b])
        acodec = ['-c:a', 'copy'] if full else ['-c:a', 'aac', '-b:a', '320k', '-af', 'afade=t=in:d=0.05']
        if args.video_only:
            audio, acodec = [], []
        cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
               '-i', '-', *audio, '-map', '0:v', *([] if args.video_only else ['-map', '1:a']), '-c:v', 'libx264', '-preset', args.preset,
               '-crf', str(args.crf), '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-pix_fmt', 'yuv420p',
               '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
               *acodec, *([] if args.video_only else ['-shortest']), '-movflags', '+faststart', args.out]
        enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    def run(fs):
        nonlocal enc
        ra = Reader(args.a, fs[0], min(len(fs), max(0, na - fs[0]))) if fs[0] < na else None
        rb = Reader(args.b, fs[0], len(fs))
        for f in fs:
            t = f / FPS
            a = ra.read() if (ra and f < na) else None
            b = rb.read()
            m = masks.get(f)
            k = max(0, np.searchsorted(times, t, side='right') - 1)
            ev = EDL[k]
            prev = EDL[k - 1] if k > 0 else None

            cache = {}

            def prep():
                if 'p' not in cache:
                    cache['p'] = BPrep(b, f)
                return cache['p']

            def src(name):
                if name == 'B' or a is None:
                    return b
                if name == 'A':
                    return apply_door(apply_lens(a, prep, m, t), b, prep, t)
                return thermal(a, t, f)[0]

            p = (t - ev[0]) / ev[3] if ev[3] > 0 else 1.0
            if prev is not None and p < 1:
                kind, opt = ev[2], ev[4]
                if kind == 'scan':
                    to_thermal = ev[1] != 'A'
                    out = scan(src(prev[1]), src(ev[1]), p, opt['dir'], TINT_THERMAL if to_thermal else TINT_VISIBLE)
                elif kind == 'heat':
                    at, lut = thermal(a, t, f)
                    out = heat_front(src(prev[1]), at, p, opt['c'], lut)
                elif kind == 'dissolve':
                    out = mix(src(prev[1]), src(ev[1]), ease_io(p))
                elif kind == 'melt':
                    at, lut = thermal(a, t, f)
                    out = melt(at if prev[1] == 'AT' else src(prev[1]), src(ev[1]), p, lut, int(ev[0] * 100))
                elif kind == 'glitch':
                    out = glitch(src(prev[1]), src(ev[1]), p, f)
                else:  # door: A already carries the growing window
                    out = src(prev[1])
            else:
                out = src(ev[1])
            yield f, out
        if ra:
            ra.close()
        rb.close()

    t_start = time.time()
    if stills:
        os.makedirs(args.out, exist_ok=True)
        for f in frames:
            for g, img in run([f]):
                Image.fromarray(img).save(os.path.join(args.out, f'fusion_{g / FPS:07.2f}.png'))
        print('stills', len(frames), args.out)
        return
    n = 0
    for f, img in run(frames):
        enc.stdin.write(np.ascontiguousarray(img).tobytes())
        n += 1
        if n % 150 == 0:
            el = time.time() - t_start
            print(f'{n}/{len(frames)} frames, {n / el:.1f} fps', flush=True)
    enc.stdin.close()
    enc.wait()
    print('done', args.out, f'{len(frames)} frames in {time.time() - t_start:.0f}s')


if __name__ == '__main__':
    main()
