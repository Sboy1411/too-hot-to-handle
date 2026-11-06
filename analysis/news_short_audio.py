#!/usr/bin/env python3
"""Audio for the breaking-news Short (TooHotNewsShort): a synthesized news theme at the song's 152 BPM under the
bulletin (sting, ticking 8ths, bass ostinato, stabs, whooshes on the cuts), the lights dying, a burst of static,
then the master from 0:00 until "spotlight", which echoes out under the end card. Times come from news.json.

Usage: python3 analysis/news_short_audio.py MASTER.wav OUT.wav
"""
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
cfg = json.loads((Path(__file__).resolve().parent.parent / 'src/shorts/news/news.json').read_text())
SONG_AT, DUR = cfg['songAt'], cfg['frames'] / 30
ST, SG, TAIL = cfg['story'], cfg['song'], cfg['tail']
BEAT = 60 / 152


def load(path, start, dur):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(start), '-t', str(dur), '-i', path,
                          '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def env(n, attack, tau):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-t / tau)


def band_limit(x, lo, hi):
    spec = np.fft.rfft(x, axis=0)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    spec[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(spec, len(x), axis=0)


def osc(freqs, dur, kind='sine'):
    """Oscillator following a frequency curve (Hz values spread evenly over dur)."""
    n = int(dur * SR)
    f = np.interp(np.arange(n) / SR, np.linspace(0, dur, len(freqs)), freqs)
    ph = np.cumsum(f) / SR
    if kind == 'saw':
        return 2 * (ph % 1) - 1
    if kind == 'tri':
        return 2 * np.abs(2 * (ph % 1) - 1) - 1
    return np.sin(2 * np.pi * ph)


def noise(dur, lo, hi, seed):
    n = int(dur * SR)
    s = band_limit(np.random.default_rng(seed).standard_normal(n), lo, hi)
    return s / (np.abs(s).max() + 1e-9)


def place(out, sound, t, pan=0.0, gain=1.0):
    i = int(round(t * SR))
    if i >= len(out) or i + len(sound) <= 0:
        return
    if sound.ndim == 1:
        sound = np.stack([sound * (1 - pan) ** 0.5, sound * (1 + pan) ** 0.5], axis=1)
    a, b = max(i, 0), min(len(out), i + len(sound))
    out[a:b] += gain * sound[a - i:b - i]


def chord(notes, dur, tau, kind='saw', lp=3000):
    s = sum(osc([f * d], dur, kind) for f in notes for d in (0.997, 1.003)) / (2 * len(notes))
    return band_limit(s, 30, lp) * env(len(s), 0.006, tau)


N = lambda m: 440 * 2 ** ((m - 69) / 12)  # MIDI note to Hz
# two bars per chord: Dm, Bb, C, A (the news theme's minor ostinato)
PROG = [(N(38), [N(62), N(65), N(69)]), (N(34), [N(58), N(62), N(65)]), (N(36), [N(60), N(64), N(67)]), (N(33), [N(57), N(61), N(64)])]


def news_bed():
    out = np.zeros((int(SONG_AT * SR) + SR, 2))
    # the BREAKING sting
    boom = osc(70 * (32 / 70) ** np.linspace(0, 1, 50), 1.0) * env(SR, 0.002, 0.45)
    place(out, np.tanh(boom * 1.6) * 0.48, 0.0)
    place(out, noise(1.4, 2500, 14000, 1) * env(int(1.4 * SR), 0.001, 0.45) * 0.13, 0.0)
    place(out, chord([N(50), N(53), N(57), N(62)], 0.9, 0.35) * 0.72, 0.0)
    stop = ST['wait']
    bed_start = 0.4
    nbeats = int((stop - bed_start) / BEAT)
    for k in range(nbeats * 2):  # eighth notes
        t = bed_start + k * BEAT / 2
        if t >= stop:
            break
        bar_chord = PROG[(k // 16) % 4]
        tension = t >= ST['close'] + 0.9  # bass and pads drop out; only the clock is left
        tick = noise(0.02, 6000, 16000, 10 + k) * env(int(0.02 * SR), 0.0005, 0.005)
        place(out, tick, t, 0.25, 0.085 if k % 2 == 0 else 0.05)
        if not tension:
            bass = band_limit(osc([bar_chord[0]], 0.16, 'saw'), 30, 500) * env(int(0.16 * SR), 0.003, 0.07)
            place(out, bass, t, 0, 0.32 if k % 2 == 0 else 0.2)
        if ST['map'] <= t and not tension:  # the story picks up: a 16th arpeggio, then a kick from the CCTV beat
            tones = [bar_chord[1][j] * 2 for j in (0, 1, 2, 1)]
            for h in range(2):
                ar = band_limit(osc([tones[(2 * k + h) % 4]], 0.12, 'tri'), 200, 5000) * env(int(0.12 * SR), 0.002, 0.05)
                place(out, ar, t + h * BEAT / 4, 0.3 if h else -0.3, 0.05 + 0.02 * (t >= ST['cctv']))
            if t >= ST['cctv'] and k % 2 == 0:
                kick = osc([120, 45], 0.25) * env(int(0.25 * SR), 0.002, 0.07)
                place(out, kick, t, 0, 0.28)
        if k % 16 == 0 and not tension:
            place(out, chord(bar_chord[1], 0.32, 0.12) * 0.55, t)
            tom = osc([95, 60], 0.5) * env(int(0.5 * SR), 0.002, 0.16)
            place(out, tom, t, 0, 0.45)
            pad = chord(bar_chord[1], 16 * BEAT / 2, 2.5, 'tri', 1600)
            pad *= np.minimum(1, np.arange(len(pad)) / (0.3 * SR))[:, None] if pad.ndim > 1 else np.minimum(1, np.arange(len(pad)) / (0.3 * SR))
            place(out, pad, t, 0, 0.22)
    # whooshes on the cuts
    for c in (ST['studio'], ST['map'], ST['cctv'], ST['close']):
        n = int(0.4 * SR)
        w = noise(0.4, 400, 7000, int(c * 10)) * np.sin(np.linspace(0, np.pi, n)) ** 2
        place(out, w, c - 0.22, 0.3, 0.16)
    # the party pin pops on the map; the evidence photo slides in
    place(out, osc([520, 900], 0.12) * env(int(0.12 * SR), 0.002, 0.04), ST['party'] + 0.25, -0.3, 0.1)
    n = int(0.45 * SR)
    place(out, noise(0.45, 600, 9000, 33) * np.sin(np.linspace(0, np.pi, n)) ** 3, ST['glasses'] - 0.1, 0.5, 0.14)
    # rising tension into "Wait…"
    rise_from = ST['close'] + 0.9
    n = int((stop - rise_from) * SR)
    riser = noise(stop - rise_from, 300, 9000, 77) * np.linspace(0, 1, n) ** 2
    place(out, riser, rise_from, -0.2, 0.12)
    # the lights die, then static until the song
    dark = ST['dark']
    pd = osc(220 * (28 / 220) ** np.linspace(0, 1, 40), 0.6, 'tri') * env(int(0.6 * SR), 0.002, 0.3)
    place(out, np.tanh(pd * 2) * 0.32, dark)
    place(out, noise(0.04, 60, 1200, 5) * env(int(0.04 * SR), 0.001, 0.012) * 0.5, dark)
    sdur = SONG_AT - ST['static']
    stat = noise(sdur, 900, 11000, 9)
    crackle = (np.random.default_rng(3).random(len(stat)) > 0.9985) * np.random.default_rng(4).standard_normal(len(stat)) * 3
    stat = (stat + crackle) * np.minimum(1, np.arange(len(stat)) / 240)
    place(out, np.clip(stat, -1, 1), ST['static'], 0, 0.2)
    out[int(SONG_AT * SR):] = 0  # hard cut into the song
    return out


def reverb(x, rt60=2.0, seed=5):
    ir_n = int(2.4 * SR)
    ir = band_limit(np.random.default_rng(seed).standard_normal((ir_n, 2)), 150, 5000)
    ir *= np.exp(-np.arange(ir_n) / SR * 6.91 / rt60)[:, None]
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    size = 1 << int(math.ceil(math.log2(len(x) + ir_n)))
    return np.fft.irfft(np.fft.rfft(x, size, axis=0) * np.fft.rfft(ir, size, axis=0), size, axis=0)[:len(x)]


def echo_tail(master_path, span):
    """'spotlight' repeated a bar later (darker, quieter, ping-ponged) in a reverb wash."""
    src = load(master_path, TAIL['from'], TAIL['cut'] - TAIL['from'])
    n = len(src)
    src *= np.minimum(1, np.arange(n) / 240)[:, None] * np.minimum(1, (n - np.arange(n)) / 1200)[:, None]
    wet = np.zeros((span, 2))
    k = 1
    while int(k * TAIL['delay'] * SR) < span:
        i = int(k * TAIL['delay'] * SR)
        rep = band_limit(src, 220, 7000 / k) * 0.55 * TAIL['feedback'] ** (k - 1)
        pan = 0.35 if k % 2 else -0.35
        rep = rep * np.array([(1 - pan) ** 0.5, (1 + pan) ** 0.5])
        m = min(n, span - i)
        wet[i:i + m] += rep[:m]
        k += 1
    both = wet.copy()
    both[:n] += src
    return wet + 0.32 * reverb(both)


def main():
    master, out_path = sys.argv[1], sys.argv[2]
    total = int(round(DUR * SR))
    mix = np.zeros((total, 2))
    bed = news_bed()
    mix[:min(len(bed), total)] += bed[:total]
    song = load(master, 0, TAIL['cut'])
    fade = int(0.03 * SR)
    song[-fade:] *= np.linspace(1, 0, fade)[:, None]
    place(mix, song, SONG_AT)
    place(mix, echo_tail(master, total - int((SONG_AT + TAIL['from']) * SR)), SONG_AT + TAIL['from'])
    # a few graphics sounds over the song: stamps, card flips, the CRT switching off
    thump = osc([110, 50], 0.3) * env(int(0.3 * SR), 0.002, 0.08)
    click = noise(0.08, 800, 5000, 2) * env(int(0.08 * SR), 0.001, 0.02) * 0.4
    thump[:len(click)] += click
    for s in (SG['stamp'] + 0.15, SG['tm']):
        place(mix, thump, SONG_AT + s, 0, 0.5)
    for i, s in enumerate(SG['flips']):
        place(mix, noise(0.05, 1500, 8000, 50 + i) * env(int(0.05 * SR), 0.001, 0.015), SONG_AT + s, 0.4 if i % 2 else -0.4, 0.12)
    off = SONG_AT + SG['off']
    whine = osc(np.geomspace(9000, 600, 30), 0.35) * env(int(0.35 * SR), 0.001, 0.12)
    place(mix, whine, off, 0, 0.12)
    place(mix, noise(0.03, 80, 2000, 8) * env(int(0.03 * SR), 0.001, 0.01), off + 0.24, 0, 0.4)
    n = len(mix)
    mix[n - int(0.35 * SR):] *= np.linspace(1, 0, int(0.35 * SR))[:, None]
    print(f'peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS, {n / SR:.3f} s')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s24le', out_path], input=mix.astype(np.float32).tobytes(), check=True)


if __name__ == '__main__':
    main()
