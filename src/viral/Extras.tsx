import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { CUES, FPS, clamp, cueOut } from '../lib/time';
import { useFontsReady, VF } from './fonts';
import { Thermal, heat } from './thermal';
import { Blob, Figure, HeatField, HeatGrain, HeatVignette } from './world';
import { Lyric, STYLES, layout, measure, metrics, W, StyleName } from './type';
import { Brackets, TITLE_WORDS } from './act1';
import { Viral } from './Viral';
import { grid, paletteAt, tempAt } from './story';
import { fmtTemp } from './hud';

const RED = '#ff3b30';

// ───────────────────────── YouTube thumbnail (one still) ─────────────────────────
/** Static drips hanging off the title's last line at chosen points of each word (fractions of the word's width). */
const TitleDrips: React.FC<{ boxes: ReturnType<typeof layout>['boxes']; line: number; at: Record<number, [number, number][]>; v?: number }> = ({ boxes, line, at, v = 0.96 }) => (
  <>
    {boxes.filter((b) => b.line === line).flatMap((b) => (at[b.w0.i] ?? []).map(([f, len], k) => {
      const x = b.cx - b.w / 2 + f * b.w;
      const ww = b.cap * (0.16 + 0.05 * ((k * 7 + b.w0.i * 3) % 3) / 2);
      const drop = len > 0.9;
      const L = b.cap * len;
      return (
        <React.Fragment key={`${b.w0.i}-${k}`}>
          <div style={{ position: 'absolute', left: x - ww / 2, top: b.base - b.cap * 0.12, width: ww, height: L + b.cap * 0.12, borderRadius: `0 0 ${ww}px ${ww}px`, background: `linear-gradient(180deg, ${heat(v)}, ${heat(v * 0.84)})` }} />
          {drop && <div style={{ position: 'absolute', left: x - ww * 0.62, top: b.base + L + b.cap * 0.32, width: ww * 1.24, height: ww * 1.6, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: heat(v * 0.82) }} />}
        </React.Fragment>
      );
    }))}
  </>
);

export const ViralThumb: React.FC = () => {
  const ready = useFontsReady();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  // justified two-line title: TOO HOT scaled up to the width of TO HANDLE
  const s = STYLES.melt;
  const rowW = (ws: string[]) => ws.reduce((sum, w, j) => sum + (measure(w, s) * (100 / metrics(s).cap)) / 100 + (j ? 32 : 0), 0);
  const k1 = rowW(['TO', 'HANDLE']) / rowW(['TOO', 'HOT']);
  const title = { t: 99, words: TITLE_WORDS, lines: [2, 2], align: 'left' as const, x: 72, y: 560, cap: 400, maxW: 1190, maxH: 600, lineStep: 1.16, scale: (w: W) => (w.i < 2 ? k1 : 1), style: 'melt' as const, anim: 'none' as const, curve: { pre: 0.98, peak: 0.98, hold: 0.98 }, year: 2012, glow: 1.4 };
  const { boxes } = layout(title);
  // subject: waist-up, head high on the right
  const FX = 1590, FY = 1980, FH = 1900;
  const headTop = FY - 1.004 * FH, chin = FY - 0.853 * FH, headCy = FY - 0.925 * FH;
  const bx = FX - 140, bw = 280, by = headTop - 26, bh = chin - headTop + 60;
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Thermal id="th-thumb" blend={[{ name: 'IRONBOW', w: 1 }]}>
        <HeatField t={80} amb={0.15} />
        <Blob x={FX} y={560} r={820} v={0.3} sy={1.15} />
        <Figure x={FX} y={FY} h={FH} v={1} phase={0.25} walk={0.5} id="thumbfig" blur={7} />
        <Blob x={FX} y={headCy} r={260} v={0.5} sy={1.2} />
        <Blob x={FX} y={headCy + 18} r={120} v={1} sy={1.25} />
        <Blob x={560} y={560} r={760} v={0.15} sy={0.55} />
        <TitleDrips boxes={boxes} line={1} at={{ 2: [[0.5, 0.72]], 3: [[0.07, 1.25], [0.3, 0.42], [0.47, 0.95], [0.66, 0.55], [0.79, 1.4], [0.93, 0.36]] }} />
        <Lyric {...title} />
        <HeatVignette amt={0.55} />
        <HeatGrain frame={7} amt={0.045} />
      </Thermal>
      {/* spot meter on the subject's head */}
      <Brackets x={bx} y={by} w={bw} h={bh} len={54} thick={6} col={RED} />
      <div style={{ position: 'absolute', left: bx - 122, top: headCy - 40, width: 112, height: 6, background: RED, boxShadow: `0 0 14px ${RED}` }} />
      <div style={{ position: 'absolute', right: 1920 - (bx - 140), top: headCy - 112, textAlign: 'right', color: RED, textShadow: '0 4px 0 rgba(0,0,0,0.55), 0 0 34px rgba(255,40,30,0.75)' }}>
        <div style={{ fontFamily: VF.wide, fontWeight: 900, fontSize: 150, lineHeight: 1 }}>&gt;650<span style={{ fontSize: 66, verticalAlign: 'top', marginLeft: 6 }}>°C</span></div>
        <div style={{ marginTop: 14, fontFamily: VF.hud, fontWeight: 800, fontSize: 30, letterSpacing: '0.2em' }}>SUBJECT 01 · TARGET LOCKED</div>
      </div>
      <div style={{ position: 'absolute', left: 72, top: 64, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px', border: `4px solid ${RED}`, color: RED, background: 'rgba(0,0,0,0.5)', fontFamily: VF.hud, fontWeight: 800, fontSize: 44, letterSpacing: '0.12em' }}>⚠ SENSOR OVERLOAD</div>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)' }} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Vertical Short (9:16) ─────────────────────────
export const SHORT_FROM = 77.05;
export const SHORT_DUR = 15.1;

/** Greedy line breaks for a caption by measured width. */
const wrap = (words: W[], style: StyleName, cap: number, maxW: number) => {
  const s = STYLES[style];
  const m = metrics(s);
  const size = cap / m.cap;
  const gap = 0.32 * cap;
  const counts: number[] = [];
  let w = 0, n = 0;
  for (const word of words) {
    const txt = s.upper ? word.w.toUpperCase() : word.w;
    const ww = (measure(txt, s) * size) / 100;
    if (n > 0 && w + gap + ww > maxW) { counts.push(n); n = 0; w = 0; }
    w += (n ? gap : 0) + ww; n++;
  }
  if (n) counts.push(n);
  return counts;
};

/** The cue on screen at t; cues that start in the Short's last half second are left out and the one before holds to the end. */
const activeCue = (t: number) => {
  const end = SHORT_FROM + SHORT_DUR;
  const last = CUES.reduce((k, c, i) => (c.start < end - 0.5 ? i : k), 0);
  for (let i = last; i >= 0; i--) {
    const c = CUES[i];
    if (t >= c.start - 0.1 && (i === last || t < cueOut(i + 1))) return i + 1;
  }
  return 0;
};

export const ViralShort: React.FC = () => {
  const ready = useFontsReady();
  const frame = useCurrentFrame();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const off = Math.round(SHORT_FROM * FPS);
  const t = (frame + off) / FPS;
  const { blend } = paletteAt(t);
  const g = grid(t);
  const n = activeCue(t);
  const words: W[] = n ? CUES[n - 1].words.map((w, i) => ({ ...w, i })) : [];
  const lines = words.length ? wrap(words, 'cond', 92, 840) : [];
  const temp = tempAt(t);
  const vt = 0.86 + 0.14 * g.pulse;
  const fadeIn = clamp(frame / 6);
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Thermal id="th-short" blend={blend}>
        <HeatField t={t} amb={0.12} />
        <Blob x={540} y={400} r={560} v={0.14 + 0.06 * g.pulse} sy={0.6} />
        <Lyric t={99} words={TITLE_WORDS} lines={[2, 2]} x={540} y={404} cap={124} maxW={940} lineStep={1.24} style="melt" anim="none" curve={{ pre: vt, peak: vt, hold: vt }} year={1979 + clamp((t - 80.67) / 2) * 30} />
        {words.length > 0 && <Lyric t={t} words={words} lines={lines} x={540} y={1404} cap={92} maxW={860} maxH={300} lineStep={1.3} style="cond" anim="punch" dur={0.2} curve={{ peak: 1, hold: 0.8 }} />}
        <HeatVignette amt={0.4} />
        <HeatGrain frame={frame} amt={0.05} />
      </Thermal>
      {/* the 16:9 camera feed */}
      <div style={{ position: 'absolute', left: 0, top: 624, width: 1080, height: 608, overflow: 'hidden', boxShadow: '0 0 0 3px rgba(255,255,255,0.2)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: 'scale(0.5625)', transformOrigin: '0 0' }}>
          <Sequence from={-off} layout="none">
            <Viral />
          </Sequence>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 158, display: 'flex', alignItems: 'center', gap: 14, fontFamily: VF.hud, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: 'rgba(246,242,234,0.92)' }}>
        <span style={{ width: 18, height: 18, borderRadius: 9, background: RED, boxShadow: `0 0 12px ${RED}`, opacity: Math.floor(t * 1.6) % 2 ? 0.3 : 1 }} />REC · THERMAL
      </div>
      <div style={{ position: 'absolute', right: 60, top: 140, fontFamily: VF.wide, fontWeight: 800, fontSize: 64, color: isFinite(temp) && temp < 90 ? 'rgba(246,242,234,0.95)' : RED }}>
        {fmtTemp(temp)}<span style={{ fontSize: 30, verticalAlign: 'top', marginLeft: 4 }}>°C</span>
      </div>
      <AbsoluteFill style={{ background: '#000', opacity: 1 - fadeIn }} />
    </AbsoluteFill>
  );
};
