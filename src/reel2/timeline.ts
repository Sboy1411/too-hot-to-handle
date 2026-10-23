// Reel 2 — "THE GROUP CHAT". The Sector 17 party chat from the GARMI bulletin, seen on your phone.
// Every time here is in seconds of the finished video. Song times are converted with V(song).
export const FPS = 30;
export const SONG_FROM = 56.48; // song in-point: the downbeat where the kick returns under "Phone vich…"
export const SONG_TO = 92.3; // song out-point: end of "scandal!", just before the next downbeat (92.37)

// The story before the song, paced so every message can be read (about 1.1–1.6 s each, the photo 2.5 s).
export const STORY = {
  notif1: 0.25, // lock screen: Riya's notification
  notif2: 1.6, // Aman's
  tap: 3.1, // you tap the notification
  open: 3.3, // the chat zooms open
  chat: 3.7,
  typing: [7.8, 8.9] as const,
  photo: 11.4, // Simran's photo of That Man
  rename: 19.2,
  playTap: 22.0, // you tap play on the DJ's track
};
export const PLAY = 22.4; // the song starts here
export const V = (song: number) => +(song - SONG_FROM + PLAY).toFixed(3);
export const SONG_END = V(SONG_TO); // 58.22
export const END_CARD = SONG_END + 0.58;
export const OUT_NOW = END_CARD + 1.0; // "OUT NOW" lands at the bottom of the end card
export const DUR = +(END_CARD + 4.2).toFixed(2); // 63.0
export const FRAMES = Math.round(DUR * FPS); // 1890

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

// ───────── the chat ─────────
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
export const CHAT_OPEN = STORY.chat;
export const MSGS: Msg[] = [
  { id: 'h0', t: -1, kind: 'system', text: 'TODAY' },
  { id: 'h1', t: -1, from: 'dj', kind: 'text', text: 'party starts NOW 🎉🎉', time: '9:00 PM' },
  { id: 'h2', t: -1, from: 'uncle', kind: 'text', text: 'reached. dancing.', time: '9:02 PM' },
  { id: 'h3', t: -1, from: 'simran', kind: 'text', text: 'is anyone even here', time: '10:41 PM' },
  { id: 'h4', t: -1, from: 'kabir', kind: 'text', text: 'snacks are finished btw', time: '11:20 PM' },
  { id: 'r1', t: -1, from: 'riya', kind: 'text', text: 'this party is DEAD 💀', time: '11:57', del: V(70.1) },
  { id: 'a1', t: -1, from: 'aman', kind: 'text', text: 'dj playing the same song since 9 😴', time: '11:57', del: V(70.4) },
  { id: 'u1', t: 4.5, from: 'uncle', kind: 'text', text: 'still dancing 🕺', time: '11:57' },
  { id: 'k1', t: 5.8, from: 'kabir', kind: 'text', text: 'leaving in 5', time: '11:57', del: V(70.6) },
  { id: 'r2', t: 7.0, from: 'riya', kind: 'text', text: 'same', time: '11:57' },
  { id: 'ty', t: STORY.typing[0], end: STORY.typing[1], from: 'simran', kind: 'typing' },
  { id: 's1', t: STORY.typing[1], from: 'simran', kind: 'text', text: 'WAIT.', time: '11:58' },
  { id: 's2', t: 10.0, from: 'simran', kind: 'text', text: 'who just walked in???', time: '11:58' },
  { id: 'ph', t: STORY.photo, from: 'simran', kind: 'photo', time: '11:58' },
  { id: 'r3', t: 13.9, from: 'riya', kind: 'emoji', text: '😳😳😳', time: '11:58' },
  { id: 'a2', t: 15.0, from: 'aman', kind: 'text', text: 'my AC just quit 🥵', time: '11:58' },
  { id: 'k2', t: 16.3, from: 'kabir', kind: 'text', text: '…not leaving anymore', time: '11:58' },
  { id: 'u2', t: 17.7, from: 'uncle', kind: 'text', text: 'I have stopped dancing.', time: '11:58' },
  { id: 'rn', t: STORY.rename, kind: 'system', text: 'Simran changed the group name to "TOO HOT TO HANDLE 🔥"' },
  { id: 'dj', t: 20.6, from: 'dj', kind: 'audio', text: 'TOO HOT TO HANDLE.mp3', time: '11:58' },
  // the song is playing
  { id: 'jn', t: V(56.62), kind: 'system', text: 'THAT MAN 🔥 joined the group' },
  { id: 'm1', t: V(58.2), from: 'man', kind: 'text', text: 'hi.', time: '11:58', hot: true },
  { id: 'mi', t: V(60.3), from: 'mirror', kind: 'text', text: 'not jealous.', time: '11:58' },
  { id: 'vn', t: V(60.62), from: 'man', kind: 'voice', time: '11:58', hot: true },
  { id: 'cd', t: V(72.45), from: 'man', kind: 'emoji', text: '🕯️', time: '11:59', hot: true },
  { id: 'r4', t: V(74.4), from: 'riya', kind: 'emoji', text: '🔥🔥🔥', time: '11:59' },
];
export const TYPING_NAME = (t: number) => (t >= STORY.typing[0] && t < STORY.typing[1] ? 'Simran is typing…' : null);
export const GROUP_RENAME = STORY.rename;

// ───────── which screen is up ─────────
export const SHOTS = {
  lock: [0, CHAT_OPEN],
  banner: [V(56.62), V(58.72)], // "Phone vich mera naam bold letters"
  profile: [V(58.72), V(60.24)], // "Main classy, never off-center"
  vinyl: [V(61.75), V(63.27)], // "…jiven vinyl jaan wool"
  alert: [V(63.27), V(66.3)], // "Style mera final, kise chahidi na trial"
  overheat: [V(66.3), V(69.33)], // "Ni I'm too hot to handle"
  deleted: [V(69.33), V(72.45)], // "ho jaave na koi scandal"
  candle: [V(72.45), V(75.56)], // "Main taan move karaan candle, tu fire di ik angle"
  scramble: [V(75.56), V(77.15)], // "Tere nazran ne keeta scramble"
  panel: [V(77.15), V(80.82)], // "Ni tu smile kare, main lose heart da panel"
  call: [V(80.82), V(83.94)], // "Ni I'm too hot to handle" (2)
  playlist: [V(83.94), V(86.73)], // "Playlist 'te tera channel"
  camera: [V(86.73), V(89.28)], // "Eyes on me, tu ik angle"
  pop: [V(89.28), SONG_END], // "Heart went pop — oops! it's a scandal!"
  off: [SONG_END, END_CARD],
  end: [END_CARD, DUR],
} as const;

// ───────── lyrics (sung word onsets from analysis/word_timings.tsv) ─────────
export type Line = { a: number; b: number; text: string; en?: string; words: number[] };
const L = (a: number, b: number, text: string, en: string | undefined, w: number[]): Line => ({ a: V(a), b: V(b), text, en, words: w.map(V) });
export const LINES: Line[] = [
  L(56.48, 58.72, 'Phone vich mera naam bold letters,', "My name's in bold letters on your phone,", [56.6, 56.9, 57.2, 57.4, 57.8, 58.0]),
  L(58.72, 60.24, 'Main classy, never off-center.', "I'm classy, never off-center.", [58.7, 58.9, 59.3, 59.5]),
  L(60.24, 63.27, 'Main talk karaan smooth, jiven vinyl jaan wool,', 'I talk smooth, like vinyl or wool,', [60.4, 60.6, 60.9, 61.3, 61.6, 61.9, 62.3, 62.7]),
  L(63.27, 66.3, 'Style mera final, kise chahidi na trial.', 'My style is final, no one needs a trial.', [63.1, 63.6, 63.9, 64.8, 65.3, 65.7, 65.9]),
  L(66.3, 69.33, "Ni I'm too hot to handle,", "Girl, I'm too hot to handle,", [66.4, 66.6, 66.8, 66.9, 67.3, 67.6]),
  L(69.33, 72.45, 'ho jaave na koi scandal,', "hope there's no scandal,", [69.4, 69.7, 70.1, 70.4, 70.6]),
  L(72.45, 75.56, 'Main taan move karaan candle, tu fire di ik angle.', "I move like a candle, you're one angle of the fire.", [72.4, 72.7, 72.9, 73.2, 73.7, 74.2, 74.4, 74.9, 75.1, 75.2]),
  L(75.56, 77.15, 'Tere nazran ne keeta scramble,', 'Your eyes scrambled me,', [75.6, 76.1, 76.3, 76.4, 76.7]),
  L(77.15, 80.82, 'Ni tu smile kare, main lose heart da panel.', "Girl, you smile and I lose my heart's control panel.", [77.1, 77.3, 77.6, 77.8, 78.1, 78.4, 78.6, 78.9, 79.1]),
  L(80.82, 83.94, "Ni I'm too hot to handle,", "Girl, I'm too hot to handle,", [80.9, 81.3, 81.4, 81.8, 82.1, 82.4]),
  L(83.94, 86.73, "Playlist 'te tera channel,", "Your channel's on my playlist,", [84.1, 84.6, 85.0, 85.3]),
  L(86.73, 89.28, 'Eyes on me, tu ik angle,', "Eyes on me, you're one angle,", [87.0, 87.1, 87.4, 87.7, 88.1, 88.6]),
  L(89.28, SONG_TO, "Heart went pop, oops! it's a scandal!", undefined, [89.3, 89.8, 90.1, 90.4, 91.3, 91.4, 91.6]),
];

/** Phone temperature in the status bar. */
export const phoneTemp = (t: number) => {
  const k: [number, number][] = [[0, 36], [STORY.photo, 36], [STORY.playTap, 44], [V(66.2), 71], [V(66.4), 99], [V(80.8), 104], [V(89.3), 118], [SONG_END, 140]];
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) return Math.round(k[i - 1][1] + (k[i][1] - k[i - 1][1]) * ((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  }
  return k[k.length - 1][1];
};
export const clockAt = (t: number) => (t < STORY.typing[1] ? '11:57' : t < V(72.45) ? '11:58' : '11:59');

// camera hits (shake)
export const HITS: { t: number; amp: number; decay: number }[] = [
  { t: STORY.photo, amp: 10, decay: 9 },
  { t: V(66.4), amp: 26, decay: 6 },
  { t: V(66.9), amp: 30, decay: 6 },
  { t: V(80.9), amp: 18, decay: 7 },
  { t: V(81.8), amp: 26, decay: 6 },
  { t: V(90.1), amp: 34, decay: 6 },
  { t: V(91.6), amp: 24, decay: 7 },
];
