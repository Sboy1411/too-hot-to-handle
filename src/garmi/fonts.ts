import { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

// Text is fitted on a canvas, so nothing renders until every face is live.
const FACES: { family: string; file: string; weight: string; stretch?: string }[] = [
  { family: 'Anton', file: 'anton-latin-400-normal.woff2', weight: '400' },
  { family: 'Inter', file: 'inter-latin-400-normal.woff2', weight: '400' },
  { family: 'Inter', file: 'inter-latin-600-normal.woff2', weight: '600' },
  { family: 'JetBrains Mono', file: 'JetBrainsMono-wght.woff2', weight: '100 800' },
  { family: 'Archivo', file: 'Archivo-wdth-wght.woff2', weight: '100 900', stretch: '62% 125%' },
];

let ready: Promise<void> | null = null;
const loadAll = () => {
  if (!ready) {
    ready = Promise.all(
      FACES.map(async (f) => {
        const face = new FontFace(f.family, `url('${staticFile(`fonts/${f.file}`)}') format('woff2')`, { weight: f.weight, stretch: f.stretch ?? 'normal' });
        await face.load();
        (document.fonts as any).add(face);
      }),
    ).then(() => (document.fonts as any).load('40px "Noto Color Emoji"').catch(() => undefined)).then(() => undefined);
  }
  return ready;
};

export const useGarmiFonts = () => {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender('garmi fonts'));
  useEffect(() => {
    loadAll().then(() => { setOk(true); continueRender(handle); });
  }, [handle]);
  return ok;
};

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();
/** Width in px of text set in a CSS font shorthand, e.g. '400 100px Anton'. */
export const textW = (text: string, font: string, spacing = 0) => {
  const k = `${font}|${spacing}|${text}`;
  let w = cache.get(k);
  if (w === undefined) {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = font;
    (ctx as any).letterSpacing = `${spacing}px`;
    w = ctx.measureText(text).width;
    cache.set(k, w);
  }
  return w;
};
/** Largest font size (≤ max) that sets text on one line within maxW. */
export const fitOne = (text: string, family: string, weight: number, maxW: number, max: number, spacingEm = 0) => {
  const w100 = textW(text, `${weight} 100px ${family}`, spacingEm * 100);
  return Math.min(max, (maxW / w100) * 100);
};
/** Greedy word wrap at a given size. */
export const wrapWords = (words: string[], family: string, weight: number, size: number, maxW: number) => {
  const space = textW(' ', `${weight} ${size}px ${family}`);
  const lines: number[][] = [];
  let cur: number[] = [], curW = 0;
  words.forEach((w, i) => {
    const ww = textW(w, `${weight} ${size}px ${family}`);
    if (cur.length && curW + space + ww > maxW) { lines.push(cur); cur = [i]; curW = ww; }
    else { curW += (cur.length ? space : 0) + ww; cur.push(i); }
  });
  if (cur.length) lines.push(cur);
  return lines;
};
