import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeInCubic, easeInOutCubic, easeOutCubic, easeOutExpo, lerp, rand, cue } from '../lib/time';
import { Lyric, layout, LyricProps, W } from './type';
import { heat } from './thermal';
import { Blob, Crowd, Figure, HeatField, HeatGrain, HeatVignette, Ring } from './world';
import { VScene, Sc, Pane, ws, wt, HUD_INK } from './kit';
import { ambientAt, beatTime, grid, PERIOD } from './story';
import { VF } from './fonts';

const word = (w: string, t: number, i: number): W => ({ w, t, i });
const TM_DY = 300;
export const TITLE_WORDS = [word('TOO', 0, 0), word('HOT', 0, 1), word('TO', 0, 2), word('HANDLE', 0, 3)];

/** Corner brackets (camera focus/target box), colour overlay. */
export const Brackets: React.FC<{ x: number; y: number; w: number; h: number; len?: number; col?: string; op?: number; thick?: number; label?: string; labelR?: string }> = ({ x, y, w, h, len = 56, col = HUD_INK, op = 1, thick = 3, label, labelR }) => {
  const c = (s: React.CSSProperties) => <div style={{ position: 'absolute', width: len, height: len, ...s }} />;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, opacity: op }}>
      {c({ left: 0, top: 0, borderLeft: `${thick}px solid ${col}`, borderTop: `${thick}px solid ${col}` })}
      {c({ right: 0, top: 0, borderRight: `${thick}px solid ${col}`, borderTop: `${thick}px solid ${col}` })}
      {c({ left: 0, bottom: 0, borderLeft: `${thick}px solid ${col}`, borderBottom: `${thick}px solid ${col}` })}
      {c({ right: 0, bottom: 0, borderRight: `${thick}px solid ${col}`, borderBottom: `${thick}px solid ${col}` })}
      {label && <div style={{ position: 'absolute', left: 0, top: -34, fontFamily: VF.hud, fontSize: 17, fontWeight: 700, letterSpacing: '0.18em', color: col, whiteSpace: 'nowrap' }}>{label}</div>}
      {labelR && <div style={{ position: 'absolute', right: 0, bottom: -32, fontFamily: VF.hud, fontSize: 16, letterSpacing: '0.16em', color: col, whiteSpace: 'nowrap' }}>{labelR}</div>}
    </div>
  );
};

/** The room behind a second pane (field, vignette, grain), so split views read as one camera. */
export const Room: React.FC<{ t: number; ti: number; amb?: number }> = ({ t, ti, amb }) => (
  <>
    <HeatField t={ti} amb={amb ?? ambientAt(ti)} />
    <HeatVignette />
    <HeatGrain frame={Math.floor(t * 30) + 7} />
  </>
);

/** Bounding box of a laid-out block (for overlays that frame words). */
export const boxOf = (p: LyricProps, pick?: (w: W) => boolean) => {
  const { boxes } = layout(p);
  const bs = pick ? boxes.filter((b) => pick(b.w0)) : boxes;
  const x0 = Math.min(...bs.map((b) => b.cx - b.w / 2));
  const x1 = Math.max(...bs.map((b) => b.cx + b.w / 2));
  const y0 = Math.min(...bs.map((b) => b.base - b.cap));
  const y1 = Math.max(...bs.map((b) => b.base));
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
};

// ───────────────────────── INTRO ─────────────────────────
const STRUMS = [0.17, 0.396, 0.786, 1.175, 1.565, 1.954];
const titleHeat = (t: number) => {
  let n = 0, kick = 0;
  for (const s of STRUMS) if (t >= s) { n++; kick = Math.max(kick, Math.exp(-(t - s) * 8)); }
  return Math.min(1, 0.2 + n * 0.135 + kick * 0.14);
};
export const titleProps = (v: number, year: number): LyricProps => ({ t: 99, words: TITLE_WORDS, lines: [2, 2], style: 'melt', cap: 196, maxW: 1480, lineStep: 1.28, anim: 'none', curve: { pre: v, peak: v, hold: v }, year });

const mirrorBlock = (t: number, flick = 0): LyricProps => ({
  t, words: ws(2), lines: [2, 3, 1], x: 480, y: 540, cap: 132, maxW: 800, lineStep: 1.34,
  style: (w) => (w.i === 5 ? 'serif' : 'cond'),
  scale: (w) => (w.i < 2 ? 0.6 : w.i === 5 ? 1.25 : 1),
  anim: (w) => (w.i === 5 ? 'blur' : 'rise'), dur: 0.4,
  curve: { peak: 1, hold: 0.7, decay: 0.5 },
  fx: flick ? (w, local, v) => (w.i === 5 && local > 0 ? { v: v * (0.55 + 0.45 * rand(Math.floor(t * 30) * 1.3)) } : undefined) : undefined,
});

// The walk-in: one step per beat out of a doorway on the right, growing as he comes toward camera.
const DOOR = { x: 1460, w: 330, top: 214, bot: 860 };
const walkIn = (t: number) => {
  const near = easeInOutCubic(clamp((t - 7.45) / 1.9));
  const h = lerp(300, 840, near);
  const feet = lerp(820, 1036, near);
  const phase = (t - beatTime(19)) / PERIOD;
  const k = h / 100;
  const s = Math.sin(phase * Math.PI);
  const bob = (1 - Math.abs(s)) * 1.3;
  const hx = DOOR.x + s * 1.1 * k;
  return { near, h, feet, phase, hx, headY: feet + (-92.5 - bob) * k, chestY: feet + (-68 - bob) * k };
};

export const ACT1: VScene[] = [
  {
    id: 'title', from: 0, to: 2.34,
    heat: (t) => {
      const v = titleHeat(t);
      const melt = clamp((t - 1.98) / 0.34);
      const em = easeInCubic(melt);
      return (
        <>
          <Blob x={960} y={560} r={760} v={0.06 + v * 0.18} />
          <AbsoluteFill style={{ opacity: 1 - easeInCubic(clamp((t - 2.08) / 0.24)), transform: `translateY(${-em * 70}px) scale(${1 + t * 0.012})`, filter: melt > 0.04 ? `blur(${melt * 12}px)` : undefined }}>
            <Lyric {...titleProps(v, 1979 + em * 71)} />
          </AbsoluteFill>
        </>
      );
    },
    over: (t) => {
      const p = easeInOutCubic(clamp(t / 1.95));
      const b = boxOf(titleProps(1, 1979));
      const pad = 40;
      const x = lerp(110, b.x0 - pad, p), y = lerp(150, b.y0 - pad, p);
      const w = lerp(1700, b.w + pad * 2, p), h = lerp(790, b.h + pad * 2, p);
      const lock = t >= 1.954;
      const pulse = lock ? Math.exp(-(t - 1.954) * 8) : 0;
      const op = (t < 0.1 ? t / 0.1 : 1) * (1 - clamp((t - 2.0) / 0.2));
      return <Brackets x={x - pulse * 16} y={y - pulse * 16} w={w + pulse * 32} h={h + pulse * 32} op={op} col={lock ? '#ffd27a' : HUD_INK} label={lock ? 'SUBJECT 01 · LOCKED' : 'ACQUIRING…'} labelR={lock ? '36.6°C' : undefined} />;
    },
  },
  {
    id: 'c1', from: 2.3, to: 3.12,
    heat: (t) => (
      <Sc t={t} from={2.3} to={3.12} exit="cool" exitDur={0.26}>
        <Lyric t={t} words={ws(1)} style="serif" cap={92} keepPunct anim="blur" dur={0.45} curve={{ peak: 1, hold: 0.74, decay: 0.5 }} fx={(w, local) => ({ transform: `translateY(${-Math.max(0, local) * 34}px)` })} />
      </Sc>
    ),
  },
  {
    id: 'c2', from: 3.02, to: 7.48,
    heat: (t) => (
      <Sc t={t} from={3.02} to={7.48} exit="cut">
        <Blob x={480} y={560} r={520} v={0.14} />
        <Lyric {...mirrorBlock(t)} />
      </Sc>
    ),
    layer: (t, ti) => {
      const open = easeOutCubic(clamp((t - 3.05) / 0.4));
      const sheen = clamp((t - 5.85) / 0.8);
      if (t >= 7.48) return null;
      return (
        <Pane id="th-mirror" blend={[{ name: 'ARCTIC', w: 1 }]} clip={`inset(0 0 0 ${960 + (1 - open) * 960}px)`}>
          <AbsoluteFill style={{ transform: 'scaleX(-1)' }}>
            <Room t={t} ti={ti} />
            <Blob x={480} y={560} r={520} v={0.14} />
            <Lyric {...mirrorBlock(t, 1)} />
          </AbsoluteFill>
          {sheen > 0 && sheen < 1 && <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${lerp(-20, 110, sheen) - 8}%, ${heat(0.75, 0.55)} ${lerp(-20, 110, sheen)}%, transparent ${lerp(-20, 110, sheen) + 8}%)` }} />}
        </Pane>
      );
    },
    over: (t) => {
      const open = easeOutCubic(clamp((t - 3.05) / 0.4));
      const op = 1 - clamp((t - 7.38) / 0.1);
      return (
        <>
          <div style={{ position: 'absolute', left: 958, top: 540 - 540 * open, width: 4, height: 1080 * open, background: 'linear-gradient(180deg, transparent, #fff 20%, #dfe8ff 50%, #fff 80%, transparent)', boxShadow: '0 0 24px rgba(200,220,255,0.9)', opacity: op }} />
          <div style={{ position: 'absolute', left: 990, bottom: 150, fontFamily: VF.hud, fontSize: 16, letterSpacing: '0.24em', color: HUD_INK, opacity: op * open * 0.8 }}>REFLECTION · ARCTIC ▶</div>
          <div style={{ position: 'absolute', right: 990, bottom: 150, fontFamily: VF.hud, fontSize: 16, letterSpacing: '0.24em', color: HUD_INK, opacity: op * open * 0.8 }}>◀ SUBJECT</div>
        </>
      );
    },
  },
  {
    id: 'c3', from: 7.42, to: 10.1,
    heat: (t) => {
      const zoom = easeInCubic(clamp((t - 9.32) / 0.45));
      const textOut = easeInCubic(clamp((t - 9.18) / 0.22));
      const w = walkIn(t);
      return (
        <Sc t={t} from={7.42} to={10.1} exitDur={0.3} enterDur={0.12}>
          <AbsoluteFill style={{ transform: `scale(${1 + zoom * 7})`, transformOrigin: `${w.hx}px ${w.chestY}px`, filter: zoom > 0.05 ? `blur(${zoom * 8}px)` : undefined }}>
            {/* the doorway: a cool dark opening in a slightly warmer frame, a warm spill on the floor */}
            <div style={{ position: 'absolute', left: DOOR.x - DOOR.w / 2 - 26, top: DOOR.top - 26, width: DOOR.w + 52, height: DOOR.bot - DOOR.top + 26, background: heat(0.24), filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', left: DOOR.x - DOOR.w / 2, top: DOOR.top, width: DOOR.w, height: DOOR.bot - DOOR.top, background: `linear-gradient(180deg, ${heat(0.03)}, ${heat(0.1)})` }} />
            <div style={{ position: 'absolute', left: 0, top: DOOR.bot, width: 1920, height: 1080 - DOOR.bot, clipPath: `polygon(${DOOR.x - DOOR.w / 2}px 0, ${DOOR.x + DOOR.w / 2}px 0, ${DOOR.x + DOOR.w * 1.5}px 100%, ${DOOR.x - DOOR.w * 1.5}px 100%)`, background: `linear-gradient(180deg, ${heat(0.2 + 0.2 * w.near)}, ${heat(0.06)})`, filter: 'blur(8px)' }} />
            <Blob x={w.hx} y={w.chestY} r={w.h * 0.62} v={0.16 + 0.22 * w.near} sy={1.25} />
            <Figure x={DOOR.x} y={w.feet} h={w.h} v={0.97} phase={w.phase} id="walker" blur={2.5 + 2.5 * w.near} />
            <AbsoluteFill style={{ opacity: 1 - textOut, transform: `translateX(${-textOut * 200}px)` }}>
              <Lyric t={t} words={ws(3)} lines={[3, 2, 4]} align="left" x={150} y={540} cap={108} maxW={1000} keepPunct
                style={(w) => (w.i === 6 || w.i === 7 ? 'wide' : 'cond')} scale={(w) => (w.i === 6 || w.i === 7 ? 0.92 : 1)}
                anim="rise" dur={0.35} curve={{ peak: 1, hold: 0.66 }} fx={(w, l, v) => (w.i === 6 || w.i === 7 ? { v: l > 0 ? Math.max(v, 0.86) : v } : undefined)} />
            </AbsoluteFill>
          </AbsoluteFill>
        </Sc>
      );
    },
    over: (t) => {
      const w = walkIn(t);
      const op = clamp((t - 7.7) / 0.2) * (1 - clamp((t - 9.1) / 0.18));
      if (op <= 0) return null;
      const sz = w.h * 0.17;
      return <Brackets x={w.hx - sz / 2} y={w.headY - sz * 0.55} w={sz} h={sz * 1.1} len={Math.max(14, sz * 0.24)} thick={2} op={op * 0.9} labelR={`SUBJECT 01 · ${(36.4 + w.near * 0.5).toFixed(1)}°C`} />;
    },
  },
  // ───────────────────────── VERSE 1 ─────────────────────────
  {
    id: 'c4', from: 9.8, to: 13.02,
    heat: (t) => {
      const p = easeInOutCubic(clamp((t - 10.4) / 2.3));
      const g = grid(t);
      return (
        <Sc t={t} from={9.8} to={13.02} exit="left" enterDur={0.3}>
          <Blob x={960} y={540} r={640} v={0.1 + 0.08 * p} />
          {Array.from({ length: 72 }).map((_, i) => {
            const a = (i / 72) * Math.PI * 2 - Math.PI / 2;
            const lit = i / 72 <= p * 0.86;
            const r0 = 430, r1 = i % 6 === 0 ? 470 : 452;
            const v = lit ? (i / 72 > p * 0.86 - 0.05 ? 1 : 0.62) : 0.16;
            return <div key={i} style={{ position: 'absolute', left: 960 + Math.cos(a) * r0, top: 540 + Math.sin(a) * r0, width: r1 - r0, height: i % 6 === 0 ? 7 : 4, background: heat(v), transformOrigin: '0 50%', transform: `rotate(${(a * 180) / Math.PI}deg)`, boxShadow: lit ? `0 0 14px ${heat(1, 0.5)}` : undefined }} />;
          })}
          <Ring x={960} y={540} r={404} v={0.75} w={5} p={p * 0.86} blur={1.5} />
          <Ring x={960} y={540} r={404} v={0.22} w={2} p={1} blur={0} />
          <div style={{ position: 'absolute', left: 960 - 200, top: 540 + 300, width: 400, textAlign: 'center', fontFamily: VF.hud, fontWeight: 700, fontSize: 30, letterSpacing: '0.3em', color: heat(0.55 + 0.3 * g.pulse) }}>MOOD ▲</div>
          <Lyric t={t} words={ws(4)} lines={[3, 1]} cap={176} maxW={1560} lineStep={1.2}
            style={(w) => (w.i === 3 ? 'wide' : 'cond')} scale={(w) => (w.i === 3 ? 1 : 0.46)} anim={(w) => (w.i === 3 ? 'stretch' : 'rise')} dur={0.4}
            curve={{ peak: 1, hold: 0.74 }} />
        </Sc>
      );
    },
  },
  {
    id: 'c5', from: 12.85, to: 15.84,
    heat: (t) => {
      const warm = easeInOutCubic(clamp((t - 13.4) / 1.8));
      const stab = [14.8, 15.0, 15.2, 15.6].reduce((m, s) => (t >= s ? Math.max(m, Math.exp(-(t - s) * 12)) : m), 0);
      const sun = easeOutExpo(clamp((t - 14.78) / 0.5));
      return (
        <Sc t={t} from={12.85} to={15.84} exit="cut">
          <Blob x={960} y={620} r={1100} v={0.05 + warm * 0.2} />
          {sun > 0 && (
            <AbsoluteFill style={{ transform: `rotate(${(t - 14.8) * 22}deg) scale(${0.6 + 0.4 * sun})`, opacity: sun }}>
              <Blob x={960} y={600} r={330} v={0.5} />
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', left: 960, top: 600, width: 520, height: 10, marginTop: -5, transformOrigin: '0 50%', transform: `rotate(${i * 22.5}deg) translateX(260px)`, background: `linear-gradient(90deg, ${heat(0.55)}, ${heat(0.55, 0)})`, filter: 'blur(4px)' }} />
              ))}
            </AbsoluteFill>
          )}
          <AbsoluteFill style={{ transform: `scale(${1 + stab * 0.05})` }}>
            <Lyric t={t} words={ws(5)} lines={[4, 1, 1]} cap={176} maxW={1500} lineStep={1.22} keepPunct={false}
              style={(w) => (w.i >= 4 ? 'wide' : 'cond')} scale={(w) => (w.i >= 4 ? 1 : 0.42)} anim={(w) => (w.i >= 4 ? 'slam' : 'rise')} dur={0.3}
              curve={{ peak: 1, hold: 0.72 }} />
          </AbsoluteFill>
        </Sc>
      );
    },
  },
  {
    id: 'c6', from: 15.84, to: 18.74,
    heat: (t, ti) => {
      const sweep = ((ti - 15.84) % 1.3) / 1.3;
      const lp: LyricProps = { t: ti, words: ws(6, 2), cap: 200, maxW: 1640, y: 560, keepPunct: true, style: 'cond', anim: 'slam', dur: 0.2, curve: { peak: 1, hold: 0.8 } };
      return (
        <Sc t={t} from={15.84} to={18.74} exit="cut" enterDur={0.01}>
          <Crowd t={ti} beat={0} y={1220} rows={2} v={0.42} phones={0} jump={0} seed={3} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: sweep * 1080 - 40, height: 80, background: `linear-gradient(180deg, transparent, ${heat(0.35)}, transparent)` }} />
          <Lyric t={ti} words={ws(6, 0, 2)} cap={46} y={350} style="mono" gap={0.9} anim="type" curve={{ peak: 0.9, hold: 0.7 }} />
          <Lyric {...lp} />
        </Sc>
      );
    },
    over: (t, ti) => {
      const lock = ti >= wt(6, 4) - 0.05;
      const lp: LyricProps = { t: ti, words: ws(6, 2), cap: 200, maxW: 1640, y: 560, keepPunct: true, style: 'cond' };
      const b = boxOf(lp, lock ? (w) => w.i === 4 : undefined);
      const f = Math.floor(ti * 10);
      const jx = lock ? 0 : (rand(f * 1.3) - 0.5) * 900, jy = lock ? 0 : (rand(f * 2.9) - 0.5) * 300;
      const pad = 28;
      const op = 1 - clamp((t - 18.6) / 0.14);
      return <Brackets x={b.x0 - pad + jx} y={b.y0 - pad + jy} w={(lock ? b.w : 300) + pad * 2} h={b.h + pad * 2} len={40} col={lock ? '#ff3b30' : HUD_INK} op={op} label={lock ? 'UNKNOWN SUBJECT' : `ID ${String(f % 97).padStart(2, '0')}…`} />;
    },
  },
  {
    id: 'c7', from: 18.74, to: 22.0,
    heat: (t, ti) => {
      const tt = t < 19.86 ? ti : t;
      const sear = wt(7, 5);
      return (
        <Sc t={t} from={18.74} to={22.0} exit="left" enterDur={0.01}>
          <Lyric t={tt} words={ws(7)} lines={[3, 2, 1, 1]} cap={236} maxW={1500} lineStep={1.12} keepPunct={false}
            style={(w) => (w.i === 5 ? 'wide' : 'cond')} scale={(w) => (w.i === 5 ? 1 : w.i === 6 ? 0.5 : 0.36)}
            anim={(w) => (w.i === 5 ? 'sear' : 'rise')} dur={0.3} curve={{ peak: 1, hold: 0.7, decay: 0.6 }}
            wrap={(w, node, b) => w.i !== 5 ? node : (
              <>
                {tt > sear && Array.from({ length: 7 }).map((_, k) => {
                  const life = 1.6, ph = ((tt - sear) + rand(k) * life) % life / life;
                  return <Blob key={k} x={b.cx - b.w / 2 + rand(k * 3.3) * b.w} y={b.base - b.cap * 0.5 - ph * 200} r={60 + ph * 70} v={0.2 * (1 - ph)} />;
                })}
                {node}
                <div style={{ position: 'absolute', left: b.cx + b.w / 2 + 14, top: b.base - b.cap - 6, fontFamily: VF.wide, fontWeight: 700, fontSize: b.cap * 0.42, lineHeight: 1, color: heat(0.8), textShadow: `0 0 18px ${heat(1, 0.5)}`, opacity: clamp((tt - sear - 0.12) / 0.15) }}>®</div>
              </>
            )} />
        </Sc>
      );
    },
    over: (t) => {
      if (t < 20.0) return null;
      const lp: LyricProps = { t, words: ws(7), lines: [3, 2, 1, 1], cap: 236, maxW: 1500, lineStep: 1.12, style: (w) => (w.i === 5 ? 'wide' : 'cond'), scale: (w) => (w.i === 5 ? 1 : w.i === 6 ? 0.5 : 0.36) };
      const b = boxOf(lp, (w) => w.i === 5);
      const p = easeOutCubic(clamp((t - 20.0) / 0.25));
      const pad = 30 + (1 - p) * 60;
      return <Brackets x={b.x0 - pad} y={b.y0 - pad} w={b.w + pad * 2} h={b.h + pad * 2} len={44} col="#ffb020" op={p * (1 - clamp((t - 21.7) / 0.2))} label="MATCH 99.8%" labelR="BRAND ✓" />;
    },
  },
  {
    id: 'c8', from: 21.9, to: 24.86,
    heat: (t) => {
      const lp: LyricProps = { t, words: ws(8), lines: [3, 1], cap: 206, maxW: 1460, lineStep: 1.2, style: (w) => (w.i === 3 ? 'grotWide' : 'cond'), scale: (w) => (w.i === 3 ? 1 : 0.44), anim: (w) => (w.i === 3 ? 'drop' : 'rise'), dur: 0.36, curve: { peak: 1, hold: 0.72 } };
      const land = wt(8, 3) + 0.2;
      const thud = t > land ? Math.exp(-(t - land) * 10) : 0;
      return (
        <Sc t={t} from={21.9} to={24.86} exit="up">
          <div style={{ position: 'absolute', left: 0, right: 0, top: 540 - 640, height: 1280, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VF.wide, fontWeight: 300, fontSize: 1280, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${heat(0.12 + 0.08 * clamp((t - land) * 2))}`, transform: `translateY(${TM_DY}px) rotate(${(t - 21.9) * 3}deg) scale(${1 + (t - 21.9) * 0.02})` }}>™</div>
          <AbsoluteFill style={{ transform: `translateY(${thud * 10}px)` }}>
            <Lyric {...lp} wrap={(w, node, b) => w.i !== 3 ? node : (
              <>
                {node}
                <div style={{ position: 'absolute', left: b.cx + b.w / 2 + 10, top: b.base - b.cap - 4, fontFamily: VF.wide, fontWeight: 700, fontSize: b.cap * 0.4, lineHeight: 1, color: heat(t >= land ? 0.85 : 0) }}>™</div>
              </>
            )} />
          </AbsoluteFill>
        </Sc>
      );
    },
  },
  {
    id: 'c9', from: 24.78, to: 27.5,
    heat: (t) => {
      const land = wt(9, 2);
      const spin = 1 - easeOutCubic(clamp((t - (land - 0.55)) / 0.62));
      const step = 196;
      const off = spin * step * 9 + Math.max(0, t - land - 0.6) * 90;
      const sc = (k: number) => {
        const y = 560 + k * step - (off % step);
        const d = Math.abs(y - 560) / step;
        const hot = t >= land - 0.04 && Math.abs(y - 560) < step * 0.5;
        return { y, v: hot ? lerp(1, 0.78, clamp((t - land) / 0.6)) : 0.3 * clamp(1 - d / 3.2) };
      };
      return (
        <Sc t={t} from={24.78} to={27.5} exit="cut">
          <Lyric t={t} words={ws(9, 0, 2)} cap={64} y={214} style="cond" anim="rise" curve={{ peak: 1, hold: 0.7 }} />
          <AbsoluteFill style={{ maskImage: 'linear-gradient(180deg, transparent 27%, #000 43%, #000 61%, transparent 75%)' }}>
            {Array.from({ length: 9 }).map((_, j) => {
              const k = j - 4;
              const { y, v } = sc(k);
              const side = Math.abs(y - 560) > step * 0.5;
              const settle = side ? 1 - 0.8 * clamp((t - land - 0.25) / 0.4) : 1;
              return <div key={j} style={{ position: 'absolute', left: 0, right: 0, top: y - 98, textAlign: 'center', fontFamily: VF.wide, fontWeight: 900, fontSize: 150, lineHeight: 1, color: heat(v), textShadow: v > 0.5 ? `0 0 30px ${heat(1, 0.4)}` : undefined, opacity: t >= 24.85 ? settle : 0 }}>SCROLL</div>;
            })}
          </AbsoluteFill>
          <Lyric t={t} words={ws(9, 3)} cap={92} y={900} style={(w) => (w.i === 4 ? 'serif' : 'cond')} scale={(w) => (w.i === 4 ? 1.3 : 1)} anim="rise" curve={{ peak: 1, hold: 0.74 }} />
        </Sc>
      );
    },
  },
  {
    id: 'c10', from: 27.38, to: 30.62,
    heat: (t) => {
      const lp: LyricProps = { t, words: ws(10), lines: [2, 4], cap: 212, maxW: 1640, lineStep: 1.2, style: (w) => (w.i === 1 ? 'wide' : w.i === 5 ? 'serif' : 'cond'), scale: (w) => (w.i === 1 ? 1 : w.i === 5 ? 0.62 : 0.4), anim: (w) => (w.i === 1 ? 'slam' : 'rise'), dur: 0.32, curve: { peak: 1, hold: 0.72 } };
      const rule = easeOutExpo(clamp((t - 27.9) / 0.5));
      const hl = easeOutCubic(clamp((t - (wt(10, 5) + 0.05)) / 0.35));
      const b = boxOf(lp, (w) => w.i === 1);
      const all = boxOf(lp);
      const sb = boxOf(lp, (w) => w.i === 5);
      return (
        <Sc t={t} from={27.38} to={30.62} exit="down">
          <div style={{ position: 'absolute', left: 960 - (all.w / 2 + 40) * rule, width: (all.w + 80) * rule, top: b.y0 - 52, height: 7, background: heat(0.6) }} />
          <div style={{ position: 'absolute', left: 960 - (all.w / 2 + 40) * rule, width: (all.w + 80) * rule, top: sb.y1 + sb.h * 0.42 + 26, height: 3, background: heat(0.45) }} />
          <Lyric {...lp} wrap={(w, node, bx) => w.i !== 5 ? node : (
            <>
              <div style={{ position: 'absolute', left: bx.cx - bx.w / 2 - 22, top: bx.base - bx.cap * 0.98, width: (bx.w + 44) * hl, height: bx.cap * 1.18, borderRadius: 14, background: heat(0.42), filter: 'blur(4px)', transform: 'skewX(-10deg)' }} />
              {node}
            </>
          )} />
        </Sc>
      );
    },
  },
  {
    id: 'c11', from: 30.5, to: 34.3,
    heat: (t) => {
      const sweep = easeInOutCubic(clamp((t - 30.6) / 1.6));
      const fx = lerp(330, 960, sweep) + Math.sin((t - 30.6) * 1.4) * 22 * sweep;
      const build = clamp((t - 32.4) / 1.6);
      const flood = easeInCubic(clamp((t - 33.95) / 0.35));
      const flick = t - 30.5 < 0.35 ? (rand(Math.floor(t * 30)) > 0.4 ? 1 : 0.35) : 1;
      const iv = (0.62 + 0.3 * build) * flick;
      return (
        <Sc t={t} from={30.5} to={34.3} exit="none">
          <div style={{ position: 'absolute', inset: 0, clipPath: `polygon(${960 - 50}px -10px, ${960 + 50}px -10px, ${fx + 480}px 1080px, ${fx - 480}px 1080px)`, background: `linear-gradient(180deg, ${heat(iv * 0.8)}, ${heat(iv * 0.36)} 30%, ${heat(iv * 0.3)} 70%, ${heat(iv * 0.42)})`, filter: 'blur(6px)' }} />
          <Blob x={fx} y={1010} r={560} v={iv * 0.55} sy={0.32} />
          <Blob x={960} y={-10} r={160} v={1} />
          <Lyric t={t} words={ws(11, 0, 4)} cap={70} y={360} style="cond" anim="rise" curve={{ peak: 1, hold: 0.78 }} fx={() => ({ style: { textShadow: '0 0 6px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.9), 0 0 48px rgba(0,0,0,0.7)' } })} />
          <Lyric t={t} words={ws(11, 4)} cap={250} maxW={1500} y={650} style="cond" anim="blur" dur={0.4} curve={{ peak: 1, hold: 0.9 }} />
          {flood > 0 && <AbsoluteFill style={{ background: heat(1), opacity: flood }} />}
        </Sc>
      );
    },
  },
];
