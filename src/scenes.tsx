import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, F, HEAT_GRADIENT, CHROME_GRADIENT } from './theme';
import { Words, WordsProps } from './lib/Words';
import { Scene, Center } from './lib/Scene';
import { cue, cueOut, clamp, easeOutCubic, easeOutExpo, easeInOutCubic, easeOutBack, lerp, beatAt } from './lib/time';
import { Mirror, Lips, DoorLight } from './props/Mirror';
import { WEATHER_START, WEATHER_FROM, WEATHER_TO } from './lib/weather';
import { MoodDial, WeatherWidget, Whispers, BigGlyph, Feed, Newspaper, Highlight, Spotlight } from './props/Verse1';
import { Glitch, Scanlines, TrendChart, CrowdNoise, AlertDialog, HazardBand, Phone, Crosshair, Vinyl, Stamp, Struck } from './props/Verse2';
import { Flame, Candle, Heart, Player, AngleFrames, StopSign, SparkBurst, Clapper, Timecode, Viewfinder, SeasonCard, TabloidWall, Marquee } from './props/Hook';

/** Artist credit for title/end cards. Leave empty to show the song title only. */
export const ARTIST: string = '';
/** The 🔥 and 💋 beats from the original cue sheet (not sung words). */
const FIRE_AT = 127.96;
const KISS_AT = 135.9;

type Span = { from: number; to: number };
type Def = Span & { id: string; el: (t: number, d: Span) => React.ReactNode };
const wt = (n: number, i: number) => cue(n).words[i].t;
const W = (n: number, t: number, p: Omit<WordsProps, 'c' | 't'>) => <Words c={cue(n)} t={t} {...p} />;
const Pos: React.FC<{ x?: number; y?: number; w?: number; h?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x = 0, y = 0, w, h, children, style }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}>{children}</div>
);
/** Standard scene span for a cue. */
const span = (n: number, pre = 0.15, post = 0) => ({ from: cue(n).start - pre, to: cueOut(n) + post });

/** Slow-motion echo of a words block. */
const Echo: React.FC<{ t: number; n: number; copies?: number; lag?: number; dx?: number; p: Omit<WordsProps, 'c' | 't'> }> = ({ t, n, copies = 4, lag = 0.09, dx = -26, p }) => (
  <div style={{ position: 'relative' }}>
    {Array.from({ length: copies }).map((_, k) => (
      <div key={k} style={{ position: 'absolute', inset: 0, opacity: 0.32 - k * 0.07, transform: `translateX(${(k + 1) * dx}px)` }}>
        <Words c={cue(n)} t={t - (k + 1) * lag} {...p} shadow={false} />
      </div>
    ))}
    <Words c={cue(n)} t={t} {...p} />
  </div>
);

/** One giant word at a time, punching on each sung word. */
const Punch: React.FC<{ t: number; n: number; size?: number; skip?: number[]; palette?: string[] }> = ({ t, n, size = 520, skip = [], palette = [C.cream, C.fire, C.gold, C.cream, C.pink, C.fire] }) => {
  const ws = cue(n).words;
  let idx = -1;
  ws.forEach((w, i) => { if (t >= w.t - 0.03 && !skip.includes(i)) idx = i; });
  if (idx < 0) return null;
  const local = t - ws[idx].t;
  const e = easeOutExpo(clamp(local / 0.25));
  const txt = ws[idx].w.replace(/[,.…]+$/, '').toUpperCase();
  const fit = Math.min(size, 1700 / (txt.length * 0.47));
  return (
    <Center>
      <div style={{ fontFamily: F.display, fontSize: fit, lineHeight: 1, color: palette[idx % palette.length], transform: `scale(${1.35 - 0.35 * e})`, letterSpacing: '-0.01em', ...(idx >= 2 && txt === 'HOT' ? { backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', color: 'transparent' } : {}) }}>{txt}</div>
    </Center>
  );
};

const smallCaps: React.CSSProperties = { fontFamily: F.mono, fontSize: 22, letterSpacing: '0.35em', color: 'rgba(255,243,226,0.65)' };

export const SCENES: Def[] = [
  // ───────────── INTRO ─────────────
  {
    id: 'title', from: 0, to: 2.3, el: (t, d) => {
      const line = easeInOutCubic(clamp((t - 0.2) / 0.9));
      const reveal = easeOutCubic(clamp((t - 0.45) / 1.2));
      return (
        <Scene t={t} from={d.from} to={d.to} enter="cut" exit="blur" exitDur={0.35}>
          <Center>
            <div style={{ position: 'relative', textAlign: 'center', transform: `scale(${1 + t * 0.015})` }}>
              <div style={{ width: 1100 * line, height: 2, margin: '0 auto 40px', background: `linear-gradient(90deg, transparent, ${C.gold}, #fff, ${C.gold}, transparent)`, boxShadow: `0 0 30px ${C.fire}` }} />
              <div style={{ fontFamily: F.display, fontSize: 170, lineHeight: 1, letterSpacing: `${lerp(0.5, 0.04, reveal)}em`, opacity: reveal, backgroundImage: CHROME_GRADIENT, WebkitBackgroundClip: 'text', color: 'transparent', filter: `blur(${(1 - reveal) * 12}px)` }}>
                TOO HOT TO HANDLE
              </div>
              {ARTIST && <div style={{ ...smallCaps, marginTop: 30, opacity: clamp((t - 1.0) / 0.5) }}>{ARTIST.toUpperCase()}</div>}
              <div style={{ width: 1100 * line, height: 2, margin: '40px auto 0', background: `linear-gradient(90deg, transparent, ${C.gold}, #fff, ${C.gold}, transparent)` }} />
            </div>
          </Center>
        </Scene>
      );
    },
  },
  {
    id: 'c1-yeah', from: 2.2, to: 3.2, el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="fade" exitDur={0.3}>
        <Center>
          {W(1, t, { preset: 'blur', font: 'serif', upper: false, size: 120, accents: { yeah: 'serif' }, dur: 0.5, keepPunct: true })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c2-mirror', from: 2.95, to: cueOut(2), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="fade" exitDur={0.4}>
        <Center>
          <Mirror t={t} start={2.95} w={620} h={760} sheenAt={wt(2, 6 - 1)} draw={1.5}>
            <div style={{ transform: `scale(${1 + (t - 3) * 0.012})` }}>
              {W(2, t, { preset: 'blur', size: 96, lines: [2, 1, 2, 1], accents: { mirror: 'chrome', jealous: 'serifPink' }, lineHeight: 1.05, dur: 0.55 })}
            </div>
          </Mirror>
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c3-walkin', from: cue(3).start - 0.1, to: cueOut(3), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="fade" exitDur={0.25}>
        <DoorLight t={t} start={7.4} dur={2.8} cx={1380} />
        <Pos x={150} y={300}>
          {W(3, t, { preset: 'rise', size: 118, lines: [3, 2, 4], align: 'left', keepPunct: true, accents: { walk: 'hot', 'in': 'hot' }, lineHeight: 1.08, dur: 0.5 })}
        </Pos>
      </Scene>
    ),
  },
  // ───────────── VERSE 1 ─────────────
  {
    id: 'c4', ...span(4, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="left">
        <Pos x={1180} y={300}><MoodDial t={t} start={10.4} size={480} /></Pos>
        <Pos x={170} y={330}>
          {W(4, t, { preset: 'slam', size: 170, lines: [3, 1], align: 'left', accents: { 'mood-setter': 'hot' }, lineHeight: 1.02 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c5', ...span(5), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="up">
        <Pos x={1220} y={250}><WeatherWidget t={t} start={WEATHER_START} from={WEATHER_FROM} to={WEATHER_TO} /></Pos>
        <Pos x={150} y={330}>
          {W(5, t, { preset: 'rise', size: 104, lines: [4, 2], align: 'left', accents: { weather: 'serif', better: 'serif' }, lineHeight: 1.1 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c6', ...span(6), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="blur">
        <Whispers t={t} start={16.1} items={["who's that?", 'kaun hai?', "who's that man?", 'is that him??', 'ohh who is that', 'kaun aa eh?', "who's that??", 'wait who', "who's that man?", 'look look look', 'OMG']} />
        <Center>
          <div style={{ textAlign: 'center' }}>
            {W(6, t, { preset: 'type', font: 'mono', size: 34, only: [0, 2], tracking: '0.3em', gap: 0.8, color: 'rgba(255,243,226,0.75)' })}
            <div style={{ height: 24 }} />
            {W(6, t, { preset: 'blur', font: 'serif', size: 150, only: [2, 5], upper: false, accents: { whos: 'serif', that: 'serif', man: 'serif' }, keepPunct: true, dur: 0.5 })}
          </div>
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c7', ...span(7), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="zoom">
        <Center><BigGlyph t={t} start={wt(7, 6) - 0.1} glyph="®" size={980} /></Center>
        <Center>
          <div style={{ textAlign: 'center' }}>
            {W(7, t, { preset: 'rise', size: 84, only: [0, 5], tracking: '0.06em' })}
            {W(7, t, { preset: 'slam', size: 330, only: [5, 6], fill: 'hot', lineHeight: 0.95, dur: 0.5 })}
            {W(7, t, { preset: 'rise', size: 84, only: [6, 7], tracking: '0.2em' })}
          </div>
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c8', ...span(8), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="left">
        <Pos x={1060} y={40}><BigGlyph t={t} start={wt(8, 3) - 0.1} glyph="™" size={760} color={C.gold} /></Pos>
        <Center>
          <div>
            {W(8, t, { preset: 'drop', size: 120, only: [0, 3], align: 'left', tracking: '0.04em' })}
            {W(8, t, { preset: 'drop', size: 250, only: [3, 4], align: 'left', fill: 'chrome', lineHeight: 0.95 })}
          </div>
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c9', ...span(9), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="up">
        <Pos x={1220} y={90}><Feed t={t} start={24.8} /></Pos>
        <Pos x={160} y={360}>
          {W(9, t, { preset: 'rise', size: 150, lines: [3, 2], align: 'left', accents: { remark: 'serif', scroll: 'outline' }, lineHeight: 1.08 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c10', ...span(10), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="down">
        <Center>
          <Newspaper t={t} start={27.5}>
            {W(10, t, { preset: 'slam', size: 200, only: [0, 2], color: '#141012', shadow: false, lineHeight: 0.95 })}
            <div style={{ height: 10 }} />
            {W(10, t, {
              preset: 'rise', font: 'serif', size: 86, only: [2, 6], upper: false, color: '#141012', shadow: false,
              wordStyle: () => ({ fontStyle: 'italic', fontWeight: 700 }),
              wrap: (i, node) => (i === 5 ? <Highlight t={t} start={wt(10, 5) + 0.05} color="rgba(255,46,110,0.75)">{node}</Highlight> : node),
            })}
          </Newspaper>
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c11', ...span(11), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="fade">
        <Spotlight t={t} start={30.65} settle={2.2} />
        <Center style={{ top: 60 }}>
          <div style={{ textAlign: 'center' }}>
            {W(11, t, { preset: 'blur', size: 100, only: [0, 4], tracking: '0.05em' })}
            {W(11, t, { preset: 'pop', size: 290, only: [4, 5], fill: 'hot', lineHeight: 1, glow: 'rgba(255,140,40,0.55)' })}
          </div>
        </Center>
      </Scene>
    ),
  },
  // ───────────── MIRROR FLEX ─────────────
  {
    id: 'c12', ...span(12), el: (t, d) => {
      const block = (tt: number) => (
        <div>
          {W(12, tt, { preset: 'rise', size: 130, lines: [3, 3], align: 'left', accents: { mirror: 'chrome', flex: 'serif' }, lineHeight: 1.05 })}
        </div>
      );
      return (
        <Scene t={t} from={d.from} to={d.to} exit="fade">
          <Pos x={140} y={170}>
            <Mirror t={t} start={34.3} w={560} h={740} draw={0.8} sheenAt={wt(12, 4)}>
              <div style={{ transform: 'scaleX(-1) scale(0.62)', opacity: 0.85, filter: 'blur(0.6px) brightness(0.9) sepia(0.2) hue-rotate(190deg)' }}>{block(t - 0.12)}</div>
            </Mirror>
          </Pos>
          <Pos x={860} y={360}>{block(t)}</Pos>
        </Scene>
      );
    },
  },
  {
    id: 'c13', ...span(13), el: (t, d) => {
      const stress = clamp((t - wt(13, 3)) / 0.8);
      const f = Math.floor(t * 30);
      const jit = (k: number) => (Math.sin(f * 2.3 + k) * 10 + Math.sin(f * 5.1 + k) * 6) * stress;
      return (
        <Scene t={t} from={d.from} to={d.to} exit="blur">
          <Center>
            <Mirror t={t} start={36.95} w={1250} h={700} draw={0.7} crack={clamp((t - wt(13, 3)) / 0.9)}>
              <div style={{ transform: `translate(${jit(1)}px, ${jit(2)}px) rotate(${jit(3) * 0.15}deg)` }}>
                {W(13, t, { preset: 'rise', size: 140, lines: [2, 3], accents: { reflection: 'chrome', stress: 'serifPink' }, lineHeight: 1.05 })}
              </div>
            </Mirror>
          </Center>
        </Scene>
      );
    },
  },
  {
    id: 'c14', ...span(14), el: (t, d) => {
      const amt = clamp((t - wt(14, 2)) / 0.1) * (0.6 + 0.4 * Math.sin(t * 20));
      return (
        <Scene t={t} from={d.from} to={d.to} exit="cut">
          <Pos x={90} y={140} style={{ ...smallCaps, color: C.red }}>ERR_0x152 · PLAN.EXE HAS STOPPED RESPONDING</Pos>
          <Pos x={1180} y={900} style={{ ...smallCaps }}>FRAME DROP · SIGNAL ▮▮▯▯</Pos>
          <Center>
            <Glitch t={t} amt={amt}>
              {W(14, t, { preset: 'flicker', size: 190, lines: [3, 3], accents: { glitch: 'pink' }, lineHeight: 1, dur: 0.3 })}
            </Glitch>
          </Center>
          <Scanlines opacity={0.3} />
        </Scene>
      );
    },
  },
  {
    id: 'c15', ...span(15), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="up">
        <Pos x={0} y={130} w={1920}>
          {W(15, t, { preset: 'rise', size: 130, accents: { trend: 'hot', fans: 'serif' } })}
        </Pos>
        <Pos x={310} y={420}><TrendChart t={t} start={42.9} /></Pos>
      </Scene>
    ),
  },
  // ───────────── VERSE 2 ─────────────
  {
    id: 'c16', ...span(16, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="left">
        <Center>
          <Echo t={t} n={16} copies={4} lag={0.1} dx={-30} p={{ preset: 'drift', size: 140, lines: [4, 4], accents: { 'slow-mo': 'serif', follow: 'hot' }, lineHeight: 1.08, dur: 0.9 }} />
        </Center>
        <Pos x={0} y={940} w={1920} style={{ display: 'flex', justifyContent: 'center', gap: 22 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const b = beatAt(t);
            return <div key={i} style={{ width: 70, height: 6, background: b.idx % 8 === i ? C.fire : 'rgba(255,255,255,0.18)' }} />;
          })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c17', ...span(17), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="zoom">
        <CrowdNoise t={t} start={50.3} focus={wt(17, 6) - 0.1} />
        <Center>
          <div style={{ textAlign: 'center' }}>
            {W(17, t, { preset: 'rise', size: 90, only: [0, 6], tracking: '0.04em' })}
            {W(17, t, { preset: 'pop', size: 330, only: [6, 7], fill: 'serif', lineHeight: 1.05 })}
          </div>
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c18', ...span(18, 0.1), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Pos x={580} y={560}><AlertDialog t={t} start={wt(18, 3) - 0.05} title="Protocol broken" body="looks.exe exceeded safe limits" /></Pos>
        <Pos x={0} y={170} w={1920}>
          {W(18, t, { preset: 'slam', size: 150, lines: [3, 2], accents: { protocol: 'hot' }, lineHeight: 1 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c19', ...span(19, 0.1), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <HazardBand t={t} start={54.8} y={110} text="DANGER ZONE" />
        <HazardBand t={t} start={54.9} y={840} text="DANGER ZONE" dir={-1} angle={-6} />
        <Center>
          {W(19, t, { preset: 'slam', size: 170, lines: [3, 3], accents: { danger: 'pink', zone: 'pink', control: 'chrome', wall: 'chrome' }, lineHeight: 1, dur: 0.3 })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c20', ...span(20, 0.1), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="left">
        <Pos x={1250} y={80}><Phone t={t} start={56.5} name="You Know Who 🔥" msg="I'm here. Everyone's staring again." /></Pos>
        <Pos x={150} y={340}>
          {W(20, t, { preset: 'rise', size: 140, lines: [3, 3], align: 'left', accents: { bold: 'hot', letters: 'hot' }, lineHeight: 1.08 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c21', ...span(21, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Crosshair t={t} start={58.7} />
        <Center>
          {W(21, t, { preset: 'pop', size: 160, lines: [2, 2], accents: { classy: 'serif' }, lineHeight: 1.05, dur: 0.3 })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c22', ...span(22, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="left">
        <Pos x={-200} y={160}><Vinyl t={t} start={60.2} size={760} /></Pos>
        <Pos x={700} y={350}>
          {W(22, t, { preset: 'drift', size: 115, lines: [3, 1, 4], align: 'left', accents: { smooth: 'serif', vinyl: 'hot', wool: 'serif' }, lineHeight: 1.12, dur: 0.6 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c23', ...span(23, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="blur" exitDur={0.35}>
        <Center>
          {W(23, t, {
            preset: 'rise', size: 150, lines: [3, 4], lineHeight: 1.1, accents: { final: 'hot' },
            wrap: (i, node) => (i === 6 ? <Struck t={t} start={wt(23, 6) + 0.25}>{node}</Struck> : node),
          })}
        </Center>
        <Pos x={1220} y={170}><Stamp t={t} start={wt(23, 2) + 0.1} text="FINAL" size={130} rot={-14} /></Pos>
      </Scene>
    ),
  },
  // ───────────── HOOK 1 ─────────────
  {
    id: 'c24', from: 66.15, to: cueOut(24), el: (t, d) => {
      const push = 1 + (t - 66.3) * 0.012;
      return (
        <Scene t={t} from={d.from} to={d.to} exit="zoom">
          <Center style={{ transform: `scale(${push})` }}>
            <div style={{ textAlign: 'center' }}>
              {W(24, t, { preset: 'type', font: 'mono', size: 40, only: [0, 2], tracking: '0.3em', gap: 0.8, color: C.gold })}
              {W(24, t, { preset: 'blur', size: 270, only: [2, 4], fill: 'hot', lineHeight: 0.98, dur: 0.6, glow: 'rgba(255,90,20,0.45)' })}
              {W(24, t, { preset: 'blur', size: 270, only: [4, 6], fill: 'outline', lineHeight: 0.98, dur: 0.6 })}
              <div style={{ height: 22 }} />
              {W(24, t, { preset: 'rise', font: 'serif', size: 76, only: [6, 11], upper: false, accents: { scandal: 'serifPink' }, wordStyle: () => ({ fontStyle: 'italic' }), wrap: (i, node) => (i === 10 ? <Highlight t={t} start={wt(24, 10) + 0.2} color="rgba(255,46,110,0.22)">{node}</Highlight> : node) })}
            </div>
          </Center>
        </Scene>
      );
    },
  },
  {
    id: 'c25', ...span(25, 0.1), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="up">
        <Pos x={170} y={300}><Candle t={t} start={cue(25).start} litAt={wt(25, 4)} /></Pos>
        <Pos x={560} y={330}>
          {W(25, t, { preset: 'rise', size: 120, lines: [4, 1, 5], align: 'left', accents: { candle: 'serif', fire: 'hot' }, lineHeight: 1.12 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c26', ...span(26, 0.1), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Center>
          {W(26, t, { preset: 'scramble', size: 190, lines: [3, 2], accents: { scramble: 'hot', nazran: 'outline' }, lineHeight: 1.02, dur: 0.5 })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c27', ...span(27, 0.1), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Pos x={110} y={260}><Heart t={t} start={77.15} crackAt={wt(27, 5)} size={560} /></Pos>
        <Pos x={760} y={300}>
          {W(27, t, { preset: 'rise', size: 130, lines: [4, 3, 2], align: 'left', accents: { smile: 'serif', heart: 'serifPink', panel: 'hot' }, lineHeight: 1.1 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c28', from: 80.8, to: cueOut(28), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Punch t={t} n={28} size={560} />
      </Scene>
    ),
  },
  {
    id: 'c29', ...span(29, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="left">
        <Pos x={1150} y={110}><Player t={t} start={83.95} song={t} /></Pos>
        <Pos x={150} y={360}>
          {W(29, t, { preset: 'rise', size: 160, lines: [2, 2], align: 'left', accents: { channel: 'serif', playlist: 'hot' }, lineHeight: 1.08 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c30', ...span(30, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <AngleFrames t={t} start={86.7} beatIdx={beatAt(t).idx} />
        <Center>
          {W(30, t, { preset: 'slam', size: 170, lines: [3, 3], accents: { eyes: 'hot', angle: 'serif' }, lineHeight: 1.05, dur: 0.35 })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c31', ...span(31, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="zoom">
        <Center style={{ opacity: 0.9 }}><Heart t={t} start={89.0} popAt={wt(31, 2)} size={640} /></Center>
        <Center>
          <div style={{ textAlign: 'center' }}>
            {W(31, t, { preset: 'slam', size: 130, only: [0, 3], accents: { pop: 'pink' }, dur: 0.3 })}
            {W(31, t, { preset: 'pop', font: 'serif', size: 230, only: [3, 4], upper: false, fill: 'serifPink', keepPunct: true, lineHeight: 1.1 })}
            {W(31, t, { preset: 'rise', size: 110, only: [4, 7], accents: { scandal: 'hot' }, keepPunct: true })}
          </div>
        </Center>
        <Pos x={1250} y={180}><Stamp t={t} start={wt(31, 6)} text="SCANDAL" size={100} rot={12} color={C.red} /></Pos>
      </Scene>
    ),
  },
  // ───────────── VERSE 3 ─────────────
  {
    id: 'c32', ...span(32, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Pos x={150} y={270}><StopSign t={t} start={wt(32, 3) - 0.1} size={540} /></Pos>
        <Pos x={780} y={370}>
          {W(32, t, { preset: 'slam', size: 140, lines: [3, 2], align: 'left', accents: { show: 'hot', stopper: 'hot' }, lineHeight: 1.08, dur: 0.3 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c33', ...span(33, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Center><SparkBurst t={t} start={wt(33, 1)} size={1100} /></Center>
        <Center>
          <div style={{ textAlign: 'center' }}>
            {W(33, t, { preset: 'pop', size: 260, only: [0, 2], accents: { spark: 'serif' }, lineHeight: 1, dur: 0.3 })}
            {W(33, t, { preset: 'rise', size: 110, only: [2, 4], fill: 'outline', tracking: '0.08em' })}
          </div>
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c34', ...span(34, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Pos x={120} y={300}><Clapper t={t} start={95.06} clapAt={wt(34, 4)} scene="07" /></Pos>
        <Pos x={840} y={370}>
          {W(34, t, { preset: 'rise', size: 130, lines: [4, 2], align: 'left', accents: { scene: 'hot' }, lineHeight: 1.1, dur: 0.3 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c35', ...span(35, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Pos x={0} y={200} w={1920} style={{ display: 'flex', justifyContent: 'center' }}><Timecode t={t} start={96.7} /></Pos>
        <Center style={{ top: 80 }}>
          {W(35, t, { preset: 'drop', size: 150, lines: [4, 1], accents: { proper: 'serif', timing: 'hot' }, lineHeight: 1.08, dur: 0.3 })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c36', ...span(36, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Pos x={200} y={190}>
          <Mirror t={t} start={98.05} w={520} h={700} draw={0.5} sheenAt={wt(36, 2)}>
            <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontWeight: 900, fontSize: 150, color: C.pink, transform: 'scaleX(-1)', opacity: clamp((t - wt(36, 2)) / 0.2) }}>bff</div>
          </Mirror>
        </Pos>
        <Pos x={860} y={380}>
          {W(36, t, { preset: 'rise', size: 140, lines: [2, 3], align: 'left', accents: { mirror: 'chrome', best: 'serif', friend: 'serif' }, lineHeight: 1.1, dur: 0.3 })}
        </Pos>
      </Scene>
    ),
  },
  {
    id: 'c37', ...span(37, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Viewfinder t={t} start={99.78} />
        <Center>
          {W(37, t, { preset: 'slam', size: 170, lines: [2, 3], accents: { yes: 'pink', camera: 'chrome' }, lineHeight: 1.05, dur: 0.3 })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c38', ...span(38, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <Center>
          {W(38, t, { preset: 'pop', size: 150, lines: [3, 3], accents: { reason: 'serif' }, lineHeight: 1.1, dur: 0.3 })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c39', ...span(39, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="fade">
        <Pos x={0} y={240} w={1920}>
          {W(39, t, { preset: 'rise', size: 130, lines: [5, 2], accents: { season: 'serif', fan: 'hot' }, lineHeight: 1.1, dur: 0.3 })}
        </Pos>
        <Pos x={0} y={720} w={1920}><SeasonCard t={t} start={103.4} /></Pos>
      </Scene>
    ),
  },
  // ───────────── HOOK 2 ─────────────
  {
    id: 'c40', from: 105.0, to: cueOut(40), el: (t, d) => {
      // stack builds word by word
      const ws = cue(40).words;
      const vis = (i: number) => t >= ws[i].t - 0.03;
      const pe = (i: number) => easeOutExpo(clamp((t - ws[i].t) / 0.25));
      const big = (i: number, txt: string, style: React.CSSProperties) =>
        vis(i) ? <span style={{ display: 'inline-block', transform: `scale(${1.6 - 0.6 * pe(i)})`, opacity: clamp((t - ws[i].t + 0.03) / 0.05), ...style }}>{txt}</span> : <span style={{ opacity: 0, ...style }}>{txt}</span>;
      return (
        <Scene t={t} from={d.from} to={d.to} exit="zoom">
          <Center>
            <div style={{ textAlign: 'center', fontFamily: F.display, lineHeight: 0.92 }}>
              <div style={{ fontSize: 60, letterSpacing: '0.3em', color: C.gold, fontFamily: F.mono }}>{big(0, 'NI', { marginRight: 36 })}{big(1, "I'M", {})}</div>
              <div style={{ fontSize: 300, display: 'flex', gap: 50, justifyContent: 'center' }}>
                {big(2, 'TOO', { color: C.cream })}
                {big(3, 'HOT', { backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', color: 'transparent' })}
              </div>
              <div style={{ fontSize: 300, display: 'flex', gap: 50, justifyContent: 'center' }}>
                {big(4, 'TO', { color: 'transparent', WebkitTextStroke: `4px ${C.cream}` })}
                {big(5, 'HANDLE', { color: C.fire })}
              </div>
            </div>
          </Center>
        </Scene>
      );
    },
  },
  {
    id: 'c41', ...span(41, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="cut">
        <AbsoluteFill style={{ opacity: 0.4, filter: 'blur(3px)' }}><TabloidWall t={t} start={108.2} every={0.2} /></AbsoluteFill>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(7,6,10,0.8), transparent 70%)' }} />
        <Center>
          <div style={{ textAlign: 'center' }}>
            {W(41, t, { preset: 'rise', font: 'serif', size: 96, only: [0, 4], upper: false, wordStyle: () => ({ fontStyle: 'italic' }) })}
            {W(41, t, { preset: 'slam', size: 300, only: [4, 5], fill: 'hot', lineHeight: 1 })}
          </div>
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c42', ...span(42, 0.05), el: (t, d) => (
      <Scene t={t} from={d.from} to={d.to} exit="up">
        <Pos x={60} y={330}><Candle t={t} start={cue(42).start} litAt={wt(42, 4)} scale={0.85} /></Pos>
        <Pos x={1660} y={330}><Candle t={t} start={cue(42).start + 0.1} litAt={wt(42, 4) + 0.08} seed={3} scale={0.85} /></Pos>
        <Center>
          {W(42, t, { preset: 'slam', size: 125, lines: [4, 1, 5], accents: { candle: 'serif', fire: 'hot', angle: 'serif' }, lineHeight: 1.12, dur: 0.3 })}
        </Center>
      </Scene>
    ),
  },
  {
    id: 'c43', from: 114.44, to: cueOut(43) + 0.35, el: (t, d) => {
      const wall = wt(43, 6) + 0.1;
      return (
        <Scene t={t} from={d.from} to={d.to} exit="cut">
          {t >= wall && <TabloidWall t={t} start={wall} every={0.11} />}
          {t < wall + 0.8 && (
            <AbsoluteFill style={{ opacity: 1 - clamp((t - wall) / 0.8) }}>
              <Center><Heart t={t} start={114.4} popAt={wt(43, 2)} size={720} /></Center>
              <Center>
                <div style={{ textAlign: 'center' }}>
                  {W(43, t, { preset: 'slam', size: 150, only: [0, 3], accents: { pop: 'pink' }, dur: 0.35 })}
                  {W(43, t, { preset: 'pop', font: 'serif', size: 260, only: [3, 4], upper: false, fill: 'serifPink', keepPunct: true, lineHeight: 1.1 })}
                  {W(43, t, { preset: 'rise', size: 120, only: [4, 7], accents: { scandal: 'hot' }, keepPunct: true })}
                </div>
              </Center>
            </AbsoluteFill>
          )}
          {t >= wall && (
            <Center>
              <div style={{ background: C.red, padding: '10px 60px', transform: `rotate(-6deg) scale(${easeOutBack(clamp((t - wall - 0.6) / 0.3), 2)})`, fontFamily: F.display, fontSize: 210, color: '#fff', boxShadow: '0 40px 120px rgba(0,0,0,0.7)' }}>SCANDAL!</div>
            </Center>
          )}
        </Scene>
      );
    },
  },
  // ───────────── DROP ─────────────
  {
    id: 'c44', from: 120.6, to: 129.95, el: (t, d) => {
      const ws = cue(44).words;
      const surge = easeOutCubic(clamp((t - FIRE_AT + 0.1) / 0.5)) * (1 - clamp((t - 129.2) / 0.6));
      return (
        <Scene t={t} from={d.from} to={d.to} exit="blur" exitDur={0.45}>
          <AbsoluteFill style={{ opacity: 0.16 + 0.1 * beatAt(t).pulse }}><Marquee t={t} text="TOO HOT  •  NO SCANDAL  •" rows={7} size={170} /></AbsoluteFill>
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse 62% 55% at center, rgba(7,6,10,0.9), transparent 100%)' }} />
          {surge > 0 && (
            <AbsoluteFill style={{ opacity: surge }}>
              <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 110%, rgba(255,120,30,0.75), rgba(255,60,20,0.25) 45%, transparent 75%)', mixBlendMode: 'screen' }} />
              <Pos x={0} y={640} w={1920} style={{ display: 'flex', justifyContent: 'space-around', transform: `translateY(${(1 - surge) * 400}px)`, opacity: 0.7 }}>
                {[0, 1, 2, 3].map((k) => (
                  <div key={k} style={{ transform: `scale(${2.2 + (k % 2) * 0.5})`, transformOrigin: '50% 100%' }}><Flame t={t + k * 0.37} size={200} seed={k * 2} /></div>
                ))}
              </Pos>
            </AbsoluteFill>
          )}
          <Center style={{ top: -60 }}>
            <div style={{ textAlign: 'center' }}>
              {W(44, t, { preset: 'blur', size: 330, only: [0, 2], fill: 'hot', lines: [2], dur: 0.8, glow: `rgba(255,${90 + 80 * surge},20,${0.5 + 0.4 * surge})`, wordStyle: (_, l) => ({ transform: `scale(${1 + Math.max(0, l) * 0.008})` }) })}
            </div>
          </Center>
          <Pos x={0} y={700} w={1920} style={{ display: 'flex', justifyContent: 'center', gap: 60 }}>
            <Stamp t={t} start={ws[2].t} text="NO" size={170} rot={-8} color={C.cream} />
            <Stamp t={t} start={ws[3].t} text="SCANDAL" size={170} rot={-8} color={C.pink} />
          </Pos>
        </Scene>
      );
    },
  },
  // ───────────── OUTRO ─────────────
  {
    id: 'outro-mirror', from: 129.75, to: 137.5, el: (t, d) => {
      const lp = clamp((t - KISS_AT) / 0.18);
      return (
        <Scene t={t} from={d.from} to={d.to} exit="blur" exitDur={0.8}>
          <Center>
            <Mirror t={t} start={129.8} w={640} h={790} draw={1.6} sheenAt={132.5}>
              <div style={{ position: 'relative' }}>
                {t < cue(46).start + 0.1 && (
                  <div style={{ opacity: 1 - clamp((t - cue(46).start + 0.2) / 0.3) }}>
                    {W(45, t, { preset: 'blur', size: 86, lines: [2, 2, 2], accents: { mirror: 'chrome', flex: 'serif' }, lineHeight: 1.08, dur: 0.7 })}
                  </div>
                )}
                {t >= cue(46).start - 0.1 && W(46, t, { preset: 'blur', size: 100, lines: [1, 2], accents: { reflection: 'chrome', stress: 'serifPink' }, lineHeight: 1.08, dur: 0.6 })}
              </div>
              {lp > 0 && (
                <div style={{ position: 'absolute', left: 330, top: 500, transform: `rotate(-14deg) scale(${1.8 - 0.8 * easeOutCubic(lp)})`, opacity: lp * 0.92, mixBlendMode: 'screen' }}>
                  <Lips size={220} />
                </div>
              )}
            </Mirror>
          </Center>
        </Scene>
      );
    },
  },
  {
    id: 'endcard', from: 137.0, to: 143.4, el: (t, d) => {
      const p = easeOutCubic(clamp((t - 137.1) / 1.4));
      const out = clamp((t - 141.9) / 1.2);
      return (
        <Scene t={t} from={d.from} to={d.to} exit="cut">
          <AbsoluteFill style={{ opacity: 1 - out }}>
            <Center>
              <div style={{ textAlign: 'center', transform: `scale(${1 + (t - 137) * 0.01})` }}>
                <div style={{ width: 900 * p, height: 2, margin: '0 auto 36px', background: `linear-gradient(90deg, transparent, ${C.gold}, #fff, ${C.gold}, transparent)` }} />
                <div style={{ fontFamily: F.display, fontSize: 150, lineHeight: 1, letterSpacing: `${lerp(0.3, 0.04, p)}em`, opacity: p, filter: `blur(${(1 - p) * 10}px)`, backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', color: 'transparent' }}>TOO HOT TO HANDLE</div>
                {ARTIST && <div style={{ ...smallCaps, marginTop: 24, opacity: clamp((t - 137.8) / 0.8) }}>{ARTIST.toUpperCase()}</div>}
                <div style={{ width: 900 * p, height: 2, margin: '36px auto 0', background: `linear-gradient(90deg, transparent, ${C.gold}, #fff, ${C.gold}, transparent)` }} />
              </div>
            </Center>
          </AbsoluteFill>
          <AbsoluteFill style={{ background: '#000', opacity: out }} />
        </Scene>
      );
    },
  },
];
