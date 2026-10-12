import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp } from '../lib/time';

/**
 * Thermal-camera false colour. Everything inside a <Thermal> layer is authored in greyscale
 * ("heat": black = cold, white = hottest); an SVG gradient-map filter turns it into a camera palette.
 */
type Stop = [number, number, number, number]; // position 0..1, r, g, b (0..255)

export const PALETTES = {
  IRONBOW: [
    [0, 4, 3, 16], [0.1, 28, 4, 84], [0.24, 92, 6, 148], [0.39, 168, 14, 138], [0.53, 222, 48, 72],
    [0.66, 246, 106, 14], [0.8, 255, 178, 8], [0.92, 255, 232, 96], [1, 255, 255, 240],
  ],
  ARCTIC: [
    [0, 2, 4, 14], [0.16, 8, 22, 66], [0.34, 16, 66, 146], [0.52, 40, 140, 214], [0.68, 120, 210, 244],
    [0.82, 214, 244, 255], [0.92, 255, 236, 190], [1, 255, 255, 255],
  ],
  LAVA: [
    [0, 6, 0, 0], [0.18, 52, 0, 4], [0.36, 140, 8, 0], [0.52, 220, 52, 0], [0.67, 255, 122, 0],
    [0.82, 255, 200, 50], [0.93, 255, 240, 160], [1, 255, 255, 236],
  ],
  RAINBOW: [
    [0, 0, 0, 6], [0.13, 44, 0, 120], [0.27, 0, 56, 250], [0.41, 0, 196, 224], [0.54, 0, 228, 92],
    [0.66, 236, 240, 0], [0.79, 255, 112, 0], [0.9, 255, 10, 60], [1, 255, 255, 255],
  ],
  WHITEHOT: [
    [0, 2, 4, 6], [0.5, 112, 118, 124], [0.85, 222, 230, 236], [1, 250, 252, 255],
  ],
  BLACKHOT: [
    [0, 236, 234, 228], [0.45, 150, 148, 144], [0.8, 40, 38, 36], [1, 4, 4, 4],
  ],
  SCANDAL: [
    [0, 6, 0, 12], [0.2, 52, 0, 84], [0.4, 156, 0, 128], [0.58, 255, 28, 118], [0.76, 255, 128, 186],
    [0.9, 255, 214, 230], [1, 255, 252, 252],
  ],
  GOLD: [
    [0, 5, 2, 0], [0.22, 60, 20, 0], [0.45, 168, 82, 6], [0.64, 236, 150, 30], [0.8, 255, 206, 96],
    [0.92, 255, 238, 186], [1, 255, 252, 240],
  ],
  OVERLOAD: [
    [0, 60, 0, 0], [0.14, 210, 24, 0], [0.32, 255, 132, 0], [0.5, 255, 222, 110], [0.7, 255, 250, 220], [1, 255, 255, 255],
  ],
} satisfies Record<string, Stop[]>;
export type PaletteName = keyof typeof PALETTES;

const N = 48;
const sample = (stops: Stop[], x: number): [number, number, number] => {
  let i = 0;
  while (i < stops.length - 2 && stops[i + 1][0] < x) i++;
  const a = stops[i], b = stops[i + 1];
  const p = clamp((x - a[0]) / (b[0] - a[0] || 1));
  return [a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p, a[3] + (b[3] - a[3]) * p];
};
const TABLES: Record<string, [number, number, number][]> = {};
for (const k of Object.keys(PALETTES)) {
  TABLES[k] = Array.from({ length: N }, (_, i) => sample(PALETTES[k as PaletteName] as Stop[], i / (N - 1)));
}

/** A palette blend: a weighted mix of named palettes (weights need not sum to 1). */
export type Blend = { name: PaletteName; w: number }[];
export const tableFor = (blend: Blend): [number, number, number][] => {
  const tot = blend.reduce((s, b) => s + b.w, 0) || 1;
  return Array.from({ length: N }, (_, i) => {
    let r = 0, g = 0, b = 0;
    for (const { name, w } of blend) {
      const c = TABLES[name][i];
      r += c[0] * w; g += c[1] * w; b += c[2] * w;
    }
    return [r / tot, g / tot, b / tot];
  });
};
export const cssColor = (name: PaletteName, x: number) => {
  const c = sample(PALETTES[name] as Stop[], x);
  return `rgb(${c.map(Math.round).join(',')})`;
};
export const gradientCss = (blend: Blend, dir = '0deg') => {
  const tab = tableFor(blend);
  const stops = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((x) => {
    const c = tab[Math.round(x * (N - 1))];
    return `rgb(${c.map(Math.round).join(',')}) ${x * 100}%`;
  });
  return `linear-gradient(${dir}, ${stops.join(', ')})`;
};

/** SVG <filter> that maps luminance through the palette. `gain`/`lift` shape the heat curve before mapping. */
export const ThermalFilter: React.FC<{ id: string; blend: Blend; gain?: number; lift?: number }> = ({ id, blend, gain = 1, lift = 0 }) => {
  const tab = tableFor(blend);
  const ch = (k: 0 | 1 | 2) => tab.map((c) => (c[k] / 255).toFixed(4)).join(' ');
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }}>
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={`${0.2126 * gain} ${0.7152 * gain} ${0.0722 * gain} 0 ${lift}  ${0.2126 * gain} ${0.7152 * gain} ${0.0722 * gain} 0 ${lift}  ${0.2126 * gain} ${0.7152 * gain} ${0.0722 * gain} 0 ${lift}  0 0 0 1 0`} />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={ch(0)} />
          <feFuncG type="table" tableValues={ch(1)} />
          <feFuncB type="table" tableValues={ch(2)} />
        </feComponentTransfer>
      </filter>
    </svg>
  );
};

/** A full-frame heat layer seen through palette `blend`. */
export const Thermal: React.FC<{ id: string; blend: Blend; gain?: number; lift?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, blend, gain, lift, children, style }) => (
  <>
    <ThermalFilter id={id} blend={blend} gain={gain} lift={lift} />
    <AbsoluteFill style={{ background: '#000', filter: `url(#${id})`, overflow: 'hidden', ...style }}>{children}</AbsoluteFill>
  </>
);

/** Grey level for heat v (0..1). */
export const heat = (v: number, a = 1) => {
  const g = Math.round(clamp(v) * 255);
  return a >= 1 ? `rgb(${g},${g},${g})` : `rgba(${g},${g},${g},${a})`;
};
/** Thermal bloom for text: hot core + diffused halo (greyscale, so the palette paints it). */
export const heatGlow = (v: number, size: number, spread = 1) =>
  v <= 0.02
    ? 'none'
    : [
        `0 0 ${size * 0.035 * spread}px ${heat(1, 0.6 * v)}`,
        `0 0 ${size * 0.12 * spread}px ${heat(1, 0.5 * v)}`,
        `0 0 ${size * 0.34 * spread}px ${heat(1, 0.38 * v)}`,
        `0 0 ${size * 0.8 * spread}px ${heat(1, 0.24 * v * v)}`,
      ].join(', ');
