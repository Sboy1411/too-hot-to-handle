// Prints the sound cues of one cut of reel 2 as JSON, from the same timeline the video uses (src/reel2/timeline.ts).
// Usage: node --experimental-strip-types analysis/reel2_cues.ts [full|cut30|cut17] > out/reel2/cues.json
import { buildTL, type CutName } from '../src/reel2/timeline.ts';

const cut = (process.argv[2] ?? 'full') as CutName;
const tl = buildTL(cut);
const { V, STORY } = tl;
console.log(JSON.stringify({
  cut, dur: tl.DUR, frames: tl.FRAMES, play: tl.PLAY, drop: tl.DROP, outNow: tl.OUT_NOW,
  songFrom: tl.SONG_FROM, songTo: 92.3, songEnd: tl.SONG_END, endCard: tl.END_CARD,
  lock: STORY.lock, phoneSpeaker: tl.phoneSpeaker, shutdown: tl.shutdown, endFade: tl.endFade,
  msgs: tl.MSGS.filter((m) => m.t >= 0).map((m) => ({ id: m.id, t: m.t, kind: m.kind, end: m.end ?? null })),
  lockNotifs: [STORY.notif1, STORY.notif2], tap: STORY.tap, open: STORY.open, playTap: STORY.playTap,
  zoom: STORY.lock ? null : tl.DROP - 0.84,
  bold: V(57.8), banner: tl.on('banner') ? V(56.62) : null, pop: V(90.1), scandal: V(91.6),
  notifs: [0, 1, 2, 3].map((k) => V(91.3) + 0.05 + k * 0.16),
}, null, 1));
