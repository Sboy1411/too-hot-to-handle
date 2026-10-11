import React, { CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand, cue, Word } from '../lib/time';
import { heat, heatGlow } from './thermal';

/**
 * Heat type: lyric words laid out by measured width (so blocks auto-fit and centre optically on cap height),
 * each word heating up white-hot on its sung onset and cooling to a warm hold, like a heat signature.
 */
export type StyleName = 'cond' | 'wide' | 'melt' | 'serif' | 'grot' | 'grotWide' | 'grotCond' | 'mono' | 'light';
type StyleDef = { family: string; weight: number; italic?: boolean; stretch?: string; upper: boolean; tracking: number };
export const STYLES: Record<StyleName, StyleDef> = {
  cond: { family: 'Anton', weight: 400, upper: true, tracking: 0.01 },
  wide: { family: 'Unbounded', weight: 900, upper: true, tracking: -0.01 },
  melt: { family: 'Climate Crisis', weight: 400, upper: true, tracking: 0 },
  serif: { family: 'Playfair Display', weight: 900, italic: true, upper: false, tracking: -0.01 },
  grot: { family: 'Archivo', weight: 900, upper: true, tracking: 0 },
  grotWide: { family: 'Archivo', weight: 900, stretch: 'expanded', upper: true, tracking: -0.01 },
  grotCond: { family: 'Archivo', weight: 900, stretch: 'extra-condensed', upper: true, tracking: 0 },
  mono: { family: 'JetBrains Mono', weight: 700, upper: true, tracking: 0.04 },
  light: { family: 'Unbounded', weight: 300, upper: true, tracking: 0.02 },
};
const STRETCH_PCT: Record<string, number> = { 'extra-condensed': 62.5, condensed: 75, 'semi-condensed': 87.5, normal: 100, 'semi-expanded': 112.5, expanded: 125 };

type Metrics = { cap: number; asc: number; desc: number };
const mCache = new Map<string, number>();
const metCache = new Map<string, Metrics>();
let ctx: CanvasRenderingContext2D | null = null;
const getCtx = () => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')!;
  return ctx;
};
const fontStr = (s: StyleDef, px: number, weight = s.weight) => `${s.italic ? 'italic ' : ''}${weight} ${px}px "${s.family}"`;
/** Width of text in style s at font-size 100px. */
export const measure = (text: string, s: StyleDef, weight = s.weight, stretch = s.stretch) => {
  const k = `${s.family}|${weight}|${s.italic}|${stretch}|${s.tracking}|${text}`;
  let w = mCache.get(k);
  if (w === undefined) {
    const c = getCtx();
    c.font = fontStr(s, 100, weight);
    (c as any).fontStretch = stretch ?? 'normal';
    (c as any).letterSpacing = `${s.tracking * 100}px`;
    w = c.measureText(text).width;
    mCache.set(k, w);
  }
  return w;
};
/** Cap height, ascent and descent (as fractions of font size), as Chrome lays the font out. */
export const metrics = (s: StyleDef): Metrics => {
  const k = `${s.family}|${s.weight}|${s.italic}`;
  let m = metCache.get(k);
  if (!m) {
    const c = getCtx();
    c.font = fontStr(s, 100);
    const tm = c.measureText('H');
    m = { cap: tm.actualBoundingBoxAscent / 100, asc: tm.fontBoundingBoxAscent / 100, desc: tm.fontBoundingBoxDescent / 100 };
    if (!(m.cap > 0.3)) m = { cap: 0.75, asc: 1, desc: 0.25 };
    metCache.set(k, m);
  }
  return m;
};

export type Anim = 'slam' | 'punch' | 'rise' | 'drop' | 'pop' | 'blur' | 'zoom' | 'sear' | 'scramble' | 'type' | 'flex' | 'bold' | 'melt' | 'none' | 'left' | 'right' | 'stretch';
export type HeatCurve = { pre?: number; peak?: number; hold?: number; decay?: number; attack?: number };
export type W = Word & { i: number };

export const cueWords = (n: number): W[] => cue(n).words.map((w, i) => ({ ...w, i }));
export const clean = (w: string, keep = false) => {
  let s = w.replace(/[“”"]/g, '').replace(/[‘’]/g, "'");
  if (!keep) s = s.replace(/[,.;:—–…]+$/u, '');
  return s;
};

export type LyricProps = {
  t: number;
  words: W[];
  lines?: number[];
  /** Cap height in px for the block (before auto-fit). */
  cap?: number;
  maxW?: number;
  maxH?: number;
  x?: number;
  y?: number;
  align?: 'center' | 'left' | 'right';
  lineStep?: number; // multiple of cap height
  gap?: number; // word gap, multiple of cap height
  style?: StyleName | ((w: W) => StyleName);
  /** Per-word size multiplier (relative cap height). */
  scale?: (w: W) => number;
  anim?: Anim | ((w: W) => Anim);
  dur?: number;
  lead?: number;
  curve?: HeatCurve;
  heatMul?: number;
  keepPunct?: boolean;
  glow?: number;
  /** Extra per-word style (transform appended). */
  fx?: (w: W, local: number, v: number) => { transform?: string; style?: CSSProperties; text?: string; v?: number } | undefined;
  /** Melt (Climate Crisis YEAR axis) for melt-style words, 1979 solid → 2050 melted. */
  year?: number | ((w: W, local: number) => number);
  wrap?: (w: W, node: React.ReactNode, box: Box) => React.ReactNode;
};
export type Box = { cx: number; base: number; w: number; cap: number; size: number; line: number };

/** Lay out words into rows; returns the per-word boxes (cx, baseline) and the font size per word. */
export const layout = (p: LyricProps) => {
  const words = p.words;
  const styleOf = (w: W): StyleName => (typeof p.style === 'function' ? p.style(w) : p.style ?? 'cond');
  const counts = p.lines ?? [words.length];
  const rows: W[][] = [];
  let k = 0;
  for (const n of counts) { rows.push(words.slice(k, k + n)); k += n; }
  if (k < words.length) rows[rows.length - 1].push(...words.slice(k));
  const cap = p.cap ?? 140;
  const gap = p.gap ?? 0.32;
  const lineStep = p.lineStep ?? 1.32;
  const txt = (w: W) => { const s = STYLES[styleOf(w)]; const c = clean(w.w, p.keepPunct); return s.upper ? c.toUpperCase() : c; };
  // widths at cap = 100px
  const rowW = rows.map((r) => r.reduce((sum, w, j) => {
    const s = STYLES[styleOf(w)];
    const m = metrics(s);
    const sc = p.scale ? p.scale(w) : 1;
    const fs = (100 / m.cap) * sc;
    return sum + (measure(txt(w), s) * fs) / 100 + (j ? gap * 100 : 0);
  }, 0));
  const rowCap = rows.map((r) => Math.max(...r.map((w) => (p.scale ? p.scale(w) : 1))));
  let fit = cap;
  const maxW = p.maxW ?? 1640;
  const widest = Math.max(...rowW);
  if ((widest * cap) / 100 > maxW) fit = (maxW / widest) * 100;
  // vertical: total height in cap units
  const steps = rowCap.map((c) => c);
  // Gap between one row's baseline and the next row's cap top scales with the two rows' caps;
  // rows set in the lowercase serif get extra room for descenders.
  // Small kicker rows get a floor so they never crowd the big word; lowercase rows get room for ascenders/descenders.
  const lower = rows.map((r) => r.some((w) => !STYLES[styleOf(w)].upper));
  const gapAt = (i: number) => {
    const a = steps[i - 1], b = steps[i];
    const base = (lineStep - 1) * 0.5 * (a + b);
    const floor = Math.min(a, b) < 0.7 ? 0.36 * Math.min(a, b) : 0;
    return Math.max(base, floor) + (lower[i - 1] ? 0.26 * a : 0) + (lower[i] ? 0.14 * b : 0);
  };
  let hUnits = steps[0];
  for (let i = 1; i < rows.length; i++) hUnits += gapAt(i) + steps[i];
  const maxH = p.maxH ?? 820;
  if (hUnits * fit > maxH) fit = maxH / hUnits;
  const X = p.x ?? 960, Y = p.y ?? 540;
  const boxes: (Box & { w0: W; text: string; style: StyleName })[] = [];
  let base = Y - (hUnits * fit) / 2 + steps[0] * fit;
  rows.forEach((r, ri) => {
    if (ri > 0) base += (gapAt(ri) + steps[ri]) * fit;
    const rw = (rowW[ri] * fit) / 100;
    let x = p.align === 'left' ? X : p.align === 'right' ? X - rw : X - rw / 2;
    r.forEach((w, j) => {
      const s = STYLES[styleOf(w)];
      const m = metrics(s);
      const sc = p.scale ? p.scale(w) : 1;
      const size = (fit / m.cap) * sc;
      const ww = (measure(txt(w), s) * size) / 100;
      if (j) x += gap * fit;
      boxes.push({ cx: x + ww / 2, base, w: ww, cap: fit * sc, size, line: ri, w0: w, text: txt(w), style: styleOf(w) });
      x += ww;
    });
  });
  return { boxes, fit };
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$*!?0123456789';

export const heatValue = (local: number, c: HeatCurve = {}) => {
  const pre = c.pre ?? 0, peak = c.peak ?? 1, hold = c.hold ?? 0.72, decay = c.decay ?? 0.45, attack = c.attack ?? 0.05;
  if (local < 0) return pre;
  if (local < attack) return lerp(pre, peak, local / attack);
  return hold + (peak - hold) * Math.exp(-(local - attack) / decay);
};

export const Lyric: React.FC<LyricProps> = (p) => {
  const { boxes } = layout(p);
  const lead = p.lead ?? 0.05;
  const dur = p.dur ?? 0.32;
  const glow = p.glow ?? 1;
  return (
    <AbsoluteFill>
      {boxes.map((b) => {
        const w = b.w0;
        const local = p.t - (w.t - lead);
        const s = STYLES[b.style];
        const m = metrics(s);
        const anim: Anim = typeof p.anim === 'function' ? p.anim(w) : p.anim ?? 'slam';
        let v = heatValue(local, p.curve) * (p.heatMul ?? 1);
        const pr = clamp(local / dur);
        let tr = '';
        let op = 1;
        let blur = 0;
        let text = b.text;
        let weight = s.weight;
        let stretch = s.stretch ? STRETCH_PCT[s.stretch] : 100;
        let year = typeof p.year === 'function' ? p.year(w, local) : p.year ?? 1979;
        const pre = (p.curve?.pre ?? 0) > 0;
        if (local < 0 && !pre && anim !== 'none') op = 0;
        if (local >= 0 || !pre) {
          switch (anim) {
            case 'slam': { const e = easeOutCubic(clamp(local / (dur * 0.6))); tr = `scale(${1.55 - 0.55 * e})`; op *= clamp(local / 0.05); break; }
            case 'punch': { const e = easeOutExpo(clamp(local / dur)); tr = `scale(${1.22 - 0.22 * e})`; blur = (1 - e) * 10; op *= clamp(local / 0.05); break; }
            case 'zoom': { const e = easeOutExpo(clamp(local / dur)); tr = `scale(${3.2 - 2.2 * e})`; blur = (1 - e) * 24; op *= clamp(local / 0.06); break; }
            case 'rise': { const e = easeOutExpo(pr); tr = `translateY(${(1 - e) * b.cap * 0.7}px)`; op *= clamp(local / 0.08); break; }
            case 'drop': { const e = easeOutBack(pr, 2.0); tr = `translateY(${(1 - e) * -b.cap * 1.4}px)`; op *= clamp(local / 0.06); break; }
            case 'left': { const e = easeOutExpo(pr); tr = `translateX(${(1 - e) * -b.cap * 2.2}px)`; op *= clamp(local / 0.08); blur = (1 - e) * 10; break; }
            case 'right': { const e = easeOutExpo(pr); tr = `translateX(${(1 - e) * b.cap * 2.2}px)`; op *= clamp(local / 0.08); blur = (1 - e) * 10; break; }
            case 'pop': { tr = `scale(${Math.max(0, easeOutBack(pr, 2.6))})`; break; }
            case 'blur': { const e = easeOutCubic(pr); blur = (1 - e) * 22; tr = `scale(${1.14 - 0.14 * e})`; op *= e; break; }
            case 'sear': { const e = easeOutCubic(clamp(local / 0.12)); tr = `scale(${1.05 - 0.05 * e})`; v = Math.max(v, local >= 0 ? lerp(1, v, clamp(local / 0.9)) : v); break; }
            case 'scramble': {
              const resolved = Math.floor(clamp(local / (dur * 1.6)) * text.length);
              const f = Math.floor(local * 24);
              text = text.split('').map((ch, ci) => (ci < resolved || ch === ' ' ? ch : GLYPHS[Math.floor(rand(f * 31 + ci * 7 + w.i) * GLYPHS.length)])).join('');
              op *= clamp(local / 0.04);
              break;
            }
            case 'type': { text = text.slice(0, Math.max(0, Math.floor(local / 0.04) + 1)); break; }
            case 'flex': { const e = easeOutBack(pr, 2.2); stretch = lerp(62.5, 125, clamp(e, 0, 1.15)); op *= clamp(local / 0.05); break; }
            case 'stretch': { const e = easeOutBack(pr, 1.8); tr = `scaleX(${lerp(0.2, 1, e)})`; op *= clamp(local / 0.05); break; }
            case 'bold': { const e = easeOutCubic(clamp(local / (dur * 1.8))); weight = Math.round(lerp(200, 900, e)); op *= clamp(local / 0.05); break; }
            case 'melt': { op *= clamp(local / 0.08); blur = (1 - easeOutCubic(clamp(local / 0.3))) * 14; break; }
            case 'none': break;
          }
        }
        const extra = p.fx ? p.fx(w, local, v) : undefined;
        if (extra?.v !== undefined) v = extra.v;
        if (extra?.text !== undefined) text = extra.text;
        if (extra?.transform) tr = `${tr} ${extra.transform}`;
        // baseline position inside a line box of line-height 1
        const topOff = (1 - (m.asc + m.desc)) / 2 + m.asc; // baseline from box top, in em
        const style: CSSProperties = {
          position: 'absolute', left: b.cx, top: b.base - topOff * b.size, transform: `translateX(-50%) ${tr}`, transformOrigin: '50% 60%',
          fontFamily: `"${s.family}"`, fontWeight: weight, fontStyle: s.italic ? 'italic' : 'normal', fontStretch: `${stretch}%`,
          fontSize: b.size, lineHeight: 1, letterSpacing: `${s.tracking}em`, whiteSpace: 'nowrap',
          color: heat(v), textShadow: heatGlow(v * glow, b.size), opacity: op,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          fontVariationSettings: s.family === 'Climate Crisis' ? `'YEAR' ${Math.round(year)}` : undefined,
          ...extra?.style,
        };
        const node = <div key={w.i} style={style}>{text}</div>;
        return p.wrap ? <React.Fragment key={w.i}>{p.wrap(w, node, b)}</React.Fragment> : node;
      })}
    </AbsoluteFill>
  );
};

/** One huge word at a time, punching in on each sung word (for the slam hooks). */
export const Punch: React.FC<{ t: number; words: W[]; style?: StyleName | ((w: W) => StyleName); cap?: number; maxW?: number; lead?: number; curve?: HeatCurve; fx?: LyricProps['fx']; year?: LyricProps['year'] }> = ({ t, words, style = 'cond', cap = 560, maxW = 1700, lead = 0.04, curve, fx, year }) => {
  let idx = -1;
  words.forEach((w, i) => { if (t >= w.t - lead) idx = i; });
  if (idx < 0) return null;
  const w = words[idx];
  return <Lyric t={t} words={[w]} cap={cap} maxW={maxW} maxH={900} style={style} anim="punch" dur={0.22} lead={lead} curve={curve ?? { peak: 1, hold: 0.82, decay: 0.3 }} fx={fx} year={year} />;
};
