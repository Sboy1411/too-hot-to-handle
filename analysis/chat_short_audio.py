#!/usr/bin/env python3
"""Audio for the group-chat Short (TooHotChatShort): the master from chat.json's start, low-passed like music heard
from another room until a filter sweep opens it on the hook, plus synthesized message sounds and typing clicks.

Usage: python3 analysis/chat_short_audio.py MASTER.wav OUT.wav
"""
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
cfg = json.loads((Path(__file__).resolve().parent.parent / 'src/shorts/chat/chat.json').read_text())
START, DUR = cfg['start'], cfg['frames'] / 30
A = cfg['audio']


def load(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(START), '-t', str(DUR), '-i', path,
                          '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def cutoff(t):
    """Low-pass corner in Hz at song time t: closed, then an exponential sweep up to fully open."""
    if t <= A['sweepFrom']:
        return A['muffleHz']
    p = min(1.0, (t - A['sweepFrom']) / (A['sweepTo'] - A['sweepFrom']))
    return A['muffleHz'] * (18000 / A['muffleHz']) ** (p * p)


def muffle(x):
    """Two cascaded RBJ low-pass biquads (24 dB/oct, Q 0.707), coefficients refreshed every 32 samples."""
    n_end = int((A['sweepTo'] - START) * SR) + 480
    y = x.copy()
    state = [[0.0, 0.0, 0.0, 0.0] for _ in range(4)]  # (x1, x2, y1, y2) per stage per channel
    for b0i in range(0, n_end, 32):
        w = 2 * math.pi * cutoff(START + b0i / SR) / SR
        alpha = math.sin(w) / (2 * 0.7071)
        cw = math.cos(w)
        a0 = 1 + alpha
        b0 = b2 = (1 - cw) / 2 / a0
        b1 = (1 - cw) / a0
        a1 = -2 * cw / a0
        a2 = (1 - alpha) / a0
        for ch in range(2):
            for stage in range(2):
                s = state[ch * 2 + stage]
                x1, x2, y1, y2 = s
                seg = y[b0i:b0i + 32, ch]
                for i in range(len(seg)):
                    v = seg[i]
                    o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
                    x2, x1, y2, y1 = x1, v, y1, o
                    seg[i] = o
                s[:] = [x1, x2, y1, y2]
    # hand back to the untouched master over 10 ms once the filter is wide open
    xf = np.clip((np.arange(len(x)) - (n_end - 480)) / 480, 0, 1)[:, None]
    makeup = np.where(np.arange(len(x)) < n_end, 1.25, 1.0)[:, None]  # ~+2 dB so the muffled bed isn't too thin
    return (y * makeup) * (1 - xf) + x * xf


def env(n, attack, tau):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-t / tau)


def tone(freqs, dur, amp, tau):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.interp(t, np.linspace(0, dur, len(freqs)), freqs)
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, tau)


def noise(dur, amp, tau, lo, hi, seed):
    n = int(dur * SR)
    r = np.random.default_rng(seed).standard_normal(n)
    spec = np.fft.rfft(r)
    fr = np.fft.rfftfreq(n, 1 / SR)
    spec[(fr < lo) | (fr > hi)] = 0
    s = np.fft.irfft(spec, n)
    return amp * s / (np.abs(s).max() + 1e-9) * env(n, 0.001, tau)


def place(out, sound, t, pan=0.0):
    i = int((t - START) * SR)
    if i >= len(out):
        return
    s = sound[:len(out) - max(i, 0)]
    out[max(i, 0):max(i, 0) + len(s), 0] += s * (1 - pan) ** 0.5
    out[max(i, 0):max(i, 0) + len(s), 1] += s * (1 + pan) ** 0.5


def main():
    master, out_path = sys.argv[1], sys.argv[2]
    mix = muffle(load(master))
    fx = np.zeros_like(mix)
    pop = np.concatenate([tone([880, 900], 0.045, 0.28, 0.02), tone([1318, 1350], 0.09, 0.3, 0.03)])
    for t in cfg['sfx']['pop']:
        place(fx, pop, max(t, START))
    for t in cfg['sfx']['react']:
        place(fx, tone([1560, 1700], 0.06, 0.16, 0.02), t, 0.3)
    for t in cfg['sfx']['tick']:
        place(fx, tone([620, 600], 0.07, 0.16, 0.025) + tone([930, 900], 0.07, 0.1, 0.02), t)
    for t in cfg['sfx']['send']:
        whoosh = noise(0.16, 0.1, 0.06, 500, 4000, 7) * np.linspace(0.3, 1, int(0.16 * SR))
        place(fx, whoosh, t - 0.04, 0.2)
        place(fx, tone([1100, 1500], 0.05, 0.07, 0.015), t + 0.03, 0.2)
    ty = cfg['typed']
    step = (ty['to'] - ty['from']) / len(ty['text'])
    for i, ch in enumerate(ty['text']):
        place(fx, noise(0.012, 0.08 if ch != ' ' else 0.11, 0.004, 2000, 9000, 100 + i), ty['from'] + i * step, 0.1)
    mix += fx
    n = len(mix)
    mix[:int(0.015 * SR)] *= np.linspace(0, 1, int(0.015 * SR))[:, None]
    mix[n - int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))[:, None]
    print(f'peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS, {n / SR:.3f} s')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s24le', out_path], input=mix.astype(np.float32).tobytes(), check=True)


if __name__ == '__main__':
    main()
