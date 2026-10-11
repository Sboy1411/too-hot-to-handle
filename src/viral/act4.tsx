import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';
import { Lyric, LyricProps, Punch } from './type';
import { heat } from './thermal';
import { Blob, HeatFlame, HeatHeart, Ring, Sparks } from './world';
import { VScene, Sc, Pane, ws, wt, HUD_INK } from './kit';
import { Room, boxOf } from './act1';
import { Cracks } from './fx';
import { Drips } from './act3';
import { beatTime, grid } from './story';
import { VF } from './fonts';

const decay = (t: number, at: number, rate = 6) => (t >= at ? Math.exp(-(t - at) * rate) : 0);

// ── props ──
const Octagon: React.FC<{ x: number; y: number; r: number; v: number; rot?: number; w?: number }> = ({ x, y, r, v, rot = 0, w = 16 }) => {
  const pts = Array.from({ length: 8 }, (_, i) => { const a = ((i + 0.5) / 8) * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  return (
    <svg style={{ position: 'absolute', left: x - r - 40, top: y - r - 40, overflow: 'visible', transform: `rotate(${rot}deg)`, mixBlendMode: 'lighten' }} width={r * 2 + 80} height={r * 2 + 80} viewBox={`${-r - 40} ${-r - 40} ${r * 2 + 80} ${r * 2 + 80}`}>
      <polygon points={pts} fill="none" stroke={heat(v)} strokeWidth={w * 2.6} opacity={0.3} style={{ filter: 'blur(10px)' }} />
      <polygon points={pts} fill="none" stroke={heat(v)} strokeWidth={w} strokeLinejoin="round" />
    </svg>
  );
};

const FilmBand: React.FC<{ y: number; t: number; v?: number }> = ({ y, t, v = 0.62 }) => {
  const off = -((t * 380) % 110);
  return (
    <div style={{ position: 'absolute', left: 0, top: y, width: 1920, height: 76, background: heat(0.05), overflow: 'hidden' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{ position: 'absolute', left: off + i * 110 + 26, top: 20, width: 56, height: 36, borderRadius: 7, background: heat(v) }} />
      ))}
    </div>
  );
};

const fmtTC = (t: number) => {
  const f = Math.floor(t * 30);
  return [Math.floor(t / 3600), Math.floor(t / 60) % 60, Math.floor(t) % 60, f % 30].map((n) => String(n).padStart(2, '0')).join(':');
};

const MapPin: React.FC<{ x: number; y: number; s: number; v: number }> = ({ x, y, s, v }) => (
  <svg style={{ position: 'absolute', left: x - 60 * s, top: y - 160 * s, overflow: 'visible' }} width={120 * s} height={170 * s} viewBox="-60 -160 120 170">
    <path d="M 0 0 C -12 -40, -56 -70, -56 -104 A 56 56 0 1 1 56 -104 C 56 -70, 12 -40, 0 0 Z" fill={heat(v)} style={{ filter: 'blur(1.5px)' }} />
    <circle cx={0} cy={-104} r={22} fill={heat(v * 0.35)} />
  </svg>
);

const Fan: React.FC<{ x: number; y: number; r: number; rot: number; v?: number }> = ({ x, y, r, rot, v = 1 }) => {
  // a desk fan, front on: three swept blades behind a spoked guard
  const blade = 'M 6 -10 C 30 -34, 74 -62, 96 -36 C 108 -18, 84 8, 56 14 C 34 18, 16 12, 6 6 Z';
  return (
    <svg style={{ position: 'absolute', left: x - r, top: y - r, overflow: 'visible' }} width={r * 2} height={r * 2} viewBox="-110 -110 220 220">
      <circle r={104} fill={heat(0.08 * v)} />
      {[-2, -1, 0].map((k) => (
        <g key={k} transform={`rotate(${rot + k * 7})`} opacity={k === 0 ? 1 : 0.28}>
          {Array.from({ length: 3 }).map((_, i) => <path key={i} d={blade} transform={`rotate(${i * 120})`} fill={heat(0.46 * v)} />)}
        </g>
      ))}
      <g stroke={heat(0.34 * v)} strokeWidth={1.6} fill="none">
        {Array.from({ length: 28 }).map((_, i) => { const a = (i / 28) * Math.PI * 2; return <line key={i} x1={Math.cos(a) * 24} y1={Math.sin(a) * 24} x2={Math.cos(a) * 104} y2={Math.sin(a) * 104} />; })}
        {[44, 66, 86].map((rr) => <circle key={rr} r={rr} />)}
      </g>
      <circle r={106} fill="none" stroke={heat(0.5 * v)} strokeWidth={7} />
      <circle r={24} fill={heat(0.82 * v)} />
      <circle r={10} fill={heat(1 * v)} />
    </svg>
  );
};

const Snow: React.FC<{ t: number; t0: number; n?: number; v?: number }> = ({ t, t0, n = 70, v = 0.92 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const sp = 120 + rand(i * 3.1) * 200;
      const y = ((rand(i * 7.7) * 1200 + (t - t0) * sp) % 1200) - 60;
      const x = rand(i * 1.9) * 1920 + Math.sin((t - t0) * 1.3 + i) * 30;
      const s = 3 + rand(i * 5.3) * 7;
      return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: heat(v), opacity: clamp((t - t0) / 0.4) * (0.5 + rand(i) * 0.5), filter: 'blur(1px)' }} />;
    })}
  </>
);

/** Paparazzi: flashbulbs firing on the eighth notes. */
const Flashes: React.FC<{ t: number; from: number; to: number; seed?: number }> = ({ t, from, to, seed = 1 }) => {
  const out: React.ReactNode[] = [];
  const step = 60 / 154 / 2;
  for (let k = 0; ; k++) {
    const at = from + k * step + rand(k * 2.2 + seed) * 0.08;
    if (at > to) break;
    const l = t - at;
    if (l < 0 || l > 0.16) continue;
    const e = 1 - l / 0.16;
    const x = 160 + rand(k * 3.3 + seed) * 1600, y = 140 + rand(k * 5.9 + seed) * 800;
    out.push(
      <React.Fragment key={k}>
        <Blob x={x} y={y} r={170} v={e} />
        <div style={{ position: 'absolute', left: x - 260, top: y - 3, width: 520, height: 6, background: `linear-gradient(90deg, transparent, ${heat(1)}, transparent)`, opacity: e, mixBlendMode: 'lighten' }} />
        <div style={{ position: 'absolute', left: x - 3, top: y - 200, width: 6, height: 400, background: `linear-gradient(180deg, transparent, ${heat(1)}, transparent)`, opacity: e, mixBlendMode: 'lighten' }} />
      </React.Fragment>,
    );
  }
  return <>{out}</>;
};

const Candle: React.FC<{ t: number; x: number; top: number; lit: number; lean: number; seed: number; w?: number; fh?: number }> = ({ t, x, top, lit, lean, seed, w = 96, fh = 190 }) => {
  const ign = easeOutBack(clamp((t - lit) / 0.3), 1.6);
  return (
    <>
      {t >= lit && <Blob x={x} y={top - 80} r={300 * clamp(ign, 0.2, 1)} v={0.14 * clamp(ign, 0, 1)} />}
      <div style={{ position: 'absolute', left: x - w / 2, top, width: w, height: 1080 - top + 20, borderRadius: '10px 10px 0 0', background: `linear-gradient(180deg, ${heat(0.3 + 0.16 * clamp(ign, 0, 1))}, ${heat(0.18)} 45%, ${heat(0.13)})` }} />
      <div style={{ position: 'absolute', left: x - 3, top: top - 22, width: 6, height: 24, background: heat(0.45 + 0.4 * clamp(ign, 0, 1)) }} />
      {t >= lit && <HeatFlame t={t} x={x} y={top - 10} h={fh * clamp(ign, 0, 1.2)} lean={lean} seed={seed} />}
      <Sparks t={t} at={lit} x={x} y={top - 40} n={14} r={160} gravity={-90} dur={0.7} seed={seed * 3} />
    </>
  );
};

// ── hook 2 helpers ──
const hook2Title = (t: number, year: number): LyricProps => ({
  t, words: ws(40, 2, 6), lines: [2, 2], style: 'melt', cap: 176, maxW: 1420, y: 520, lineStep: 1.26, anim: 'blur', dur: 0.5, curve: { peak: 1, hold: 0.9, decay: 0.7 }, year,
});
const Glints: React.FC<{ t: number; x0: number; x1: number; y0: number; y1: number; n?: number; seed?: number }> = ({ t, x0, x1, y0, y1, n = 10, seed = 1 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const per = 1.1 + rand(i * 2.7 + seed) * 0.9;
      const ph = ((t + rand(i * 4.1 + seed) * per) % per) / per;
      const e = Math.sin(clamp(ph / 0.35) * Math.PI);
      if (e <= 0.01) return null;
      const cyc = Math.floor((t + rand(i * 4.1 + seed) * per) / per);
      const x = lerp(x0, x1, rand(i * 5.3 + cyc * 1.7 + seed)), y = lerp(y0, y1, rand(i * 8.1 + cyc * 2.9 + seed));
      const L = 60 * e;
      return (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: x - L, top: y - 2, width: L * 2, height: 4, background: `linear-gradient(90deg, transparent, ${heat(1)}, transparent)`, mixBlendMode: 'lighten' }} />
          <div style={{ position: 'absolute', left: x - 2, top: y - L, width: 4, height: L * 2, background: `linear-gradient(180deg, transparent, ${heat(1)}, transparent)`, mixBlendMode: 'lighten' }} />
          <div style={{ position: 'absolute', left: x - 8, top: y - 8, width: 16, height: 16, borderRadius: 8, background: heat(1), opacity: e, filter: 'blur(3px)' }} />
        </React.Fragment>
      );
    })}
  </>
);

const POP2 = 115.4;
const heartBeats2 = [114.62, 114.95, 115.15, 115.28];
const mirrorBF = (t: number): LyricProps => ({
  t, words: ws(36), lines: [2, 2, 1], x: 480, y: 540, cap: 150, maxW: 800, lineStep: 1.22,
  style: (w) => (w.i === 2 || w.i === 3 ? 'serif' : 'cond'), scale: (w) => (w.i === 2 || w.i === 3 ? 0.9 : w.i === 4 ? 0.5 : 0.62),
  anim: (w) => (w.i === 2 || w.i === 3 ? 'blur' : 'rise'), dur: 0.4, curve: { peak: 1, hold: 0.84 },
});

export const ACT4: VScene[] = [
  // ───────────────────────── VERSE 3: one palette per line ─────────────────────────
  {
    id: 'v3a', from: 92.13, to: 93.6,
    heat: (t) => {
      const lp: LyricProps = { t, words: ws(32), lines: [3, 1, 1], cap: 190, maxW: 1300, lineStep: 1.14, y: 540, style: (w) => (w.i >= 3 ? 'wide' : 'cond'), scale: (w) => (w.i >= 3 ? 1 : 0.32), anim: (w) => (w.i >= 3 ? 'punch' : 'rise'), dur: 0.26, curve: { peak: 1, hold: 0.86 } };
      const stopAt = wt(32, 4) - 0.04;
      const p = easeOutBack(clamp((t - 92.2) / 0.5), 1.6);
      const rot = lerp(22.5, 0, easeOutCubic(clamp((t - 92.2) / 0.8))) + (t >= stopAt ? 0 : 0);
      const thud = decay(t, stopAt, 8);
      return (
        <Sc t={t} from={92.13} to={93.6} exit="cut" enterDur={0.01}>
          <Octagon x={960} y={540} r={470 * p * (1 + thud * 0.04)} v={0.42 + 0.4 * thud} rot={rot} />
          <Lyric {...lp} />
        </Sc>
      );
    },
  },
  {
    id: 'v3b', from: 93.6, to: 95.11,
    heat: (t) => {
      const lp: LyricProps = { t, words: ws(33), lines: [2, 2], cap: 230, maxW: 1460, lineStep: 1.2, y: 520, style: (w) => (w.i === 1 ? 'wide' : 'cond'), scale: (w) => (w.i === 1 ? 1 : w.i === 3 ? 0.78 : 0.36), anim: (w) => (w.i === 1 ? 'punch' : w.i === 3 ? 'drop' : 'rise'), dur: 0.42, curve: { peak: 1, hold: 0.86 } };
      const sb = boxOf({ ...lp, t: 99 }, (w) => w.i === 1);
      const db = boxOf({ ...lp, t: 99 }, (w) => w.i === 3);
      return (
        <Sc t={t} from={93.6} to={95.11} exit="cut" enterDur={0.01}>
          <Sparks t={t} at={wt(33, 1) - 0.02} x={sb.cx} y={sb.cy} n={56} r={720} gravity={240} dur={1.3} seed={21} />
          <Drips t={t} x0={db.cx - 40} x1={db.cx + 40} y={db.y1 - 4} start={wt(33, 3) + 0.25} n={1} v={0.9} len={70} fall={300} seed={4} w={22} />
          <Lyric {...lp} />
        </Sc>
      );
    },
  },
  {
    id: 'v3c', from: 95.11, to: 96.72,
    heat: (t) => (
      <Sc t={t} from={95.11} to={96.72} exit="cut" enterDur={0.01}>
        <FilmBand y={148} t={t} />
        <FilmBand y={856} t={t} />
        <Lyric t={t} words={ws(34)} lines={[4, 2]} cap={230} maxW={1500} lineStep={1.2} y={520} keepPunct
          style={(w) => (w.i === 4 ? 'wide' : 'cond')} scale={(w) => (w.i === 4 ? 1 : w.i === 5 ? 0.5 : 0.3)} anim={(w) => (w.i === 4 ? 'punch' : 'rise')} dur={0.26} curve={{ peak: 1, hold: 0.86 }} />
        <div style={{ position: 'absolute', left: 140, top: 790, fontFamily: VF.hud, fontWeight: 700, fontSize: 22, letterSpacing: '0.24em', color: heat(0.7) }}>SCENE 34 · TAKE 01</div>
        <div style={{ position: 'absolute', right: 140, top: 790, fontFamily: VF.hud, fontWeight: 700, fontSize: 22, letterSpacing: '0.24em', color: heat(0.7) }}>● ROLLING</div>
      </Sc>
    ),
  },
  {
    id: 'v3d', from: 96.72, to: 98.12,
    heat: (t) => {
      const lockAt = wt(35, 4) - 0.03;
      const locked = t >= lockAt;
      const tc = fmtTC(locked ? lockAt : t);
      const flash = decay(t, lockAt, 7);
      return (
        <Sc t={t} from={96.72} to={98.12} exit="cut" enterDur={0.01}>
          <Lyric t={t} words={ws(35, 0, 1)} cap={150} y={276} style="cond" anim="punch" dur={0.24} curve={{ peak: 1, hold: 0.86 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', fontFamily: VF.hud, fontWeight: 800, fontSize: 150, letterSpacing: '0.04em', color: heat(locked ? 0.95 : 0.62), textShadow: `0 0 ${30 + flash * 60}px ${heat(1, 0.4 + flash * 0.5)}` }}>{tc}</div>
          {locked && <div style={{ position: 'absolute', left: 0, right: 0, top: 616, textAlign: 'center', fontFamily: VF.hud, fontWeight: 700, fontSize: 24, letterSpacing: '0.3em', color: heat(0.85), opacity: easeOutCubic(clamp((t - lockAt) / 0.2)) }}>✓ IN SYNC</div>}
          <Lyric t={t} words={ws(35, 1)} cap={84} y={850} style={(w) => (w.i === 4 ? 'serif' : 'cond')} scale={(w) => (w.i === 4 ? 1.5 : 1)} anim={(w) => (w.i === 4 ? 'blur' : 'rise')} keepPunct={false} dur={0.36} curve={{ peak: 1, hold: 0.86 }} />
        </Sc>
      );
    },
  },
  {
    id: 'v3e', from: 98.12, to: 99.82,
    heat: (t) => (
      <Sc t={t} from={98.12} to={99.82} exit="cut" enterDur={0.01}>
        <Blob x={480} y={560} r={520} v={0.12} />
        <Lyric {...mirrorBF(t)} />
      </Sc>
    ),
    layer: (t, ti) => {
      const open = easeOutCubic(clamp((t - 98.14) / 0.35));
      return (
        <Pane id="th-bff" blend={[{ name: 'IRONBOW', w: 1 }]} clip={`inset(0 0 0 ${960 + (1 - open) * 960}px)`}>
          <AbsoluteFill style={{ transform: 'scaleX(-1)' }}>
            <Room t={t} ti={ti} />
            <Blob x={480} y={560} r={520} v={0.16} />
            <Lyric {...mirrorBF(t)} heatMul={1.05} />
          </AbsoluteFill>
        </Pane>
      );
    },
    over: (t) => {
      const open = easeOutCubic(clamp((t - 98.14) / 0.35));
      const op = 1 - clamp((t - 99.72) / 0.1);
      const beat = grid(t).pulse;
      return (
        <>
          <div style={{ position: 'absolute', left: 958, top: 540 - 540 * open, width: 4, height: 1080 * open, background: 'linear-gradient(180deg, transparent, #fff 20%, #ffe2c8 50%, #fff 80%, transparent)', boxShadow: '0 0 24px rgba(255,210,170,0.9)', opacity: op }} />
          <div style={{ position: 'absolute', left: 960 - 40, top: 540 - 44, width: 80, textAlign: 'center', fontSize: 64, lineHeight: 1, color: '#ff5a8a', textShadow: '0 0 24px rgba(255,80,140,0.9)', transform: `scale(${(0.8 + 0.25 * beat) * open})`, opacity: op }}>♥</div>
          <div style={{ position: 'absolute', right: 990, bottom: 150, fontFamily: VF.hud, fontSize: 16, letterSpacing: '0.24em', color: HUD_INK, opacity: op * open * 0.8 }}>◀ SUBJECT · ARCTIC</div>
          <div style={{ position: 'absolute', left: 990, bottom: 150, fontFamily: VF.hud, fontSize: 16, letterSpacing: '0.24em', color: HUD_INK, opacity: op * open * 0.8 }}>BEST FRIEND · IRONBOW ▶</div>
        </>
      );
    },
  },
  {
    id: 'v3f', from: 99.82, to: 101.33,
    heat: (t) => (
      <Sc t={t} from={99.82} to={101.33} exit="cut" enterDur={0.01}>
        <Lyric t={t} words={ws(37)} lines={[2, 2, 1]} cap={220} maxW={1400} lineStep={1.18}
          style={(w) => (w.i === 2 || w.i === 3 ? 'wide' : 'cond')} scale={(w) => (w.i === 2 || w.i === 3 ? 1 : 0.36)} anim={(w) => (w.i === 2 || w.i === 3 ? 'punch' : 'rise')} dur={0.24} curve={{ peak: 1, hold: 0.86 }} />
      </Sc>
    ),
    over: (t) => {
      const chips = [[230, 250], [1560, 300], [300, 800], [1500, 760], [180, 520], [1640, 540], [760, 190], [1180, 900]];
      const start = wt(37, 2) - 0.05;
      return (
        <>
          {chips.map(([x, y], i) => {
            const at = start + i * (60 / 154 / 2);
            const l = t - at;
            if (l < 0) return null;
            const p = easeOutBack(clamp(l / 0.22), 2.2);
            const op = 1 - clamp((t - 101.2) / 0.12);
            return (
              <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${p})`, padding: '8px 16px', border: '2px solid #7dffa8', color: '#7dffa8', background: 'rgba(0,0,0,0.4)', fontFamily: VF.hud, fontWeight: 800, fontSize: 24, letterSpacing: '0.18em', opacity: op, whiteSpace: 'nowrap' }}>YES ✓</div>
            );
          })}
        </>
      );
    },
  },
  {
    id: 'v3g', from: 101.33, to: 102.86,
    heat: (t) => {
      const dropAt = wt(38, 1) - 0.08;
      const p = easeOutBack(clamp((t - dropAt) / 0.32), 2.4);
      const land = dropAt + 0.2;
      return (
        <Sc t={t} from={101.33} to={102.86} exit="cut" enterDur={0.01}>
          <Blob x={1450} y={760} r={260} v={0.18} sy={0.3} />
          {t >= land && [0, 1, 2].map((k) => { const l = ((t - land) * 1.2 + k / 3) % 1; return <Ring key={k} x={1450} y={760} r={40 + l * 320} v={0.6 * (1 - l)} w={5} blur={2} />; })}
          {t >= dropAt && <MapPin x={1450} y={lerp(-200, 760, clamp(p, 0, 1.2))} s={1.5} v={0.95} />}
          <Lyric t={t} words={ws(38)} lines={[3, 3]} align="left" x={130} y={540} cap={210} maxW={1060} lineStep={1.24}
            style={(w) => (w.i === 1 ? 'wide' : w.i === 5 ? 'serif' : 'cond')} scale={(w) => (w.i === 1 ? 1 : w.i === 5 ? 0.86 : 0.36)} anim={(w) => (w.i === 1 ? 'punch' : w.i === 5 ? 'blur' : 'rise')} dur={0.3} curve={{ peak: 1, hold: 0.86 }} />
        </Sc>
      );
    },
    over: (t) => {
      const at = wt(38, 1) + 0.2;
      if (t < at) return null;
      const op = easeOutCubic(clamp((t - at) / 0.2)) * (1 - clamp((t - 102.74) / 0.12));
      return <div style={{ position: 'absolute', left: 1450 - 200, width: 400, top: 800, textAlign: 'center', fontFamily: VF.hud, fontWeight: 700, fontSize: 22, letterSpacing: '0.3em', color: '#ffd27a', opacity: op }}>● YOU ARE HERE</div>;
    },
  },
  {
    id: 'v3h', from: 102.86, to: 105.08,
    heat: (t) => {
      const spin = easeInOutCubic(clamp((t - 102.9) / 0.8));
      const rot = (t - 102.86) * 380 * spin;
      return (
        <Sc t={t} from={102.86} to={105.08} exit="cut" enterDur={0.01}>
          <Snow t={t} t0={102.9} />
          <Fan x={1420} y={540} r={400} rot={rot} />
          <Lyric t={t} words={ws(39)} lines={[3, 1, 3]} align="left" x={130} y={540} cap={250} maxW={900} lineStep={1.2} keepPunct={false}
            style={(w) => (w.i === 3 ? 'wide' : 'cond')} scale={(w) => (w.i === 3 ? 1 : w.i === 6 ? 0.5 : 0.32)} anim={(w) => (w.i === 3 ? 'punch' : 'rise')} dur={0.26} curve={{ peak: 1, hold: 0.86 }} />
        </Sc>
      );
    },
  },
  // ───────────────────────── HOOK 2 (GOLD → LAVA → SCANDAL) ─────────────────────────
  {
    id: 'h2a', from: 105.08, to: 108.11,
    heat: (t) => {
      const melt = easeInOutCubic(clamp((t - 106.6) / 1.5));
      const lp = hook2Title(t, 1979 + melt * 46);
      const all = boxOf({ ...lp, t: 99 });
      const row2 = boxOf({ ...lp, t: 99 }, (w) => w.i >= 4);
      const push = 1 + 0.05 * easeInOutCubic(clamp((t - 105.1) / 3));
      return (
        <Sc t={t} from={105.08} to={108.11} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ transform: `scale(${push})` }}>
            <Blob x={960} y={520} r={900} v={0.16} sy={0.7} />
            <Lyric t={t} words={ws(40, 0, 2)} cap={58} y={228} style="cond" gap={0.5} anim="rise" curve={{ peak: 1, hold: 0.78 }} />
            <Drips t={t} x0={row2.x0 + 30} x1={row2.x1 - 30} y={row2.y1 - 4} start={107.0} n={12} v={0.86} len={130} fall={220} seed={12} w={17} />
            <Lyric {...lp} />
            {t > 106.5 && <Glints t={t} x0={all.x0} x1={all.x1} y0={all.y0} y1={all.y1} n={9} seed={3} />}
          </AbsoluteFill>
        </Sc>
      );
    },
  },
  {
    id: 'h2b', from: 108.11, to: 111.22,
    heat: (t) => (
      <Sc t={t} from={108.11} to={111.22} exit="cut" enterDur={0.01}>
        <Flashes t={t} from={wt(41, 4) - 0.02} to={111.1} seed={5} />
        <Lyric t={t} words={ws(41, 0, 4)} cap={92} y={330} style="serif" gap={0.36} anim="rise" dur={0.4} curve={{ peak: 1, hold: 0.82 }} />
        <Lyric t={t} words={ws(41, 4)} cap={300} y={600} maxW={1600} style="serif" keepPunct anim="blur" dur={0.5} curve={{ peak: 1, hold: 0.92 }} />
      </Sc>
    ),
    over: (t) => {
      const at = wt(41, 4);
      if (t < at) return null;
      const op = easeOutCubic(clamp((t - at) / 0.2)) * (1 - clamp((t - 111.1) / 0.12));
      return (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 872, display: 'flex', justifyContent: 'center', opacity: op }}>
          <div style={{ fontFamily: VF.hud, fontWeight: 700, fontSize: 20, letterSpacing: '0.3em', color: HUD_INK, padding: '6px 16px', border: `2px solid ${HUD_INK}` }}>◉ FLASH ×{Math.floor((t - at) * 5.13 * 2)}</div>
        </div>
      );
    },
  },
  {
    id: 'h2c', from: 111.22, to: 114.5,
    heat: (t) => {
      const lean = 0.09 * Math.sin((t - 111.2) * 2.6) + 0.05 * grid(t).pulse;
      const partB = t >= wt(42, 5) - 0.08;
      const xs = [360, 660, 960, 1260, 1560];
      const base = wt(42, 4) - 0.05;
      return (
        <Sc t={t} from={111.22} to={114.5} exit="cut" enterDur={0.01}>
          {xs.map((x, i) => <Candle key={i} t={t} x={x} top={760 - (i % 2) * 40} lit={base + i * (60 / 154 / 2)} lean={lean * (i % 2 ? 1 : 0.85)} seed={i + 20} w={88} fh={170} />)}
          {!partB && <Lyric t={t} words={ws(42, 0, 5)} lines={[4, 1]} cap={200} y={320} maxW={1500} lineStep={1.18} style={(w) => (w.i === 4 ? 'serif' : 'cond')} scale={(w) => (w.i === 4 ? 1 : 0.3)} anim={(w) => (w.i === 4 ? 'blur' : 'rise')} dur={0.4} curve={{ peak: 1, hold: 0.86 }} />}
          {partB && <Lyric t={t} words={ws(42, 5)} lines={[2, 3]} cap={200} y={320} maxW={1400} lineStep={1.18} style={(w) => (w.i === 6 ? 'melt' : 'cond')} scale={(w) => (w.i === 6 ? 1 : w.i === 9 ? 0.5 : 0.32)} anim={(w) => (w.i === 6 ? 'punch' : 'rise')} dur={0.3} year={(w, local) => (w.i === 6 ? 1979 + clamp(local / 1.0) * 50 : 1979)} curve={{ peak: 1, hold: 0.88 }} />}
        </Sc>
      );
    },
  },
  {
    id: 'h2d', from: 114.5, to: 118.07,
    heat: (t, ti) => {
      const beat = heartBeats2.reduce((m, h) => (ti >= h ? Math.max(m, Math.exp(-(ti - h) * 8)) : m), 0);
      const popped = ti >= POP2;
      const grow = easeOutCubic(clamp((ti - 114.52) / 0.3));
      const frozen = t >= 115.62 && t < 118.03;
      const crackP = clamp((t - (wt(43, 6) + 0.1)) / 1.2);
      return (
        <Sc t={t} from={114.5} to={118.07} exit="none" enterDur={0.01}>
          <AbsoluteFill style={{ opacity: frozen ? 0.6 : 1 }}>
            {!popped && <Lyric t={ti} words={ws(43, 0, 2)} cap={84} y={196} style="cond" gap={0.45} anim="rise" curve={{ peak: 1, hold: 0.8 }} />}
            {!popped && <HeatHeart x={960} y={600} size={580 * grow * (1 + 0.18 * clamp((ti - 114.9) / 0.5))} v={0.8 + 0.2 * beat} beat={beat} id="popheart2" />}
            <Sparks t={ti} at={POP2} x={960} y={600} n={110} r={1200} gravity={380} dur={2.2} seed={17} />
            {popped && <Ring x={960} y={600} r={200 + easeOutExpo(clamp((ti - POP2) / 0.5)) * 760} v={0.85 * (1 - clamp((ti - POP2) / 0.5))} w={16} blur={6} />}
            {popped && <Punch t={ti} words={ws(43, 2, 3)} style="melt" cap={360} maxW={1300} year={(w, local) => 1979 + clamp(local / 0.2) * 30} />}
          </AbsoluteFill>
          {frozen && Array.from({ length: 4 }).map((_, i) => {
            const f = Math.floor(t * 12);
            return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: rand(f * 2.9 + i * 5) * 1080, height: 3, background: heat(0.55), opacity: 0.5 }} />;
          })}
          {t >= wt(43, 3) - 0.05 && (
            <AbsoluteFill style={{ transform: `rotate(-8deg) scale(${lerp(1.5, 1, easeOutExpo(clamp((t - wt(43, 3) + 0.05) / 0.2)))})`, transformOrigin: '400px 236px' }}>
              <Lyric t={t} words={ws(43, 3, 4)} cap={124} x={400} y={236} style="serif" keepPunct anim="none" curve={{ pre: 0, peak: 1, hold: 0.95 }} />
            </AbsoluteFill>
          )}
          <Lyric t={t} words={ws(43, 4)} cap={96} y={900} maxW={1500} keepPunct style={(w) => (w.i === 6 ? 'wide' : 'cond')} scale={(w) => (w.i === 6 ? 1.15 : 0.8)} anim="punch" dur={0.2} curve={{ peak: 1, hold: 0.9 }} />
          {crackP > 0 && <Cracks x={1280} y={420} p={crackP} v={0.9} seed={8} n={13} r={1500} w={3.5} />}
          {crackP > 0.5 && <Cracks x={560} y={700} p={(crackP - 0.5) * 2} v={0.85} seed={19} n={9} r={900} w={3} />}
        </Sc>
      );
    },
  },
];
