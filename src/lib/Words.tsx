import React, { CSSProperties } from 'react';
import { C, F, HEAT_GRADIENT, CHROME_GRADIENT } from '../theme';
import { Cue, clamp, easeOutBack, easeOutCubic, easeOutExpo, rand } from './time';

export type Preset = 'rise' | 'slam' | 'pop' | 'type' | 'flicker' | 'scramble' | 'drift' | 'blur' | 'drop' | 'none';
export type Accent = 'serif' | 'hot' | 'pink' | 'chrome' | 'outline' | 'gold' | 'serifPink';

export const accentStyle = (a: Accent | undefined, size: number): CSSProperties => {
  switch (a) {
    case 'hot':
      return { backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
    case 'chrome':
      return { backgroundImage: CHROME_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
    case 'serif':
      return {
        fontFamily: F.serif, fontStyle: 'italic', fontWeight: 900, textTransform: 'none', letterSpacing: '-0.01em',
        fontSize: size * 0.98, backgroundImage: `linear-gradient(180deg, ${C.cream}, ${C.gold} 55%, ${C.fire})`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.08em',
      };
    case 'serifPink':
      return { fontFamily: F.serif, fontStyle: 'italic', fontWeight: 900, textTransform: 'none', fontSize: size * 0.98, color: C.pink, padding: '0 0.08em' };
    case 'pink':
      return { color: C.pink };
    case 'gold':
      return { color: C.gold };
    case 'outline':
      return { color: 'transparent', WebkitTextStroke: `${Math.max(2, size / 40)}px ${C.cream}` };
    default:
      return {};
  }
};

const clean = (w: string, keepPunct: boolean) => (keepPunct ? w : w.replace(/[,.]+$/, '').replace(/[“”"]/g, ''));
export const key = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '');

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$*!?0123456789';

export type WordsProps = {
  c: Cue;
  t: number;
  preset?: Preset;
  size?: number;
  font?: keyof typeof F;
  lines?: number[];
  accents?: Record<string, Accent>;
  fill?: Accent;
  color?: string;
  upper?: boolean;
  align?: 'center' | 'left' | 'right';
  lineHeight?: number;
  tracking?: string;
  style?: CSSProperties;
  wordStyle?: (i: number, local: number) => CSSProperties;
  keepPunct?: boolean;
  lead?: number;
  glow?: string;
  only?: [number, number];
  dur?: number;
  wrap?: (i: number, node: React.ReactNode) => React.ReactNode;
  shadow?: boolean;
  gap?: number;
};

export const Words: React.FC<WordsProps> = ({
  c, t, preset = 'rise', size = 120, font = 'display', lines, accents = {}, fill, color = C.cream, upper = true,
  align = 'center', lineHeight = 1.0, tracking = '0.005em', style, wordStyle, keepPunct = false, lead = 0.04, glow, only, dur = 0.42, wrap, shadow = true, gap = 0.24,
}) => {
  let words = c.words.map((w, i) => ({ ...w, i }));
  if (only) words = words.slice(only[0], only[1]);
  const counts = lines ?? autoLines(words.map((w) => w.w), font === 'display' ? 22 : 30);
  const rows: (typeof words)[] = [];
  let k = 0;
  for (const n of counts) { rows.push(words.slice(k, k + n)); k += n; }
  if (k < words.length) rows[rows.length - 1].push(...words.slice(k));

  const renderWord = (w: (typeof words)[number]): React.ReactNode => {
            const local = t - (w.t - lead);
            const p = clamp(local / dur);
            const acc = accents[key(w.w)] ?? fill;
            const base: CSSProperties = {
              fontFamily: F[font], fontSize: size, color, textTransform: upper ? 'uppercase' : 'none',
              letterSpacing: tracking, display: 'inline-block', ...accentStyle(acc, size),
              ...(shadow && !acc && !glow ? { textShadow: `0 ${size * 0.05}px ${size * 0.3}px rgba(0,0,0,0.55)` } : {}),
              ...(glow ? { filter: `drop-shadow(0 0 ${size * 0.18}px ${glow})` } : {}),
              ...(wordStyle ? wordStyle(w.i, local) : {}),
            };
            let txt = clean(w.w, keepPunct);
            if (local < 0 && preset !== 'none') {
              return <span key={w.i} style={{ ...base, opacity: 0 }}>{txt}</span>;
            }
            let tr = '';
            let op = 1;
            let filt: string | undefined;
            switch (preset) {
              case 'rise': {
                const e = easeOutExpo(p);
                return (
                  <span key={w.i} style={{ display: 'inline-block', overflow: 'hidden', padding: '0.06em 0.04em 0.12em', margin: '-0.06em -0.04em -0.12em' }}>
                    <span style={{ ...base, transform: `translateY(${(1 - e) * 115}%) rotate(${(1 - e) * 6}deg)`, transformOrigin: 'left bottom' }}>{txt}</span>
                  </span>
                );
              }
              case 'slam': {
                const e = easeOutCubic(clamp(local / (dur * 0.55)));
                tr = `scale(${1.85 - 0.85 * e}) rotate(${(1 - e) * (rand(w.i + c.cue) * 10 - 5)}deg)`;
                op = clamp(local / 0.06);
                break;
              }
              case 'drop': {
                const e = easeOutBack(clamp(local / dur), 2.2);
                tr = `translateY(${(1 - e) * -size * 1.1}px)`;
                op = clamp(local / 0.08);
                break;
              }
              case 'pop':
                tr = `scale(${easeOutBack(p, 2.4)})`;
                break;
              case 'drift':
                tr = `translateX(${(1 - easeOutCubic(p)) * size * 0.5}px)`;
                op = easeOutCubic(p);
                break;
              case 'blur':
                op = easeOutCubic(p);
                filt = `blur(${(1 - easeOutCubic(p)) * 18}px)`;
                tr = `scale(${1.15 - 0.15 * easeOutCubic(p)})`;
                break;
              case 'flicker': {
                const f = Math.floor(local * 30);
                op = p >= 1 ? 1 : rand(f * 7.1 + w.i) > 0.45 + (1 - p) * 0.3 ? 1 : 0.12;
                break;
              }
              case 'type': {
                const n = Math.floor(local / 0.035);
                txt = txt.slice(0, n);
                break;
              }
              case 'scramble': {
                const resolved = Math.floor(clamp(local / (dur * 1.3)) * txt.length);
                const f = Math.floor(local * 24);
                txt = txt.split('').map((ch, ci) => (ci < resolved || ch === ' ' ? ch : GLYPHS[Math.floor(rand(f * 31 + ci * 7 + w.i) * GLYPHS.length)])).join('');
                break;
              }
            }
            return <span key={w.i} style={{ ...base, transform: tr || undefined, opacity: op, filter: filt ?? base.filter }}>{txt}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end', ...style }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: size * gap, lineHeight, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
          {row.map((w) => {
            const node = renderWord(w);
            return wrap ? <React.Fragment key={w.i}>{wrap(w.i, node)}</React.Fragment> : node;
          })}
        </div>
      ))}
    </div>
  );
};

export function autoLines(words: string[], maxChars: number): number[] {
  const total = words.join(' ').length;
  if (total <= maxChars) return [words.length];
  const nLines = Math.ceil(total / maxChars);
  const target = total / nLines;
  const out: number[] = [];
  let cur = 0, n = 0;
  words.forEach((w, i) => {
    if (n > 0 && cur + w.length / 2 > target && out.length < nLines - 1) { out.push(n); cur = 0; n = 0; }
    cur += w.length + 1; n++;
    if (i === words.length - 1) out.push(n);
  });
  return out;
}
