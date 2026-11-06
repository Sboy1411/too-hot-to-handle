#!/usr/bin/env python3
"""Audio for the group-chat Short (TooHotChatShort): the master from chat.json's start, low-passed and turned down
like music heard from another room (a little closer once he walks in) until a filter sweep opens it on the hook,
plus message sounds derived from the timeline and typing clicks. The master stops right after "scandal!" and the
word echoes out.

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
KEYS = A['cutoff']  # [song time, Hz]; the last key is the filter fully open
GAIN = A['gainDb']  # [song time, dB]: the party next door sits under the story, then comes up with the sweep
TAIL = A['tail']
OPEN = cfg['moments']['open']


def load(path, start, dur):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(start), '-t', str(dur), '-i', path,
                          '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def cutoff(t):
    """Low-pass corner in Hz at song time t: log-interpolated between keys, eased in (p²) so sweeps open late."""
    if t <= KEYS[0][0]:
        return KEYS[0][1]
    for (t0, f0), (t1, f1) in zip(KEYS, KEYS[1:]):
        if t <= t1:
            p = (t - t0) / (t1 - t0)
            return f0 * (f1 / f0) ** (p * p)
    return KEYS[-1][1]


def muffle(x):
    """Two cascaded RBJ low-pass biquads (24 dB/oct, Q 0.707), coefficients refreshed every 32 samples."""
    n_end = min(len(x), int((KEYS[-1][0] - START) * SR) + 480)
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
    ts = START + np.arange(len(x)) / SR
    gain = 10 ** (np.interp(ts, [k[0] for k in GAIN], [k[1] for k in GAIN]) / 20)[:, None]
    return (y * (1 - xf) + x * xf) * gain


def env(n, attack, tau):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-t / tau)


def tone(freqs, dur, amp, tau):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.interp(t, np.linspace(0, dur, len(freqs)), freqs)
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, tau)


def band_limit(x, lo, hi):
    spec = np.fft.rfft(x, axis=0)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    spec[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(spec, len(x), axis=0)


def noise(dur, amp, tau, lo, hi, seed):
    n = int(dur * SR)
    s = band_limit(np.random.default_rng(seed).standard_normal(n), lo, hi)
    return amp * s / (np.abs(s).max() + 1e-9) * env(n, 0.001, tau)


def place(out, sound, t, pan=0.0):
    i = int((t - START) * SR)
    if i >= len(out):
        return
    if sound.ndim == 1:
        sound = np.stack([sound * (1 - pan) ** 0.5, sound * (1 + pan) ** 0.5], axis=1)
    s = sound[:len(out) - max(i, 0)]
    out[max(i, 0):max(i, 0) + len(s)] += s


def echo_tail(master_path):
    """'scandal!' repeated on a half-note delay (darker and quieter each time, ping-ponged) in a reverb wash."""
    src = load(master_path, TAIL['from'], TAIL['cut'] - TAIL['from'])
    n = len(src)
    src *= np.minimum(1, np.arange(n) / 240)[:, None] * np.minimum(1, (n - np.arange(n)) / 1200)[:, None]
    span = int((START + DUR - TAIL['from']) * SR)
    wet = np.zeros((span, 2))
    k = 1
    while True:
        i = int(k * TAIL['delay'] * SR)
        if i >= span:
            break
        rep = band_limit(src, 220, 7000 / k) * 0.55 * TAIL['feedback'] ** (k - 1)
        pan = 0.35 if k % 2 else -0.35
        rep = rep * np.array([(1 - pan) ** 0.5, (1 + pan) ** 0.5])
        m = min(n, span - i)
        wet[i:i + m] += rep[:m]
        k += 1
    # synthetic stereo room: decorrelated noise, RT60 ~2 s, darkened
    ir_n = int(2.4 * SR)
    rng = np.random.default_rng(5)
    ir = band_limit(rng.standard_normal((ir_n, 2)), 150, 5000) * np.exp(-np.arange(ir_n) / SR * 6.91 / 2.0)[:, None]
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    dry_and_echo = wet.copy()
    dry_and_echo[:n] += src
    size = 1 << int(math.ceil(math.log2(span + ir_n)))
    verb = np.fft.irfft(np.fft.rfft(dry_and_echo, size, axis=0) * np.fft.rfft(ir, size, axis=0), size, axis=0)[:span]
    return wet + 0.32 * verb


def main():
    master, out_path = sys.argv[1], sys.argv[2]
    total = int(round(DUR * SR))
    mix = np.zeros((total, 2))
    dry = muffle(load(master, START, TAIL['cut'] - START))
    fade = int(0.025 * SR)
    dry[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix[:len(dry)] += dry
    place(mix, echo_tail(master), TAIL['from'])

    fx = np.zeros_like(mix)
    pop = np.concatenate([tone([880, 900], 0.045, 0.28, 0.02), tone([1318, 1350], 0.09, 0.3, 0.03)])
    tick = tone([620, 600], 0.07, 0.16, 0.025) + tone([930, 900], 0.07, 0.1, 0.02)
    whoosh = noise(0.16, 0.1, 0.06, 500, 4000, 7) * np.linspace(0.3, 1, int(0.16 * SR))
    # sounds for the story part only: once the song opens up, the music carries it
    for m in cfg['messages']:
        if m['at'] >= OPEN or m['kind'] in ('typing', 'lyric', 'song'):
            continue
        t = max(m['at'], START)
        if m['kind'] == 'system':
            place(fx, tick, t)
        elif m.get('from') == 'you':
            place(fx, whoosh, t - 0.04, 0.2)
            place(fx, tone([1100, 1500], 0.05, 0.07, 0.015), t + 0.03, 0.2)
        else:
            place(fx, pop, t)
    for r in cfg['reactions']:
        if r['at'] < OPEN:
            place(fx, tone([1560, 1700], 0.06, 0.16, 0.02), r['at'], 0.3)
    for t in cfg['sfx']['tick']:
        place(fx, tick * 0.8, t, -0.2)
    ty = cfg['typed']
    step = (ty['to'] - ty['from']) / len(ty['text'])
    for i, ch in enumerate(ty['text']):
        place(fx, noise(0.012, 0.08 if ch != ' ' else 0.11, 0.004, 2000, 9000, 100 + i), ty['from'] + i * step, 0.1)
    mix += fx

    n = len(mix)
    mix[:int(0.08 * SR)] *= np.linspace(0, 1, int(0.08 * SR))[:, None]
    mix[n - int(0.35 * SR):] *= np.linspace(1, 0, int(0.35 * SR))[:, None]
    print(f'peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS, {n / SR:.3f} s')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s24le', out_path], input=mix.astype(np.float32).tobytes(), check=True)


if __name__ == '__main__':
    main()
