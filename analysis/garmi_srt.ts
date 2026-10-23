// Caption files for the GARMI 24×7 Short, from the same timeline the video uses (src/garmi/timeline.ts).
// Usage: node --experimental-strip-types analysis/garmi_srt.ts OUT_DIR
//   TooHotToHandle_GARMI_captions.srt        every caption at the exact times in the brief (a few lyric cues overlap)
//   TooHotToHandle_GARMI_captions_clean.srt  same text, each cue ends where the next begins (no stacked captions)
import fs from 'node:fs';
import path from 'node:path';
import { ANCHOR_LINES, SONG_LINES, type Caption } from '../src/garmi/timeline.ts';

const ts = (s: number) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms % 1000, 3)}`;
};
const body = (c: Caption) => (c.kind === 'anchor' ? `ANCHOR: ${c.text}` : `♪ ${c.text}${c.en ? `\n${c.en}` : ''}`);
const srt = (cues: { a: number; b: number; text: string }[]) =>
  cues.map((c, i) => `${i + 1}\n${ts(c.a)} --> ${ts(c.b)}\n${c.text}\n`).join('\n');

const all = [...ANCHOR_LINES, ...SONG_LINES].sort((x, y) => x.a - y.a);
const exact = all.map((c) => ({ a: c.a, b: c.b, text: body(c) }));
const clean = all.map((c, i) => ({ a: c.a, b: Math.min(c.b, all[i + 1]?.a ?? c.b), text: body(c) }));

const out = process.argv[2] ?? 'out/garmi';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'TooHotToHandle_GARMI_captions.srt'), srt(exact));
fs.writeFileSync(path.join(out, 'TooHotToHandle_GARMI_captions_clean.srt'), srt(clean));
console.log(`${all.length} cues → ${out}`);
