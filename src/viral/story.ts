import { clamp, lerp, easeInOutCubic } from '../lib/time';
import { Blend, PaletteName } from './thermal';

/** The master is a fixed-tempo Suno render: exactly 154 BPM, first beat at 0.396 s (drift under ±8 ms end to end). */
export const BPM = 154;
export const PERIOD = 60 / BPM;
export const PHASE = 0.396;
export const beatTime = (k: number) => PHASE + k * PERIOD;
export const grid = (t: number) => {
  const x = (t - PHASE) / PERIOD;
  const idx = Math.floor(x);
  const since = (x - idx) * PERIOD;
  return { idx, since, frac: x - idx, pulse: idx < 0 ? 0 : Math.exp(-since * 10) };
};

/** Measured from the master: the hits worth a flash or a camera kick (seconds, strength). */
export const HITS: { t: number; amt: number }[] = [
  { t: 9.75, amt: 0.9 },   // drums enter
  { t: 19.87, amt: 0.55 }, // bass back after the stop-time
  { t: 34.3, amt: 0.45 },  // mirror section
  { t: 47.149, amt: 0.5 }, // verse 2 (kick after the snare fill)
  { t: 66.27, amt: 0.4 },  // hook 1 (stripped)
  { t: 80.667, amt: 1.0 }, // the big hit
  { t: 89.97, amt: 0.9 },  // "pop"
  { t: 92.17, amt: 0.6 },  // band back after the stop
  { t: 105.2, amt: 0.5 },  // hook 2
  { t: 115.4, amt: 0.8 },  // "pop" 2
  { t: 118.07, amt: 1.0 }, // 1:58 slam
  { t: 121.17, amt: 1.0 }, // the drop
  { t: 130.07, amt: 0.7 },
  { t: 130.53, amt: 0.6 },
  { t: 136.8, amt: 0.9 },  // band returns for the tag
  { t: 141.43, amt: 1.0 }, // last hit
];

/** The two real stops in the master (band out, vocal in the gap) and the verse-1 stop-time. */
export const FREEZES: [number, number][] = [[90.12, 92.13], [115.62, 118.03]];
export const STUTTER: [number, number] = [15.84, 19.85];
export const inWin = (t: number, w: [number, number]) => t >= w[0] && t < w[1];
/** Image time: what the camera shows. It freezes during the stops and drops to 10 fps in the stop-time. */
export const imageTime = (t: number) => {
  for (const w of FREEZES) if (inWin(t, w)) return w[0];
  if (inWin(t, STUTTER)) return Math.floor(t * 10) / 10;
  return t;
};
export const freezeAt = (t: number) => FREEZES.find((w) => inWin(t, w));

/** Final hook + drop run wild: palette strobes, harder punches. */
export const WILD: [number, number] = [118.07, 129.95];
export const wild = (t: number) => (inWin(t, WILD) ? 1 : 0);

/** Palette timeline. `xf` = crossfade seconds (0 = hard snap on the hit). */
type PalKey = { t: number; p: PaletteName; xf?: number };
export const PAL_TIMELINE: PalKey[] = [
  { t: 0, p: 'IRONBOW' },
  { t: 15.86, p: 'WHITEHOT', xf: 0 },
  { t: 19.87, p: 'IRONBOW', xf: 0 },
  { t: 34.3, p: 'ARCTIC', xf: 0 },
  { t: 42.474, p: 'RAINBOW', xf: 0 },
  { t: 47.14, p: 'IRONBOW', xf: 0 },
  { t: 54.75, p: 'LAVA', xf: 0 },
  { t: 56.5, p: 'IRONBOW', xf: 0 },
  { t: 58.6, p: 'GOLD', xf: 0 },
  { t: 63.0, p: 'IRONBOW', xf: 0 },
  { t: 66.27, p: 'LAVA', xf: 1.2 },
  { t: 75.55, p: 'RAINBOW', xf: 0 },
  { t: 77.05, p: 'SCANDAL', xf: 0 },
  { t: 79.6, p: 'LAVA', xf: 0.9 },
  { t: 80.667, p: 'OVERLOAD', xf: 0 },
  { t: 81.25, p: 'LAVA', xf: 0 },
  { t: 83.9, p: 'IRONBOW', xf: 0 },
  { t: 89.2, p: 'SCANDAL', xf: 0 },
  { t: 92.15, p: 'IRONBOW', xf: 0 },
  { t: 93.62, p: 'LAVA', xf: 0 },
  { t: 95.12, p: 'RAINBOW', xf: 0 },
  { t: 96.72, p: 'WHITEHOT', xf: 0 },
  { t: 98.12, p: 'ARCTIC', xf: 0 },
  { t: 99.82, p: 'IRONBOW', xf: 0 },
  { t: 101.33, p: 'GOLD', xf: 0 },
  { t: 102.86, p: 'ARCTIC', xf: 0 },
  { t: 105.08, p: 'GOLD', xf: 0 },
  { t: 111.25, p: 'LAVA', xf: 0.8 },
  { t: 114.5, p: 'SCANDAL', xf: 0 },
  { t: 118.07, p: 'OVERLOAD', xf: 0 },
  { t: 118.6, p: 'LAVA', xf: 0 },
  { t: 129.9, p: 'ARCTIC', xf: 0 },
  { t: 136.78, p: 'IRONBOW', xf: 0 },
];
const STROBE: PaletteName[] = ['LAVA', 'IRONBOW', 'SCANDAL', 'RAINBOW', 'GOLD', 'LAVA', 'OVERLOAD', 'IRONBOW'];
/** Sensor glitches: the palette flickers every two frames. */
export const GLITCHES: [number, number][] = [[40.38, 40.95], [75.6, 76.0], [118.07, 118.4]];
const FLICKER: PaletteName[] = ['BLACKHOT', 'RAINBOW', 'WHITEHOT', 'IRONBOW', 'ARCTIC', 'BLACKHOT', 'SCANDAL', 'RAINBOW'];

export const paletteAt = (t: number): { blend: Blend; name: PaletteName } => {
  let i = 0;
  while (i < PAL_TIMELINE.length - 1 && PAL_TIMELINE[i + 1].t <= t) i++;
  const cur = PAL_TIMELINE[i];
  const gl = GLITCHES.find((w) => inWin(t, w));
  if (gl) {
    const name = FLICKER[Math.floor((t - gl[0]) * 15) % FLICKER.length];
    return { blend: [{ name, w: 1 }], name };
  }
  // Wild section: a new palette on every downbeat pair, with the drop's own snap.
  if (wild(t) && t >= 118.6) {
    const g = grid(t);
    const name = STROBE[Math.floor(g.idx / 2) % STROBE.length];
    return { blend: [{ name, w: 1 }], name };
  }
  const prev = PAL_TIMELINE[Math.max(0, i - 1)];
  const xf = cur.xf ?? 0;
  const p = xf > 0 ? easeInOutCubic(clamp((t - cur.t) / xf)) : 1;
  if (p >= 1 || i === 0) return { blend: [{ name: cur.p, w: 1 }], name: cur.p };
  return { blend: [{ name: prev.p, w: 1 - p }, { name: cur.p, w: p }], name: cur.p };
};

/** Subject temperature (°C) the camera reads. Infinity = over range. */
const TEMP: [number, number][] = [
  [0, 21.4], [1.97, 36.6], [10.4, 36.9], [22, 38.2], [34.3, 41.5], [47, 46], [60, 52], [66.27, 61],
  [72.4, 88], [77.1, 112], [80.6, 196], [80.667, Infinity], [83.94, 296], [89.2, 344], [89.97, Infinity], [92.1, Infinity], [92.15, 128], [104.9, 214],
  [105.2, 260], [111.2, 420], [115.4, 640], [115.42, Infinity], [129.9, Infinity], [129.95, 36.6], [136.7, 37.2], [136.8, Infinity],
];
export const tempAt = (t: number) => {
  let i = 0;
  while (i < TEMP.length - 1 && TEMP[i + 1][0] <= t) i++;
  const [ta, va] = TEMP[i];
  const [tb, vb] = TEMP[Math.min(TEMP.length - 1, i + 1)];
  if (!isFinite(va)) return Infinity;
  if (!isFinite(vb) || tb === ta) return va;
  return lerp(va, vb, easeInOutCubic(clamp((t - ta) / (tb - ta))));
};

/** Ambient warmth of the room (background heat level, 0..1). */
const AMB: [number, number][] = [
  [0, 0.05], [10.4, 0.08], [16, 0.12], [34.3, 0.06], [47, 0.11], [66.27, 0.15], [80.667, 0.26], [92.15, 0.14],
  [105.2, 0.2], [118.07, 0.3], [129.9, 0.05], [136.8, 0.12], [143.4, 0.06],
];
export const ambientAt = (t: number) => {
  let i = 0;
  while (i < AMB.length - 1 && AMB[i + 1][0] <= t) i++;
  const [ta, va] = AMB[i];
  const [tb, vb] = AMB[Math.min(AMB.length - 1, i + 1)];
  return tb === ta ? va : lerp(va, vb, clamp((t - ta) / (tb - ta)));
};

export const hitAt = (t: number, decay = 7) => {
  let v = 0;
  for (const h of HITS) {
    const d = t - h.t;
    if (d >= -0.017 && d < 1.2) v = Math.max(v, h.amt * Math.exp(-Math.max(0, d) * decay));
  }
  return v;
};
