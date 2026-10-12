import React from 'react';
import { AbsoluteFill } from 'remotion';
import { band, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';
import { Lyric, LyricProps } from './type';
import { heat } from './thermal';
import { Blob, Crowd, Figure, HeatHeart, Ring } from './world';
import { VScene, Sc, ws, wt, HUD_INK } from './kit';
import { Brackets, boxOf } from './act1';
import { ChartGrid, Cracks, echoOf, Footprint, Hazard, Reflect, Slices, StampBox, TrendLine, trendPoint, Vinyl } from './fx';
import { beatTime, grid, PERIOD } from './story';
import { VF } from './fonts';

const jitter = (t: number, amt: number, k = 0) => {
  const f = Math.floor(t * 30);
  return { x: (rand(f * 1.31 + k) - 0.5) * 2 * amt, y: (rand(f * 2.17 + k * 3) - 0.5) * 2 * amt };
};
const decay = (t: number, at: number, rate = 6) => (t >= at ? Math.exp(-(t - at) * rate) : 0);

// ───────────────────────── MIRROR SECTION (ARCTIC) ─────────────────────────
const FLEX_Y = 470;
const flexProps = (t: number): LyricProps => ({ t, words: ws(12, 4, 5), cap: 250, maxW: 1500, y: FLEX_Y, style: 'grotWide', anim: 'flex', dur: 0.55, curve: { peak: 1, hold: 0.84, decay: 0.5 } });
const flexBase = () => { const b = boxOf(flexProps(99)); return b.y1; };

const reflProps = (t: number): LyricProps => ({ t, words: ws(13, 0, 2), cap: 176, maxW: 1560, y: 330, style: 'cond', scale: (w) => (w.i === 0 ? 0.4 : 1), anim: (w) => (w.i === 0 ? 'rise' : 'blur'), dur: 0.4, curve: { peak: 1, hold: 0.78 } });
const stressProps = (t: number): LyricProps => ({ t, words: ws(13, 2), cap: 150, maxW: 1400, y: 840, style: (w) => (w.i === 3 ? 'wide' : 'cond'), scale: (w) => (w.i === 3 ? 1 : 0.38), anim: (w) => (w.i === 3 ? 'slam' : 'rise'), dur: 0.26, curve: { peak: 1, hold: 0.8 } });

const glitchAmt = (t: number) => {
  let a = 0;
  if (t >= 40.38 && t < 41.2) a = Math.max(a, 1 - easeInCubic(clamp((t - 40.38) / 0.82)) * 0.9);
  for (const [s, d] of [[41.58, 0.1], [42.06, 0.07], [42.3, 0.1]] as const) if (t >= s && t < s + d) a = Math.max(a, 0.55);
  return a;
};

// ───────────────────────── VERSE 2 ─────────────────────────
const CROWD_COOL = 52.62;
const fmtViews = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${Math.round(n)}`);

const centerOff = (t: number) => {
  const snapAt = wt(21, 3) - 0.04;
  if (t >= snapAt) { const e = 1 - easeOutBack(clamp((t - snapAt) / 0.28), 2.4); return { x: 64 * e, y: -26 * e, done: t >= snapAt + 0.12 }; }
  const p = clamp((t - 58.6) / (snapAt - 58.6));
  return { x: lerp(90, 64, p) + Math.sin(t * 5) * 6, y: lerp(-40, -26, p) + Math.cos(t * 4) * 4, done: false };
};

export const ACT2: VScene[] = [
  {
    id: 'm1', from: 34.27, to: 37.06,
    heat: (t) => {
      const base = flexBase();
      const line = easeOutExpo(clamp((t - 34.3) / 0.5));
      return (
        <Sc t={t} from={34.27} to={37.06} exit="cut" enterDur={0.01}>
          <Blob x={960} y={base} r={700} v={0.12} sy={0.4} />
          <div style={{ position: 'absolute', left: 960 - 860 * line, width: 1720 * line, top: base + 6, height: 3, background: `linear-gradient(90deg, ${heat(0.5, 0)}, ${heat(0.75)} 50%, ${heat(0.5, 0)})` }} />
          <Lyric t={t} words={ws(12, 0, 4)} cap={62} y={250} style="cond" anim="rise" curve={{ peak: 1, hold: 0.74 }} />
          <Reflect y={base + 6} depth={230} op={0.4} blur={2.5}>
            <Lyric {...flexProps(t)} />
          </Reflect>
          <Lyric t={t} words={ws(12, 5)} cap={62} y={884} style="cond" anim="rise" curve={{ peak: 1, hold: 0.74 }} />
        </Sc>
      );
    },
  },
  {
    id: 'm2', from: 37.06, to: 39.74,
    heat: (t) => {
      const hit = wt(13, 3) - 0.02;
      const cracked = t >= hit;
      const sh = jitter(t, 16 * decay(t, hit, 5));
      const rowA = <Lyric {...reflProps(t)} />;
      const ba = boxOf(reflProps(99));
      return (
        <Sc t={t} from={37.06} to={39.74} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
            <Cracks x={980} y={ba.y1 + 120} p={clamp((t - hit) / 0.35)} v={0.8} seed={4} w={3} />
            <div style={{ position: 'absolute', left: 100, right: 100, top: ba.y1 + 8, height: 3, background: `linear-gradient(90deg, ${heat(0.5, 0)}, ${heat(0.7)} 50%, ${heat(0.5, 0)})` }} />
            {rowA}
            <AbsoluteFill style={{ maskImage: `linear-gradient(180deg, transparent ${ba.y1 + 8}px, #000 ${ba.y1 + 12}px, transparent ${ba.y1 + 230}px)`, opacity: 0.42 }}>
              <Slices t={t} amt={cracked ? 0.18 + 0.4 * decay(t, hit, 3) : 0} n={7} maxShift={60} seed={9}>
                <AbsoluteFill style={{ transform: 'scaleY(-1)', transformOrigin: `50% ${ba.y1 + 8}px`, filter: 'blur(2.5px)' }}>{rowA}</AbsoluteFill>
              </Slices>
            </AbsoluteFill>
            <Lyric {...stressProps(t)} fx={(w, local) => (w.i === 3 && local > 0.1 ? (() => { const j = jitter(t, 7 * (0.35 + decay(t, hit, 3)), 5); return { transform: `translate(${j.x}px, ${j.y}px)` }; })() : undefined)} />
          </AbsoluteFill>
        </Sc>
      );
    },
  },
  {
    id: 'm3', from: 39.74, to: 42.47,
    heat: (t) => {
      const amt = glitchAmt(t);
      const lp: LyricProps = { t, words: ws(14), lines: [2, 1, 3], cap: 236, maxW: 1560, lineStep: 1.16, style: (w) => (w.i === 2 ? 'wide' : w.i === 5 ? 'mono' : 'cond'), scale: (w) => (w.i === 2 ? 1 : 0.34), anim: (w) => (w.i === 2 ? 'scramble' : w.i === 5 ? 'type' : 'rise'), dur: 0.3, curve: { peak: 1, hold: 0.76 } };
      return (
        <Sc t={t} from={39.74} to={42.47} exit="cut" enterDur={0.01}>
          {amt > 0.05 && <AbsoluteFill style={{ transform: `translateX(${jitter(t, 26 * amt).x}px)`, opacity: 0.45 * amt }}><Lyric {...lp} heatMul={0.6} glow={0} /></AbsoluteFill>}
          <Slices t={t} amt={amt} n={10} maxShift={170} seed={3}>
            <Lyric {...lp} />
          </Slices>
          {amt > 0.3 && Array.from({ length: 5 }).map((_, i) => {
            const f = Math.floor(t * 15);
            return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: rand(f * 3.1 + i * 7) * 1080, height: 2 + rand(f + i) * 10, background: heat(0.5 + 0.5 * rand(f * 2 + i)), opacity: 0.6 * amt }} />;
          })}
        </Sc>
      );
    },
  },
  {
    id: 'm4', from: 42.47, to: 47.14,
    heat: (t) => {
      const p = easeInOutCubic(clamp((t - 42.5) / 2.6));
      const fansAt = wt(15, 4);
      const rise = easeOutCubic(clamp((t - (fansAt - 0.1)) / 0.45));
      const g = grid(t);
      return (
        <Sc t={t} from={42.47} to={47.14} exit="cut" enterDur={0.01}>
          <ChartGrid op={easeOutCubic(clamp((t - 42.48) / 0.3))} />
          <TrendLine p={p} />
          <Lyric t={t} words={ws(15)} lines={[2, 3]} align="left" x={140} y={330} cap={150} maxW={960} lineStep={1.2}
            style={(w) => (w.i === 1 || w.i === 4 ? 'wide' : 'cond')} scale={(w) => (w.i === 1 ? 1 : w.i === 4 ? 0.72 : 0.4)}
            anim={(w) => (w.i === 1 ? 'slam' : w.i === 4 ? 'pop' : 'rise')} dur={0.32} curve={{ peak: 1, hold: 0.78 }} />
          {rise > 0 && (
            <AbsoluteFill style={{ transform: `translateY(${(1 - rise) * 380}px)` }}>
              <Crowd t={t} beat={g.idx + g.frac} y={1150} rows={3} v={0.76} phones={0.55} seed={7} jump={1} />
            </AbsoluteFill>
          )}
          {t > fansAt && Array.from({ length: 26 }).map((_, i) => {
            const at = fansAt + i * 0.12, life = 1.8;
            const l = t - at;
            if (l < 0 || l > life) return null;
            const q = l / life;
            const x0 = 1380 + rand(i * 3.7) * 420;
            return <HeatHeart key={i} id={`fh${i}`} x={x0 + Math.sin(l * 4 + i) * 30} y={1000 - q * 640} size={56 + rand(i * 1.3) * 40} v={0.95 * (1 - q * 0.5)} beat={0} />;
          })}
        </Sc>
      );
    },
    over: (t) => {
      const p = easeInOutCubic(clamp((t - 42.5) / 2.6));
      if (p <= 0.02) return null;
      const h = trendPoint(p);
      const views = 12000 * Math.pow(900, p);
      const off = h.y < 150;
      const op = 1 - clamp((t - 46.9) / 0.2);
      if (off) {
        return (
          <div style={{ position: 'absolute', right: 120, top: 210, fontFamily: VF.hud, fontWeight: 700, fontSize: 22, letterSpacing: '0.2em', color: '#ff3b30', border: '2px solid #ff3b30', padding: '6px 14px', background: 'rgba(0,0,0,0.35)', opacity: op * (Math.floor(t * 4) % 2 ? 1 : 0.7) }}>▲ OFF THE CHARTS</div>
        );
      }
      return (
        <div style={{ position: 'absolute', left: h.x + 28, top: h.y - 54, fontFamily: VF.hud, fontWeight: 700, fontSize: 20, letterSpacing: '0.16em', color: HUD_INK, whiteSpace: 'nowrap', opacity: op }}>
          ▲ {fmtViews(views)} VIEWS
        </div>
      );
    },
  },
  {
    id: 'v2a', from: 47.14, to: 48.62,
    heat: (t) => {
      const near = easeInOutCubic(clamp((t - 47.1) / 1.5));
      const fig = (tt: number, k: number) => {
        const nn = easeInOutCubic(clamp((tt - 47.1) / 1.5));
        return <Figure key={k} id={`slow${k}`} x={1450} y={lerp(930, 1010, nn)} h={lerp(470, 650, nn)} v={k ? 0.72 - k * 0.14 : 0.97} phase={(tt - 47.14) / (PERIOD * 2.4)} blur={3 + k * 2} />;
      };
      return (
        <Sc t={t} from={47.14} to={48.62} exit="cut" enterDur={0.01}>
          <Blob x={1450} y={700} r={520} v={0.12 + 0.12 * near} sy={1.2} />
          {[4, 3, 2, 1].map((k) => <AbsoluteFill key={k} style={{ opacity: 0.5 - k * 0.1 }}>{fig(t - k * 0.16, k)}</AbsoluteFill>)}
          {fig(t, 0)}
          <Lyric t={t} words={ws(16, 0, 4)} lines={[3, 1]} align="left" x={140} y={520} cap={230} maxW={980} lineStep={1.18}
            style="cond" scale={(w) => (w.i === 3 ? 1 : 0.34)} anim={(w) => (w.i === 3 ? 'blur' : 'rise')} dur={0.8} curve={{ peak: 1, hold: 0.8, decay: 0.7 }}
            wrap={(w, node) => w.i !== 3 ? node : (
              <>
                {[5, 4, 3, 2, 1].map((k) => echoOf(node, k, -k * 34 * easeOutCubic(clamp((t - w.t) / 0.9)), 0.42 - k * 0.07))}
                {node}
              </>
            )} />
        </Sc>
      );
    },
  },
  {
    id: 'v2b', from: 48.62, to: 50.24,
    heat: (t) => {
      const steps = [0, 1, 2, 3].map((j) => beatTime(124 + j));
      return (
        <Sc t={t} from={48.62} to={50.24} exit="cut" enterDur={0.01}>
          {steps.map((at, j) => {
            const x = lerp(330, 1590, j / 3) + (j % 2 ? 40 : -40);
            const y = lerp(1000, 800, j / 3) + (j % 2 ? 20 : -20);
            const s = lerp(2.2, 1.45, j / 3);
            const l = t - at;
            if (l < 0) return null;
            const v = 0.3 + 0.68 * Math.exp(-l * 1.6);
            return (
              <React.Fragment key={j}>
                <Ring x={x} y={y} r={30 + easeOutCubic(clamp(l / 0.7)) * 240} v={0.7 * (1 - clamp(l / 0.7))} w={5} blur={3} />
                <Footprint x={x} y={y} s={s} v={v} rot={70} left={j % 2 === 1} />
              </React.Fragment>
            );
          })}
          <Lyric t={t} words={ws(16, 4)} lines={[3, 1]} cap={200} y={360} maxW={1500} lineStep={1.18}
            style={(w) => (w.i === 7 ? 'wide' : 'cond')} scale={(w) => (w.i === 7 ? 1 : 0.36)} anim={(w) => (w.i === 7 ? 'right' : 'rise')} dur={0.36} curve={{ peak: 1, hold: 0.8 }}
            wrap={(w, node) => w.i !== 7 ? node : (
              <>
                {[3, 2, 1].map((k) => echoOf(node, k, -k * 70 * (0.4 + 0.6 * Math.abs(Math.sin((t - w.t) * 3))), 0.36 - k * 0.09))}
                {node}
              </>
            )} />
        </Sc>
      );
    },
  },
  {
    id: 'v2c', from: 50.24, to: 52.99,
    heat: (t) => {
      const g = grid(t);
      const cool = easeInOutCubic(clamp((t - CROWD_COOL) / 0.35));
      const partB = t >= wt(17, 3) - 0.1;
      const shor = wt(17, 2);
      return (
        <Sc t={t} from={50.24} to={52.99} exit="cut" enterDur={0.01}>
          {partB && cool > 0 && <Blob x={1380} y={700} r={480} v={0.22 * cool} sy={1.3} />}
          {partB && <Figure x={1380} y={1130} h={760} v={0.97} phase={0} walk={0} id="solo" blur={3.5} />}
          <Crowd t={t} beat={cool > 0 ? CROWD_COOL / PERIOD : g.idx + g.frac} y={1150} rows={3} v={lerp(0.6, 0.1, cool)} phones={0.3 * (1 - cool)} seed={11} jump={1 - cool} />
          {!partB && (
            <Lyric t={t} words={ws(17, 0, 3)} lines={[2, 1]} cap={210} y={380} maxW={1400} lineStep={1.16}
              style={(w) => (w.i === 2 ? 'wide' : 'cond')} scale={(w) => (w.i === 2 ? 1 : 0.36)} anim={(w) => (w.i === 2 ? 'slam' : 'rise')} dur={0.26} curve={{ peak: 1, hold: 0.82 }}
              fx={(w, local) => (w.i === 2 && local > 0 ? (() => { const j = jitter(t, 9, 2); return { transform: `translate(${j.x}px, ${j.y}px)` }; })() : undefined)} />
          )}
          {!partB && t > shor && [0, 1, 2].map((k) => {
            const l = ((t - shor) * 1.6 + k / 3) % 1;
            return <Ring key={k} x={960} y={380} r={300 + l * 700} v={0.4 * (1 - l)} w={6} blur={4} />;
          })}
          {partB && (
            <Lyric t={t} words={ws(17, 3)} lines={[3, 1]} align="left" x={140} y={430} cap={250} maxW={900} lineStep={1.2}
              style={(w) => (w.i === 6 ? 'serif' : 'cond')} scale={(w) => (w.i === 6 ? 1 : 0.3)} anim={(w) => (w.i === 6 ? 'blur' : 'rise')} dur={0.4} keepPunct
              curve={{ peak: 1, hold: 0.86 }} />
          )}
        </Sc>
      );
    },
    over: (t) => {
      const cool = clamp((t - CROWD_COOL) / 0.35);
      if (cool <= 0) return null;
      const op = easeOutCubic(cool) * (1 - clamp((t - 52.86) / 0.12));
      return <Brackets x={1380 - 80} y={352} w={160} h={176} len={30} thick={2} col="#ffd27a" op={op} labelR="1 OF 1" />;
    },
  },
  {
    id: 'v2d', from: 52.99, to: 54.73,
    heat: (t) => {
      const lp: LyricProps = { t, words: ws(18), lines: [3, 1, 1], cap: 260, maxW: 1560, lineStep: 1.14, style: (w) => (w.i === 3 ? 'wide' : 'cond'), scale: (w) => (w.i === 4 ? 1 : w.i === 3 ? 0.42 : 0.3), anim: (w) => (w.i === 4 ? 'slam' : 'rise'), dur: 0.28, curve: { peak: 1, hold: 0.8 } };
      const breakAt = wt(18, 4) + 0.14;
      const e = easeOutExpo(clamp((t - breakAt) / 0.3));
      const pb = boxOf(lp, (w) => w.i === 4);
      const mid = pb.y0 + pb.h * 0.52;
      const flash = decay(t, breakAt, 9);
      const block = <Lyric {...lp} />;
      if (t < breakAt) return <Sc t={t} from={52.99} to={54.73} exit="cut" enterDur={0.01}>{block}</Sc>;
      return (
        <Sc t={t} from={52.99} to={54.73} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ clipPath: `polygon(0 0, 1920px 0, 1920px ${mid - 14}px, 0 ${mid + 14}px)`, transform: `translate(${-46 * e}px, ${-22 * e}px) rotate(${-1.2 * e}deg)` }}>{block}</AbsoluteFill>
          <AbsoluteFill style={{ clipPath: `polygon(0 ${mid + 14}px, 1920px ${mid - 14}px, 1920px 1080px, 0 1080px)`, transform: `translate(${46 * e}px, ${22 * e}px) rotate(${0.8 * e}deg)` }}>{block}</AbsoluteFill>
          {flash > 0.02 && <div style={{ position: 'absolute', left: 0, right: 0, top: mid - 4, height: 8, background: heat(1), transform: 'rotate(-0.83deg)', boxShadow: `0 0 40px ${heat(1, 0.8)}`, opacity: flash }} />}
        </Sc>
      );
    },
  },
  {
    id: 'v2e', from: 54.73, to: 56.48,
    heat: (t) => {
      const partB = t >= wt(19, 3) - 0.08;
      const out = easeInCubic(clamp((t - (wt(19, 3) - 0.2)) / 0.16));
      const lvl = clamp(band('rms', t) * 1.6);
      return (
        <Sc t={t} from={54.73} to={56.48} exit="cut" enterDur={0.01}>
          {out < 1 && (
            <AbsoluteFill style={{ transform: `translateX(${out * 2200}px)` }}>
              <Hazard y={540} h={420} t={t} rot={-5}>
                <div style={{ position: 'absolute', left: 200, top: 0, width: 1920, height: 420 }}>
                  <Lyric t={t} words={ws(19, 0, 3)} cap={170} y={210} maxW={1500} style={(w) => (w.i === 0 ? 'cond' : 'wide')} scale={(w) => (w.i === 0 ? 0.5 : 1)} anim="slam" dur={0.24} curve={{ peak: 1, hold: 0.84 }} />
                </div>
              </Hazard>
            </AbsoluteFill>
          )}
          {partB && (
            <>
              {[-1, 1].map((side) => (
                <div key={side} style={{ position: 'absolute', left: side < 0 ? 150 : 1690, top: 300, width: 80, height: 480, display: 'flex', flexDirection: 'column-reverse', gap: 8 }}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const on = i / 12 < lvl * (side < 0 ? 1 : 0.93);
                    return <div key={i} style={{ height: 32, background: heat(on ? (i > 9 ? 1 : 0.55 + i * 0.03) : 0.1) }} />;
                  })}
                </div>
              ))}
              <Lyric t={t} words={ws(19, 3)} lines={[1, 1, 1]} cap={220} maxW={1280} lineStep={1.12}
                style={(w) => (w.i === 4 ? 'wide' : 'cond')} scale={(w) => (w.i === 4 ? 1 : 0.4)} anim={(w) => (w.i === 4 ? 'slam' : 'rise')} dur={0.26} curve={{ peak: 1, hold: 0.82 }} />
            </>
          )}
        </Sc>
      );
    },
  },
  {
    id: 'v2f', from: 56.48, to: 58.58,
    heat: (t) => {
      const inn = easeOutCubic(clamp((t - 56.48) / 0.3));
      const glow = 0.1 + 0.08 * Math.sin(t * 3);
      return (
        <Sc t={t} from={56.48} to={58.58} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ transform: `translateY(${(1 - inn) * 500}px) rotate(${-4 + inn * 2}deg)` }}>
            <Blob x={960} y={560} r={620} v={0.16} sy={1.3} />
            <div style={{ position: 'absolute', left: 960 - 290, top: 50, width: 580, height: 990, borderRadius: 74, background: heat(0.32), boxShadow: `0 0 60px ${heat(0.4, 0.5)}` }} />
            <div style={{ position: 'absolute', left: 960 - 262, top: 78, width: 524, height: 934, borderRadius: 54, background: `radial-gradient(ellipse at 50% 40%, ${heat(glow + 0.06)}, ${heat(glow * 0.5)})` }} />
            <div style={{ position: 'absolute', left: 960 - 62, top: 100, width: 124, height: 30, borderRadius: 15, background: heat(0.02) }} />
            <Lyric t={t} words={ws(20)} lines={[2, 2, 1, 1]} cap={190} y={572} maxW={450} maxH={760} lineStep={1.42}
              style={(w) => (w.i === 4 ? 'wide' : 'cond')} scale={(w) => (w.i === 4 ? 1 : w.i === 2 || w.i === 3 ? 0.74 : 0.5)}
              anim={(w) => (w.i === 4 ? 'bold' : 'rise')} dur={0.36} curve={{ peak: 1, hold: 0.8 }} />
          </AbsoluteFill>
        </Sc>
      );
    },
  },
  {
    id: 'v2g', from: 58.58, to: 60.32,
    heat: (t) => {
      const o = centerOff(t);
      return (
        <Sc t={t} from={58.58} to={60.32} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ transform: `translate(${o.x}px, ${o.y}px)` }}>
            <Lyric t={t} words={ws(21)} lines={[2, 2]} cap={230} maxW={1500} lineStep={1.16}
              style={(w) => (w.i === 1 ? 'serif' : 'cond')} scale={(w) => (w.i === 1 ? 1 : w.i === 3 ? 0.6 : 0.34)}
              anim={(w) => (w.i === 1 ? 'blur' : 'rise')} dur={0.4} curve={{ peak: 1, hold: 0.82 }} />
          </AbsoluteFill>
        </Sc>
      );
    },
    over: (t) => {
      const o = centerOff(t);
      const op = clamp((t - 58.62) / 0.2) * (1 - clamp((t - 60.2) / 0.12));
      const snap = o.done ? decay(t, wt(21, 3) + 0.08, 4) : 0;
      const col = o.done ? '#ffd27a' : HUD_INK;
      return (
        <AbsoluteFill style={{ opacity: op }}>
          <div style={{ position: 'absolute', left: 959, top: 150, width: 2, height: 780, background: `repeating-linear-gradient(180deg, ${col} 0 12px, transparent 12px 22px)`, opacity: 0.55 + snap * 0.45 }} />
          <div style={{ position: 'absolute', top: 539, left: 140, width: 1640, height: 2, background: `repeating-linear-gradient(90deg, ${col} 0 12px, transparent 12px 22px)`, opacity: 0.55 + snap * 0.45 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 952, textAlign: 'center', fontFamily: VF.hud, fontWeight: 700, fontSize: 20, letterSpacing: '0.24em', color: col }}>
            {o.done ? '✓ CENTERED · OFFSET 0.000' : `OFFSET X ${(o.x / 1000).toFixed(3)} · Y ${(o.y / 1000).toFixed(3)}`}
          </div>
        </AbsoluteFill>
      );
    },
  },
  {
    id: 'v2h', from: 60.32, to: 63.1,
    heat: (t) => {
      const inn = easeOutCubic(clamp((t - 60.32) / 0.5));
      return (
        <Sc t={t} from={60.32} to={63.1} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ transform: `translateX(${(1 - inn) * 600}px)` }}>
            <Blob x={1390} y={540} r={560} v={0.12} />
            <Vinyl x={1390} y={540} r={440} rot={(t - 60.3) * 200} />
          </AbsoluteFill>
          <Lyric t={t} words={ws(22)} lines={[3, 1, 4]} align="left" x={130} y={540} cap={250} maxW={820} lineStep={1.2}
            style={(w) => (w.i === 3 ? 'serif' : 'cond')} scale={(w) => (w.i === 3 ? 1 : 0.3)} anim={(w) => (w.i === 3 ? 'blur' : 'rise')} dur={0.6} keepPunct={false}
            curve={{ peak: 1, hold: 0.84, decay: 0.6 }} />
        </Sc>
      );
    },
  },
  {
    id: 'v2i', from: 63.1, to: 66.25,
    heat: (t) => {
      const stampAt = wt(23, 2) - 0.03;
      const sp = clamp((t - stampAt) / 0.12);
      const sc = lerp(1.9, 1, easeInCubic(sp));
      const thud = decay(t, stampAt + 0.12, 9);
      const top: LyricProps = { t, words: ws(23, 2, 3), cap: 150, maxW: 900, y: 430, style: 'grotWide', anim: 'none', curve: { pre: 0, peak: 1, hold: 0.86 } };
      const fb = boxOf({ ...top, t: 99 });
      const strikeAt = wt(23, 6) + 0.12;
      const lowP: LyricProps = { t, words: ws(23, 3), lines: [3, 1], cap: 150, y: 820, maxW: 1300, lineStep: 1.32, style: 'cond', scale: (w) => (w.i === 6 ? 1 : 0.42), anim: (w) => (w.i === 6 ? 'slam' : 'rise'), dur: 0.26, curve: { peak: 1, hold: 0.8 } };
      const tb = boxOf({ ...lowP, t: 99 }, (w) => w.i === 6);
      const strike = easeOutExpo(clamp((t - strikeAt) / 0.16));
      return (
        <Sc t={t} from={63.1} to={66.25} exit="cut" enterDur={0.01}>
          <AbsoluteFill style={{ transform: `translateY(${thud * 12}px)` }}>
            <Lyric t={t} words={ws(23, 0, 2)} cap={62} y={232} style="cond" anim="rise" curve={{ peak: 1, hold: 0.76 }} />
            {t >= stampAt && (
              <AbsoluteFill style={{ opacity: clamp(sp * 3), transform: `rotate(-6deg) scale(${sc})`, transformOrigin: `960px ${fb.cy}px` }}>
                <StampBox x={960} y={fb.cy} w={fb.w + 130} h={fb.h + 110} v={0.9} rot={0} />
                <Lyric {...top} />
              </AbsoluteFill>
            )}
            {t >= stampAt && thud > 0.03 && <Ring x={960} y={fb.cy} r={300 + (1 - thud) * 500} v={0.5 * thud} w={8} blur={6} />}
          </AbsoluteFill>
          <Lyric {...lowP} heatMul={t > strikeAt ? lerp(1, 0.62, strike) : 1} />
          {strike > 0 && <div style={{ position: 'absolute', left: tb.x0 - 30, top: tb.cy - 4, width: (tb.w + 60) * strike, height: 16, background: heat(1), transform: 'rotate(-3deg)', transformOrigin: `${(tb.w + 60) / 2}px 50%`, boxShadow: `0 0 30px ${heat(1, 0.7)}` }} />}
        </Sc>
      );
    },
  },
];
