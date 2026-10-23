// Prints the sound cues of reel 2 as JSON, from the same timeline the video uses (src/reel2/timeline.ts).
// Usage: node --experimental-strip-types analysis/reel2_cues.ts > out/reel2/cues.json
import { DUR, END_CARD, FRAMES, LINES, MSGS, OUT_NOW, PLAY, SONG_END, SONG_FROM, SONG_TO, STORY, V } from '../src/reel2/timeline.ts';

console.log(JSON.stringify({
  dur: DUR, frames: FRAMES, play: PLAY, outNow: OUT_NOW, songFrom: SONG_FROM, songTo: SONG_TO, songEnd: SONG_END, endCard: END_CARD,
  msgs: MSGS.filter((m) => m.t >= 0).map((m) => ({ id: m.id, t: m.t, kind: m.kind, end: m.end ?? null })),
  lockNotifs: [STORY.notif1, STORY.notif2], tap: STORY.tap, open: STORY.open, playTap: STORY.playTap,
  bold: V(57.8), banner: V(56.62), pop: V(90.1), scandal: V(91.6), notifs: [0, 1, 2, 3].map((k) => V(91.3) + 0.05 + k * 0.16),
  scandalWord: [91.6, SONG_TO], lines: LINES.length,
}, null, 1));
