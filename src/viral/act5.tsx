import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';
import { Lyric, LyricProps, Punch, W } from './type';
import { heat } from './thermal';
import { Blob, Crowd, HeatFlame, KissPrint, MarqueeRows, Sparks } from './world';
import { VScene, Sc, Pane, ws, HUD_INK } from './kit';
import { Brackets, Room, boxOf, TITLE_WORDS } from './act1';
import { Slices } from './fx';
import { Drips } from './act3';
import { beatTime, grid } from './story';
import { VF } from './fonts';

const decay = (t: number, at: number, rate = 6) => (t >= at ? Math.exp(-(t - at) * rate) : 0);

/** The frozen frame shatters: shards of the old image fly out from the centre. */
const Shards: React.FC<{ t: number; at: number; n?: number; dur?: number }> = ({ t, at, n = 28, dur = 0.9 }) => {
  const l = t - at;
  if (l < 0 || l > dur) return null;
  const p = l / dur;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1920} height={1080}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + rand(i * 3.1) * 0.4;
        const d0 = 60 + rand(i * 1.7) * 380;
        const sp = 900 + rand(i * 2.9) * 1400;
        const cx = 960 + Math.cos(a) * (d0 + sp * l), cy = 540 + Math.sin(a) * (d0 + sp * l) + 500 * l * l;
        const s = 60 + rand(i * 7.3) * 120;
        const rot = (rand(i * 5.5) - 0.5) * 900 * l;
        const pts = [0, 1, 2].map((k) => { const b = (k / 3) * Math.PI * 2 + rand(i * 9 + k) * 1.2; const r = s * (0.5 + rand(i * 4 + k) * 0.6); return `${(Math.cos(b) * r).toFixed(1)},${(Math.sin(b) * r).toFixed(1)}`; }).join(' ');
        return <polygon key={i} points={pts} transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot.toFixed(1)})`} fill={heat(0.55 + 0.4 * rand(i * 6.1))} stroke={heat(1)} strokeWidth={3} opacity={1 - p * p} />;
      })}
    </svg>
  );
};

/** Concert pyro: a flame column that bursts on a kick and burns down. */
const PYRO = [121.17, 122.73, 124.28, 125.84, 127.39, 128.95];
const pyroH = (t: number) => PYRO.reduce((m, at) => {
  const l = t - at;
  if (l < 0 || l > 1.0) return m;
  return Math.max(m, easeOutExpo(clamp(l / 0.1)) * Math.exp(-l * 3.2));
}, 0);
const Pyro: React.FC<{ t: number; xs: number[]; h: number }> = ({ t, xs, h }) => {
  const e = pyroH(t);
  if (e < 0.03) return null;
  return (
    <>
      {xs.map((x, i) => (
        <React.Fragment key={i}>
          <Blob x={x} y={1000 - h * e * 0.5} r={h * 0.5 * e + 60} v={0.4 * e} sy={1.6} />
          <HeatFlame t={t * 1.8} x={x} y={1090} h={h * e} seed={40 + i} lean={(i % 2 ? 1 : -1) * 0.04} />
        </React.Fragment>
      ))}
    </>
  );
};

/** ⊘ drawn in heat. */
const NoSign: React.FC<{ x: number; y: number; r: number; p: number; slash: number; v?: number; w?: number }> = ({ x, y, r, p, slash, v = 0.95, w = 44 }) => (
  <svg style={{ position: 'absolute', left: x - r - w, top: y - r - w, overflow: 'visible', mixBlendMode: 'lighten' }} width={(r + w) * 2} height={(r + w) * 2} viewBox={`${-r - w} ${-r - w} ${(r + w) * 2} ${(r + w) * 2}`}>
    <circle r={r} fill="none" stroke={heat(v)} strokeWidth={w * 2.2} opacity={0.25} style={{ filter: 'blur(16px)' }} pathLength={1} strokeDasharray={`${p} 1`} transform="rotate(-135)" />
    <circle r={r} fill="none" stroke={heat(v)} strokeWidth={w} pathLength={1} strokeDasharray={`${p} 1`} transform="rotate(-135)" strokeLinecap="round" />
    {slash > 0 && <line x1={-r * 0.707} y1={-r * 0.707} x2={-r * 0.707 + r * 1.414 * slash} y2={-r * 0.707 + r * 1.414 * slash} stroke={heat(v)} strokeWidth={w} strokeLinecap="round" />}
  </svg>
);

const COUNT = [beatTime(306), beatTime(307), beatTime(308)];
const DROP = 121.17;

const outroMirror = (t: number): LyricProps => ({
  t, words: ws(45), lines: [4, 1, 1], x: 480, y: 540, cap: 210, maxW: 800, lineStep: 1.2, keepPunct: true,
  style: (w) => (w.i === 4 ? 'grotWide' : w.i === 5 ? 'serif' : 'cond'), scale: (w) => (w.i === 4 ? 1 : w.i === 5 ? 0.5 : 0.3),
  anim: (w) => (w.i === 4 ? 'flex' : w.i === 5 ? 'blur' : 'rise'), dur: 0.5, curve: { peak: 1, hold: 0.84 },
});

// End tag: the title lands one word per beat with the band's return.
const TAG_T = [beatTime(350), beatTime(351), beatTime(352), beatTime(353)];
const TAG_WORDS: W[] = TITLE_WORDS.map((w, i) => ({ ...w, t: TAG_T[i] }));
const LAST = 141.41;
const tagProps = (t: number, v: number | null, year: number): LyricProps => ({
  t, words: TAG_WORDS, lines: [2, 2], style: 'melt', cap: 196, maxW: 1480, lineStep: 1.28, anim: v === null ? 'punch' : 'none', dur: 0.24,
  curve: v === null ? { peak: 1, hold: 0.9, decay: 0.5 } : { pre: v, peak: v, hold: v }, year,
});

export const ACT5: VScene[] = [
  // ───────────────────────── 1:58 SENSOR FAILURE ─────────────────────────
  {
    id: 'd0', from: 118.07, to: 120.85,
    heat: (t) => {
      const cd = COUNT.findIndex((c, i) => t >= c && (i === COUNT.length - 1 || t < COUNT[i + 1]));
      const dim = t >= COUNT[0] - 0.05 ? 0.35 : 1;
      const gl = t < 118.4 ? 1 - (t - 118.07) / 0.33 : 0;
      return (
        <Sc t={t} from={118.07} to={120.85} exit="cut" enterDur={0.01}>
          <Slices t={t} amt={gl} n={9} maxShift={200} seed={31}>
            <AbsoluteFill style={{ opacity: dim }}>
              <MarqueeRows t={t} text="TOO HOT TO HANDLE" rows={6} size={170} speed={520} v={0.62} year={1979 + clamp((t - 118.07) / 2.6) * 30} />
            </AbsoluteFill>
          </Slices>
          <Shards t={t} at={118.07} />
          {cd >= 0 && (() => {
            const l = t - COUNT[cd];
            const e = easeOutExpo(clamp(l / 0.18));
            const op = 1 - clamp((l - 0.26) / 0.1);
            return (
              <div style={{ position: 'absolute', left: 0, right: 0, top: 540 - 330, height: 660, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VF.wide, fontWeight: 900, fontSize: 620, lineHeight: 1, color: heat(1), textShadow: `0 0 60px ${heat(1, 0.7)}, 0 0 160px ${heat(1, 0.4)}`, transform: `scale(${1.3 - 0.3 * e})`, opacity: op }}>{3 - cd}</div>
            );
          })()}
        </Sc>
      );
    },
  },
  // ───────────────────────── THE DROP ─────────────────────────
  {
    id: 'd1', from: 120.85, to: 124.0,
    heat: (t) => {
      const g = grid(t);
      const melt = easeInCubic(clamp((t - DROP) / 2.8));
      return (
        <Sc t={t} from={120.85} to={124.0} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ opacity: 0.2 }}><MarqueeRows t={t} text="TOO HOT TO HANDLE" rows={6} size={170} speed={600} v={0.8} /></AbsoluteFill>
          <Pyro t={t} xs={[170, 1750]} h={760} />
          <Lyric t={t} words={ws(44, 0, 2)} cap={330} maxW={1720} y={410} style="melt" keepPunct={false} anim="punch" dur={0.2} year={1979 + melt * 71} curve={{ peak: 1, hold: 0.92, decay: 0.6 }} />
          {t > DROP && <Drips t={t} x0={200} x1={1720} y={410 + 165} start={DROP + 0.8} n={16} v={0.9} len={150} fall={240} seed={44} w={20} />}
          <Crowd t={t} beat={g.idx + g.frac} y={1200} rows={3} v={0.72} phones={0.4} seed={21} jump={t >= DROP ? 1.5 : 0.4} />
        </Sc>
      );
    },
  },
  {
    id: 'd2', from: 124.0, to: 127.88,
    heat: (t) => {
      const g = grid(t);
      const noAt = 124.0;
      const ring = easeInOutCubic(clamp((t - noAt - 0.05) / 0.45));
      const pulse = g.pulse;
      return (
        <Sc t={t} from={124.0} to={127.88} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ opacity: 0.2 }}><MarqueeRows t={t} text="TOO HOT TO HANDLE" rows={6} size={170} speed={600} v={0.8} /></AbsoluteFill>
          <Pyro t={t} xs={[170, 1750]} h={760} />
          <AbsoluteFill style={{ transform: `scale(${1 + 0.03 * pulse})` }}>
            <NoSign x={960} y={460} r={390} p={ring} slash={0} v={0.9} />
            <Lyric t={t} words={ws(44, 2, 3)} cap={430} maxW={1200} y={460} style="cond" anim="punch" dur={0.22} curve={{ peak: 1, hold: 0.92 }} />
          </AbsoluteFill>
          <Crowd t={t} beat={g.idx + g.frac} y={1200} rows={3} v={0.72} phones={0.4} seed={21} jump={1.5} />
        </Sc>
      );
    },
  },
  {
    id: 'd3', from: 127.88, to: 129.95,
    heat: (t) => {
      const g = grid(t);
      const sAt = 127.9;
      const up = easeOutCubic(clamp((t - sAt) / 0.3));
      const slash = easeOutExpo(clamp((t - sAt - 0.08) / 0.25));
      const wall = clamp((t - 127.96) / 0.25);
      const off = easeInCubic(clamp((t - 129.3) / 0.6));
      return (
        <Sc t={t} from={127.88} to={129.95} exit="none" enterDur={0.01}>
          <AbsoluteFill style={{ transform: `translateY(${off * 260}px) scaleY(${1 + off * 0.4})`, filter: off > 0.02 ? `blur(${off * 14}px)` : undefined, opacity: 1 - off * 0.9 }}>
            {wall > 0 && Array.from({ length: 9 }).map((_, i) => <HeatFlame key={i} t={t * 1.6} x={110 + i * 212} y={1100} h={(300 + 160 * rand(i * 3.3)) * easeOutBack(wall, 1.5)} seed={60 + i} lean={(rand(i) - 0.5) * 0.1} />)}
            <Crowd t={t} beat={g.idx + g.frac} y={1240} rows={2} v={0.7} phones={0.3} seed={22} jump={1.5} />
            <NoSign x={960} y={540} r={lerp(390, 470, up)} p={1} slash={slash} v={0.92} w={40} />
            <Lyric t={t} words={ws(44, 2, 3)} cap={lerp(430, 110, up)} maxW={1200} y={lerp(460, 318, up)} style="cond" anim="none" curve={{ pre: 0.92, peak: 0.92, hold: 0.92 }} />
            <Lyric t={t} words={ws(44, 3)} cap={250} maxW={1560} y={580} style="wide" anim="punch" dur={0.22} year={1979} curve={{ peak: 1, hold: 0.96 }} />
          </AbsoluteFill>
        </Sc>
      );
    },
  },
  // ───────────────────────── OUTRO: reboot, the mirror again ─────────────────────────
  {
    id: 'o0', from: 129.95, to: 130.3,
    heat: (t) => {
      const p = clamp((t - 129.95) / 0.35);
      return (
        <AbsoluteFill style={{ background: '#000' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: p * 1080 - 30, height: 60, background: `linear-gradient(180deg, transparent, ${heat(0.5)}, transparent)` }} />
        </AbsoluteFill>
      );
    },
  },
  {
    id: 'o1', from: 130.3, to: 133.72,
    heat: (t) => (
      <Sc t={t} from={130.3} to={133.72} exit="cool" exitDur={0.3} enterDur={0.2}>
        <Blob x={480} y={560} r={520} v={0.12} />
        <Lyric {...outroMirror(t)} />
      </Sc>
    ),
    layer: (t, ti) => {
      const open = easeOutCubic(clamp((t - 130.32) / 0.45));
      const out = clamp((t - 133.42) / 0.3);
      return (
        <Pane id="th-mirror2" blend={[{ name: 'IRONBOW', w: 1 }]} clip={`inset(0 0 0 ${960 + (1 - open) * 960}px)`} style={{ opacity: 1 - out }}>
          <AbsoluteFill style={{ transform: 'scaleX(-1)' }}>
            <Room t={t} ti={ti} />
            <Blob x={480} y={560} r={520} v={0.16} />
            <Lyric {...outroMirror(t)} />
          </AbsoluteFill>
        </Pane>
      );
    },
    over: (t) => {
      const open = easeOutCubic(clamp((t - 130.32) / 0.45));
      const op = 1 - clamp((t - 133.42) / 0.3);
      return (
        <>
          <div style={{ position: 'absolute', left: 958, top: 540 - 540 * open, width: 4, height: 1080 * open, background: 'linear-gradient(180deg, transparent, #fff 20%, #ffe2c8 50%, #fff 80%, transparent)', boxShadow: '0 0 24px rgba(255,210,170,0.9)', opacity: op }} />
          <div style={{ position: 'absolute', right: 990, bottom: 150, fontFamily: VF.hud, fontSize: 16, letterSpacing: '0.24em', color: HUD_INK, opacity: op * open * 0.8 }}>◀ SUBJECT · ARCTIC</div>
          <div style={{ position: 'absolute', left: 990, bottom: 150, fontFamily: VF.hud, fontSize: 16, letterSpacing: '0.24em', color: HUD_INK, opacity: op * open * 0.8 }}>REFLECTION · IRONBOW ▶</div>
        </>
      );
    },
  },
  {
    id: 'o2', from: 133.72, to: 136.72,
    heat: (t) => {
      const kiss = 135.57;
      const kv = t >= kiss ? lerp(1, 0.56, easeOutCubic(clamp((t - kiss) / 2.4))) : 0;
      const kp = easeOutBack(clamp((t - kiss) / 0.16), 2);
      return (
        <Sc t={t} from={133.72} to={136.72} exit="cool" exitDur={0.25} enterDur={0.25}>
          <Lyric t={t} words={ws(46)} lines={[1, 2]} cap={210} maxW={1300} y={470} lineStep={1.3}
            style={(w) => (w.i === 0 ? 'serif' : 'cond')} scale={(w) => (w.i === 0 ? 1 : 0.4)} anim={(w) => (w.i === 0 ? 'blur' : 'rise')} dur={0.5} curve={{ peak: 1, hold: 0.84 }} />
          {t >= kiss && (
            <AbsoluteFill style={{ transform: `scale(${kp})`, transformOrigin: '1500px 830px' }}>
              <Blob x={1500} y={820} r={300} v={0.3 * kv} />
              <KissPrint x={1500} y={820} w={420} v={kv} rot={-14} />
            </AbsoluteFill>
          )}
        </Sc>
      );
    },
  },
  // ───────────────────────── END TAG + LOOP ─────────────────────────
  {
    id: 'o3', from: 136.72, to: 143.4,
    hud: (t) => 1 - clamp((t - 142.3) / 1.0),
    heat: (t) => {
      const settled = t >= LAST + 0.25;
      const cool = easeInOutCubic(clamp((t - (LAST + 0.25)) / 1.3));
      const melt = clamp((t - 138.3) / 3.1);
      const kicks = grid(t);
      const beatHeat = t < LAST ? 0.06 * kicks.pulse : 0;
      const year = settled ? lerp(1979 + melt * 30, 1979, cool) : 1979 + melt * 30;
      const v = settled ? lerp(0.9, 0.2, cool) : null;
      const lp = tagProps(t, v, year);
      const row2 = boxOf({ ...lp, t: 99 }, (w) => w.i >= 2);
      return (
        <>
          <Blob x={960} y={560} r={760} v={settled ? lerp(0.24, 0.096, cool) : 0.2 + beatHeat} />
          {!settled && t > 138.3 && <Sparks t={t} at={138.3} x={960} y={560} n={40} r={800} gravity={-60} dur={3.1} seed={77} />}
          {!settled && t > 138.6 && <Drips t={t} x0={row2.x0 + 30} x1={row2.x1 - 30} y={row2.y1 - 4} start={138.6} n={12} v={0.86} len={110} fall={200} seed={91} w={17} />}
          <AbsoluteFill style={{ transform: `scale(${1 + beatHeat * 0.3})` }}>
            <Lyric {...lp} />
          </AbsoluteFill>
        </>
      );
    },
    over: (t) => {
      if (t < LAST + 0.6) return null;
      // close on the opening frame's framing so the video loops
      const p = easeInOutCubic(clamp((t - (LAST + 0.6)) / 1.0));
      const b = boxOf(tagProps(99, 0.2, 1979));
      const pad = 40;
      const x = lerp(b.x0 - pad, 110, p), y = lerp(b.y0 - pad, 150, p);
      const w = lerp(b.w + pad * 2, 1700, p), h = lerp(b.h + pad * 2, 790, p);
      const op = clamp((t - (LAST + 0.6)) / 0.3) * (1 - clamp((t - 142.6) / 0.6));
      return <Brackets x={x} y={y} w={w} h={h} op={op} label="ACQUIRING…" />;
    },
  },
];
