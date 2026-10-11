import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeOutCubic, rand } from '../lib/time';
import { VF } from './fonts';
import { gradientCss, cssColor, Blend, PaletteName } from './thermal';
import { grid, tempAt, wild, freezeAt, inWin, STUTTER } from './story';

const INK = 'rgba(246,242,234,0.92)';
const DIM = 'rgba(246,242,234,0.55)';
const RED = '#ff3b30';
const AMBER = '#ffb020';

export type Warn = { from: number; to: number; text: string; level?: 'amber' | 'red' | 'white' };
/** Camera warnings, in story order. */
export const WARNINGS: Warn[] = [
  { from: 0.05, to: 1.95, text: 'CALIBRATING', level: 'white' },
  { from: 1.97, to: 3.0, text: 'TARGET LOCKED', level: 'white' },
  { from: 15.88, to: 19.85, text: 'SCANNING SUBJECT', level: 'white' },
  { from: 19.87, to: 21.6, text: 'MATCH FOUND · THE BRAND', level: 'amber' },
  { from: 40.4, to: 42.4, text: 'ERR · PLAN.EXE', level: 'red' },
  { from: 54.4, to: 54.74, text: 'PROTOCOL BROKEN', level: 'red' },
  { from: 54.75, to: 56.5, text: 'DANGER ZONE', level: 'amber' },
  { from: 72.4, to: 77.0, text: 'HIGH TEMP', level: 'amber' },
  { from: 77.05, to: 80.66, text: 'CRITICAL TEMP', level: 'red' },
  { from: 80.667, to: 83.9, text: 'SENSOR OVERLOAD', level: 'red' },
  { from: 90.12, to: 92.13, text: '❚❚ SIGNAL FROZEN', level: 'white' },
  { from: 92.15, to: 93.6, text: 'RECALIBRATING', level: 'white' },
  { from: 105.2, to: 111.2, text: 'HIGH GAIN MODE', level: 'amber' },
  { from: 111.25, to: 115.4, text: 'OVER RANGE', level: 'red' },
  { from: 115.62, to: 118.03, text: '❚❚ SIGNAL FROZEN', level: 'white' },
  { from: 118.07, to: 120.8, text: 'SENSOR FAILURE', level: 'red' },
  { from: 120.8, to: 129.9, text: 'TOO HOT TO HANDLE', level: 'red' },
  { from: 129.95, to: 131.2, text: 'REBOOTING', level: 'white' },
  { from: 141.43, to: 143.4, text: 'SENSOR DAMAGED', level: 'red' },
];

/** The camera's heart-rate readout: the song tempo, until she smiles. */
const bpmAt = (t: number): string => {
  const ramp = (a: number, b: number, from: number, to: number) => Math.round(from + (to - from) * Math.pow(clamp((t - a) / (b - a)), 2));
  if (t >= 77.05 && t < 80.667) return `${ramp(77.05, 80.667, 154, 238)}`;
  if (t >= 80.667 && t < 83.9) return 'ERR';
  if (t >= 89.2 && t < 90.12) return `${ramp(89.2, 90.12, 154, 212)}`;
  if (t >= 90.12 && t < 92.13) return '---';
  if (t >= 114.5 && t < 115.62) return `${ramp(114.5, 115.62, 154, 212)}`;
  if (t >= 115.62 && t < 118.03) return '---';
  if (t >= 118.07 && t < 129.9) return 'ERR';
  if (t >= 141.43) return 'ERR';
  return '154';
};

const fmtTC = (t: number) => {
  const f = Math.floor(t * 30);
  return [Math.floor(t / 3600), Math.floor(t / 60) % 60, Math.floor(t) % 60, f % 30].map((v) => String(v).padStart(2, '0')).join(':');
};
export const fmtTemp = (v: number) => (isFinite(v) ? `${v < 100 ? v.toFixed(1) : Math.round(v)}` : '>650');
const status = (v: number) => (!isFinite(v) ? 'OVER RANGE' : v < 37.5 ? 'NORMAL' : v < 45 ? 'ELEVATED' : v < 90 ? 'HIGH' : v < 300 ? 'CRITICAL' : 'EXTREME');
const statusColor = (v: number) => (!isFinite(v) || v >= 90 ? RED : v >= 45 ? AMBER : v >= 37.5 ? '#ffd27a' : '#9fe0ff');

const Spark: React.FC<{ t: number; w: number; h: number }> = ({ t, w, h }) => {
  const N = 60, span = 24;
  const ys = Array.from({ length: N }, (_, i) => {
    const tt = t - span + (i / (N - 1)) * span;
    if (tt < 0) return null;
    const v = tempAt(tt);
    const lv = isFinite(v) ? Math.log(Math.max(20, v) / 20) / Math.log(700 / 20) : 1.05;
    return h - clamp(lv, 0, 1.05) * h;
  });
  const pts = ys.map((y, i) => (y === null ? null : `${(i / (N - 1)) * w},${y}`)).filter(Boolean);
  return (
    <svg width={w} height={h + 4} style={{ overflow: 'visible' }}>
      <line x1={0} x2={w} y1={h} y2={h} stroke="rgba(255,255,255,0.18)" />
      {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={INK} strokeWidth={2} />}
    </svg>
  );
};

/** Fixed camera HUD (not shaken with the image). */
export const HUD: React.FC<{ t: number; blend: Blend; name: PaletteName; show?: number; boot?: number }> = ({ t, blend, name, show = 1, boot = 1 }) => {
  const g = grid(t);
  const temp = tempAt(t);
  const isWild = wild(t);
  const fr = freezeAt(t);
  const blinkFast = Math.floor(t * 6) % 2 === 0;
  const recOn = Math.floor(t * 1.6) % 2 === 0;
  const fail = isWild && t >= 118.07;
  const jit = (k: number) => (fail ? (rand(Math.floor(t * 30) * 3.1 + k) - 0.5) * 10 : 0);
  const warn = WARNINGS.filter((w) => t >= w.from && t < w.to).pop();
  const scanning = inWin(t, STUTTER);
  const b = (k: number) => clamp((boot - k * 0.12) / 0.3);
  const tmpTxt = fail && t >= 118.6 ? 'ERR' : fmtTemp(temp);
  return (
    <AbsoluteFill style={{ opacity: show, pointerEvents: 'none', fontFamily: VF.hud, color: INK }}>
      {/* frame corners */}
      {[[40, 34, 1, 1], [1880, 34, -1, 1], [40, 1046, 1, -1], [1880, 1046, -1, -1]].map(([x, y, sx, sy], i) => (
        <div key={i} style={{ position: 'absolute', left: sx > 0 ? x : x - 46, top: sy > 0 ? y : y - 46, width: 46, height: 46, opacity: 0.55 * b(0), borderLeft: sx > 0 ? `2px solid ${INK}` : undefined, borderRight: sx < 0 ? `2px solid ${INK}` : undefined, borderTop: sy > 0 ? `2px solid ${INK}` : undefined, borderBottom: sy < 0 ? `2px solid ${INK}` : undefined }} />
      ))}
      {/* top-left: rec + title */}
      <div style={{ position: 'absolute', left: 76, top: 58, opacity: b(1), transform: `translate(${jit(1)}px, ${jit(2)}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 19, fontWeight: 600, letterSpacing: '0.12em' }}>
          <div style={{ width: 13, height: 13, borderRadius: 7, background: RED, opacity: recOn ? 1 : 0.25, boxShadow: `0 0 10px ${RED}` }} />
          REC <span style={{ color: DIM, fontWeight: 400 }}>{fmtTC(t)}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 15, letterSpacing: '0.34em', fontWeight: 700 }}>TOO HOT TO HANDLE</div>
      </div>
      {/* top-right: subject temperature */}
      <div style={{ position: 'absolute', right: 76, top: 50, width: 300, textAlign: 'right', opacity: b(2), transform: `translate(${jit(3)}px, ${jit(4)}px)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, letterSpacing: '0.24em', color: DIM }}>
          <span>SUBJECT · MAX</span>
          <span style={{ color: statusColor(temp), opacity: !isFinite(temp) && !blinkFast ? 0.35 : 1, fontWeight: 700 }}>{fail && t >= 118.6 ? 'FAILURE' : status(temp)}</span>
        </div>
        <div style={{ fontFamily: VF.wide, fontWeight: 700, fontSize: 50, lineHeight: 1.08, letterSpacing: '-0.02em', color: !isFinite(temp) ? RED : INK }}>
          {tmpTxt}<span style={{ fontSize: 24, verticalAlign: 'top', marginLeft: 4, fontFamily: VF.hud }}>{tmpTxt === 'ERR' ? '' : '°C'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}><Spark t={t} w={300} h={34} /></div>
      </div>
      {/* right: palette scale */}
      <div style={{ position: 'absolute', right: 52, top: 330, width: 14, height: 420, background: gradientCss(blend, '0deg'), border: '1px solid rgba(255,255,255,0.35)', opacity: b(3) * 0.9 }} />
      <div style={{ position: 'absolute', right: 76, top: 322, fontSize: 13, color: DIM, textAlign: 'right', opacity: b(3) }}>HI</div>
      <div style={{ position: 'absolute', right: 76, top: 736, fontSize: 13, color: DIM, textAlign: 'right', opacity: b(3) }}>LO</div>
      {/* bottom-left: mode */}
      <div style={{ position: 'absolute', left: 76, bottom: 56, fontSize: 15, letterSpacing: '0.2em', opacity: b(4), transform: `translate(${jit(5)}px, 0)` }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ padding: '3px 10px', border: `1px solid ${INK}`, fontWeight: 700 }}>{name}</span>
          <span style={{ color: DIM }}>ε 0.98 · AUTO</span>
        </div>
        <div style={{ marginTop: 8, color: DIM, fontSize: 13 }}>{scanning ? '10 Hz · SURVEILLANCE' : '640×512 · 30 Hz'}</div>
      </div>
      {/* bottom-right: heart rate = song tempo */}
      <div style={{ position: 'absolute', right: 76, bottom: 56, fontSize: 15, letterSpacing: '0.2em', textAlign: 'right', opacity: b(5) }}>
        <div style={{ color: bpmAt(t) === '154' ? INK : RED }}><span style={{ color: '#ff5a7a', display: 'inline-block', transform: `scale(${1 + 0.35 * g.pulse})` }}>♥</span> {bpmAt(t)} BPM</div>
        <div style={{ marginTop: 8, color: DIM, fontSize: 13 }}>{fr ? 'FRAME HOLD' : 'LIVE'}</div>
      </div>
      {/* centre reticle */}
      <div style={{ position: 'absolute', left: 960 - 22, top: 540, width: 44, height: 2, background: INK, opacity: 0.35 * b(2) }} />
      <div style={{ position: 'absolute', left: 959, top: 540 - 22, width: 2, height: 44, background: INK, opacity: 0.35 * b(2) }} />
      {/* warning banner */}
      {warn && (() => {
        const lp = easeOutCubic(clamp((t - warn.from) / 0.18));
        const col = warn.level === 'red' ? RED : warn.level === 'amber' ? AMBER : INK;
        const blink = warn.level === 'red' ? (blinkFast ? 1 : 0.55) : 1;
        return (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 62, display: 'flex', justifyContent: 'center', opacity: lp * blink, transform: `translate(${jit(7)}px, ${(1 - lp) * -14}px)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '7px 18px', border: `2px solid ${col}`, color: col, background: 'rgba(0,0,0,0.35)', fontSize: 19, fontWeight: 700, letterSpacing: '0.22em' }}>
              {warn.level !== 'white' && <span style={{ fontSize: 20 }}>⚠</span>}
              {warn.text}
              {scanning && warn.text === 'SCANNING SUBJECT' && <span style={{ color: DIM }}>{Math.min(99, Math.floor(((t - 15.88) / 3.9) * 100))}%</span>}
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

export const hotColor = (name: PaletteName) => cssColor(name, 0.82);
