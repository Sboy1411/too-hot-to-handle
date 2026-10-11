"""Writes YouTube caption files for the lyric video: the lyrics as sung and an English translation.

Timings come from src/data/lyrics.json (Albert's word timings); text comes from his lyrics CSV with
his spelling fixes ("panel", "show stopper"). Usage: python3 analysis/make_srt.py OUT_DIR
"""
import csv
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV = os.path.join(ROOT, 'analysis', 'lyrics.csv')
FIXES = {27: ('pah-nel.', 'panel.'), 32: ('show-stopper', 'show stopper')}

# English translation, one line per cue (Punjabi "Ni" addresses a girl).
EN = [
    'yeah…',
    'I think even the mirror is jealous',
    'you know what happens when I walk in, right?',
    "I'm the one who sets the mood,",
    'I walk into the room and the weather gets better.',
    'People ask, “who’s that man?”',
    'Just tell them — that’s the brand, man.',
    "I'm the trademark of the vibe,",
    'You just scroll and leave a remark.',
    "I'm the headline, you're just a highlight,",
    "I'm the light the spotlight follows.",
    'Even in the mirror I flex,',
    'I stress out my own reflection.',
    "Girl, I'm the glitch in the plan,",
    "I'm the trend that has the fans.",
    'I walk in slow-mo, the beat follows me,',
    'The crowd gets loud when they see me solo.',
    'Looks like yours broke protocol,',
    "You're the danger zone, I'm the control wall.",
    "My name's in bold letters on your phone,",
    "I'm classy, never off-center.",
    'I talk smooth — like vinyl or wool,',
    'My style is final, no one needs a trial.',
    "Girl, I'm too hot to handle, hope there's no scandal,",
    "I move like a candle, you're one angle of the fire.",
    'Your eyes scrambled me,',
    "Girl, you smile and I lose my heart's control panel.",
    "Girl, I'm too hot to handle,",
    "Your channel's on my playlist,",
    "Eyes on me, you're one angle,",
    "Heart went pop — oops! it's a scandal!",
    "I know I'm a show stopper,",
    "I'm the spark, the rest are dropouts.",
    'If I step into the scene,',
    'the timing turns out just right.',
    'The mirror is my best friend,',
    'The camera is my yes man.',
    "I'm here for a reason —",
    'You just stay my fan all season.',
    "Girl, I'm too hot to handle…",
    "Hope there's no scandal…",
    "I move like a candle, you're one angle of the fire,",
    "Heart went pop — oops! it's a scandal!",
    'too hot… no scandal 🔥',
    'Even in the mirror I flex…',
    'I stress out the reflection 💋',
]


def stamp(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def two_lines(text: str, limit: int = 42) -> str:
    """Breaks a long caption once: at the clause break nearest the middle, else the space nearest it."""
    if len(text) <= limit:
        return text
    mid = len(text) / 2
    cuts = [i + 1 for i, ch in enumerate(text[:-1]) if ch in ',—' and text[i + 1] == ' ']
    cuts = [c for c in cuts if abs(c - mid) < len(text) * 0.3] or [i for i, ch in enumerate(text) if ch == ' ']
    c = min(cuts, key=lambda i: abs(i - mid))
    return text[:c].rstrip() + '\n' + text[c:].lstrip()


def main(out_dir: str) -> None:
    cues = json.load(open(os.path.join(ROOT, 'src', 'data', 'lyrics.json'), encoding='utf-8'))
    rows = list(csv.DictReader(open(CSV, encoding='utf-8-sig')))
    assert len(cues) == len(rows) == len(EN), (len(cues), len(rows), len(EN))
    sung = []
    for r in rows:
        text = r['lyrics'].strip()
        n = int(r['cue'])
        if n in FIXES:
            text = text.replace(*FIXES[n])
        sung.append(text)
    times = []
    for i, c in enumerate(cues):
        nxt = cues[i + 1]['start'] if i + 1 < len(cues) else None
        end = c['end'] + 0.25
        if nxt is not None and nxt - c['end'] < 0.6:
            end = nxt
        times.append((c['start'], max(end, c['start'] + 0.6)))
    os.makedirs(out_dir, exist_ok=True)
    for name, lines in (('lyrics', sung), ('English', EN)):
        path = os.path.join(out_dir, f'Too_Hot_To_Handle_VIRAL_{name}.srt')
        with open(path, 'w', encoding='utf-8') as f:
            for k, ((a, b), text) in enumerate(zip(times, lines), 1):
                f.write(f'{k}\n{stamp(a)} --> {stamp(b)}\n{two_lines(text)}\n\n')
        print('wrote', path)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'out', 'deliver'))
