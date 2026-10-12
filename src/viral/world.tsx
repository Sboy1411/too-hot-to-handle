import React, { useEffect, useRef } from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';
import { heat } from './thermal';

// ── value noise (deterministic) ──
const perm = new Uint8Array(512);
{
  let s = 4242;
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const g = (h: number) => (h / 255) * 2 - 1;
const fade = (t: number) => t * t * (3 - 2 * t);
export function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const X = xi & 255, Y = yi & 255;
  const a = g(perm[perm[X] + Y]), b = g(perm[perm[X + 1] + Y]);
  const c = g(perm[perm[X] + Y + 1]), d = g(perm[perm[X + 1] + Y + 1]);
  const u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const FW = 160, FH = 90;
/** The room as the sensor sees it: soft, slowly drifting temperature variation plus rising warm air. */
export const HeatField: React.FC<{ t: number; amb: number; rise?: number; spots?: { x: number; y: number; r: number; v: number }[] }> = ({ t, amb, rise = 0, spots = [] }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext('2d')!;
    const img = c.createImageData(FW, FH);
    for (let y = 0; y < FH; y++) {
      const fy = y / FH;
      for (let x = 0; x < FW; x++) {
        const fx = x / FW;
        // big slow masses (walls, warm corners), mid drift, fine turbulence
        const n = vnoise(fx * 1.5 + 7.3 + t * 0.025, fy * 1.1 - t * 0.018) * 0.55 + vnoise(fx * 3.4 + t * 0.05, fy * 2.4 - t * 0.03) * 0.3 + vnoise(fx * 8 - t * 0.04, fy * 7 + t * 0.07) * 0.15;
        let v = amb * (0.62 + 1.05 * n) + amb * 0.75 * fy * fy; // floors run warmer
        if (rise > 0) v += rise * Math.max(0, vnoise(fx * 9, fy * 3 + t * 1.6) * 0.5 + 0.15) * (0.4 + fy * 0.8);
        for (const s of spots) {
          const d = Math.hypot((fx * 1920 - s.x) / s.r, (fy * 1080 - s.y) / s.r);
          if (d < 1) v += s.v * (1 - d * d) * (1 - d * d);
        }
        const q = Math.max(0, Math.min(255, v * 255));
        const o = (y * FW + x) * 4;
        img.data[o] = q; img.data[o + 1] = q; img.data[o + 2] = q; img.data[o + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
  }, [t, amb, rise, spots]);
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={FW} height={FH} style={{ width: '100%', height: '100%', filter: 'blur(10px)', transform: 'scale(1.04)' }} />
    </AbsoluteFill>
  );
};

/** Sensor noise: fine speckle, a fresh pattern every frame. */
export const HeatGrain: React.FC<{ frame: number; amt?: number }> = ({ frame, amt = 0.07 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext('2d')!;
    const img = c.createImageData(cv.width, cv.height);
    let s = (frame * 2654435761) >>> 0 || 1;
    for (let i = 0; i < img.data.length; i += 4) {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      const v = (s & 255) >> 1;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  }, [frame]);
  return (
    <AbsoluteFill style={{ opacity: amt, pointerEvents: 'none' }}>
      <canvas ref={ref} width={640} height={360} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};

/** Lens falloff: the sensor reads the frame edges slightly cooler. */
export const HeatVignette: React.FC<{ amt?: number }> = ({ amt = 0.5 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 72% 68% at 50% 50%, transparent 50%, rgba(0,0,0,${amt}) 100%)` }} />
);

/** Soft radial heat source. */
export const Blob: React.FC<{ x: number; y: number; r: number; v: number; sx?: number; sy?: number }> = ({ x, y, r, v, sx = 1, sy = 1 }) => (
  <div style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${heat(v)} 0%, ${heat(v, 0.5)} 35%, ${heat(v, 0)} 70%)`, transform: `scale(${sx}, ${sy})`, mixBlendMode: 'lighten' }} />
);

/** A flame as a thermal camera sees it: white-hot core, layered hot tongues, diffuse plume. Pure function of t. */
export const HeatFlame: React.FC<{ t: number; x: number; y: number; h: number; seed?: number; lean?: number; v?: number }> = ({ t, x, y, h, seed = 0, lean = 0, v = 1 }) => {
  const n = (f: number, k: number) => Math.sin(t * f + seed * 1.7 + k) * 0.6 + Math.sin(t * f * 2.3 + k * 3.1 + seed) * 0.4;
  const sway = (n(3.1, 1) * 0.05 + lean) * h;
  const w = h * 0.36 * (1 + n(4.4, 2) * 0.05);
  const tip = h * (1 + n(5.7, 3) * 0.06);
  const body = (sc: number, top: number) => {
    const ww = w * sc, hh = tip * top;
    return `M ${sway * top} ${-hh} C ${ww * 0.35 + sway * 0.6} ${-hh * 0.62}, ${ww} ${-hh * 0.34}, ${ww * 0.62} ${-hh * 0.06} Q 0 ${hh * 0.06}, ${-ww * 0.62} ${-hh * 0.06} C ${-ww} ${-hh * 0.34}, ${-ww * 0.35 + sway * 0.6} ${-hh * 0.62}, ${sway * top} ${-hh} Z`;
  };
  const id = `hf${seed}`;
  return (
    <svg style={{ position: 'absolute', left: x - h, top: y - h * 1.6, overflow: 'visible', mixBlendMode: 'lighten' }} width={h * 2} height={h * 1.8} viewBox={`${-h} ${-h * 1.6} ${h * 2} ${h * 1.8}`}>
      <defs>
        <filter id={`${id}b`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={h * 0.05} /></filter>
        <filter id={`${id}p`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={h * 0.18} /></filter>
      </defs>
      <ellipse cx={sway * 0.5} cy={-h * 0.75} rx={w * 1.5} ry={h * 0.95} fill={heat(0.55 * v)} filter={`url(#${id}p)`} />
      <path d={body(1.15, 1.12)} fill={heat(0.68 * v)} filter={`url(#${id}b)`} />
      <path d={body(0.85, 0.9)} fill={heat(0.86 * v)} filter={`url(#${id}b)`} />
      <path d={body(0.48, 0.62)} fill={heat(1 * v)} filter={`url(#${id}b)`} />
    </svg>
  );
};

/** Hot sparks bursting from a point; deterministic, frozen with t. */
export const Sparks: React.FC<{ t: number; at: number; x: number; y: number; n?: number; r?: number; v?: number; seed?: number; gravity?: number; dur?: number }> = ({ t, at, x, y, n = 40, r = 520, v = 1, seed = 1, gravity = 260, dur = 1.4 }) => {
  const local = t - at;
  if (local < 0 || local > dur) return null;
  const p = local / dur;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const a = rand(i * 3.3 + seed) * Math.PI * 2;
        const sp = 0.35 + rand(i * 1.7 + seed) * 0.65;
        const d = easeOutExpo(clamp(local / (0.9 * dur))) * r * sp;
        const px = x + Math.cos(a) * d;
        const py = y + Math.sin(a) * d + gravity * local * local;
        const s = (4 + rand(i * 9 + seed) * 10) * (1 - p * 0.6);
        return <div key={i} style={{ position: 'absolute', left: px - s, top: py - s, width: s * 2, height: s * 2, borderRadius: '50%', background: heat(v * (1 - p * 0.5)), boxShadow: `0 0 ${s * 3}px ${heat(1, 0.6 * (1 - p))}`, opacity: 1 - p * p }} />;
      })}
    </>
  );
};

export const HEART_PATH = 'M 0 34 C -10 24, -62 -6, -50 -36 C -40 -60, -8 -56, 0 -30 C 8 -56, 40 -60, 50 -36 C 62 -6, 10 24, 0 34 Z';
/** Heart as a heat source: warm body, hotter core; beats. */
export const HeatHeart: React.FC<{ x: number; y: number; size: number; v: number; beat?: number; id?: string }> = ({ x, y, size, v, beat = 0, id = 'hh' }) => (
  <svg style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible' }} width={size} height={size} viewBox="-80 -80 160 160">
    <defs>
      <radialGradient id={`${id}g`} cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor={heat(v)} /><stop offset="0.6" stopColor={heat(v * 0.72)} /><stop offset="1" stopColor={heat(v * 0.45)} /></radialGradient>
      <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      <filter id={`${id}h`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="16" /></filter>
    </defs>
    <g transform={`scale(${1 + beat * 0.08})`}>
      <path d={HEART_PATH} fill={heat(v * 0.6)} filter={`url(#${id}h)`} transform="scale(1.25)" />
      <path d={HEART_PATH} fill={`url(#${id}g)`} filter={`url(#${id}b)`} />
    </g>
  </svg>
);

const LIP_TOP = 'M10 60 C 40 20, 70 18, 100 38 C 130 18, 160 20, 190 60 C 150 58, 120 56, 100 62 C 80 56, 50 58, 10 60 Z';
const LIP_BOT = 'M10 62 C 50 64, 80 62, 100 66 C 120 62, 150 64, 190 62 C 160 110, 40 110, 10 62 Z';
/** A kiss pressed on cold glass leaves a heat print that slowly cools. */
export const KissPrint: React.FC<{ x: number; y: number; w: number; v: number; rot?: number }> = ({ x, y, w, v, rot = -12 }) => (
  <svg style={{ position: 'absolute', left: x - w / 2, top: y - w * 0.3, overflow: 'visible', transform: `rotate(${rot}deg)` }} width={w} height={w * 0.6} viewBox="0 0 200 120">
    <defs>
      <filter id="kpb" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" /></filter>
      <filter id="kph" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="12" /></filter>
    </defs>
    <g filter="url(#kph)" opacity={0.9}><path d={LIP_TOP} fill={heat(v * 0.7)} /><path d={LIP_BOT} fill={heat(v * 0.7)} /></g>
    <g filter="url(#kpb)"><path d={LIP_TOP} fill={heat(v)} /><path d={LIP_BOT} fill={heat(v * 0.95)} /></g>
    {Array.from({ length: 16 }).map((_, i) => (
      <path key={i} d={`M${22 + i * 10.5} ${i % 2 ? 74 : 46} l ${(i % 3) - 1} 13`} stroke={heat(v * 0.55)} strokeWidth={2.2} />
    ))}
  </svg>
);

/** A concert crowd in thermal: rows of heads and shoulders bouncing on the beat, phones held up. */
export const Crowd: React.FC<{ t: number; beat: number; y?: number; rows?: number; v?: number; phones?: number; seed?: number; jump?: number }> = ({ t, beat, y = 1080, rows = 3, v = 0.62, phones = 0.3, seed = 1, jump = 1 }) => {
  const out: React.ReactNode[] = [];
  for (let r = rows - 1; r >= 0; r--) {
    const n = 11 + r * 3;
    const sc = 1 - r * 0.22;
    const baseY = y - r * 120 * sc - 20;
    for (let i = 0; i < n; i++) {
      const sd = seed * 100 + r * 31 + i;
      const x = (i + 0.5 + (rand(sd) - 0.5) * 0.7) * (1920 / n);
      const ph = rand(sd * 3.1);
      const bounce = Math.max(0, Math.sin((beat + ph * 0.5) * Math.PI)) * 34 * sc * jump;
      const hv = v * (0.82 + rand(sd * 7) * 0.25) * (1 - r * 0.18);
      const hw = 64 * sc, hh = 78 * sc;
      const top = baseY - 230 * sc - bounce;
      out.push(
        <div key={`${r}-${i}`} style={{ position: 'absolute', left: x - 120 * sc, top, width: 240 * sc, height: 360 * sc, filter: `blur(${5 + r * 2}px)` }}>
          <div style={{ position: 'absolute', left: 120 * sc - hw / 2, top: 0, width: hw, height: hh, borderRadius: '45% 45% 42% 42%', background: `radial-gradient(ellipse at 50% 45%, ${heat(hv)}, ${heat(hv * 0.78)} 70%)` }} />
          <div style={{ position: 'absolute', left: 0, top: hh * 0.92, width: 240 * sc, height: 300 * sc, borderRadius: '48% 48% 8% 8%', background: `radial-gradient(ellipse at 50% 15%, ${heat(hv * 0.85)}, ${heat(hv * 0.55)} 75%)` }} />
          {rand(sd * 13) < phones && (
            <div style={{ position: 'absolute', left: (rand(sd * 5) > 0.5 ? 175 : 25) * sc, top: -40 * sc - bounce * 0.3, width: 34 * sc, height: 62 * sc, borderRadius: 6 * sc, background: heat(Math.min(1, hv + 0.3)), boxShadow: `0 0 ${20 * sc}px ${heat(1, 0.5)}` }} />
          )}
        </div>,
      );
    }
  }
  return <>{out}</>;
};

/** Infinite horizontal marquee rows (for the drop). */
export const MarqueeRows: React.FC<{ t: number; text: string; rows: number; size: number; speed?: number; v?: number; family?: string; year?: number }> = ({ t, text, rows, size, speed = 320, v = 0.5, family = '"Climate Crisis"', year = 1979 }) => (
  <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: 'rotate(-7deg) scale(1.3)' }}>
    {Array.from({ length: rows }).map((_, r) => {
      const dir = r % 2 ? 1 : -1;
      const off = ((t * speed * dir) % 2400) - 1200;
      return (
        <div key={r} style={{ whiteSpace: 'nowrap', fontFamily: family, fontSize: size, lineHeight: 1.0, transform: `translateX(${off - 600}px)`, color: heat(v * (r % 2 ? 0.75 : 1)), fontVariationSettings: `'YEAR' ${year}` }}>
          {Array.from({ length: 10 }).map(() => text).join('   ')}
        </div>
      );
    })}
  </AbsoluteFill>
);

/** Heat-shimmer streaks rising (hot air). */
export const Shimmer: React.FC<{ t: number; amt: number; seed?: number }> = ({ t, amt, seed = 0 }) => {
  if (amt <= 0.01) return null;
  return (
    <>
      {Array.from({ length: 14 }).map((_, i) => {
        const x = rand(i * 2.1 + seed) * 1920;
        const life = 2.2 + rand(i * 5.1 + seed) * 1.6;
        const ph = ((t + rand(i * 3.3) * life) % life) / life;
        const y = 1180 - ph * 1400;
        const w = 80 + rand(i * 7.7) * 160;
        return <div key={i} style={{ position: 'absolute', left: x - w / 2, top: y, width: w, height: 420, borderRadius: '50%', background: `radial-gradient(ellipse, ${heat(amt * 0.5)}, ${heat(amt * 0.5, 0)} 70%)`, filter: 'blur(18px)', opacity: Math.sin(ph * Math.PI) }} />;
      })}
    </>
  );
};

export const Ring: React.FC<{ x: number; y: number; r: number; v: number; w?: number; p?: number; dash?: string; rot?: number; blur?: number }> = ({ x, y, r, v, w = 6, p = 1, dash, rot = -90, blur = 2 }) => (
  <svg style={{ position: 'absolute', left: x - r - 20, top: y - r - 20, overflow: 'visible', filter: blur ? `blur(${blur}px)` : undefined, mixBlendMode: 'lighten' }} width={r * 2 + 40} height={r * 2 + 40} viewBox={`${-r - 20} ${-r - 20} ${r * 2 + 40} ${r * 2 + 40}`}>
    <circle r={r} fill="none" stroke={heat(v)} strokeWidth={w} pathLength={1} strokeDasharray={dash ?? `${p} 1`} transform={`rotate(${rot})`} strokeLinecap="round" />
  </svg>
);

export const lerpPt = (a: number, b: number, p: number) => lerp(a, b, easeOutCubic(clamp(p)));

/**
 * A person as the sensor sees them, front on: hot face and hands, warm neck and chest, cooler hair, clothes and shoes.
 * Feet at (x, y), height h. `phase` advances one per step; `walk` scales the gait (0 = standing).
 */
export const Figure: React.FC<{ x: number; y: number; h: number; v?: number; phase?: number; walk?: number; id?: string; blur?: number }> = ({ x, y, h, v = 1, phase = 0, walk = 1, id = 'fig', blur = 3.5 }) => {
  const s = Math.sin(phase * Math.PI) * walk; // +1 left leg forward, -1 right leg forward (one step per phase unit)
  const bob = (1 - Math.abs(s)) * 1.3 * walk;
  const sway = s * 1.1;
  const k = h / 100;
  const arm = (side: 1 | -1) => {
    const sw = -side * s; // arms swing opposite to legs
    const hx = side * (14.2 - 1.6 * Math.abs(sw)), hy = -45 + 3.4 * Math.max(0, sw) - 1.2 * Math.max(0, -sw);
    return { d: `M ${side * 11.4} -79 Q ${side * 15.2} -64, ${hx} ${hy}`, hx, hy };
  };
  const leg = (side: 1 | -1) => {
    const fwd = side * s; // >0 this leg comes toward camera: foot lower, longer
    const fy = 2.6 * Math.max(0, fwd) - 4.2 * Math.max(0, -fwd);
    const knee = -24 + 2 * Math.max(0, -fwd);
    return { d: `M ${side * 5.2} -47 Q ${side * 5.9} ${knee}, ${side * 5.6} ${fy - 3}`, fx: side * 5.6, fy };
  };
  const L = leg(1), R = leg(-1), aL = arm(1), aR = arm(-1);
  const torso = 'M -11.6 -81 C -12.6 -70, -10.2 -60, -8.6 -51 L -9.8 -45 L 9.8 -45 L 8.6 -51 C 10.2 -60, 12.6 -70, 11.6 -81 C 6 -83.4, -6 -83.4, -11.6 -81 Z';
  return (
    <svg style={{ position: 'absolute', left: x - h * 0.4, top: y - h * 1.08, overflow: 'visible' }} width={h * 0.8} height={h * 1.12} viewBox={`-40 -108 80 112`}>
      <defs>
        <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={blur / k} /></filter>
        <filter id={`${id}h`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={7} /></filter>
        <radialGradient id={`${id}c`} cx="0.5" cy="0.18" r="0.75"><stop offset="0" stopColor={heat(v * 0.9)} /><stop offset="0.55" stopColor={heat(v * 0.72)} /><stop offset="1" stopColor={heat(v * 0.6)} /></radialGradient>
        <radialGradient id={`${id}f`} cx="0.5" cy="0.55" r="0.6"><stop offset="0" stopColor={heat(v)} /><stop offset="1" stopColor={heat(v * 0.86)} /></radialGradient>
      </defs>
      <g transform={`translate(${sway} ${-bob})`}>
        {/* warm air around the body */}
        <g filter={`url(#${id}h)`} opacity={0.55}>
          <ellipse cx={0} cy={-62} rx={17} ry={34} fill={heat(v * 0.5)} />
          <ellipse cx={0} cy={-93} rx={8} ry={10} fill={heat(v * 0.6)} />
        </g>
        <g filter={`url(#${id}b)`}>
          {[L, R].map((g, i) => <path key={i} d={g.d} stroke={heat(v * 0.58)} strokeWidth={6.6} strokeLinecap="round" fill="none" />)}
          {[L, R].map((g, i) => <ellipse key={`f${i}`} cx={g.fx} cy={g.fy - 1} rx={3.9} ry={2.2} fill={heat(v * 0.42)} />)}
          {[aL, aR].map((a, i) => <path key={`a${i}`} d={a.d} stroke={heat(v * 0.66)} strokeWidth={4.6} strokeLinecap="round" fill="none" />)}
          {[aL, aR].map((a, i) => <ellipse key={`h${i}`} cx={a.hx} cy={a.hy + 1.6} rx={2.2} ry={3} fill={heat(v * 0.95)} />)}
          <path d={torso} fill={`url(#${id}c)`} />
          <rect x={-2.6} y={-87} width={5.2} height={7} fill={heat(v * 0.92)} />
          <ellipse cx={0} cy={-92.5} rx={5.6} ry={7.2} fill={`url(#${id}f)`} />
          <path d="M -5.7 -93.5 C -6.2 -101, -3 -100.6, 0 -100.4 C 3 -100.6, 6.2 -101, 5.7 -93.5 C 4.6 -97.4, -4.6 -97.4, -5.7 -93.5 Z" fill={heat(v * 0.62)} />
        </g>
      </g>
    </svg>
  );
};
