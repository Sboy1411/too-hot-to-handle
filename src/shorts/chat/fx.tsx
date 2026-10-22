import React, { useEffect, useRef } from 'react';
import { AbsoluteFill } from 'remotion';
import { C, F, HEAT_GRADIENT } from '../../theme';
import { VF } from '../../viral/fonts';
import { CUES, clamp, easeInCubic, easeOutBack, easeOutCubic, lerp, rand } from '../../lib/time';
import { END, M, TAIL } from './script';

/**
 * SVG filters for the phone layer. haze: rising heat shimmer (a stitched noise tile, tiled and scrolled up so it loops
 * seamlessly). melt: per-column downward displacement from stretched noise, so the screen drips off the frame.
 */
export const Filters: React.FC<{ t: number; haze: number; melt: number }> = ({ t, haze, melt }) => {
  const TILE = 480;
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }}>
      <defs>
        <filter id="haze" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={-20} y={-20} width={1120} height={1960 + TILE} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.013" numOctaves={2} seed={4} stitchTiles="stitch" x={0} y={0} width={1080} height={TILE} result="tile" />
          <feTile in="tile" result="field" />
          <feOffset in="field" dy={-((t * 150) % TILE)} result="move" />
          <feDisplacementMap in="SourceGraphic" in2="move" scale={haze} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="melt" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0105 0.0007" numOctaves={2} seed={11} result="n" />
          <feComponentTransfer in="n" result="d">
            <feFuncR type="linear" slope={0} intercept={0.5} />
            <feFuncG type="linear" slope={-0.5} intercept={0.38} />
            <feFuncA type="linear" slope={0} intercept={1} />
          </feComponentTransfer>
          <feDisplacementMap in="SourceGraphic" in2="d" scale={melt} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
};

/** Warm grade + burning edges while the phone heats. */
export const HeatGrade: React.FC<{ h: number }> = ({ h }) =>
  h <= 0.01 ? null : (
    <>
      <AbsoluteFill style={{ background: `rgba(255,96,24,${0.22 * h})`, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 75% at 50% 42%, transparent 48%, rgba(255,60,10,${0.6 * h}) 100%)`, mixBlendMode: 'screen', pointerEvents: 'none' }} />
    </>
  );

// value noise (same construction as layers/FireField)
const perm = new Uint8Array(512);
{
  let s = 2024;
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const fade = (t: number) => t * t * (3 - 2 * t);
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const X = xi & 255, Y = yi & 255;
  const g = (h: number) => (h / 255) * 2 - 1;
  const a = g(perm[perm[X] + Y]), b = g(perm[perm[X + 1] + Y]), c = g(perm[perm[X] + Y + 1]), d = g(perm[perm[X + 1] + Y + 1]);
  const u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const LAVA: [number, number, number, number][] = [[0, 14, 1, 2], [0.38, 70, 6, 4], [0.6, 168, 26, 8], [0.78, 255, 86, 16], [0.9, 255, 176, 58], [1, 255, 242, 204]];
const lavaRGB = (v: number) => {
  for (let i = 1; i < LAVA.length; i++) {
    if (v <= LAVA[i][0]) {
      const [p0, r0, g0, b0] = LAVA[i - 1], [p1, r1, g1, b1] = LAVA[i];
      const k = (v - p0) / (p1 - p0);
      return [r0 + (r1 - r0) * k, g0 + (g1 - g0) * k, b0 + (b1 - b0) * k];
    }
  }
  return LAVA[LAVA.length - 1].slice(1);
};

/** Full-frame molten surface: dark crust with bright veins that flow upward (pure function of t). */
export const Lava: React.FC<{ t: number; op?: number }> = ({ t, op = 1 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const LW = 108, LH = 192;
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(LW, LH);
    for (let y = 0; y < LH; y++) {
      for (let x = 0; x < LW; x++) {
        const nx = x / 16, ny = y / 16;
        const w = vnoise(nx * 0.7 + t * 0.25, ny * 0.7 + t * 0.9);
        const n = vnoise(nx + w * 1.6, ny + t * 1.4 + w) * 0.65 + vnoise(nx * 2.2 - t * 0.6, ny * 2.2 + t * 2) * 0.35;
        const vein = 1 - Math.min(1, Math.abs(n) * 3.4);
        const v = clamp(0.3 + 0.7 * vein * vein - (y / LH) * 0.12 + 0.06 * Math.sin(t * 9 + x * 0.3));
        const c = lavaRGB(v);
        const o = (y * LW + x) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [t]);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <canvas ref={ref} width={LW} height={LH} style={{ width: '100%', height: '100%', filter: 'blur(5px) saturate(1.15)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 46%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.7) 100%)' }} />
    </AbsoluteFill>
  );
};

/** Rising sparks over the portrait frame; analytic in t like layers/Embers. */
export const Sparks: React.FC<{ t: number; n?: number; op?: number }> = ({ t, n = 90, op = 1 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, 1080, 1920);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const life = 1.4 + rand(i * 3.1) * 1.6;
      const age = ((t + rand(i * 7.7) * life) % life) / life;
      const x = rand(i * 1.3) * 1080 + Math.sin(t * (1 + rand(i)) + i) * 30 + age * (rand(i * 9) - 0.5) * 240;
      const y = 2000 - age * (1600 + rand(i * 5) * 700);
      const r = (2 + rand(i * 2.2) * 4) * (1 - age * 0.6);
      const a = Math.sin(age * Math.PI) * (0.5 + rand(i * 4) * 0.5);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      g.addColorStop(0, `rgba(255,${200 + Math.round(rand(i) * 50)},140,${a})`);
      g.addColorStop(0.3, `rgba(255,110,30,${a * 0.5})`);
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [t, n]);
  return <AbsoluteFill style={{ opacity: op, pointerEvents: 'none' }}><canvas ref={ref} width={1080} height={1920} style={{ width: '100%', height: '100%' }} /></AbsoluteFill>;
};

let mctx: CanvasRenderingContext2D | null = null;
const measure = (s: string) => {
  mctx ??= document.createElement('canvas').getContext('2d')!;
  mctx.font = '100px "Climate Crisis"';
  return mctx.measureText(s).width;
};
const clean = (w: string) => w.replace(/[,.]+$/, '').replace(/’/g, "'").toUpperCase();
const TITLE: { idx: number[]; w: number }[] = [{ idx: [0, 1], w: 0 }, { idx: [2, 3], w: 980 }, { idx: [4], w: 0 }, { idx: [5], w: 980 }];

/** "Ni I'm too hot to handle" (cue 28) slammed word by word in the melting face, melting further as the line rings out. */
export const TitleSlam: React.FC<{ t: number }> = ({ t }) => {
  const ws = CUES[27].words;
  const big = Math.min(...TITLE.filter((l) => l.w).map((l) => (l.w / measure(l.idx.map((i) => clean(ws[i].w)).join(' '))) * 100));
  const small = big * 0.56;
  const out = clamp((t - (M.reboot - 0.12)) / 0.14);
  let y = 0;
  const rows = TITLE.map((l) => {
    const size = l.w ? big : small;
    const row = { ...l, size, y };
    y += size * 0.9 + 16;
    return row;
  });
  const top = 900 - y / 2;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: 'drop-shadow(0 0 26px rgba(255,120,30,0.75)) drop-shadow(0 12px 18px rgba(40,0,0,0.8))' }}>
      {rows.map((r, li) => (
        <div key={li} style={{ position: 'absolute', left: 0, right: 0, top: top + r.y, height: r.size, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: VF.melt, fontSize: r.size, lineHeight: 1 }}>
          {r.idx.map((i, k) => {
            const w = ws[i];
            const local = t - (w.t - 0.04);
            if (local < 0) return <span key={i} style={{ display: 'inline-block', opacity: 0, marginLeft: k ? r.size * 0.28 : 0 }}>{clean(w.w)}</span>;
            const s = easeOutCubic(clamp(local / 0.14));
            const year = 1979 + 66 * Math.pow(clamp((t - (w.t + 0.25)) / 1.9), 1.5);
            return (
              <span key={i} style={{ display: 'inline-block', marginLeft: k ? r.size * 0.28 : 0, transform: `scale(${lerp(1.75, 1, s)})`, opacity: clamp(local / 0.05), filter: s < 1 ? `blur(${(1 - s) * 12}px)` : undefined, fontVariationSettings: `'YEAR' ${Math.round(year)}`, backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {clean(w.w)}
              </span>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** "Eyes on me": a swarm of 👀 reactions floating up the chat. */
export const EyesFlood: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.eyes || t > M.eyes + 3.4) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', fontFamily: F.sans }}>
      {Array.from({ length: 34 }).map((_, i) => {
        const born = M.eyes + rand(i * 2.3) * 1.5;
        const life = 1.3 + rand(i * 4.1) * 0.7;
        const a = (t - born) / life;
        if (a < 0 || a > 1) return null;
        // live-reaction style: they rise up the right edge, clear of the line being sung
        const x = 600 + rand(i * 3.7) * 410 + Math.sin(a * 6 + i) * 40;
        const y = 860 - easeOutCubic(a) * (440 + rand(i * 5.1) * 300);
        const s = (0.7 + rand(i * 6.3) * 0.8) * easeOutBack(clamp(a * 5), 2);
        return <div key={i} style={{ position: 'absolute', left: x, top: y, fontSize: 84, transform: `translate(-50%,-50%) scale(${s}) rotate(${(rand(i) - 0.5) * 30}deg)`, opacity: Math.min(1, (1 - a) * 3) }}>👀</div>;
      })}
    </AbsoluteFill>
  );
};

const HEART = 'M 50 88 C 22 68, 3 50, 3 29 C 3 13, 15 3, 29 3 C 39 3, 46 9, 50 17 C 54 9, 61 3, 71 3 C 85 3, 97 13, 97 29 C 97 50, 78 68, 50 88 Z';
const Heart: React.FC<{ size: number; id: string }> = ({ size, id }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 100 90" style={{ overflow: 'visible' }}>
    <defs>
      <radialGradient id={id} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#FF8FB0" /><stop offset="0.45" stopColor="#FF2E6E" /><stop offset="1" stopColor="#B3001F" /></radialGradient>
    </defs>
    <path d={HEART} fill={`url(#${id})`} />
    <ellipse cx={30} cy={24} rx={12} ry={7} fill="#fff" opacity={0.55} transform="rotate(-30 30 24)" />
  </svg>
);

/** "Heart went pop": the ❤️ reaction inflates off its chip to fill the screen and bursts on "pop". */
export const HeartPop: React.FC<{ t: number }> = ({ t }) => {
  const t0 = M.heart + 0.14;
  if (t < t0 || t > M.pop + 0.7) return null;
  if (t < M.pop) {
    const p = easeInCubic(clamp((t - t0) / (M.pop - t0)));
    const beat = 1 + 0.07 * (Math.exp(-Math.max(0, t - 89.62) * 12) * (t > 89.62 ? 1 : 0) + Math.exp(-Math.max(0, t - 89.86) * 12) * (t > 89.86 ? 1 : 0));
    const size = lerp(46, 980, p) * beat;
    const x = lerp(178, 540, easeOutCubic(clamp((t - t0) / 0.4)));
    const y = lerp(1000, 880, easeOutCubic(clamp((t - t0) / 0.4)));
    return (
      <div style={{ position: 'absolute', left: x - size / 2, top: y - size * 0.45, filter: `drop-shadow(0 0 ${20 + 60 * p}px rgba(255,46,110,0.8))`, transform: `rotate(${Math.sin(t * 40) * 3 * p}deg)` }}>
        <Heart size={size} id="bigheart" />
      </div>
    );
  }
  const d = t - M.pop;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: 26 }).map((_, i) => {
        const a = (i / 26) * Math.PI * 2 + rand(i * 3.3) * 0.4;
        const v = 1100 + rand(i * 5.7) * 1300;
        const x = 540 + Math.cos(a) * v * d;
        const y = 880 + Math.sin(a) * v * d + 2600 * d * d;
        const s = 40 + rand(i * 2.9) * 90;
        return (
          <div key={i} style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, opacity: 1 - clamp(d / 0.65), transform: `rotate(${(rand(i) - 0.5) * 900 * d}deg)` }}>
            <Heart size={s} id={`shard${i}`} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** After the pop: the phone is dead, cracked; the silent "oops! it's a scandal!" plays over black, then the title card holds while the word echoes out. */
export const DeadScreen: React.FC<{ t: number }> = ({ t }) => {
  const oops = t - 90.4, sc = t - 91.3, card = t - 90.95;
  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: F.sans, textAlign: 'center' }}>
      {oops > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 760, fontSize: 124, fontWeight: 600, color: '#fff', transform: `scale(${easeOutBack(clamp(oops / 0.2), 2.4)})`, textShadow: '0 0 30px rgba(255,46,110,0.55)' }}>oops!</div>
      )}
      {sc > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 930, fontSize: 60, color: '#FFD0DC', opacity: clamp(sc / 0.1), transform: `translateY(${(1 - easeOutCubic(clamp(sc / 0.2))) * 20}px)` }}>it's a scandal!</div>
      )}
      {/* each echo of "scandal!" in the audio tail ripples the line outward */}
      {[1, 2, 3, 4].map((k) => {
        const d = t - (TAIL.from + k * TAIL.delay);
        if (d < 0 || d > 0.9) return null;
        return <div key={k} style={{ position: 'absolute', left: 0, right: 0, top: 930, fontSize: 60, color: '#FF8FB0', opacity: 0.5 * Math.pow(TAIL.feedback, k - 1) * (1 - d / 0.9), transform: `scale(${1 + 0.35 * easeOutCubic(d / 0.9)})`, filter: `blur(${4 * d}px)` }}>it's a scandal!</div>;
      })}
      {card > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1300, opacity: clamp(card / 0.25) }}>
          <div style={{ fontFamily: F.display, fontSize: 76, letterSpacing: 5, backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', display: 'inline-block' }}>TOO HOT TO HANDLE</div>
          <div style={{ fontSize: 36, color: '#A9A6B3', marginTop: 10 }}>full song on the channel</div>
        </div>
      )}
      <AbsoluteFill style={{ background: C.cream, opacity: t < M.dead ? 0 : Math.exp(-(t - M.dead) * 30) * 0.3, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: '#000', opacity: clamp((t - (END - 0.35)) / 0.3) }} />
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{ t: number; at: number; amt?: number; decay?: number; color?: string }> = ({ t, at, amt = 1, decay = 9, color = '#fff' }) =>
  t < at || t > at + 1 ? null : <AbsoluteFill style={{ background: color, opacity: amt * Math.exp(-(t - at) * decay), pointerEvents: 'none' }} />;
