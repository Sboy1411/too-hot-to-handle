"""Soundtrack for reel 2, "THE GROUP CHAT" (src/reel2/), for any of its cuts (see analysis/reel2_cues.ts).
The full cut is described below; the discovery cuts (cut30, cut17) play the song from the first frame with only
phone sounds over the chat setup, skip the shutdown, and end without a fade so they loop.

0:00–0:13   your phone at a dead party: a muffled 4-on-the-floor loop through the wall, notification dings,
            message pops, typing; the loop dies with a record scratch when Simran's photo of That Man lands.
0:13        you tap play on the DJ's track: the song from 0:56.48 (the downbeat where the kick returns under
            "Phone vich mera naam…"), first through a phone speaker, opening to full range on "bold".
            Untouched after that until 1:32.30 (end of "scandal!", just before the next downbeat).
on top      a few phone sounds (banner ding, heart pop, scandal stamp, notification blips), the phone shutting
            down, and the end-card ding.
after the cut "scandal!" echoes every 1.58 s (one bar), ×0.42 and darker each time, in a long reverb.

Usage: python3 analysis/reel2_audio.py SONG_MASTER CUES_JSON OUT_DIR
Writes OUT_DIR/reel2-<cut>-mix.wav (song at unity; these sections of the master land the mix near -14 LUFS).
"""
import json
import os
import subprocess
import sys

import numpy as np
import scipy.io.wavfile as wf
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from garmi_audio import SR, bp, hp, lp, lufs, place, reverb_ir, tvec, write  # noqa: E402

rng = np.random.default_rng(2)


def ding(f1=1568.0, f2=2349.0, dur=0.6):
    t = tvec(dur)
    return (np.sin(2 * np.pi * f1 * t) * np.exp(-t / 0.18) + 0.6 * np.sin(2 * np.pi * f2 * t) * np.exp(-t / 0.12)) * np.clip(t / 0.003, 0, 1)


def blip(up=True):
    t = tvec(0.09)
    f = np.where(t < 0.04, 820 if up else 1100, 1240 if up else 760)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035) * np.clip(t / 0.002, 0, 1)


def click(f=2400, dur=0.02):
    t = tvec(dur)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.004) + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.002) * 0.4


def swoosh(dur=0.35):
    t = tvec(dur)
    k = np.sin(np.pi * t / dur) ** 2
    n = rng.standard_normal((len(t), 2))
    return (bp(n, 600, 5000) * k[:, None]) * 0.6


def kick(f0=130, f1=48):
    t = tvec(0.3)
    f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15)


def party_loop(dur, bpm=120):
    """The song the DJ has been playing since 9: plain house loop, heard through a wall."""
    out = np.zeros(int(dur * SR))
    beat = 60 / bpm
    chords = [[57, 60, 64], [55, 59, 62], [53, 57, 60], [55, 59, 62]]
    for b in range(int(dur / beat) + 1):
        tb = b * beat
        place1(out, kick(), tb, 1.0)
        if b % 2 == 1:
            place1(out, bp(rng.standard_normal(int(0.12 * SR)), 1500, 6000) * np.exp(-tvec(0.12) / 0.03), tb, 0.3)
        ch = chords[(b // 4) % 4]
        stab = sum(np.sign(np.sin(2 * np.pi * 440 * 2 ** ((m - 69) / 12) * tvec(0.18))) for m in ch) / 3 * np.exp(-tvec(0.18) / 0.06)
        place1(out, stab, tb + beat / 2, 0.35)
        place1(out, np.sin(2 * np.pi * 55 * 2 ** ((ch[0] - 12 - 45) / 12) * tvec(beat * 0.9)) * np.exp(-tvec(beat * 0.9) / 0.2), tb, 0.6)
    return lp(out, 260, 4)  # through the wall


def place1(buf, sig, t, gain=1.0):
    i = int(round(t * SR))
    j = min(len(buf), i + len(sig))
    if j > i >= 0:
        buf[i:j] += sig[: j - i] * gain


def scratch(dur=0.45):
    t = tvec(dur)
    f = 900 * np.exp(-t / 0.08) + 120 + 300 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.1)
    s = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15)
    return lp(s + bp(rng.standard_normal(len(t)), 800, 4000) * np.exp(-t / 0.08) * 0.5, 3000)


def balloon_pop():
    t = tvec(0.35)
    n = rng.standard_normal(len(t)) * np.exp(-t / 0.012)
    th = np.sin(2 * np.pi * np.cumsum(70 + 120 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.08)
    return hp(n, 900) * 0.9 + th * 0.8


def thump():
    t = tvec(0.4)
    s = np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-t / 0.04)) / SR) * np.exp(-t / 0.12)
    return s + bp(rng.standard_normal(len(t)), 300, 2500) * np.exp(-t / 0.02) * 0.5


def main(song_path, cues_path, out_dir):
    c = json.load(open(cues_path))
    dur, play, s_from, s_to = c['dur'], c['play'], c['songFrom'], c['songTo']
    song_end, end_card = c['songEnd'], c['endCard']
    N = int(round(dur * SR))
    os.makedirs(out_dir, exist_ok=True)
    tmp = os.path.join(out_dir, 'song48k.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', song_path, '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_f32le', tmp], check=True)
    _, song = wf.read(tmp)
    song = song.astype(np.float64)

    story = np.zeros((N, 2))
    if c['lock']:
        build_story(c, story, N, play)
    else:
        # discovery cuts: the song plays from the first frame; the chat setup only adds its phone sounds
        for m in c['msgs']:
            if m['t'] >= c['drop']:
                continue
            if m['kind'] == 'photo':
                place(story, swoosh(0.4), m['t'] - 0.15, 0.22)
                place(story, click(1800, 0.03), m['t'] + 0.02, 0.22)
            elif m['kind'] != 'system':
                place(story, blip(True), m['t'], 0.12, 0.15)
        place(story, swoosh(0.5), c['zoom'] - 0.1, 0.2)

    # ── the song ──
    a, b = int(round(s_from * SR)), int(round(s_to * SR))
    seg = song[a:b].copy()
    seg[:48] *= np.linspace(0, 1, 48)[:, None]
    seg[-720:] *= np.linspace(1, 0, 720)[:, None]
    if c['phoneSpeaker']:
        # phone speaker at first, opening to full range on "bold"
        ph = hp(lp(seg.mean(1), 3800, 4), 450, 4)
        ph = np.tanh(ph * 2.2) / 2.2 * 1.9
        ts = np.arange(len(seg)) / SR + play
        w = np.clip((ts - (c['bold'] - 0.5)) / 0.5, 0, 1)
        w = w * w * (3 - 2 * w)
        seg = seg * w[:, None] + ph[:, None] * (1 - w)[:, None]
    mix = story.copy()
    place(mix, seg, play)

    # ── phone sounds over the song ──
    sfx = np.zeros((N, 2))
    if c['banner'] is not None:
        place(sfx, ding(), c['banner'] + 0.05, 0.06)
    place(sfx, balloon_pop(), c['pop'], 0.3)
    place(sfx, thump(), c['scandal'], 0.32)
    for t in c['notifs']:
        place(sfx, blip(False), t, 0.07, 0.3)
    if c['shutdown']:
        t = tvec(0.7)
        f = 30 + 600 * np.exp(-t / 0.12)
        pdown = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25)
        place(sfx, pdown, song_end, 0.3)
        place(sfx, click(1200, 0.01), song_end, 0.3)
        place(sfx, ding(1568, 2093, 0.9), end_card + 0.35, 0.12)
    # OUT NOW lands: a soft low hit and a bright chime
    place(sfx, thump(), c['outNow'], 0.22)
    place(sfx, ding(2093, 3136, 1.2), c['outNow'] + 0.02, 0.1)
    mix += sfx
    return finish(c, mix, song, N, play, s_from, s_to, song_end, b, out_dir, tmp, dur)


def build_story(c, story, N, play):
    """Full cut: the party through the wall, the phone, the heartbeat, the play tap."""
    photo = next(m['t'] for m in c['msgs'] if m['kind'] == 'photo')
    loop = party_loop(photo + 0.5)
    loop[int(photo * SR):] = 0
    place(story, loop, 0, 0.1)
    place(story, scratch(), photo - 0.05, 0.22)
    room = lp(rng.standard_normal((N, 2)), 500) * 0.004
    room[int(play * SR):] = 0
    story += room
    for t in c['lockNotifs']:
        place(story, ding(), t, 0.16)
    place(story, click(), c['tap'], 0.25)
    place(story, swoosh(0.35), c['open'], 0.25)
    for m in c['msgs']:
        if m['t'] >= play:
            continue
        if m['kind'] == 'typing':
            k = m['t']
            while k < m['end'] - 0.05:
                place(story, click(3000 + rng.random() * 800, 0.012), k, 0.05, rng.random() * 0.6 - 0.3)
                k += 0.07 + rng.random() * 0.08
        elif m['kind'] == 'photo':
            place(story, swoosh(0.4), m['t'] - 0.15, 0.3)
            place(story, click(1800, 0.03), m['t'] + 0.02, 0.3)
            # a low hit + a slow rise of tension after the reveal
            th = thump()
            place(story, th, m['t'], 0.26)
            tr = tvec(play - m['t'])
            drone = (np.sin(2 * np.pi * 55 * tr) + 0.5 * np.sin(2 * np.pi * 82.5 * tr)) * (tr / tr[-1]) ** 2 * 0.06
            place(story, lp(drone, 400), m['t'], 1.0)
            # a heartbeat that speeds up toward the drop
            hb, span = m['t'] + 0.9, play - 0.35 - (m['t'] + 0.9)
            while hb < play - 0.35:
                u = (hb - m['t'] - 0.9) / span
                for dt, g in ((0.0, 1.0), (0.2, 0.65)):
                    th2 = tvec(0.25)
                    beat = np.sin(2 * np.pi * np.cumsum(42 + 30 * np.exp(-th2 / 0.03)) / SR) * np.exp(-th2 / 0.07)
                    place(story, beat, hb + dt, (0.1 + 0.16 * u) * g)
                hb += 60 / (62 + 40 * u)
        elif m['kind'] == 'system':
            place(story, ding(1175, 1760, 0.5), m['t'], 0.12)
        else:
            place(story, blip(True), m['t'], 0.18, 0.15)
    place(story, click(2600, 0.02), c['playTap'], 0.35)
    i0 = int(round(play * SR))
    story[i0:] = 0


def finish(c, mix, song, N, play, s_from, s_to, song_end, b, out_dir, tmp, dur):
    # ── "scandal!" echoes after the cut ──
    wa, wb = int(round(91.6 * SR)), int(round(s_to * SR))
    word = bp(song[wa:wb].mean(1), 180, 7500)
    word[:240] *= np.linspace(0, 1, 240)
    word[-1200:] *= np.linspace(1, 0, 1200)
    t_word = play + (91.6 - s_from)
    send = np.zeros((N, 2))
    gain = 1.0
    for n, cut in zip((1, 2, 3), (4200, 2000, 950)):
        gain *= 0.42
        rep = lp(word, cut, 2)
        pan = -0.75 if n % 2 else 0.75
        place(mix, rep, t_word + 1.58 * n, gain * 0.9, pan)
        place(send, rep, t_word + 1.58 * n, gain, pan)
    tail = song[b - int(0.4 * SR): b].copy() * np.linspace(0.2, 1, int(0.4 * SR))[:, None]
    place(send, tail, song_end - 0.4, 0.5)
    ir = reverb_ir()
    wet = np.stack([signal.fftconvolve(send[:, 0], ir[:, 0])[:N], signal.fftconvolve(send[:, 1], ir[:, 1])[:N]], 1)
    wet[: int(round(song_end * SR))] = 0
    mix += wet * 0.55
    fade = 0.3 if c['endFade'] else 0.06  # the short cuts loop, so they only de-click
    i = int(round((dur - fade) * SR))
    mix[i:] *= np.linspace(1, 0, N - i)[:, None]

    out = os.path.join(out_dir, f"reel2-{c['cut']}-mix.wav")
    write(out, mix)
    si, stp = lufs(tmp, s_from, s_to - s_from)
    mi, mp = lufs(out)
    pre = f' | before the song {lufs(out, 0, play)[0]:.1f} LUFS' if play > 1 else ''
    print(f"{c['cut']}: song {s_from}–{s_to}: {si:.1f} LUFS, TP {stp:.1f}{pre} | mix {mi:.1f} LUFS, TP {mp:.1f} dBTP")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
