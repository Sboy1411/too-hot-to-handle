"""Apply hand-checked word timings (word<TAB>mm:ss.s, in lyric order) to the cue list.
Dash-only words and emoji are dropped from the display text; cue starts follow the first word."""
import csv, json, sys
rows = list(csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')))
timed = []
for line in open(sys.argv[2], encoding='utf-8'):
    if not line.strip(): continue
    w, ts = line.rstrip('\n').split('\t')
    m, s = ts.split(':')
    timed.append((w.strip(), round(int(m) * 60 + float(s), 3)))
FIX = {'pah-nel.': 'panel', 'show-stopper,': 'show stopper'}
out, k = [], 0
for r in rows:
    words = []
    for w in r['lyrics'].split():
        if w in ('—', '🔥', '💋'): continue
        words += FIX.get(w, w).split()
    ws = []
    for w in words:
        tw, tt = timed[k]; k += 1
        if tw.strip('…,.!?') .lower() != w.strip('…,.!?').lower():
            sys.exit(f'mismatch at cue {r["cue"]}: {w!r} vs {tw!r}')
        ws.append(dict(w=w, t=tt))
    start = min(float(r['start_seconds']), ws[0]['t'] - 0.1)
    end = max(float(r['end_seconds']), ws[-1]['t'] + 0.4)
    out.append(dict(cue=int(r['cue']), start=round(start, 3), end=round(end, 3), text=' '.join(words), words=ws))
assert k == len(timed), (k, len(timed))
json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
print(len(out), 'cues,', k, 'words')
