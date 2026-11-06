#!/usr/bin/env python3
"""Audio for the animated chorus Reel (TooHotKlingReel): the master from the hook's first downbeat to just after
"scandal!", then "scandal!" echoing out under the front page and the end card. Times come from kling.json.

Usage: python3 analysis/kling_reel_audio.py MASTER.wav OUT.wav
"""
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
cfg = json.loads((Path(__file__).resolve().parent.parent / 'src/shorts/kling/kling.json').read_text())
START, DUR, TAIL = cfg['start'], cfg['frames'] / 30, cfg['tail']


def load(path, start, dur):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(start), '-t', str(dur), '-i', path,
                          '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def band_limit(x, lo, hi):
    spec = np.fft.rfft(x, axis=0)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    spec[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(spec, len(x), axis=0)


def reverb(x, rt60=2.2, seed=5):
    ir_n = int(2.6 * SR)
    ir = band_limit(np.random.default_rng(seed).standard_normal((ir_n, 2)), 150, 6000)
    ir *= np.exp(-np.arange(ir_n) / SR * 6.91 / rt60)[:, None]
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    size = 1 << int(math.ceil(math.log2(len(x) + ir_n)))
    return np.fft.irfft(np.fft.rfft(x, size, axis=0) * np.fft.rfft(ir, size, axis=0), size, axis=0)[:len(x)]


def main():
    master, out_path = sys.argv[1], sys.argv[2]
    total = int(round(DUR * SR))
    mix = np.zeros((total, 2))
    song = load(master, START, TAIL['cut'] - START)
    song[:240] *= np.linspace(0, 1, 240)[:, None]
    fade = int(0.03 * SR)
    song[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix[:len(song)] += song
    # "scandal!" repeated every half note, darker and quieter each time, ping-ponged, in a reverb wash
    src = load(master, TAIL['from'], TAIL['cut'] - TAIL['from'])
    n = len(src)
    src *= np.minimum(1, np.arange(n) / 240)[:, None] * np.minimum(1, (n - np.arange(n)) / 1200)[:, None]
    at = int((TAIL['from'] - START) * SR)
    span = total - at
    wet = np.zeros((span, 2))
    k = 1
    while int(k * TAIL['delay'] * SR) < span:
        i = int(k * TAIL['delay'] * SR)
        rep = band_limit(src, 220, 7000 / k) * 0.6 * TAIL['feedback'] ** (k - 1)
        pan = 0.35 if k % 2 else -0.35
        rep = rep * np.array([(1 - pan) ** 0.5, (1 + pan) ** 0.5])
        m = min(n, span - i)
        wet[i:i + m] += rep[:m]
        k += 1
    both = wet.copy()
    both[:n] += src
    mix[at:] += wet + 0.3 * reverb(both)
    mix[-int(0.35 * SR):] *= np.linspace(1, 0, int(0.35 * SR))[:, None]
    peak = np.abs(mix).max()
    if peak > 0.98:
        mix *= 0.98 / peak
    print(f'peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS, {total / SR:.3f} s')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s24le', out_path], input=mix.astype(np.float32).tobytes(), check=True)


if __name__ == '__main__':
    main()
