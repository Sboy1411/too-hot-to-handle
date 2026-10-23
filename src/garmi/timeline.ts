// GARMI 24×7 — the news-bulletin Short. Every time here is in seconds of the finished video.
export const FPS = 30;
export const DUR = 65.37;
export const FRAMES = Math.round(DUR * FPS); // 1961
export const SONG_IN = 28.37; // song 0:00 lands here
export const SONG_OUT = 62.43; // song cut (song 0:34.06)
export const HIJACK = 28.37;
export const W = 1080;
export const H = 1920;

// Fixed news-channel layout (y = pixels from the top)
export const L = {
  top: { y: 96, h: 104 },
  pic: { y: 210, h: 920 },
  strap: { y: 1142, h: 136 },
  cc: { y: 1292, h: 176 },
  ticker: { y: 1482, h: 66 },
};

export const C = {
  red: '#D7141E',
  navy: '#0B1630',
  off: '#F4F1EA',
  fire: '#FF4D1A',
  gold: '#FFB547',
  yellow: '#FFD21F',
  ink: '#140e0c',
  sub: '#FFE14D', // translation yellow
};

export const FONT = {
  anton: 'Anton, Impact, sans-serif',
  inter: 'Inter, sans-serif',
  mono: '"JetBrains Mono", monospace',
  archivo: 'Archivo, sans-serif',
};

// ───────── math ─────────
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeInCubic = (p: number) => p * p * p;
export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;
export const easeOutExpo = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const easeOutBack = (p: number, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** Smooth 1-D value noise in [-1, 1]. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x), f = x - i;
  const a = rand(i + seed * 101.3) * 2 - 1, b = rand(i + 1 + seed * 101.3) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
/** Piecewise-linear lookup through [time, value] keys. */
export const keys = (t: number, k: [number, number][], ease: (p: number) => number = (p) => p) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ease((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  }
  return k[k.length - 1][1];
};

// ───────── camera hits (shake) ─────────
type Hit = { t: number; amp: number; decay: number; whole?: boolean };
export const HITS: Hit[] = [
  { t: 0, amp: 42, decay: 5, whole: true },
  { t: 34.3, amp: 26, decay: 7 },
  { t: 38.74, amp: 34, decay: 6, whole: true },
  { t: 43.75, amp: 24, decay: 8 },
  { t: 51.4, amp: 22, decay: 8 },
  { t: 60.7, amp: 30, decay: 6, whole: true },
];
export const shake = (t: number, onlyWhole = false) => {
  let x = 0, y = 0, r = 0;
  for (const h of HITS) {
    if (t < h.t || (onlyWhole && !h.whole)) continue;
    const e = h.amp * Math.exp(-(t - h.t) * h.decay) * (onlyWhole ? 0.35 : 1);
    if (e < 0.05) continue;
    x += e * noise1((t - h.t) * 38, h.t);
    y += e * noise1((t - h.t) * 41, h.t + 7);
    r += e * 0.04 * noise1((t - h.t) * 30, h.t + 13);
  }
  return { x, y, r };
};

// ───────── temperature readout ─────────
export const tempAt = (t: number) =>
  Math.round(
    keys(t, [
      [0, 49], [10, 49], [18, 50], [25, 51], [28, 54], [HIJACK, 54], [36, 56],
      [38.7, 99], [60.7, 120], [62.4, 140], [99, 140],
    ], (p) => p),
  );
/** The 36.0–38.7 race accelerates instead of climbing linearly. */
export const tempShown = (t: number) => {
  if (t >= 36 && t <= 38.7) return Math.round(lerp(56, 99, Math.pow(seg(t, 36, 38.7), 1.6)));
  if (t > 60.7 && t <= 62.4) return Math.round(lerp(120, 140, Math.pow(seg(t, 60.7, 62.4), 1.5)));
  return tempAt(t);
};

// ───────── scenes ─────────
export const SCENES = [
  { n: 1, a: 0, b: 2.4, name: 'opener' },
  { n: 2, a: 2.4, b: 6.4, name: 'studio-wide' },
  { n: 3, a: 6.4, b: 10.2, name: 'camera-2' },
  { n: 4, a: 10.2, b: 13.5, name: 'heat-map' },
  { n: 5, a: 13.5, b: 17.7, name: 'sector-17' },
  { n: 6, a: 17.7, b: 21.2, name: 'cctv' },
  { n: 7, a: 21.2, b: 24.7, name: 'sunglasses' },
  { n: 8, a: 24.7, b: 27.95, name: 'close-up' },
  { n: 9, a: 27.95, b: 28.37, name: 'signal-lost' },
  { n: 10, a: 28.37, b: 31.5, name: 'hijack' },
  { n: 11, a: 31.5, b: 36.0, name: 'mirror-crack' },
  { n: 12, a: 36.0, b: 38.74, name: 'thermometer' },
  { n: 13, a: 38.74, b: 41.2, name: 'heat-wave' },
  { n: 14, a: 41.2, b: 44.2, name: 'forecast' },
  { n: 15, a: 44.2, b: 47.1, name: 'debate' },
  { n: 16, a: 47.1, b: 53.2, name: 'profile' },
  { n: 17, a: 53.2, b: 56.3, name: 'live-chat' },
  { n: 18, a: 56.3, b: 58.9, name: 'headline' },
  { n: 19, a: 58.9, b: 62.43, name: 'spotlight' },
  { n: 20, a: 62.43, b: 62.9, name: 'tv-off' },
  { n: 21, a: 62.9, b: DUR, name: 'end-card' },
];
/** Red skewed wipes: the cut happens at the midpoint. */
export const WIPES = [10.2, 17.7, 24.7, 41.2, 44.2, 47.1];
export const WIPE_DUR = 0.3;

// ───────── lower-third straps ─────────
export type Strap = { t: number; tag: string; text: string; rewrite?: boolean };
export const STRAPS: Strap[] = [
  { t: 2.4, tag: 'BREAKING NEWS', text: 'CITY HITS 49°C AT MIDNIGHT' },
  { t: 6.4, tag: 'WEATHER DESK', text: "THE SUN LEFT. THE HEAT DIDN'T." },
  { t: 10.2, tag: 'LIVE HEAT MAP', text: 'HEAT FRONT MOVING AT WALKING SPEED' },
  { t: 13.5, tag: 'SOURCE', text: 'A "DEAD" PARTY IN SECTOR 17' },
  { t: 17.7, tag: 'EXCLUSIVE', text: 'CCTV: THE HEAT SOURCE IS ONE MAN' },
  { t: 21.2, tag: 'POLICE', text: '"WE COULDN\'T GET CLOSE"' },
  { t: 24.7, tag: 'BREAKING NEWS', text: 'HE IS HEADING TO OUR STUDIO' },
  { t: 27.95, tag: '', text: '' },
  { t: 28.8, tag: 'HIJACKED', text: 'THAT MAN 🔥 IS NOW LIVE' },
  { t: 38.74, tag: 'WEATHER', text: 'CITY TEMPERATURE: TOO HOT' },
  { t: 44.2, tag: 'DEBATE', text: "WHO'S THAT MAN?" },
  { t: 47.1, tag: 'PROFILE', text: 'THAT MAN 🔥 · THE BRAND, MAN' },
  { t: 53.2, tag: 'LIVE CHAT', text: 'VIEWERS REACT' },
  { t: 56.3, tag: 'HEADLINE', text: 'HE IS THE HEADLINE', rewrite: true },
];

// ───────── closed captions ─────────
export const WORD_STEP = 0.13;
export type Caption = { a: number; b: number; kind: 'anchor' | 'song'; text: string; en?: string; words?: number[] };
export const ANCHOR_LINES: Caption[] = [
  { a: 2.6, b: 6.2, kind: 'anchor', text: 'Good evening. It is midnight… and the city is at 49 degrees.' },
  { a: 6.6, b: 9.95, kind: 'anchor', text: 'The sun set five hours ago. Nobody told the heat.' },
  { a: 10.4, b: 13.3, kind: 'anchor', text: 'The heat is not spreading. It is… walking.' },
  { a: 13.7, b: 17.45, kind: 'anchor', text: 'It started at a party in Sector 17. Guests say it was dead… until 11:58.' },
  { a: 17.9, b: 20.95, kind: 'anchor', text: 'Police have one blurry photo. The heat source is… one man.' },
  { a: 21.4, b: 24.45, kind: 'anchor', text: 'Officers tried to follow him. Their sunglasses melted.' },
  { a: 24.9, b: 27.45, kind: 'anchor', text: 'Reports say he is walking into… our studio.' },
  { a: 27.5, b: 27.95, kind: 'anchor', text: 'Wait…' },
];
// Sung word onsets are song time (analysis/word_timings.tsv) + SONG_IN.
const s = (song: number) => +(song + SONG_IN).toFixed(3);
export const SONG_LINES: Caption[] = [
  { a: 30.67, b: 31.48, kind: 'song', text: 'yeah…', words: [s(2.4)] },
  { a: 31.47, b: 35.87, kind: 'song', text: 'Mainu lagda Mirror vi hai jealous', en: 'I think even the mirror is jealous', words: [3.2, 3.6, 5.1, 5.2, 5.7, 5.9].map(s) },
  { a: 35.87, b: 38.74, kind: 'song', text: 'you know what happens when I walk in, right?', words: [7.6, 7.8, 7.9, 8.1, 8.3, 8.6, 8.6, 8.9, 9.0].map(s) },
  { a: 38.67, b: 41.38, kind: 'song', text: 'Main vibe da mood-setter,', en: "I'm the one who sets the mood", words: [10.4, 10.6, 11.0, 11.8].map(s) },
  { a: 41.17, b: 44.49, kind: 'song', text: "Room 'ch enter karaan weather better.", en: 'I walk into the room and the weather gets better', words: [12.9, 13.3, 13.6, 14.1, 14.8, 15.2].map(s) },
  { a: 44.17, b: 47.2, kind: 'song', text: 'Lok kehnde "who\'s that man?"', en: 'People ask, "who\'s that man?"', words: [15.9, 16.5, 16.9, 17.1, 17.4].map(s) },
  { a: 47.07, b: 50.55, kind: 'song', text: "Bas keh de that's the brand man.", en: "Just tell them: that's the brand, man", words: [18.8, 19.1, 19.4, 19.6, 19.8, 20.0, 20.4].map(s) },
  { a: 50.27, b: 53.26, kind: 'song', text: 'Main vibe da trademark,', en: "I'm the trademark of the vibe", words: [22.0, 22.3, 22.8, 23.0].map(s) },
  { a: 53.17, b: 55.98, kind: 'song', text: 'Tu bas scroll kare remark.', en: 'You just scroll and leave a remark', words: [24.9, 25.0, 25.4, 25.9, 26.2].map(s) },
  { a: 55.77, b: 59.09, kind: 'song', text: 'Main headline, tu bas ik highlight,', en: "I'm the headline, you're just a highlight", words: [27.5, 27.9, 28.4, 28.5, 28.8, 29.2].map(s) },
  { a: 58.87, b: 62.4, kind: 'song', text: 'Main light jide chakkde spotlight.', en: "I'm the light the spotlight follows", words: [30.6, 30.8, 31.2, 31.5, 32.2].map(s) },
];

// ───────── ticker ─────────
export const TICKER_STORY =
  'MIRRORS CRACKING CITYWIDE • ICE CREAM SHOPS CLOSE EARLY • AC SALES UP 900% • PARTY IN SECTOR 17 "WAS DEAD" UNTIL 11:58 PM • LOCAL UNCLE STOPS DANCING FOR FIRST TIME SINCE 9 PM • GROUP CHAT RENAMED "TOO HOT TO HANDLE" • ';
export const TICKER_SONG = 'TOO HOT TO HANDLE • FULL SONG ON THE CHANNEL • ';
export const TICKER_SWITCH = 28.8;
export const LOGO_SWITCH = 29.9;

// ───────── scene data ─────────
export const BOOTS = [28.5, 28.8, 29.2, 29.6, 29.9, 30.3];
export const BOOT_ORDER = [3, 2, 5, 0, 4, 1]; // monitor index booting at each hit (face screen last)
export const CRACK_T = 34.3;
export const FORECAST = [
  { d: 'MON', e: '⛅', v: 31, t: 41.26 },
  { d: 'TUE', e: '☀️', v: 33, t: 41.65 },
  { d: 'WED', e: '🌧️', v: 27, t: 42.05 },
  { d: 'THU', e: '⛅', v: 30, t: 42.42 },
  { d: 'FRI', e: '☀️', v: 34, t: 42.81 },
  { d: 'SAT', e: '🌤️', v: 32, t: 43.21 },
  { d: 'SUN', e: '⛅', v: 31, t: 43.6 },
];
export const STAMP_T = 43.75;
export const DEBATE = [
  { id: 'anchor', name: 'ANCHOR', sub: 'GARMI 24×7', bubble: 44.74 },
  { id: 'trench', name: 'TRENCH COAT GUY', sub: 'fashion expert', bubble: 45.14 },
  { id: 'leather', name: 'LEATHER JACKET GUY', sub: 'gym expert', bubble: 45.27 },
  { id: 'hoodie', name: 'HOODIE GUY', sub: 'music expert', bubble: 45.53 },
  { id: 'uncle', name: 'UNCLE', sub: 'Sector 17, since 9 pm', bubble: 45.77 },
  { id: 'mirror', name: 'THE MIRROR', sub: 'jealous', bubble: 44.27 },
];
export const TM_T = 51.4;
export const COMMENTS = [
  { u: 'simran', m: "WHO'S THAT MAN??" },
  { u: 'aman', m: 'my AC just quit again 🥵' },
  { u: 'riya', m: 'song name??' },
  { u: 'kabir', m: 'bro is on the NEWS now 😭' },
  { u: 'uncle_since9pm', m: 'I stopped dancing for this' },
  { u: 'mirror_official', m: 'not jealous. at all.' },
  { u: 'dj_sector17', m: '🔥🔥🔥🔥' },
  { u: 'you', m: 'why is it suddenly SO hot' },
  { u: 'night_owl', m: 'full song where??' },
  { u: 'weather_team', m: 'we give up' },
];
export const COMMENTS_T = 53.2;
export const HIGHLIGHT_T = 57.6;
export const SPOT_T = 58.9;
export const BLAZE_T = 60.7;
export const END_T = 62.9;
