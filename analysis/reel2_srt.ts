// Lyric captions for reel 2 (the story itself is on-screen chat text), from src/reel2/timeline.ts.
// Usage: node --experimental-strip-types analysis/reel2_srt.ts OUT_DIR
import fs from 'node:fs';
import path from 'node:path';
import { LINES } from '../src/reel2/timeline.ts';

const ts = (s: number) => {
  const ms = Math.round(s * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
};
const out = process.argv[2] ?? 'out/reel2';
fs.mkdirSync(out, { recursive: true });
const srt = LINES.map((l, i) => `${i + 1}\n${ts(l.a)} --> ${ts(l.b)}\n♪ ${l.text}${l.en ? `\n${l.en}` : ''}\n`).join('\n');
fs.writeFileSync(path.join(out, 'TooHotToHandle_Reel2_captions.srt'), srt);
console.log(`${LINES.length} cues → ${out}`);
