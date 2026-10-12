import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';
import { Lyric, LyricProps, Punch, W } from './type';
import { heat, Blend } from './thermal';
import { Blob, HeatFlame, HeatHeart, Ring, Sparks } from './world';
import { VScene, Sc, Pane, ws, wt, HUD_INK } from './kit';
import { Room, boxOf } from './act1';
import { Slices } from './fx';
import { grid } from './story';
import { VF } from './fonts';

const decay = (t: number, at: number, rate = 6) => (t >= at ? Math.exp(-(t - at) * rate) : 0);

/** Molten drips hanging from a line of type; each one stretches, lets go of a drop, and grows again. */
export const Drips: React.FC<{ t: number; x0: number; x1: number; y: number; start: number; n?: number; v?: number; len?: number; fall?: number; seed?: number; w?: number }> = ({ t, x0, x1, y, start, n = 9, v = 0.85, len = 150, fall = 260, seed = 1, w = 16 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const s = start + rand(i * 2.3 + seed) * 1.2;
      const l = t - s;
      if (l < 0) return null;
      const period = 1.5 + rand(i * 5.1 + seed) * 0.8;
      const ph = (l % period) / period;
      const cyc = Math.floor(l / period);
      const x = x0 + (x1 - x0) * ((i + 0.5 + (rand(i * 7.7 + seed) - 0.5) * 0.6) / n);
      const L = len * (0.5 + rand(i * 3.1 + seed + cyc) * 0.7) * easeOutCubic(clamp(ph / 0.7));
      const ww = w * (0.7 + rand(i * 1.9 + seed) * 0.6);
      const drop = ph > 0.7 ? (ph - 0.7) / 0.3 : -1;
      return (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: x - ww / 2, top: y - 6, width: ww, height: Math.max(0, (drop >= 0 ? L * (1 - drop * 0.6) : L)) + 6, borderRadius: `0 0 ${ww}px ${ww}px`, background: `linear-gradient(180deg, ${heat(v)}, ${heat(v * 0.8)})` }} />
          {drop >= 0 && <div style={{ position: 'absolute', left: x - ww * 0.7, top: y + L + drop * drop * fall, width: ww * 1.4, height: ww * 1.8, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: heat(v * (1 - drop * 0.4)), opacity: 1 - drop * 0.7 }} />}
        </React.Fragment>
      );
    })}
  </>
);

// ── title (the hook's melt type) ──
const TITLE = (n: number, a: number) => ws(n, a, a + 4);
const hookTitle = (t: number, n: number, a: number, year: number, cap = 172, y = 500): LyricProps => ({
  t, words: TITLE(n, a), lines: [2, 2], style: 'melt', cap, maxW: 1420, y, lineStep: 1.26, anim: 'blur', dur: 0.5, curve: { peak: 1, hold: 0.88, decay: 0.7 }, year,
});

// ── ECG: a heartbeat that runs away with itself ──
const HB: number[] = (() => {
  const out: number[] = [];
  let x = 77.12;
  while (x < 80.66) { out.push(x); const p = clamp((x - 77.1) / 3.5); x += lerp(0.78, 0.17, p * p); }
  return out;
})();
const ecgShape = (d: number) => {
  const g = (c: number, w: number, a: number) => a * Math.exp(-((d - c) * (d - c)) / (2 * w * w));
  return g(-0.12, 0.025, 0.12) + g(-0.025, 0.008, -0.16) + g(0, 0.009, 1) + g(0.028, 0.01, -0.3) + g(0.2, 0.045, 0.24);
};
const ecgAt = (tau: number) => HB.reduce((s, h) => (Math.abs(tau - h) < 0.4 ? s + ecgShape(tau - h) : s), 0);
const ECG: React.FC<{ t: number; x0: number; x1: number; y: number; h: number; speed?: number; v?: number }> = ({ t, x0, x1, y, h, speed = 900, v = 0.95 }) => {
  const N = 260;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    const tau = t - (x1 - x) / speed;
    pts.push(`${x.toFixed(1)},${(y - ecgAt(tau) * h).toFixed(1)}`);
  }
  const hy = y - ecgAt(t) * h;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1920} height={1080}>
      <defs>
        <linearGradient id="ecgFade" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="0.25" stopColor="#fff" stopOpacity={1} /></linearGradient>
        <mask id="ecgMask"><rect x={x0} y={0} width={x1 - x0} height={1080} fill="url(#ecgFade)" /></mask>
      </defs>
      <g mask="url(#ecgMask)">
        <polyline points={pts.join(' ')} fill="none" stroke={heat(v)} strokeWidth={18} opacity={0.25} style={{ filter: 'blur(8px)' }} />
        <polyline points={pts.join(' ')} fill="none" stroke={heat(v)} strokeWidth={6} strokeLinejoin="round" />
      </g>
      <circle cx={x1} cy={hy} r={14} fill={heat(1)} />
      <circle cx={x1} cy={hy} r={40} fill={heat(1, 0.3)} style={{ filter: 'blur(12px)' }} />
    </svg>
  );
};

// ── eyes: a thermal close-up; the inner corners are the hottest point on a face ──
const EyesBand: React.FC<{ y: number; look: number; open: number; v?: number }> = ({ y, look, open, v = 1 }) => {
  const eye = (cx: number, side: 1 | -1, k: string) => {
    const h = 44 * open, w = 170;
    const P = (x: number, yy: number) => `${(cx + side * x).toFixed(1)} ${(y + yy).toFixed(1)}`;
    const d = `M ${P(-w, 4)} C ${P(-w * 0.6, -h)} ${P(w * 0.45, -h * 1.12)} ${P(w, 0)} C ${P(w * 0.55, h * 0.8)} ${P(-w * 0.55, h * 0.92)} ${P(-w, 4)} Z`;
    return (
      <g key={k}>
        <path d={`M ${P(-w * 1.05, -78)} Q ${P(0, -128)} ${P(w * 1.02, -92)}`} stroke={heat(0.2 * v)} strokeWidth={30} fill="none" strokeLinecap="round" style={{ filter: 'blur(7px)' }} />
        <clipPath id={`eyc${k}`}><path d={d} /></clipPath>
        <path d={d} fill={heat(0.62 * v)} style={{ filter: 'blur(9px)' }} />
        <g clipPath={`url(#eyc${k})`} style={{ filter: 'blur(2.5px)' }}>
          <rect x={cx - w - 10} y={y - 60} width={w * 2 + 20} height={120} fill={heat(0.74 * v)} />
          <ellipse cx={cx + side * w * 0.86} cy={y + 2} rx={44} ry={30} fill={heat(0.98 * v)} />
          <circle cx={cx + look * 46} cy={y - 2} r={46} fill={heat(0.56 * v)} />
          <circle cx={cx + look * 46} cy={y - 2} r={18} fill={heat(0.48 * v)} />
        </g>
      </g>
    );
  };
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1920} height={1080}>
      <ellipse cx={960} cy={y + 40} rx={760} ry={300} fill={heat(0.3 * v)} style={{ filter: 'blur(70px)' }} />
      <ellipse cx={960} cy={y + 150} rx={110} ry={200} fill={heat(0.22 * v)} style={{ filter: 'blur(36px)' }} />
      {eye(700, 1, 'L')}
      {eye(1220, -1, 'R')}
    </svg>
  );
};

// ── playlist where every track is this song ──
const TRACKS = ['TOO HOT TO HANDLE', 'TOO HOT TO HANDLE (SPED UP)', 'TOO HOT TO HANDLE (SLOWED + REVERB)', 'TOO HOT TO HANDLE (1 HOUR LOOP)', 'TOO HOT TO HANDLE (BASS BOOSTED)', 'TOO HOT TO HANDLE (LIVE)', 'TOO HOT TO HANDLE (REMIX)'];
const DURS = ['2:23', '1:58', '2:51', '60:00', '2:23', '3:10', '2:46'];
const Playlist: React.FC<{ t: number; from: number; x: number; y: number; w: number }> = ({ t, from, x, y, w }) => {
  const rowH = 104;
  const scroll = Math.max(0, t - (from + 1.6)) * 26;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: rowH * 6.4, overflow: 'hidden' }}>
      <div style={{ fontFamily: VF.hud, fontWeight: 700, fontSize: 20, letterSpacing: '0.24em', color: heat(0.62), paddingBottom: 18, borderBottom: `2px solid ${heat(0.3)}`, opacity: clamp((t - from) / 0.2) }}>QUEUE · 7 TRACKS · ALL BANGERS</div>
      <div style={{ transform: `translateY(${-scroll}px)` }}>
        {TRACKS.map((title, i) => {
          const at = from + 0.1 + i * 0.19;
          const p = easeOutCubic(clamp((t - at) / 0.3));
          const playing = i === 0;
          return (
            <div key={i} style={{ position: 'relative', height: rowH, display: 'flex', alignItems: 'center', gap: 24, opacity: p, transform: `translateX(${(1 - p) * 120}px)`, background: playing ? heat(0.2) : undefined, paddingLeft: 12 }}>
              <div style={{ width: 132, height: 76, borderRadius: 8, background: `radial-gradient(ellipse at ${30 + i * 9}% 60%, ${heat(0.95)}, ${heat(0.45)} 45%, ${heat(0.12)})`, flex: 'none' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: VF.hud, fontWeight: 800, fontSize: 24, letterSpacing: '0.04em', color: heat(playing ? 1 : 0.82), whiteSpace: 'nowrap' }}>{playing ? '▶ ' : ''}{title}</div>
                <div style={{ fontFamily: VF.hud, fontWeight: 500, fontSize: 17, letterSpacing: '0.12em', color: heat(0.5), marginTop: 6 }}>{DURS[i]} · {playing ? 'NOW PLAYING' : `ON REPEAT ×${(i + 2) * 7}`}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── quad cameras ──
const QUADS: { blend: Blend; x: number; y: number; name: string }[] = [
  { blend: [{ name: 'IRONBOW', w: 1 }], x: 0, y: 0, name: 'CAM 01 · IRONBOW' },
  { blend: [{ name: 'ARCTIC', w: 1 }], x: 960, y: 0, name: 'CAM 02 · ARCTIC' },
  { blend: [{ name: 'RAINBOW', w: 1 }], x: 0, y: 540, name: 'CAM 03 · RAINBOW' },
  { blend: [{ name: 'SCANDAL', w: 1 }], x: 960, y: 540, name: 'CAM 04 · SCANDAL' },
];
const QUAD_END = 87.62;
const eyesOnMe = (t: number, q: number) => {
  const sc = [1, 0.8, 1.1, 1.45][q];
  const rot = [0, -3, 4, 0][q];
  return (
    <AbsoluteFill style={{ transform: `rotate(${rot}deg) scale(${sc})`, transformOrigin: '50% 50%' }}>
      <Lyric t={t} words={ws(30, 0, 3)} cap={260} maxW={1500} keepPunct={false} style={(w) => (w.i === 2 ? 'wide' : 'cond')} scale={(w) => (w.i === 2 ? 1 : 0.7)} anim="punch" dur={0.2} curve={{ peak: 1, hold: 0.84 }} />
    </AbsoluteFill>
  );
};

const angleProps = (t: number): LyricProps => ({ t, words: ws(30, 3), lines: [2, 1], cap: 250, maxW: 1400, lineStep: 1.22, y: 480, keepPunct: false,
  style: (w) => (w.i === 5 ? 'wide' : 'cond'), scale: (w) => (w.i === 5 ? 1 : 0.4), anim: (w) => (w.i === 5 ? 'punch' : 'rise'), dur: 0.3, curve: { peak: 1, hold: 0.86 } });

// ── the pop ──
const POP_AT = 89.97;
const heartBeats = [89.3, 89.62, 89.8, 89.9];

export const ACT3: VScene[] = [
  {
    id: 'h1a', from: 66.24, to: 72.4,
    heat: (t) => {
      const melt = easeInOutCubic(clamp((t - 67.8) / 4.5));
      const lp = hookTitle(t, 24, 2, 1979 + melt * 38);
      const row2 = boxOf({ ...lp, t: 99 }, (w) => w.i >= 4);
      const warm = easeOutCubic(clamp((t - 66.3) / 2));
      return (
        <Sc t={t} from={66.24} to={72.4} exit="cut" enterDur={0.4}>
          <Blob x={960} y={520} r={900} v={0.1 + 0.12 * warm} sy={0.7} />
          <Lyric t={t} words={ws(24, 0, 2)} cap={58} y={218} style="cond" gap={0.5} anim="rise" curve={{ peak: 1, hold: 0.76 }} />
          <Drips t={t} x0={row2.x0 + 30} x1={row2.x1 - 30} y={row2.y1 - 4} start={68.6} n={11} v={0.78} len={84} fall={120} seed={3} />
          <Lyric {...lp} />
          <Lyric t={t} words={ws(24, 6)} cap={64} y={880} style="serif" keepPunct={false} scale={(w) => (w.i === 10 ? 1.45 : 1)} anim={(w) => (w.i === 10 ? 'blur' : 'rise')} dur={0.4} curve={{ peak: 1, hold: 0.8 }} />
        </Sc>
      );
    },
  },
  {
    id: 'h1b', from: 72.4, to: 75.55,
    heat: (t) => {
      const lit = wt(25, 4) - 0.06;
      const ign = easeOutBack(clamp((t - lit) / 0.3), 1.6);
      const lean = 0.1 * Math.sin((t - 72.4) * 2.6) + 0.05 * grid(t).pulse;
      const partB = t >= wt(25, 5) - 0.08;
      return (
        <Sc t={t} from={72.4} to={75.55} exit="cut" enterDur={0.01}>
          <Blob x={1440} y={560} r={640 * Math.max(0.3, ign)} v={0.16 * ign} />
          <div style={{ position: 'absolute', left: 1440 - 62, top: 610, width: 124, height: 470, borderRadius: '10px 10px 0 0', background: `linear-gradient(180deg, ${heat(0.36 + 0.14 * ign)}, ${heat(0.22)} 40%, ${heat(0.16)})` }} />
          <div style={{ position: 'absolute', left: 1440 - 3, top: 586, width: 6, height: 28, background: heat(0.5 + 0.4 * ign) }} />
          {t >= lit && <HeatFlame t={t} x={1440} y={602} h={250 * clamp(ign, 0, 1.2)} lean={lean} seed={2} />}
          <Sparks t={t} at={lit} x={1440} y={560} n={26} r={260} gravity={-120} dur={0.9} seed={5} />
          {!partB && <Lyric t={t} words={ws(25, 0, 5)} lines={[4, 1]} align="left" x={130} y={540} cap={250} maxW={1000} lineStep={1.2} style={(w) => (w.i === 4 ? 'serif' : 'cond')} scale={(w) => (w.i === 4 ? 1 : 0.28)} anim={(w) => (w.i === 4 ? 'blur' : 'rise')} dur={0.4} curve={{ peak: 1, hold: 0.84 }} />}
          {partB && (
            <Lyric t={t} words={ws(25, 5)} lines={[2, 3]} align="left" x={130} y={540} cap={240} maxW={1050} lineStep={1.2}
              style={(w) => (w.i === 6 ? 'melt' : 'cond')} scale={(w) => (w.i === 6 ? 1 : w.i === 9 ? 0.5 : 0.34)} anim={(w) => (w.i === 6 ? 'punch' : 'rise')} dur={0.3}
              year={(w, local) => (w.i === 6 ? 1979 + clamp(local / 1.1) * 50 : 1979)} curve={{ peak: 1, hold: 0.88 }} />
          )}
        </Sc>
      );
    },
    over: (t) => {
      const at = wt(25, 9) - 0.05;
      if (t < at) return null;
      const lean = 0.1 * Math.sin((t - 72.4) * 2.6) + 0.05 * grid(t).pulse;
      const deg = Math.atan(lean * 1.6) * (180 / Math.PI);
      const p = easeOutCubic(clamp((t - at) / 0.25));
      const op = p * (1 - clamp((t - 75.42) / 0.12));
      const L = 300;
      const a = (deg * Math.PI) / 180;
      return (
        <svg style={{ position: 'absolute', left: 0, top: 0, opacity: op }} width={1920} height={1080}>
          <line x1={1440} y1={600} x2={1440} y2={600 - L} stroke={HUD_INK} strokeWidth={2} strokeDasharray="8 8" />
          <line x1={1440} y1={600} x2={1440 + Math.sin(a) * L * p} y2={600 - Math.cos(a) * L * p} stroke="#ffd27a" strokeWidth={3} />
          <path d={`M 1440 ${600 - 170} A 170 170 0 0 ${deg > 0 ? 1 : 0} ${1440 + Math.sin(a) * 170} ${600 - Math.cos(a) * 170}`} fill="none" stroke="#ffd27a" strokeWidth={3} />
          <text x={1440 + (deg > 0 ? 40 : -200)} y={600 - 200} fill="#ffd27a" fontFamily="JetBrains Mono" fontWeight={700} fontSize={30} letterSpacing={3}>∠ {Math.abs(deg).toFixed(1)}°</text>
        </svg>
      );
    },
  },
  {
    id: 'h1c', from: 75.55, to: 77.05,
    heat: (t) => {
      const look = Math.sin((t - 75.5) * 7);
      const blink = t > 76.25 && t < 76.36 ? 0.12 : 1;
      const scr = wt(26, 4);
      const sl = t >= scr - 0.05 && t < scr + 0.35 ? 0.7 * (1 - (t - scr) / 0.4) : t >= 75.6 && t < 76.0 ? 0.4 : 0;
      return (
        <Sc t={t} from={75.55} to={77.05} exit="cut" enterDur={0.01}>
          <Slices t={t} amt={sl} n={8} maxShift={150} seed={6}>
            <EyesBand y={300} look={look} open={blink * easeOutCubic(clamp((t - 75.6) / 0.2))} />
            <Lyric t={t} words={ws(26)} lines={[4, 1]} cap={230} y={700} maxW={1560} lineStep={1.2} style={(w) => (w.i === 4 ? 'wide' : 'cond')} scale={(w) => (w.i === 4 ? 1 : 0.3)} anim={(w) => (w.i === 4 ? 'scramble' : 'rise')} dur={0.42} curve={{ peak: 1, hold: 0.84 }} />
          </Slices>
        </Sc>
      );
    },
  },
  {
    id: 'h1d', from: 77.05, to: 80.667,
    heat: (t) => {
      const beat = HB.reduce((m, h) => (t >= h ? Math.max(m, Math.exp(-(t - h) * 9)) : m), 0);
      const build = clamp((t - 77.05) / 3.6);
      const sh = build * build * 10;
      const f = Math.floor(t * 30);
      return (
        <Sc t={t} from={77.05} to={80.667} exit="none" enterDur={0.01}>
          <AbsoluteFill style={{ transform: `translate(${(rand(f * 1.3) - 0.5) * sh}px, ${(rand(f * 2.1) - 0.5) * sh}px)` }}>
            <Lyric t={t} words={ws(27, 0, 4)} cap={84} y={226} style={(w) => (w.i === 2 ? 'serif' : 'cond')} scale={(w) => (w.i === 2 ? 1.5 : 1)} anim={(w) => (w.i === 2 ? 'blur' : 'rise')} curve={{ peak: 1, hold: 0.8 }} />
            <HeatHeart x={250} y={545} size={230} v={0.72 + 0.28 * beat} beat={beat} id="ecgh" />
            <ECG t={t} x0={420} x1={1780} y={600} h={210} />
            <div style={{ position: 'absolute', left: 420, right: 140, top: 600, height: 2, background: heat(0.22) }} />
            <Lyric t={t} words={ws(27, 4)} cap={118} y={880} maxW={1640} gap={0.36} style={(w) => (w.i === 5 ? 'serif' : w.i === 6 || w.i === 8 ? 'wide' : 'cond')} scale={(w) => (w.i === 4 || w.i === 7 ? 0.62 : w.i === 5 ? 1.1 : 1)} anim={(w) => (w.i === 8 ? 'punch' : 'rise')} dur={0.3} curve={{ peak: 1, hold: 0.84 }} />
          </AbsoluteFill>
        </Sc>
      );
    },
  },
  {
    id: 'h1e', from: 80.667, to: 83.94,
    heat: (t) => {
      const hAt = wt(28, 5) - 0.05;
      const full = t >= hAt;
      const melt = easeInCubic(clamp((t - hAt) / 1.4));
      const lp = hookTitle(t, 28, 2, 1979 + melt * 71, 186, 500);
      const row2 = boxOf({ ...lp, t: 99 }, (w) => w.i >= 4);
      return (
        <Sc t={t} from={80.667} to={83.94} exit="melt" exitDur={0.3} enterDur={0.01}>
          {!full && <Punch t={t} words={ws(28, 0, 5)} style="melt" cap={420} maxW={1500} year={(w: W, local: number) => 1979 + clamp(local / 0.6) * 22} />}
          {full && (
            <>
              <Blob x={960} y={520} r={900} v={0.22} sy={0.75} />
              <Drips t={t} x0={row2.x0 + 20} x1={row2.x1 - 20} y={row2.y1 - 6} start={hAt + 0.25} n={14} v={0.86} len={170} seed={8} w={18} />
              <Lyric {...lp} anim="punch" dur={0.3} curve={{ pre: 0, peak: 1, hold: 0.92, decay: 0.8 }} t={t} />
              <Sparks t={t} at={hAt} x={960} y={520} n={60} r={900} gravity={300} dur={1.5} seed={9} />
            </>
          )}
        </Sc>
      );
    },
  },
  {
    id: 'h1f', from: 83.94, to: 86.73,
    heat: (t) => (
      <Sc t={t} from={83.94} to={86.73} exit="left" exitDur={0.2} enterDur={0.12}>
        <Lyric t={t} words={ws(29)} lines={[2, 2]} align="left" x={130} y={540} cap={170} maxW={780} lineStep={1.24} keepPunct
          style={(w) => (w.i === 3 ? 'wide' : 'cond')} scale={(w) => (w.i === 3 ? 0.92 : w.i === 2 ? 0.55 : w.i === 0 ? 0.62 : 0.5)} anim={(w) => (w.i === 3 ? 'punch' : 'rise')} dur={0.3} curve={{ peak: 1, hold: 0.86 }} />
        <Playlist t={t} from={84.0} x={1000} y={210} w={800} />
      </Sc>
    ),
  },
  {
    id: 'h1g', from: 86.73, to: 89.2,
    heat: (t) => {
      if (t < QUAD_END) {
        const z = easeInCubic(clamp((t - (QUAD_END - 0.16)) / 0.16));
        return (
          <AbsoluteFill style={{ clipPath: `inset(0 ${960 * (1 - z)}px ${540 * (1 - z)}px 0)` }}>
            <AbsoluteFill style={{ transform: `scale(${0.5 + 0.5 * z})`, transformOrigin: '0 0' }}>{eyesOnMe(t, 0)}</AbsoluteFill>
          </AbsoluteFill>
        );
      }
      const ang = -12 * easeOutBack(clamp((t - wt(30, 5) + 0.05) / 0.35), 2);
      return (
        <Sc t={t} from={QUAD_END} to={89.2} exit="cut" enterDur={0.01}>
          <Lyric {...angleProps(t)} fx={(w) => (w.i === 5 ? { transform: `rotate(${ang}deg)` } : undefined)} />
        </Sc>
      );
    },
    layer: (t, ti) => {
      if (t >= QUAD_END) return null;
      const z = easeInCubic(clamp((t - (QUAD_END - 0.16)) / 0.16));
      if (z >= 1) return null;
      return (
        <>
          {QUADS.slice(1).map((q, i) => (
            <Pane key={i} id={`quad${i}`} blend={q.blend} clip={`inset(${q.y}px ${1920 - q.x - 960}px ${1080 - q.y - 540}px ${q.x}px)`} style={{ opacity: 1 - z }}>
              <AbsoluteFill style={{ transform: `translate(${q.x}px, ${q.y}px) scale(0.5)`, transformOrigin: '0 0' }}>
                <Room t={t} ti={ti} />
                {eyesOnMe(t, i + 1)}
              </AbsoluteFill>
            </Pane>
          ))}
        </>
      );
    },
    over: (t) => {
      if (t >= QUAD_END - 0.16) {
        const at = wt(30, 5) - 0.05;
        if (t < at) return null;
        const p = easeOutCubic(clamp((t - at) / 0.35));
        const op = p * (1 - clamp((t - 89.08) / 0.12));
        const b = boxOf(angleProps(99), (w) => w.i === 5);
        const vx = b.x1 + 40, vy = b.y1 + 110, R = 150, a = (12 * Math.PI) / 180;
        return (
          <svg style={{ position: 'absolute', left: 0, top: 0, opacity: op }} width={1920} height={1080}>
            <line x1={vx - 260} y1={vy} x2={vx} y2={vy} stroke={HUD_INK} strokeWidth={2} strokeDasharray="8 8" />
            <line x1={vx} y1={vy} x2={vx - Math.cos(a) * 260 * p} y2={vy - Math.sin(a) * 260 * p} stroke="#ffd27a" strokeWidth={3} />
            <path d={`M ${vx - R} ${vy} A ${R} ${R} 0 0 1 ${vx - Math.cos(a) * R} ${vy - Math.sin(a) * R}`} fill="none" stroke="#ffd27a" strokeWidth={3} />
            <text x={vx - 250} y={vy + 44} fill="#ffd27a" fontFamily="JetBrains Mono" fontWeight={700} fontSize={28} letterSpacing={3}>∠ 12.0°</text>
          </svg>
        );
      }
      return (
        <AbsoluteFill>
          <div style={{ position: 'absolute', left: 958, top: 0, width: 4, height: 1080, background: '#000' }} />
          <div style={{ position: 'absolute', left: 0, top: 538, width: 1920, height: 4, background: '#000' }} />
          {QUADS.map((q, i) => {
            const left = q.x === 0, top = q.y === 0;
            return (
              <div key={i} style={{ position: 'absolute', ...(left ? { right: 960 + 30 } : { left: 960 + 30 }), ...(top ? { bottom: 540 + 26 } : { top: 540 + 26 }), fontFamily: VF.hud, fontWeight: 700, fontSize: 18, letterSpacing: '0.2em', color: HUD_INK, display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                <span style={{ width: 11, height: 11, borderRadius: 6, background: '#ff3b30', opacity: Math.floor(t * 3 + i) % 2 ? 1 : 0.3 }} />{q.name}
              </div>
            );
          })}
        </AbsoluteFill>
      );
    },
  },
  {
    id: 'h1h', from: 89.2, to: 92.15,
    heat: (t, ti) => {
      const beat = heartBeats.reduce((m, h) => (ti >= h ? Math.max(m, Math.exp(-(ti - h) * 8)) : m), 0);
      const popped = ti >= POP_AT;
      const grow = easeOutCubic(clamp((ti - 89.2) / 0.3));
      const frozen = t >= 90.12 && t < 92.13;
      return (
        <Sc t={t} from={89.2} to={92.15} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ opacity: frozen ? 0.62 : 1 }}>
            {!popped && <Lyric t={ti} words={ws(31, 0, 2)} cap={84} y={196} style="cond" gap={0.45} anim="rise" curve={{ peak: 1, hold: 0.8 }} />}
            {!popped && <HeatHeart x={960} y={600} size={560 * grow * (1 + 0.15 * clamp((ti - 89.6) / 0.37))} v={0.78 + 0.22 * beat} beat={beat} id="popheart" />}
            <Sparks t={ti} at={POP_AT} x={960} y={600} n={90} r={1100} gravity={380} dur={2.2} seed={13} />
            {popped && <Ring x={960} y={600} r={200 + easeOutExpo(clamp((ti - POP_AT) / 0.5)) * 700} v={0.8 * (1 - clamp((ti - POP_AT) / 0.5))} w={14} blur={6} />}
            {popped && <Punch t={ti} words={ws(31, 2, 3)} style="wide" cap={330} maxW={1300} />}
          </AbsoluteFill>
          {frozen && Array.from({ length: 4 }).map((_, i) => {
            const f = Math.floor(t * 12);
            return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: rand(f * 2.3 + i * 5) * 1080, height: 3, background: heat(0.55), opacity: 0.5 }} />;
          })}
          {t >= wt(31, 3) - 0.05 && (
            <AbsoluteFill style={{ transform: `rotate(9deg) scale(${lerp(1.5, 1, easeOutExpo(clamp((t - wt(31, 3) + 0.05) / 0.2)))})`, transformOrigin: '1540px 236px' }}>
              <Lyric t={t} words={ws(31, 3, 4)} cap={124} x={1540} y={236} style="serif" keepPunct anim="none" curve={{ pre: 0, peak: 1, hold: 0.95 }} />
            </AbsoluteFill>
          )}
          <Lyric t={t} words={ws(31, 4)} cap={96} y={900} maxW={1500} keepPunct style={(w) => (w.i === 6 ? 'wide' : 'cond')} scale={(w) => (w.i === 6 ? 1.15 : 0.8)} anim="punch" dur={0.2} curve={{ peak: 1, hold: 0.9 }} />
        </Sc>
      );
    },
  },
];
