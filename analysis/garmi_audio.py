"""Soundtrack for the GARMI 24×7 news-bulletin Short (src/garmi/).

0:00–0:28.37  an original news theme (152 BPM, D minor) + graphic SFX, mixed ~4 dB under the song.
0:28.37       hard cut into the song master from 0:00.0, untouched until 1:02.43 (song 0:34.06).
on top        stamp / ™ thumps, forecast-card ticks, CRT whine + click at the switch-off.
after the cut the last word ("spotlight", song 0:32.35–0:34.06) echoes every 1.58 s (one bar), ×0.42 and darker
              each time, panned L/R, inside a long reverb, fading out under the end card.

Usage: python3 analysis/garmi_audio.py SONG_MASTER OUT_DIR
Writes OUT_DIR/garmi-mix.wav (song untouched) and OUT_DIR/garmi-mix-loud.wav (gain + true-peak limiting to ≈ -14 LUFS).
"""
import os
import re
import subprocess
import sys

import numpy as np
import scipy.io.wavfile as wf
from scipy import signal

SR = 48000
DUR = 65.37
N = int(round(DUR * SR))
SONG_IN = 28.37
SONG_OUT = 62.43
SONG_CUT = SONG_OUT - SONG_IN  # 34.06
BPM = 152
BEAT = 60 / BPM
EIGHTH = BEAT / 2
SIXT = BEAT / 4
BAR = BEAT * 4
DROP = 25.6  # music drops out, only the clock + a riser remain
DARK = 27.85  # lights die: power-down + thump
STATIC_IN = 27.93
rng = np.random.default_rng(152)


def tvec(dur):
    return np.arange(int(round(dur * SR))) / SR


def place(buf, sig, t, gain=1.0, pan=0.0):
    """Add mono or stereo sig into the stereo buf at time t (s). pan -1 (L) … +1 (R), equal power."""
    i = int(round(t * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)
    j = min(len(buf), i + len(sig))
    if j > i >= 0:
        buf[i:j] += sig[: j - i] * gain


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def saw(f, dur, detune=0.0):
    t = tvec(dur)
    ph = (t * f * 2 ** (detune / 1200) + rng.random()) % 1.0
    return 2 * ph - 1


def env(dur, a=0.005, d=0.2, s=0.0, r=0.05, hold=None):
    """Attack, exponential decay toward sustain s, release at the end."""
    t = tvec(dur)
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    if r > 0:
        rel = np.clip((dur - t) / r, 0, 1)
        e = e * rel
    return e


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lufs(path, start=None, dur=None):
    cmd = ['ffmpeg', '-hide_banner', '-nostats']
    if start is not None:
        cmd += ['-ss', str(start)]
    if dur is not None:
        cmd += ['-t', str(dur)]
    cmd += ['-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-']
    out = subprocess.run(cmd, capture_output=True, text=True).stderr
    summ = out[out.rfind('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    p = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
    return i, p


def write(path, x):
    wf.write(path, SR, x.astype(np.float32))


# ───────────────────────── instruments ─────────────────────────
def tick(hi=True):
    t = tvec(0.05)
    f = 2100 if hi else 1650
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008)
    n = hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.003)
    return s * 0.6 + n * 0.25


def bass_note(f, dur):
    s = saw(f, dur) * 0.6 + saw(f, dur, 8) * 0.4 + np.sin(2 * np.pi * f * tvec(dur)) * 0.8
    return lp(s, 650) * env(dur, a=0.004, d=0.16, s=0.35, r=0.03)


def brass(freqs, dur, bright=1.0):
    x = np.zeros(int(round(dur * SR)))
    for f in freqs:
        for dt in (-9, 0, 7):
            x += saw(f, dur, dt)
    x /= len(freqs) * 3
    e_f = np.exp(-tvec(dur) / 0.18)
    x = lp(x, 900) * (1 - e_f * bright) + lp(x, 4200) * (e_f * bright)
    return x * env(dur, a=0.01, d=0.35, s=0.25, r=0.08)


def pad(freqs, dur):
    x = np.zeros(int(round(dur * SR)))
    for f in freqs:
        for dt in (-12, 5, 14):
            x += saw(f, dur, dt)
    x = lp(x / (len(freqs) * 3), 1100, 2)
    t = tvec(dur)
    a = np.clip(t / 0.5, 0, 1) * np.clip((dur - t) / 0.6, 0, 1)
    return x * a


def pluck(f, dur=0.16):
    t = tvec(dur)
    x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * saw(f, dur)) * np.exp(-t / 0.07)
    return hp(x, 250)


def kick(soft=True):
    t = tvec(0.35)
    f = 45 + 85 * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / (0.16 if soft else 0.22))
    c = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / 0.002) * 0.25
    return s + c


def tom(f0=150, f1=88):
    t = tvec(0.45)
    f = f1 + (f0 - f1) * np.exp(-t / 0.06)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    n = bp(rng.standard_normal(len(t)), 200, 1800) * np.exp(-t / 0.03) * 0.3
    return s + n


def whoosh(dur=0.5, peak=0.3):
    t = tvec(dur)
    n = rng.standard_normal((len(t), 2))
    # sweep: blend a dark and a bright band toward the peak, then back
    k = np.clip(t / peak, 0, 1) ** 2 * np.clip((dur - t) / (dur - peak), 0, 1) ** 1.5
    x = bp(n, 300, 1500) * (1 - k)[:, None] + bp(n, 1500, 9000) * k[:, None]
    return x * k[:, None] * 0.9


def pop():
    t = tvec(0.09)
    f = 380 + 700 * (1 - np.exp(-t / 0.02))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025)
    return s + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.002) * 0.3


def slide(dur=0.42):
    """Paper sliding across a desk, landing with a soft tap at the end."""
    t = tvec(dur + 0.06)
    n = lp(bp(rng.standard_normal(len(t)), 500, 5000), 3500)
    e = np.clip(t / (dur * 0.7), 0, 1) ** 1.5 * np.clip((dur - t) / (dur * 0.3), 0, 1)
    tap = np.zeros(len(t))
    k = int((dur - 0.03) * SR)
    tap[k:k + 2400] = np.sin(2 * np.pi * 180 * tvec(0.05)) * np.exp(-tvec(0.05) / 0.012)
    return n * e * 0.8 + tap * 0.7


def thump(f0=110, f1=48, dur=0.4):
    t = tvec(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    slap = bp(rng.standard_normal(len(t)), 350, 2500) * np.exp(-t / 0.018) * 0.55
    return s + slap


def card_tick():
    t = tvec(0.06)
    s = (np.sin(2 * np.pi * 2300 * t) + 0.6 * np.sin(2 * np.pi * 3400 * t)) * np.exp(-t / 0.009)
    return s * 0.7 + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.003) * 0.2


def reverb_ir(rt60=3.4, dur=4.5, dark=3200, pre=0.025):
    t = tvec(dur)
    decay = np.exp(-6.91 * t / rt60)
    ir = rng.standard_normal((len(t), 2)) * decay[:, None]
    ir = lp(ir, dark, 1)
    ir[: int(pre * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(0, keepdims=True))


# ───────────────────────── 1 · the news theme (0 → 28.37) ─────────────────────────
def build_theme():
    mus = np.zeros((N, 2))
    clock = np.zeros((N, 2))
    sfx = np.zeros((N, 2))
    # D minor: Dm, Bb, C, A — two bars each
    prog = [
        (38, [50, 53, 57, 62]),  # D2 | D3 F3 A3 D4
        (34, [50, 53, 58, 62]),  # Bb1 | D3 F3 Bb3 D4
        (36, [48, 52, 55, 60]),  # C2 | C3 E3 G3 C4
        (33, [49, 52, 57, 61]),  # A1 | C#3 E3 A3 C#4
    ]
    n_bars = int(np.ceil(DROP / BAR)) + 1
    pattern = [0, 0, 12, 0, 0, 0, 12, 7]
    for b in range(n_bars):
        t0 = b * BAR
        if t0 >= DROP:
            break
        root, chord = prog[(b // 2) % 4]
        for k, iv in enumerate(pattern):
            tn = t0 + k * EIGHTH
            if tn >= DROP:
                break
            place(mus, bass_note(midi(root + iv), EIGHTH * 0.92), tn, 0.5)
        if b % 2 == 0:
            place(mus, pad([midi(m) for m in chord], BAR * 2), t0, 0.16, 0)
            place(mus, brass([midi(m) for m in chord], 0.55), t0, 0.42, -0.15)
        else:
            nroot, nchord = prog[((b + 1) // 2) % 4]
            place(mus, brass([midi(m) for m in nchord], 0.3, 0.7), t0 + 3.5 * BEAT, 0.3, 0.15)
            place(mus, tom(150, 90), t0 + 3 * BEAT, 0.5, -0.3)
            place(mus, tom(120, 72), t0 + 3.5 * BEAT, 0.5, 0.3)
        # quiet 16th arpeggio from 0:10.2
        for k in range(16):
            tn = t0 + k * SIXT
            if tn < 10.2 - 1e-3 or tn >= DROP:
                continue
            notes = chord + [chord[1] + 12, chord[2] + 12]
            m = notes[[0, 1, 2, 3, 4, 3, 2, 1][k % 8]] + 12
            place(mus, pluck(midi(m)), tn, 0.075, 0.45 if k % 2 else -0.45)
        # soft kick on every beat from 0:17.7
        for k in range(4):
            tn = t0 + k * BEAT
            if 17.7 - 1e-3 <= tn < DROP:
                place(mus, kick(), tn, 0.55)
    # ticking clock: 8th notes until the lights die
    k = 0
    while k * EIGHTH < DARK:
        place(clock, tick(k % 2 == 0), k * EIGHTH, 0.22 if k % 2 == 0 else 0.16, 0.2 if k % 2 else -0.2)
        k += 1
    # the BREAKING sting on frame 1
    t = tvec(2.2)
    f = 36 + 80 * np.exp(-t / 0.12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    place(sfx, boom, 0.0, 0.9)
    place(sfx, brass([midi(m) for m in [38, 50, 53, 57, 62, 65]], 1.6, 1.0), 0.0, 0.75)
    crash = hp(rng.standard_normal((len(t), 2)), 3500) * np.exp(-t / 0.55)[:, None]
    place(sfx, crash, 0.0, 0.22)
    place(sfx, lp(rng.standard_normal(len(tvec(0.3))), 400) * np.exp(-tvec(0.3) / 0.05), 0.0, 0.8)
    # whooshes on the wipes (cut at the midpoint)
    for w in (2.3, 10.2, 17.7, 24.7):
        place(sfx, whoosh(0.5, 0.3), w - 0.3, 0.32)
    place(sfx, pop(), 13.75, 0.4, -0.3)
    place(sfx, slide(0.42), 21.2, 0.35, 0.5)
    # 25.6: a rising noise under the ticking clock
    rd = DARK - DROP
    tr = tvec(rd)
    n = rng.standard_normal((len(tr), 2))
    lo = bp(n, 250, 1200)
    hi = bp(n, 2000, 9000)
    k_ = (tr / rd) ** 1.6
    riser = lo * (1 - k_)[:, None] + hi * k_[:, None]
    riser *= (0.05 + 0.95 * (tr / rd) ** 2.2)[:, None]
    place(sfx, riser, DROP, 0.28)
    # 27.85: power-down + thump, then TV static to the song
    tp = tvec(0.6)
    fpd = 20 + 200 * np.exp(-tp / 0.12)
    ph = 2 * np.pi * np.cumsum(fpd) / SR
    pd = (np.sin(ph) * 0.6 + (((ph / (2 * np.pi)) % 1) * 2 - 1) * 0.3) * np.exp(-tp / 0.22)
    place(sfx, lp(pd, 2500), DARK, 0.55)
    place(sfx, thump(90, 40, 0.5), DARK, 0.75)
    st = tvec(SONG_IN - STATIC_IN)
    stat = bp(rng.standard_normal((len(st), 2)), 900, 9000)
    crackle = (rng.random((len(st), 2)) > 0.995) * rng.standard_normal((len(st), 2)) * 3
    stat = (stat + crackle) * np.clip(st / 0.02, 0, 1)[:, None]
    place(sfx, stat, STATIC_IN, 0.16)
    # nothing of the theme may leak past the hard cut into the song
    for buf in (mus, clock, sfx):
        i = int(round(SONG_IN * SR))
        buf[i:] = 0
    # music fades out fast at the drop
    i0 = int(DROP * SR)
    mus[i0:i0 + 1440] *= np.linspace(1, 0, 1440)[:, None]
    mus[i0 + 1440:] = 0
    return mus + clock + sfx


# ───────────────────────── 2 · song-side graphic SFX ─────────────────────────
def build_song_sfx():
    sfx = np.zeros((N, 2))
    for tf in (41.26, 41.65, 42.05, 42.42, 42.81, 43.21, 43.60):
        place(sfx, card_tick(), tf, 0.13, 0.3)
    place(sfx, thump(120, 50, 0.45), 43.75, 0.42)
    place(sfx, thump(130, 55, 0.45), 51.4, 0.38)
    # CRT switch-off: click, a high whine falling away, a little discharge crackle
    tc = tvec(0.004)
    click = np.sin(2 * np.pi * 900 * tc) * np.hanning(len(tc))
    place(sfx, click, SONG_OUT, 0.5)
    place(sfx, lp(rng.standard_normal(len(tvec(0.03))), 3000) * np.exp(-tvec(0.03) / 0.006), SONG_OUT, 0.35)
    tw = tvec(0.75)
    fw = 7200 + 2600 * np.exp(-tw / 0.25)
    whine = np.sin(2 * np.pi * np.cumsum(fw) / SR) * np.exp(-tw / 0.28) * np.clip(tw / 0.005, 0, 1)
    place(sfx, whine, SONG_OUT, 0.05)
    tz = tvec(0.25)
    zz = bp(rng.standard_normal((len(tz), 2)), 2000, 8000) * ((rng.random((len(tz), 2)) > 0.97) * 1.0) * np.exp(-tz / 0.08)[:, None]
    place(sfx, zz, SONG_OUT + 0.01, 0.25)
    return sfx


# ───────────────────────── 3 · the "spotlight" echo ─────────────────────────
def build_echo(song):
    out = np.zeros((N, 2))
    a, b = int(round(32.35 * SR)), int(round(34.06 * SR))
    word = song[a:b]
    mid = word.mean(1)
    mid = bp(mid, 180, 7500)
    fade = np.ones(len(mid))
    fade[:480] = np.linspace(0, 1, 480)
    fade[-2400:] = np.linspace(1, 0, 2400)
    mid *= fade
    t_word = SONG_IN + 32.35
    send = np.zeros((N, 2))
    gain = 1.0
    for n_rep, cut in zip((1, 2, 3), (4200, 2000, 950)):
        gain *= 0.42
        rep = lp(mid, cut, 2)
        pan = -0.75 if n_rep % 2 else 0.75
        place(out, rep, t_word + 1.58 * n_rep, gain * 0.9, pan)
        place(send, rep, t_word + 1.58 * n_rep, gain, pan)
    # the cut itself rings out into the reverb too
    i = int(round(SONG_OUT * SR))
    tail = song[int(round((SONG_CUT - 0.45) * SR)): int(round(SONG_CUT * SR))].copy()
    tail *= np.linspace(0.2, 1, len(tail))[:, None]
    place(send, tail, SONG_OUT - 0.45, 0.5)
    ir = reverb_ir()
    wet = np.stack([signal.fftconvolve(send[:, 0], ir[:, 0])[:N], signal.fftconvolve(send[:, 1], ir[:, 1])[:N]], 1)
    wet[: i] *= 0  # the reverb blooms only after the cut
    out += wet * 0.55
    return out


def main(song_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    tmp = os.path.join(out_dir, 'song48k.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', song_path, '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_f32le', tmp], check=True)
    _, song = wf.read(tmp)
    song = song.astype(np.float64)

    theme = build_theme()
    write(os.path.join(out_dir, 'stem-theme.wav'), theme)
    song_i, song_tp = lufs(tmp, 0, SONG_CUT)
    theme_i, _ = lufs(os.path.join(out_dir, 'stem-theme.wav'), 0, SONG_IN)
    g = 10 ** ((song_i - 4.0 - theme_i) / 20)
    print(f'song 0–34.06: {song_i:.1f} LUFS, TP {song_tp:.1f} dBTP | theme raw {theme_i:.1f} LUFS → gain {20 * np.log10(g):+.1f} dB')
    theme *= g

    mix = theme.copy()
    seg = song[: int(round(SONG_CUT * SR))].copy()
    seg[-192:] *= np.linspace(1, 0, 192)[:, None]  # 4 ms, so the hard cut does not click
    place(mix, seg, SONG_IN)
    mix += build_song_sfx()
    mix += build_echo(song)
    # fade to black over the last 0.3 s
    i = int(round((DUR - 0.3) * SR))
    mix[i:] *= np.linspace(1, 0, N - i)[:, None]
    write(os.path.join(out_dir, 'garmi-mix.wav'), mix)
    mi, mp = lufs(os.path.join(out_dir, 'garmi-mix.wav'))
    ti, _ = lufs(os.path.join(out_dir, 'garmi-mix.wav'), 0, SONG_IN)
    print(f'mix: {mi:.1f} LUFS integrated, true peak {mp:.1f} dBTP (theme section {ti:.1f} LUFS)')

    # alternate: whole mix raised to about -14 LUFS with a true-peak limiter at -1.5 dBFS
    up = -14.0 - mi
    loud = os.path.join(out_dir, 'garmi-mix-loud.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(out_dir, 'garmi-mix.wav'), '-af',
                    f'volume={up:.2f}dB,aresample=192000,alimiter=limit=0.84:attack=1:release=80:level=false,aresample=48000',
                    '-c:a', 'pcm_f32le', loud], check=True)
    li, lpk = lufs(loud)
    print(f'loud: {li:.1f} LUFS integrated, true peak {lpk:.1f} dBTP')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
