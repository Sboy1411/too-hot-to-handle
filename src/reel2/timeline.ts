// Reel 2 — "THE GROUP CHAT". The Sector 17 party chat from the GARMI bulletin, seen on your phone.
// One story, three cuts:
//   full   63 s: lock screen, the whole chat story read at leisure, then the song from 0:56.48
//   cut30  ≈34 s discovery cut: the song from the first frame (1:00.3), a 6 s chat setup, the drop on hook 1
//   cut17  ≈18 s hook cut: the song from 1:15.5, a 5 s setup, the drop on hook 2
// Every time is in seconds of the finished video; song times are converted with tl.V(song).
import { createContext, useContext } from 'react';

export const FPS = 30;
export const SONG_TO = 92.3; // song out-point: end of "scandal!", just before the next downbeat (92.37)

export const C = {
  bg: '#0d0e13',
  bubble: '#22242e',
  sys: '#1c1e26',
  text: '#eceef2',
  dim: '#8d93a1',
  fire: '#FF4D1A',
  gold: '#FFB547',
  red: '#D7141E',
  sub: '#FFE14D',
  green: '#32d26a',
};

// ───────── members of the group ─────────
export type Avatar =
  | { kind: 'letter'; bg: string }
  | { kind: 'img'; file: string; fx: number; fy: number; r: number }
  | { kind: 'uncle' }
  | { kind: 'mirror' }
  | { kind: 'emoji'; e: string; bg: string };
export type Member = { name: string; color: string; av: Avatar };
export const M: Record<string, Member> = {
  riya: { name: 'Riya', color: '#ff7aa8', av: { kind: 'letter', bg: '#e94e77' } },
  aman: { name: 'Aman', color: '#ffc069', av: { kind: 'img', file: 'trench', fx: 690, fy: 210, r: 560 } },
  kabir: { name: 'Kabir', color: '#7cc8ff', av: { kind: 'img', file: 'leather', fx: 770, fy: 230, r: 560 } },
  simran: { name: 'Simran', color: '#c99bff', av: { kind: 'letter', bg: '#8e44ad' } },
  uncle: { name: 'Uncle (since 9 pm)', color: '#86e39a', av: { kind: 'uncle' } },
  dj: { name: 'DJ Sector 17', color: '#ff86e0', av: { kind: 'img', file: 'hoodie', fx: 760, fy: 300, r: 620 } },
  man: { name: 'THAT MAN 🔥', color: '#ff6a2a', av: { kind: 'img', file: 'thatman', fx: 650, fy: 300, r: 620 } },
  mirror: { name: 'Mirror 🪞', color: '#e9c46a', av: { kind: 'mirror' } },
};

export type Msg = {
  id: string;
  t: number;
  from?: keyof typeof M;
  kind: 'text' | 'emoji' | 'photo' | 'audio' | 'voice' | 'system' | 'typing';
  text?: string;
  end?: number; // typing indicator disappears
  time?: string;
  del?: number; // becomes "This message was deleted"
  hot?: boolean; // That Man's bold, fire bubbles
};
export type Line = { a: number; b: number; text: string; words: number[] };
export type Hit = { t: number; amp: number; decay: number };
export type ShotName = 'banner' | 'profile' | 'vinyl' | 'alert' | 'overheat' | 'deleted' | 'candle' | 'scramble' | 'panel' | 'call' | 'playlist' | 'camera' | 'pop';
export type CutName = 'full' | 'cut30' | 'cut17';

// Song-time windows of the moments, one per lyric line.
const SHOT_SONG: Record<ShotName, [number, number]> = {
  banner: [56.62, 58.72], // "Phone vich mera naam bold letters"
  profile: [58.72, 60.24], // "Main classy, never off-center"
  vinyl: [61.75, 63.27], // "…jiven vinyl jaan wool"
  alert: [63.27, 66.3], // "Style mera final, kise chahidi na trial"
  overheat: [66.3, 69.33], // "Ni I'm too hot to handle"
  deleted: [69.33, 72.45], // "ho jaave na koi scandal"
  candle: [72.45, 75.56], // "Main taan move karaan candle, tu fire di ik angle"
  scramble: [75.56, 77.15], // "Tere nazran ne keeta scramble"
  panel: [77.15, 80.82], // "Ni tu smile kare, main lose heart da panel"
  call: [80.82, 83.94], // "Ni I'm too hot to handle" (2)
  playlist: [83.94, 86.73], // "Playlist 'te tera channel"
  camera: [86.73, 89.28], // "Eyes on me, tu ik angle"
  pop: [89.28, SONG_TO], // "Heart went pop, oops! it's a scandal!"
};
// Sung word onsets (analysis/word_timings.tsv), song time.
const LYRICS: [number, number, string, number[]][] = [
  [56.48, 58.72, 'Phone vich mera naam bold letters,', [56.6, 56.9, 57.2, 57.4, 57.8, 58.0]],
  [58.72, 60.24, 'Main classy, never off-center.', [58.7, 58.9, 59.3, 59.5]],
  [60.24, 63.27, 'Main talk karaan smooth, jiven vinyl jaan wool,', [60.4, 60.6, 60.9, 61.3, 61.6, 61.9, 62.3, 62.7]],
  [63.27, 66.3, 'Style mera final, kise chahidi na trial.', [63.1, 63.6, 63.9, 64.8, 65.3, 65.7, 65.9]],
  [66.3, 69.33, "Ni I'm too hot to handle,", [66.4, 66.6, 66.8, 66.9, 67.3, 67.6]],
  [69.33, 72.45, 'ho jaave na koi scandal,', [69.4, 69.7, 70.1, 70.4, 70.6]],
  [72.45, 75.56, 'Main taan move karaan candle, tu fire di ik angle.', [72.4, 72.7, 72.9, 73.2, 73.7, 74.2, 74.4, 74.9, 75.1, 75.2]],
  [75.56, 77.15, 'Tere nazran ne keeta scramble,', [75.6, 76.1, 76.3, 76.4, 76.7]],
  [77.15, 80.82, 'Ni tu smile kare, main lose heart da panel.', [77.1, 77.3, 77.6, 77.8, 78.1, 78.4, 78.6, 78.9, 79.1]],
  [80.82, 83.94, "Ni I'm too hot to handle,", [80.9, 81.3, 81.4, 81.8, 82.1, 82.4]],
  [83.94, 86.73, "Playlist 'te tera channel,", [84.1, 84.6, 85.0, 85.3]],
  [86.73, 89.28, 'Eyes on me, tu ik angle,', [87.0, 87.1, 87.4, 87.7, 88.1, 88.6]],
  [89.28, SONG_TO, "Heart went pop, oops! it's a scandal!", [89.3, 89.8, 90.1, 90.4, 91.3, 91.4, 91.6]],
];

export type Story = {
  lock: boolean; // open on the lock screen
  notif1: number; notif2: number; tap: number; open: number; chat: number;
  typing: [number, number] | null;
  photo: number; // Simran's photo of That Man
  rename: number;
  playTap: number | null; // you tap play on the DJ's track (full cut only)
};
export type TL = {
  cut: CutName;
  SONG_FROM: number;
  PLAY: number; // video time the song starts
  DROP: number; // video time of the first hook
  V: (song: number) => number;
  SONG_END: number;
  END_CARD: number;
  OUT_NOW: number;
  DUR: number;
  FRAMES: number;
  STORY: Story;
  CHAT_OPEN: number;
  GROUP_RENAME: number;
  MSGS: Msg[];
  SHOTS: Record<ShotName, [number, number]>;
  on: (k: ShotName) => boolean;
  LINES: Line[];
  LYRICS_FROM: number; // the lyrics bar shows from here
  HITS: Hit[];
  hook: { a: string[]; b: string[] } | null; // POV text over the setup
  pillLabel: string;
  shutdown: boolean; // the "too hot · shutting down…" beat before the end card
  phoneSpeaker: boolean; // the song starts through a phone speaker and opens up on "bold"
  endFade: boolean; // fade to black (the short cuts loop instead)
  typingName: (t: number) => string | null;
  phoneTemp: (t: number) => number;
  clockAt: (t: number) => string;
};

const HISTORY: Msg[] = [
  { id: 'h0', t: -1, kind: 'system', text: 'TODAY' },
  { id: 'h1', t: -1, from: 'dj', kind: 'text', text: 'party starts NOW 🎉🎉', time: '9:00 PM' },
  { id: 'h2', t: -1, from: 'uncle', kind: 'text', text: 'reached. dancing.', time: '9:02 PM' },
  { id: 'h3', t: -1, from: 'simran', kind: 'text', text: 'is anyone even here', time: '10:41 PM' },
  { id: 'h4', t: -1, from: 'kabir', kind: 'text', text: 'snacks are finished btw', time: '11:20 PM' },
];

const piecewise = (k: [number, number][]) => (t: number) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) return Math.round(k[i - 1][1] + (k[i][1] - k[i - 1][1]) * ((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  }
  return k[k.length - 1][1];
};

export const buildTL = (cut: CutName): TL => {
  const full = cut === 'full';
  // song in-point, video time the song starts, first song moment shown
  const SONG_FROM = full ? 56.48 : cut === 'cut30' ? 60.3 : 75.5;
  const PLAY = full ? 22.4 : 0;
  const dropSong = full ? 56.48 : cut === 'cut30' ? 66.3 : 80.82;
  const V = (song: number) => +(song - SONG_FROM + PLAY).toFixed(3);
  const DROP = V(dropSong);
  const SONG_END = V(SONG_TO);
  const END_CARD = full ? SONG_END + 0.58 : SONG_END;
  const OUT_NOW = END_CARD + (full ? 1.0 : 0.35);
  const DUR = +(END_CARD + (full ? 4.2 : 1.7)).toFixed(2);

  // the chat setup before the drop
  const S = full
    ? { k1: 5.8, wait: 8.9, who: 10.0, photo: 11.4 }
    : cut === 'cut30'
      ? { k1: 1.15, wait: 2.2, who: 3.0, photo: 3.85 }
      : { k1: 1.0, wait: 1.85, who: 2.55, photo: 3.3 };
  const STORY: Story = full
    ? { lock: true, notif1: 0.25, notif2: 1.6, tap: 3.1, open: 3.3, chat: 3.7, typing: [7.8, 8.9], photo: S.photo, rename: 19.2, playTap: 22.0 }
    : { lock: false, notif1: -9, notif2: -9, tap: -9, open: -1, chat: 0, typing: null, photo: S.photo, rename: DROP - 0.05, playTap: null };

  const scandalScene = full || cut === 'cut30';
  let MSGS: Msg[] = [
    ...HISTORY,
    { id: 'r1', t: -1, from: 'riya', kind: 'text', text: 'this party is DEAD 💀', time: '11:57', del: scandalScene ? V(70.1) : undefined },
    { id: 'a1', t: -1, from: 'aman', kind: 'text', text: 'dj playing the same song since 9 😴', time: '11:57', del: scandalScene ? V(70.4) : undefined },
  ];
  if (full) {
    MSGS.push(
      { id: 'u1', t: 4.5, from: 'uncle', kind: 'text', text: 'still dancing 🕺', time: '11:57' },
      { id: 'k1', t: S.k1, from: 'kabir', kind: 'text', text: 'leaving in 5', time: '11:57', del: V(70.6) },
      { id: 'r2', t: 7.0, from: 'riya', kind: 'text', text: 'same', time: '11:57' },
      { id: 'ty', t: 7.8, end: 8.9, from: 'simran', kind: 'typing' },
      { id: 's1', t: S.wait, from: 'simran', kind: 'text', text: 'WAIT.', time: '11:58' },
      { id: 's2', t: S.who, from: 'simran', kind: 'text', text: 'who just walked in???', time: '11:58' },
      { id: 'ph', t: S.photo, from: 'simran', kind: 'photo', time: '11:58' },
      { id: 'r3', t: 13.9, from: 'riya', kind: 'emoji', text: '😳😳😳', time: '11:58' },
      { id: 'a2', t: 15.0, from: 'aman', kind: 'text', text: 'my AC just quit 🥵', time: '11:58' },
      { id: 'k2', t: 16.3, from: 'kabir', kind: 'text', text: '…not leaving anymore', time: '11:58' },
      { id: 'u2', t: 17.7, from: 'uncle', kind: 'text', text: 'I have stopped dancing.', time: '11:58' },
      { id: 'rn', t: STORY.rename, kind: 'system', text: 'Simran changed the group name to "TOO HOT TO HANDLE 🔥"' },
      { id: 'dj', t: 20.6, from: 'dj', kind: 'audio', text: 'TOO HOT TO HANDLE.mp3', time: '11:58' },
      { id: 'jn', t: V(56.62), kind: 'system', text: 'THAT MAN 🔥 joined the group' },
      { id: 'm1', t: V(58.2), from: 'man', kind: 'text', text: 'hi.', time: '11:58', hot: true },
      { id: 'mi', t: V(60.3), from: 'mirror', kind: 'text', text: 'not jealous.', time: '11:58' },
      { id: 'vn', t: V(60.62), from: 'man', kind: 'voice', time: '11:58', hot: true },
    );
  } else {
    MSGS.push(
      { id: 'k1', t: S.k1, from: 'kabir', kind: 'text', text: 'leaving in 5', time: '11:57', del: scandalScene ? V(70.6) : undefined },
      { id: 's1', t: S.wait, from: 'simran', kind: 'text', text: 'WAIT.', time: '11:58' },
      { id: 's2', t: S.who, from: 'simran', kind: 'text', text: 'who just walked in???', time: '11:58' },
      { id: 'ph', t: S.photo, from: 'simran', kind: 'photo', time: '11:58' },
      { id: 'rn', t: STORY.rename, kind: 'system', text: 'Simran changed the group name to "TOO HOT TO HANDLE 🔥"' },
      { id: 'jn', t: DROP + 0.1, kind: 'system', text: 'THAT MAN 🔥 joined the group' },
    );
  }
  if (full || cut === 'cut30') {
    MSGS.push(
      { id: 'cd', t: V(72.45), from: 'man', kind: 'emoji', text: '🕯️', time: '11:59', hot: true },
      { id: 'r4', t: V(74.4), from: 'riya', kind: 'emoji', text: '🔥🔥🔥', time: '11:59' },
    );
  }
  MSGS = MSGS.sort((a, b) => a.t - b.t);

  const firstShot = full ? 0 : dropSong;
  const SHOTS = {} as Record<ShotName, [number, number]>;
  (Object.keys(SHOT_SONG) as ShotName[]).forEach((k) => {
    const [a, b] = SHOT_SONG[k];
    SHOTS[k] = a >= firstShot - 0.01 ? [V(a), V(b)] : [-1, -1];
  });
  const on = (k: ShotName) => SHOTS[k][1] > SHOTS[k][0];
  const LINES: Line[] = LYRICS.filter(([a]) => a >= firstShot - 0.01).map(([a, b, text, w]) => ({ a: V(a), b: V(b), text, words: w.map(V) }));

  const HITS: Hit[] = [
    { t: S.photo, amp: 10, decay: 9 },
    { t: V(66.4), amp: 26, decay: 6 },
    { t: V(66.9), amp: 30, decay: 6 },
    { t: V(80.9), amp: 18, decay: 7 },
    { t: V(81.8), amp: 26, decay: 6 },
    { t: V(90.1), amp: 34, decay: 6 },
    { t: V(91.6), amp: 24, decay: 7 },
  ].filter((h) => h.t >= 0);

  const temps: [number, number][] = full
    ? [[0, 36], [S.photo, 36], [22.0, 44], [V(66.2), 71], [V(66.4), 99], [V(80.8), 104], [V(89.3), 118], [SONG_END, 140]]
    : [[0, 37], [S.photo, 38], [DROP - 0.1, 64], [DROP + 0.1, 99], [V(89.3), 118], [SONG_END, 140]];

  return {
    cut, SONG_FROM, PLAY, DROP, V, SONG_END, END_CARD, OUT_NOW, DUR, FRAMES: Math.round(DUR * FPS),
    STORY, CHAT_OPEN: STORY.chat, GROUP_RENAME: STORY.rename, MSGS, SHOTS, on, LINES,
    LYRICS_FROM: full ? PLAY : DROP,
    HITS,
    hook: full ? null : { a: ['POV: the party', 'was DEAD 💀'], b: ['…until HE', 'walked in 🔥'] },
    pillLabel: full ? '♪ LIVE LYRICS' : '♪ TOO HOT TO HANDLE',
    shutdown: full,
    phoneSpeaker: full,
    endFade: full,
    typingName: (t) => (STORY.typing && t >= STORY.typing[0] && t < STORY.typing[1] ? 'Simran is typing…' : null),
    phoneTemp: piecewise(temps),
    clockAt: (t) => (t < S.wait ? '11:57' : t < V(72.45) || cut === 'cut17' ? '11:58' : '11:59'),
  };
};

export const TLContext = createContext<TL>(buildTL('full'));
export const useTL = () => useContext(TLContext);
export const CUTS: Record<CutName, TL> = { full: buildTL('full'), cut30: buildTL('cut30'), cut17: buildTL('cut17') };
