import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';
import { heat } from './thermal';

/** Floor reflection: the content again, flipped about the line y, fading out over `depth` px. */
export const Reflect: React.FC<{ y: number; depth?: number; op?: number; blur?: number; children: React.ReactNode; shake?: number }> = ({ y, depth = 220, op = 0.38, blur = 3, children, shake = 0 }) => (
  <>
    {children}
    <AbsoluteFill style={{ maskImage: `linear-gradient(180deg, transparent ${y}px, #000 ${y + 4}px, transparent ${y + depth}px)`, opacity: op }}>
      <AbsoluteFill style={{ transform: `translateX(${shake}px) scaleY(-1)`, transformOrigin: `50% ${y}px`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  </>
);

/** Glitch: the content cut into horizontal bands that jump sideways, re-cut every two frames. */
export const Slices: React.FC<{ t: number; amt: number; n?: number; seed?: number; maxShift?: number; children: React.ReactNode }> = ({ t, amt, n = 9, seed = 1, maxShift = 140, children }) => {
  if (amt <= 0.02) return <>{children}</>;
  const f = Math.floor(t * 15);
  const cuts = Array.from({ length: n - 1 }, (_, i) => rand(f * 7.1 + i * 3.3 + seed)).sort((a, b) => a - b);
  const edges = [0, ...cuts, 1];
  return (
    <>
      {edges.slice(0, -1).map((a, i) => {
        const b = edges[i + 1];
        const on = rand(f * 1.3 + i * 5.7 + seed) > 0.35 ? 1 : 0.08;
        const dx = (rand(f * 3.7 + i * 1.9 + seed) - 0.5) * 2 * maxShift * amt * on;
        return <AbsoluteFill key={i} style={{ clipPath: `inset(${a * 100}% 0 ${(1 - b) * 100}% 0)`, transform: `translateX(${dx}px)` }}>{children}</AbsoluteFill>;
      })}
    </>
  );
};

/** Shatter cracks radiating from an impact point. p grows them 0..1. */
export const Cracks: React.FC<{ x: number; y: number; p: number; v?: number; seed?: number; n?: number; r?: number; w?: number }> = ({ x, y, p, v = 0.9, seed = 1, n = 11, r = 1100, w = 3 }) => {
  if (p <= 0) return null;
  const rays: string[] = [];
  const branches: string[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + (rand(i * 2.7 + seed) - 0.5) * 0.5;
    const len = r * (0.45 + rand(i * 4.1 + seed) * 0.55) * easeOutExpo(clamp(p * (1.1 - rand(i + seed) * 0.3)));
    let px = x, py = y, a = a0;
    const pts = [`${px},${py}`];
    const segs = 7;
    for (let k = 1; k <= segs; k++) {
      a += (rand(i * 13 + k * 3.1 + seed) - 0.5) * 0.45;
      px += Math.cos(a) * (len / segs);
      py += Math.sin(a) * (len / segs);
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      if (k === 3 || k === 5) {
        const ba = a + (rand(i * 7 + k + seed) > 0.5 ? 1 : -1) * (0.5 + rand(i * 9 + k) * 0.5);
        const bl = (len / segs) * (1.2 + rand(i * 5 + k) * 1.5);
        branches.push(`M ${px.toFixed(1)} ${py.toFixed(1)} l ${(Math.cos(ba) * bl).toFixed(1)} ${(Math.sin(ba) * bl).toFixed(1)}`);
      }
    }
    rays.push(pts.join(' '));
  }
  const ring = (rr: number, k: number) => {
    const pts: string[] = [];
    for (let j = 0; j <= n; j++) {
      const a = (j / n) * Math.PI * 2 + (rand(j * 2.7 + seed) - 0.5) * 0.5;
      const q = rr * (0.85 + rand(j * 3 + k + seed) * 0.3);
      pts.push(`${(x + Math.cos(a) * q).toFixed(1)},${(y + Math.sin(a) * q).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const rp = easeOutCubic(clamp(p * 1.6));
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1920} height={1080}>
      <g fill="none" stroke={heat(v)} strokeLinejoin="round" strokeLinecap="round">
        <g strokeWidth={w * 3.5} opacity={0.25} style={{ filter: 'blur(6px)' }}>{rays.map((d, i) => <polyline key={i} points={d} />)}</g>
        {rays.map((d, i) => <polyline key={i} points={d} strokeWidth={w * (i % 3 ? 1 : 1.5)} />)}
        {branches.map((d, i) => <path key={`b${i}`} d={d} strokeWidth={w * 0.7} opacity={clamp(p * 2 - 0.4)} />)}
        <polyline points={ring(90 * rp, 1)} strokeWidth={w * 0.8} opacity={rp} />
        <polyline points={ring(230 * rp, 2)} strokeWidth={w * 0.6} opacity={rp * 0.7} />
      </g>
      <circle cx={x} cy={y} r={26 * rp} fill={heat(v)} style={{ filter: 'blur(8px)' }} />
    </svg>
  );
};

/** One shoe print as a heat mark (sole + heel). */
export const Footprint: React.FC<{ x: number; y: number; s: number; v: number; rot?: number; left?: boolean }> = ({ x, y, s, v, rot = 0, left }) => (
  <svg style={{ position: 'absolute', left: x - 40 * s, top: y - 70 * s, overflow: 'visible', transform: `rotate(${rot}deg) scaleX(${left ? -1 : 1})` }} width={80 * s} height={140 * s} viewBox="-40 -70 80 140">
    <g style={{ filter: `blur(${2.4}px)` }} fill={heat(v)}>
      <path d="M -4 -64 C 14 -66, 24 -50, 22 -26 C 20 -8, 14 4, 2 6 C -12 8, -20 -4, -21 -22 C -22 -44, -18 -62, -4 -64 Z" />
      <ellipse cx={1} cy={42} rx={16} ry={22} />
    </g>
  </svg>
);

/** A vinyl record seen by the sensor: warm label, cool grooves, a fixed sheen that sells the spin. */
export const Vinyl: React.FC<{ x: number; y: number; r: number; rot: number; v?: number; label?: string }> = ({ x, y, r, rot, v = 1, label = 'TOO HOT TO HANDLE · SIDE A · 154 BPM · ' }) => (
  <svg style={{ position: 'absolute', left: x - r, top: y - r, overflow: 'visible' }} width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`}>
    <defs>
      <path id="vinylLabel" d={`M 0 ${-r * 0.25} a ${r * 0.25} ${r * 0.25} 0 1 1 0 ${r * 0.5} a ${r * 0.25} ${r * 0.25} 0 1 1 0 ${-r * 0.5}`} />
      <linearGradient id="vinylSheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.3" stopColor={heat(0.5, 0)} /><stop offset="0.48" stopColor={heat(0.5, 0.32)} /><stop offset="0.52" stopColor={heat(0.5, 0.32)} /><stop offset="0.7" stopColor={heat(0.5, 0)} />
      </linearGradient>
    </defs>
    <circle r={r} fill={heat(0.1 * v)} />
    {Array.from({ length: 34 }).map((_, i) => {
      const rr = r * (0.36 + (i / 34) * 0.62);
      return <circle key={i} r={rr} fill="none" stroke={heat((0.16 + 0.1 * rand(i * 3.3)) * v)} strokeWidth={r * 0.006 + rand(i) * r * 0.006} />;
    })}
    <circle r={r} fill="url(#vinylSheen)" />
    <g transform={`rotate(${rot})`}>
      <circle r={r * 0.33} fill={heat(0.62 * v)} />
      <circle r={r * 0.33} fill="none" stroke={heat(0.8 * v)} strokeWidth={r * 0.012} />
      <text fontFamily="JetBrains Mono" fontWeight={700} fontSize={r * 0.052} letterSpacing={r * 0.009} fill={heat(0.18 * v)}>
        <textPath href="#vinylLabel">{label}{label}</textPath>
      </text>
      <rect x={-r * 0.06} y={-r * 0.2} width={r * 0.12} height={r * 0.03} fill={heat(0.3 * v)} />
      <circle r={r * 0.03} fill={heat(0.04)} />
    </g>
  </svg>
);

/** Rubber stamp frame (double rule), drawn in heat. */
export const StampBox: React.FC<{ x: number; y: number; w: number; h: number; v: number; rot?: number; scale?: number; op?: number }> = ({ x, y, w, h, v, rot = -6, scale = 1, op = 1 }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${scale})`, opacity: op }}>
    <div style={{ position: 'absolute', inset: 0, border: `10px solid ${heat(v)}`, borderRadius: 18, boxShadow: `0 0 30px ${heat(v, 0.4)}` }} />
    <div style={{ position: 'absolute', inset: 20, border: `4px solid ${heat(v * 0.9)}`, borderRadius: 8 }} />
  </div>
);

/** Rising line chart; returns the head position too so labels can ride it. */
export const trendPoint = (p: number) => {
  const x = lerp(140, 2000, p);
  const y = 960 - Math.pow(p, 1.9) * 1080 + Math.sin(p * 21) * 26 * (1 - p) + Math.sin(p * 9.3) * 18;
  return { x, y };
};
export const TrendLine: React.FC<{ p: number; v?: number }> = ({ p, v = 0.95 }) => {
  if (p <= 0) return null;
  const N = 90;
  const pts = Array.from({ length: N + 1 }, (_, i) => trendPoint((i / N) * p));
  const d = pts.map((q, i) => `${i ? 'L' : 'M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ');
  const head = pts[pts.length - 1];
  const area = `${d} L ${head.x.toFixed(1)} 1100 L 140 1100 Z`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1920} height={1080}>
      <defs>
        <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={heat(0.45)} /><stop offset="1" stopColor={heat(0.45, 0)} /></linearGradient>
      </defs>
      <path d={area} fill="url(#trendArea)" opacity={0.5} />
      <path d={d} fill="none" stroke={heat(v)} strokeWidth={22} opacity={0.3} style={{ filter: 'blur(10px)' }} />
      <path d={d} fill="none" stroke={heat(v)} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={head.x} cy={head.y} r={18} fill={heat(1)} style={{ filter: 'blur(2px)' }} />
      <circle cx={head.x} cy={head.y} r={46} fill={heat(1, 0.35)} style={{ filter: 'blur(14px)' }} />
    </svg>
  );
};

/** Faint chart grid. */
export const ChartGrid: React.FC<{ v?: number; op?: number }> = ({ v = 0.14, op = 1 }) => (
  <AbsoluteFill style={{ opacity: op }}>
    {Array.from({ length: 9 }).map((_, i) => <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: 120 + i * 105, height: 2, background: heat(v) }} />)}
    {Array.from({ length: 13 }).map((_, i) => <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: 120 + i * 140, width: 2, background: heat(v * 0.8) }} />)}
  </AbsoluteFill>
);

/** Diagonal hazard stripes in a band. */
export const Hazard: React.FC<{ y: number; h: number; t: number; v?: number; rot?: number; speed?: number; op?: number; children?: React.ReactNode }> = ({ y, h, t, v = 0.85, rot = -5, speed = 160, op = 1, children }) => (
  <div style={{ position: 'absolute', left: -200, width: 2320, top: y - h / 2, height: h, transform: `rotate(${rot}deg)`, opacity: op, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(-45deg, ${heat(v)} 0 46px, ${heat(0.04)} 46px 92px)`, backgroundPosition: `${(t * speed) % 130}px 0` }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: h * 0.14, bottom: h * 0.14, background: heat(0.03) }} />
    {children}
  </div>
);

/** Clone a word node with a transform/opacity tweak (for echo trails). */
export const echoOf = (node: React.ReactNode, k: number, dx: number, op: number, extra?: React.CSSProperties) => {
  if (!React.isValidElement(node)) return null;
  const el = node as React.ReactElement<{ style: React.CSSProperties }>;
  const st = el.props.style ?? {};
  return React.cloneElement(el, { key: `echo${k}`, style: { ...st, transform: `${st.transform ?? ''} translateX(${dx}px)`, opacity: (typeof st.opacity === 'number' ? st.opacity : 1) * op, textShadow: 'none', ...extra } } as any);
};
