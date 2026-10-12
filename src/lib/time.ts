import audio from '../data/audio.json';
import { END as OUTRO_END } from './outro';
import lyrics from '../data/lyrics.json';

export const FPS = 30;
// The video runs past the song into the PSH card and BOLO BEATS logo sting.
export const DURATION = Math.max(audio.duration, OUTRO_END);
export const DURATION_FRAMES = Math.ceil(DURATION * FPS);

export type Word = { w: string; t: number };
export type Cue = { cue: number; start: number; end: number; text: string; words: Word[] };
export const CUES = lyrics as Cue[];
export const cue = (n: number) => CUES[n - 1];

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const prog = (t: number, start: number, dur: number) => clamp((t - start) / dur);
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeOutExpo = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeInCubic = (p: number) => p * p * p;
export const easeOutBack = (p: number, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
export const easeOutElastic = (p: number) =>
  p === 0 ? 0 : p === 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;

/** Deterministic pseudo random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const BEATS = audio.beats as number[];
export const beatAt = (t: number) => {
  let lo = 0, hi = BEATS.length - 1, idx = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (BEATS[m] <= t) { idx = m; lo = m + 1; } else hi = m - 1;
  }
  const since = idx < 0 ? 99 : t - BEATS[idx];
  return { idx, since, pulse: Math.exp(-since * 9) };
};
type Band = 'rms' | 'low' | 'mid' | 'high' | 'energy';
export const band = (name: Band, t: number) => {
  const arr = (audio as any)[name] as number[];
  const i = clamp(Math.round(t * FPS), 0, arr.length - 1);
  return arr[i];
};
/** Smoothed band (avg of ±n frames). */
export const bandS = (name: Band, t: number, n = 2) => {
  let s = 0;
  for (let k = -n; k <= n; k++) s += band(name, t + k / FPS);
  return s / (2 * n + 1);
};

/** When a cue stops being on screen: next cue start (if close) or its own end. */
export const cueOut = (n: number) => {
  const c = cue(n), next = CUES[n];
  if (next && next.start - c.end < 0.6) return next.start;
  return c.end + 0.25;
};
