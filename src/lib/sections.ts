import { clamp } from './time';

export type Look = { top: string; bot: string; glow: string; glow2: string; glowAmt: number; fire: number; embers: number; temp: number };
export type Section = Look & { t: number; name: string };

// Song structure (seconds), from the lyric cues + the energy analysis.
export const SECTIONS: Section[] = [
  { t: 0, name: 'intro', top: '#030205', bot: '#0b0609', glow: '#ff4d1a', glow2: '#ff2e6e', glowAmt: 0.25, fire: 0, embers: 0.15, temp: 22 },
  { t: 10.37, name: 'verse1', top: '#0a0405', bot: '#1d0a06', glow: '#ff6a1f', glow2: '#ffb547', glowAmt: 0.55, fire: 0.12, embers: 0.45, temp: 29 },
  { t: 34.39, name: 'mirror', top: '#06070c', bot: '#121626', glow: '#9fb4ff', glow2: '#ff2e6e', glowAmt: 0.45, fire: 0, embers: 0.2, temp: 36 },
  { t: 46.99, name: 'verse2', top: '#0b0205', bot: '#24040b', glow: '#ff1f3d', glow2: '#ff7a2e', glowAmt: 0.6, fire: 0.18, embers: 0.5, temp: 41 },
  { t: 66.1, name: 'hook1', top: '#0c0301', bot: '#2a0a02', glow: '#ff4d1a', glow2: '#ffb547', glowAmt: 0.75, fire: 0.55, embers: 0.8, temp: 52 },
  { t: 80.82, name: 'hook1b', top: '#120401', bot: '#3a0d02', glow: '#ff4d1a', glow2: '#ffd06a', glowAmt: 1, fire: 1, embers: 1, temp: 99 },
  { t: 91.99, name: 'verse3', top: '#0b0209', bot: '#24051c', glow: '#ff2e6e', glow2: '#ffb547', glowAmt: 0.65, fire: 0.15, embers: 0.6, temp: 74 },
  { t: 104.9, name: 'hook2', top: '#120401', bot: '#3a0d02', glow: '#ff4d1a', glow2: '#ffd06a', glowAmt: 1, fire: 0.9, embers: 1, temp: 110 },
  { t: 120.5, name: 'drop', top: '#160500', bot: '#4a1202', glow: '#ff5a1a', glow2: '#ff2e6e', glowAmt: 1.15, fire: 1.2, embers: 1.3, temp: 140 },
  { t: 129.8, name: 'outro', top: '#05060b', bot: '#11131f', glow: '#9fb4ff', glow2: '#ff2e6e', glowAmt: 0.45, fire: 0.1, embers: 0.35, temp: 140 },
  { t: 136.3, name: 'end', top: '#030205', bot: '#0b0609', glow: '#ff4d1a', glow2: '#ff2e6e', glowAmt: 0.3, fire: 0.05, embers: 0.25, temp: 140 },
];

export const sectionAt = (t: number) => {
  let i = 0;
  while (i < SECTIONS.length - 1 && SECTIONS[i + 1].t <= t) i++;
  return i;
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, p: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',')})`;
};
const mixHex = (a: string, b: string, p: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join('');
};

/** Look at time t, crossfading into each section over `xf` seconds. */
export const lookAt = (t: number, xf = 0.6): Look => {
  const i = sectionAt(t);
  const cur = SECTIONS[i];
  const prev = SECTIONS[Math.max(0, i - 1)];
  const p = clamp((t - cur.t) / xf);
  const n = (k: keyof Look) => (prev[k] as number) + ((cur[k] as number) - (prev[k] as number)) * p;
  const s = (k: keyof Look) => mixHex(prev[k] as string, cur[k] as string, p);
  return { top: s('top'), bot: s('bot'), glow: s('glow'), glow2: s('glow2'), glowAmt: n('glowAmt'), fire: n('fire'), embers: n('embers'), temp: n('temp') };
};

/** Big structural hits that get a flash + camera kick. */
export const HITS: { t: number; amt: number; color: string }[] = [
  { t: 10.37, amt: 0.85, color: '#ffd9b0' },
  { t: 34.39, amt: 0.5, color: '#dfe6ff' },
  { t: 46.99, amt: 0.6, color: '#ffb0b0' },
  { t: 66.3, amt: 0.7, color: '#ffd9b0' },
  { t: 80.82, amt: 1, color: '#ffffff' },
  { t: 91.99, amt: 0.6, color: '#ffc0dd' },
  { t: 105.08, amt: 1, color: '#ffffff' },
  { t: 120.64, amt: 1, color: '#ffffff' },
  { t: 129.89, amt: 0.4, color: '#dfe6ff' },
];
