"""Turn the timed lyric CSV into per-word timings snapped to vocal onsets."""
import csv, json, re, sys
rows = list(csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')))
audio = json.load(open(sys.argv[2]))
onsets = audio['onsets']
out = []
for r in rows:
    s, e = float(r['start_seconds']), float(r['end_seconds'])
    text = r['lyrics'].strip()
    words = text.split()
    w = [len(re.sub(r'[^\w]', '', x)) + 2 for x in words]
    span = (e - s) * 0.86
    t, times = s, []
    for wi in w:
        times.append(t); t += span * wi / sum(w)
    snapped = []
    for i, tt in enumerate(times):
        near = [o for o in onsets if abs(o - tt) < 0.11]
        nt = min(near, key=lambda o: abs(o - tt)) if near else tt
        if i == 0: nt = max(s, min(nt, s + 0.08))
        if snapped and nt <= snapped[-1] + 0.06: nt = snapped[-1] + 0.06
        snapped.append(round(nt, 3))
    out.append(dict(cue=int(r['cue']), start=s, end=e, text=text,
                    words=[dict(w=x, t=tt) for x, tt in zip(words, snapped)]))
json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
print(len(out), 'cues')
