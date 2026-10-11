import React from 'react';
import { C, F } from '../theme';
import { beatAt, clamp, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';

/** Layered candle-style flame: soft outer glow, tapered body, bright core. Smooth, low-frequency flicker. */
export const Flame: React.FC<{ t: number; size?: number; seed?: number; lean?: number }> = ({ t, size = 200, seed = 0, lean = 0 }) => {
  const n = (f: number, k: number) => Math.sin(t * f + seed * 1.7 + k) * 0.6 + Math.sin(t * f * 2.3 + k * 3.1 + seed) * 0.4;
  const sway = n(3.1, 1) * 5 + lean;
  const tipY = 4 + n(5.3, 2) * 3;
  const w = 1 + n(4.1, 3) * 0.04;
  const body = (cx: number, top: number, half: number, bottom: number) =>
    `M ${cx + sway} ${top} C ${cx + half * 0.35 + sway * 0.6} ${top + (bottom - top) * 0.3}, ${cx + half * w} ${bottom - (bottom - top) * 0.32}, ${cx + half * 0.72} ${bottom - 6} ` +
    `Q ${cx} ${bottom + 4}, ${cx - half * 0.72} ${bottom - 6} C ${cx - half * w} ${bottom - (bottom - top) * 0.32}, ${cx - half * 0.35 + sway * 0.6} ${top + (bottom - top) * 0.3}, ${cx + sway} ${top} Z`;
  const id = `fl${seed}`;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.62" r="0.55"><stop offset="0" stopColor="rgba(255,170,70,0.55)" /><stop offset="1" stopColor="rgba(255,90,20,0)" /></radialGradient>
        <linearGradient id={`${id}o`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff3d12" /><stop offset="0.45" stopColor={C.fire} /><stop offset="0.85" stopColor={C.gold} stopOpacity="0.9" /><stop offset="1" stopColor={C.gold} stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ffd27a" /><stop offset="1" stopColor="#fff6dc" /></linearGradient>
        <radialGradient id={`${id}c`} cx="0.5" cy="0.8" r="0.6"><stop offset="0" stopColor="#bcd4ff" /><stop offset="0.5" stopColor="#ffffff" /><stop offset="1" stopColor="#fff6dc" stopOpacity="0" /></radialGradient>
        <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
      </defs>
      <ellipse cx={50 + sway * 0.4} cy={78} rx={46} ry={56} fill={`url(#${id}g)`} />
      <path d={body(50, tipY, 22, 118)} fill={`url(#${id}o)`} filter={`url(#${id}b)`} opacity={0.95} />
      <path d={body(50, tipY + 22, 14, 116)} fill={`url(#${id}m)`} filter={`url(#${id}b)`} />
      <path d={body(50, tipY + 52, 7, 115)} fill={`url(#${id}c)`} />
    </svg>
  );
};

/** Pillar candle: lights on `litAt` with a match flare, sways to the beat ("move karaan candle"), drips wax, trails smoke and sparks. */
export const Candle: React.FC<{ t: number; start: number; litAt: number; seed?: number; scale?: number }> = ({ t, start, litAt, seed = 0, scale = 1 }) => {
  const p = easeOutCubic(clamp((t - start) / 0.5));
  const lit = clamp((t - litAt) / 0.25);
  const flare = Math.exp(-Math.max(0, t - litAt) * 6) * (t >= litAt ? 1 : 0);
  const { pulse, idx } = beatAt(t);
  const sway = lit * Math.sin(t * 3.9 + seed) * 4;
  const lean = lit * (idx % 2 ? 1 : -1) * 6 * pulse;
  const drip = clamp((t - litAt - 0.4) / 2.2);
  return (
    <div style={{ position: 'relative', width: 200, height: 640, transform: `translateY(${(1 - p) * 500}px) rotate(${sway}deg) scale(${scale})`, transformOrigin: '100px 640px', opacity: p }}>
      <div style={{ position: 'absolute', left: -320, top: -160, width: 840, height: 680, background: 'radial-gradient(circle at 50% 45%, rgba(255,170,80,0.42), transparent 60%)', opacity: lit * (0.8 + 0.25 * pulse) }} />
      <div style={{ position: 'absolute', left: 30, right: 30, top: 230, bottom: 0, borderRadius: '14px 14px 6px 6px', background: 'linear-gradient(90deg, #cdb79b, #fff3e2 38%, #f3e3cb 60%, #b9a386)' }} />
      <div style={{ position: 'absolute', left: 30, right: 30, top: 230, height: 46, borderRadius: '14px 14px 30px 30px', background: `radial-gradient(ellipse at 50% 30%, rgba(255,200,120,${0.9 * lit}), #fff8ec 70%)` }} />
      {/* wax drips */}
      {[0, 1].map((k) => {
        const dd = clamp(drip * 1.4 - k * 0.4);
        return <div key={k} style={{ position: 'absolute', left: k ? 128 : 44, top: 252, width: 14, height: 30 + dd * (k ? 90 : 140), borderRadius: '0 0 8px 8px', background: 'linear-gradient(90deg, #f0dfc4, #fff7ea)', boxShadow: '1px 0 0 rgba(0,0,0,0.06)' }} />;
      })}
      <div style={{ position: 'absolute', left: 97, top: 205, width: 6, height: 34, background: lit > 0 ? '#1a0e08' : '#3a2a20', borderRadius: 3 }} />
      <div style={{ position: 'absolute', left: 35, top: 46, opacity: lit, transform: `scale(${0.4 + lit * 0.6 + flare * 0.5 + pulse * 0.06 * lit})`, transformOrigin: '65px 200px' }}>
        <Flame t={t} size={130} seed={seed} lean={lean} />
      </div>
      {flare > 0.02 && <div style={{ position: 'absolute', left: -60, top: 60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,250,230,0.9), rgba(255,180,90,0) 65%)', opacity: flare }} />}
      {/* sparks lifting off the flame */}
      {lit > 0 && Array.from({ length: 6 }).map((_, i) => {
        const life = 1.4, ph = (t - litAt + rand(i + seed) * life) % life / life;
        return <div key={i} style={{ position: 'absolute', left: 98 + Math.sin(i * 2 + t * 3) * 14 * ph, top: 70 - ph * 220, width: 4, height: 4, borderRadius: 2, background: C.gold, boxShadow: `0 0 8px ${C.fire}`, opacity: (1 - ph) * lit }} />;
      })}
    </div>
  );
};

const HEART = 'M 0 34 C -10 24, -62 -6, -50 -36 C -40 -60, -8 -56, 0 -30 C 8 -56, 40 -60, 50 -36 C 62 -6, 10 24, 0 34 Z';
/** Heart that draws in, beats, then (optionally) pops into shards. */
export const Heart: React.FC<{ t: number; start: number; popAt?: number; crackAt?: number; size?: number }> = ({ t, start, popAt, crackAt, size = 520 }) => {
  const draw = easeInOutCubic(clamp((t - start) / 0.8));
  const fill = clamp((t - start - 0.6) / 0.3);
  const beat = 1 + Math.max(0, Math.sin((t - start) * 8)) * 0.05;
  const popped = popAt !== undefined && t >= popAt;
  const pp = popAt !== undefined ? clamp((t - popAt) / 0.9) : 0;
  const crack = crackAt !== undefined ? easeOutCubic(clamp((t - crackAt) / 0.4)) : 0;
  return (
    <svg width={size} height={size} viewBox="-80 -80 160 160" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="heartG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.pink} /><stop offset="1" stopColor="#a8002f" /></linearGradient>
      </defs>
      {!popped && (
        <g transform={`scale(${beat})`}>
          <path d={HEART} fill="url(#heartG)" opacity={fill} />
          <path d={HEART} fill="none" stroke={C.cream} strokeWidth={2} pathLength={1} strokeDasharray={`${draw} 1`} />
          {crack > 0 && <path d="M 0 -30 L -8 -12 L 6 0 L -6 14 L 0 34" fill="none" stroke="#14080b" strokeWidth={3} pathLength={1} strokeDasharray={`${crack} 1`} />}
        </g>
      )}
      {popped && (
        <>
          <circle r={20 + pp * 90} fill="none" stroke={C.cream} strokeWidth={4 * (1 - pp)} opacity={1 - pp} />
          {Array.from({ length: 28 }).map((_, i) => {
            const a = rand(i * 3.3) * Math.PI * 2;
            const d = easeOutExpo(pp) * (50 + rand(i) * 70);
            const s = (3 + rand(i * 7) * 7) * (1 - pp * 0.7);
            return <path key={i} d={`M 0 ${-s} L ${s * 0.8} ${s * 0.6} L ${-s * 0.8} ${s * 0.6} Z`} fill={i % 3 ? C.pink : C.cream} transform={`translate(${Math.cos(a) * d} ${Math.sin(a) * d + pp * pp * 30}) rotate(${rand(i) * 360 + pp * 400})`} opacity={1 - pp * 0.9} />;
          })}
        </>
      )}
    </svg>
  );
};

export const Player: React.FC<{ t: number; start: number; song: number }> = ({ t, start, song }) => {
  const p = easeOutBack(clamp((t - start) / 0.45), 1.3);
  const total = 143;
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <div style={{ width: 640, padding: 34, borderRadius: 34, background: 'linear-gradient(170deg, rgba(40,20,14,0.92), rgba(12,8,10,0.92))', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 120px rgba(0,0,0,0.7)', transform: `scale(${p}) rotate(${(1 - p) * -8}deg)`, fontFamily: F.sans, color: C.cream }}>
      <div style={{ height: 440, borderRadius: 20, background: `radial-gradient(circle at 50% 75%, ${C.fire}, #3a0b02 70%)`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Flame t={t} size={200} />
        <div style={{ position: 'absolute', bottom: 18, left: 22, fontFamily: F.display, fontSize: 48, lineHeight: 0.95 }}>TOO HOT<br />TO HANDLE</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>Too Hot To Handle</div>
          <div style={{ fontSize: 20, opacity: 0.6, fontFamily: F.mono }}>On repeat · your channel</div>
        </div>
        <div style={{ fontSize: 34, color: C.pink }}>♥</div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', marginTop: 22, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(song / total) * 100}%`, borderRadius: 3, background: C.cream }} />
        <div style={{ position: 'absolute', left: `calc(${(song / total) * 100}% - 8px)`, top: -5, width: 16, height: 16, borderRadius: 8, background: C.cream }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 16, opacity: 0.6, marginTop: 8 }}><span>{mm(song)}</span><span>-{mm(total - song)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 70, marginTop: 10, fontSize: 40 }}>
        <span>⏮</span><span style={{ width: 70, height: 70, borderRadius: 35, background: C.cream, color: '#140c0c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>❚❚</span><span>⏭</span>
      </div>
    </div>
  );
};

/** Camera framing brackets that jump between angles on the beat. */
export const AngleFrames: React.FC<{ t: number; start: number; beatIdx: number }> = ({ t, start, beatIdx }) => {
  const frames = [[360, 180, 1200, 720], [560, 260, 800, 560], [220, 120, 1480, 840], [700, 330, 520, 420]];
  const [x, y, w, h] = frames[beatIdx % frames.length];
  const L = 70;
  const c = 'rgba(255,243,226,0.85)';
  const corner = (s: React.CSSProperties) => <div style={{ position: 'absolute', width: L, height: L, ...s }} />;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, opacity: clamp((t - start) / 0.1) }}>
      {corner({ left: 0, top: 0, borderLeft: `4px solid ${c}`, borderTop: `4px solid ${c}` })}
      {corner({ right: 0, top: 0, borderRight: `4px solid ${c}`, borderTop: `4px solid ${c}` })}
      {corner({ left: 0, bottom: 0, borderLeft: `4px solid ${c}`, borderBottom: `4px solid ${c}` })}
      {corner({ right: 0, bottom: 0, borderRight: `4px solid ${c}`, borderBottom: `4px solid ${c}` })}
      <div style={{ position: 'absolute', left: 0, top: -40, fontFamily: F.mono, fontSize: 20, color: C.gold, letterSpacing: '0.2em' }}>ANGLE {String((beatIdx % 4) + 1).padStart(2, '0')} · EYES ON ME</div>
    </div>
  );
};

export const StopSign: React.FC<{ t: number; start: number; size?: number }> = ({ t, start, size = 520 }) => {
  const p = easeOutBack(clamp((t - start) / 0.35), 2.2);
  const pts = Array.from({ length: 8 }).map((_, i) => { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; return `${Math.cos(a) * 48},${Math.sin(a) * 48}`; }).join(' ');
  return (
    <svg width={size} height={size} viewBox="-55 -55 110 110" style={{ transform: `scale(${p}) rotate(${(1 - p) * 90}deg)` }}>
      <polygon points={pts} fill={C.red} stroke={C.cream} strokeWidth={3} />
      <text y={9} textAnchor="middle" fontFamily="Anton" fontSize={28} fill={C.cream} letterSpacing={1}>STOP</text>
    </svg>
  );
};

export const SparkBurst: React.FC<{ t: number; start: number; size?: number }> = ({ t, start, size = 900 }) => {
  const p = clamp((t - start) / 0.7);
  const e = easeOutExpo(p);
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ overflow: 'visible' }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const a = (i / 22) * Math.PI * 2 + rand(i) * 0.2;
        const r1 = 8 + e * 40, r2 = r1 + (12 + rand(i * 3) * 40) * (1 - p * 0.6);
        return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={i % 2 ? C.gold : C.cream} strokeWidth={1.6} strokeLinecap="round" opacity={1 - p} />;
      })}
      <circle r={6 + 10 * (1 - p)} fill={C.cream} opacity={1 - p} />
    </svg>
  );
};

export const Clapper: React.FC<{ t: number; start: number; clapAt: number; scene?: string }> = ({ t, start, clapAt, scene = '07' }) => {
  const p = easeOutCubic(clamp((t - start) / 0.35));
  const close = t < clapAt ? -28 * clamp((clapAt - t) / 0.3 + 0.3) : -28 * Math.max(0, 1 - easeOutBack(clamp((t - clapAt) / 0.12), 3));
  const stripes = (
    <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(-55deg, ${C.cream} 0 46px, #111 46px 92px)` }} />
  );
  return (
    <div style={{ position: 'relative', width: 620, height: 470, transform: `translateY(${(1 - p) * 300}px) rotate(-4deg)`, opacity: p }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 620, height: 70, transformOrigin: '0 70px', transform: `rotate(${close}deg)`, overflow: 'hidden', borderRadius: 6 }}>{stripes}</div>
      <div style={{ position: 'absolute', left: 0, top: 74, width: 620, height: 60, overflow: 'hidden' }}>{stripes}</div>
      <div style={{ position: 'absolute', left: 0, top: 134, width: 620, height: 336, background: '#141214', border: `3px solid ${C.cream}`, fontFamily: F.mono, color: C.cream, padding: 26, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, letterSpacing: '0.15em', opacity: 0.7 }}><span>PROD.</span><span>TOO HOT TO HANDLE</span></div>
        <div style={{ display: 'flex', marginTop: 20, borderTop: `2px solid ${C.cream}`, borderBottom: `2px solid ${C.cream}` }}>
          {[['SCENE', scene], ['TAKE', '1'], ['ROLL', 'A']].map(([k, v], i) => (
            <div key={k} style={{ flex: 1, padding: '8px 14px', borderLeft: i ? `2px solid ${C.cream}` : undefined }}>
              <div style={{ fontSize: 16, opacity: 0.6 }}>{k}</div>
              <div style={{ fontFamily: F.display, fontSize: 92, lineHeight: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Timecode: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const f = Math.floor(t * 30);
  const tc = [Math.floor(t / 3600), Math.floor(t / 60) % 60, Math.floor(t) % 60, f % 30].map((v) => String(v).padStart(2, '0')).join(':');
  const p = easeOutCubic(clamp((t - start) / 0.3));
  return (
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 96, color: C.cream, letterSpacing: '0.04em', opacity: p, display: 'flex', gap: 24, alignItems: 'center' }}>
      <div style={{ width: 26, height: 26, borderRadius: 13, background: C.red, opacity: Math.floor(t * 2.53) % 2 ? 1 : 0.25 }} />
      {tc}
    </div>
  );
};

export const Viewfinder: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const p = clamp((t - start) / 0.15);
  const c = 'rgba(255,255,255,0.9)';
  const L = 90, m = 90;
  const cr = (s: React.CSSProperties) => <div style={{ position: 'absolute', width: L, height: L, ...s }} />;
  const fs = 160 + Math.max(0, 1 - (t - start) / 0.4) * 80;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: p, fontFamily: F.mono, color: c, fontSize: 22, letterSpacing: '0.12em' }}>
      {cr({ left: m, top: m, borderLeft: `3px solid ${c}`, borderTop: `3px solid ${c}` })}
      {cr({ right: m, top: m, borderRight: `3px solid ${c}`, borderTop: `3px solid ${c}` })}
      {cr({ left: m, bottom: m, borderLeft: `3px solid ${c}`, borderBottom: `3px solid ${c}` })}
      {cr({ right: m, bottom: m, borderRight: `3px solid ${c}`, borderBottom: `3px solid ${c}` })}
      <div style={{ position: 'absolute', left: m + 30, top: m + 26, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: C.red, opacity: Math.floor(t * 2) % 2 ? 1 : 0.2 }} /> REC
      </div>
      <div style={{ position: 'absolute', right: m + 30, top: m + 26 }}>4K · 30P · ISO 800</div>
      <div style={{ position: 'absolute', left: m + 30, bottom: m + 26 }}>F1.4 · 1/60 · ND OFF</div>
      <div style={{ position: 'absolute', right: m + 30, bottom: m + 26 }}>▮▮▮▯ 87%</div>
      <div style={{ position: 'absolute', left: 960 - fs / 2, top: 540 - fs / 2 - 160, width: fs, height: fs * 0.7, border: `2px solid ${C.gold}` }} />
    </div>
  );
};

export const SeasonCard: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const p = easeOutExpo(clamp((t - start) / 0.5));
  return (
    <div style={{ fontFamily: F.mono, color: C.cream, textAlign: 'center', opacity: p }}>
      <div style={{ display: 'inline-flex', gap: 18, alignItems: 'center', fontSize: 24, letterSpacing: '0.3em' }}>
        <span style={{ background: C.red, padding: '4px 14px', fontWeight: 700 }}>S1</span> A FULL SEASON <span style={{ opacity: 0.5 }}>· 10 EPISODES</span>
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 34 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ width: 120, height: 68, borderRadius: 6, background: `linear-gradient(135deg, ${i % 2 ? C.fire : C.pink}, #1a0a0a)`, opacity: clamp((t - start - i * 0.05) / 0.2), position: 'relative' }}>
            <div style={{ position: 'absolute', left: 6, bottom: 4, fontSize: 13 }}>E{i + 1}</div>
            {i === 0 && <div style={{ position: 'absolute', left: 0, bottom: 0, height: 4, width: `${clamp((t - start) / 1.6) * 100}%`, background: C.red }} />}
          </div>
        ))}
      </div>
    </div>
  );
};

const CLIPS: { h: string; kicker: string; red?: boolean; photo?: boolean }[] = [
  { h: 'SCANDAL!', kicker: 'EXCLUSIVE', red: true },
  { h: 'TOO HOT TO HANDLE?', kicker: 'CITY DESK', photo: true },
  { h: 'HEART WENT POP', kicker: 'LATE EDITION' },
  { h: 'OOPS!', kicker: 'GOSSIP', red: true, photo: true },
  { h: 'WHO IS HE?', kicker: 'NIGHTLIFE', photo: true },
  { h: 'MIRROR "JEALOUS"', kicker: 'STYLE' },
  { h: 'CAUGHT ON CAMERA', kicker: 'PAGE SIX', photo: true },
  { h: 'SCANDAL!', kicker: 'BREAKING', red: true },
  { h: 'CITY MELTDOWN', kicker: 'WEATHER', photo: true },
  { h: 'FIRE ALARM AT THE CLUB', kicker: 'METRO' },
  { h: 'SCANDAL!', kicker: 'EXCLUSIVE', red: true, photo: true },
  { h: 'ALL EYES ON HIM', kicker: 'CULTURE' },
];

const torn = (seed: number) => {
  const pts: string[] = [];
  const j = (k: number) => (rand(seed * 13.7 + k) * 1.6).toFixed(2);
  for (let i = 0; i <= 20; i++) pts.push(`${i * 5}% ${j(i)}%`);
  for (let i = 0; i <= 14; i++) pts.push(`${100 - +j(i + 40)}% ${i * (100 / 14)}%`);
  for (let i = 20; i >= 0; i--) pts.push(`${i * 5}% ${100 - +j(i + 80)}%`);
  for (let i = 14; i >= 0; i--) pts.push(`${j(i + 120)}% ${i * (100 / 14)}%`);
  return `polygon(${pts.join(',')})`;
};

/** A newsprint clipping: torn edges, masthead, halftone photo, columns, tape. */
const Clipping: React.FC<{ c: (typeof CLIPS)[number]; i: number }> = ({ c, i }) => {
  const ink = '#1a1614';
  const paper = c.red ? '#c8102e' : '#ece4d3';
  const fg = c.red ? '#fff' : ink;
  return (
    <div style={{ position: 'relative', filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.55))' }}>
      <div style={{ clipPath: torn(i + 1), background: c.red ? paper : `radial-gradient(ellipse at 50% 40%, #f3ecdc, ${paper} 70%, #d9cdb3)`, color: fg, padding: '22px 22px 26px', fontFamily: F.serif, position: 'relative' }}>
        {!c.red && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(93deg, rgba(0,0,0,0.025) 0 1px, transparent 1px 4px)', pointerEvents: 'none' }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `2px solid ${fg}`, paddingBottom: 4 }}>
          <span style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 20 }}>The Daily Heat</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.12em', opacity: 0.8 }}>{c.kicker} · 11 OCT</span>
        </div>
        <div style={{ height: 2, background: fg, marginTop: 2, opacity: 0.8 }} />
        <div style={{ fontFamily: F.display, fontSize: c.h.length > 12 ? 50 : 70, lineHeight: 0.95, marginTop: 10, letterSpacing: '0.005em' }}>{c.h}</div>
        {c.photo && (
          <div style={{ marginTop: 12, height: 92, background: c.red ? '#7a0a1c' : '#3b3532', backgroundImage: `radial-gradient(circle, ${c.red ? 'rgba(255,255,255,0.35)' : 'rgba(236,228,211,0.55)'} 1.1px, transparent 1.6px), radial-gradient(ellipse at ${30 + rand(i) * 40}% 60%, rgba(255,255,255,0.35), transparent 55%)`, backgroundSize: '5px 5px, 100% 100%', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '38%', bottom: 0, width: 46, height: 70, borderRadius: '23px 23px 4px 4px', background: 'rgba(10,8,8,0.75)' }} />
          </div>
        )}
        {c.photo && <div style={{ fontStyle: 'italic', fontSize: 12, marginTop: 4, opacity: 0.75 }}>Witnesses say the room got warmer.</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {[0, 1].map((col) => (
            <div key={col} style={{ flex: 1 }}>
              {Array.from({ length: c.photo ? 3 : 5 }).map((_, k) => <div key={k} style={{ height: 4, background: fg, opacity: 0.28, marginBottom: 5, width: `${78 + rand(i * 9 + col * 5 + k) * 22}%` }} />)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', top: -10, left: `${30 + rand(i * 3) * 30}%`, width: 90, height: 24, background: 'rgba(240,232,210,0.55)', transform: `rotate(${(rand(i * 7) - 0.5) * 16}deg)`, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </div>
  );
};

export const TabloidWall: React.FC<{ t: number; start: number; cols?: number; every?: number }> = ({ t, start, cols = 4, every = 0.13 }) => (
  <div style={{ position: 'absolute', inset: -30, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 26, padding: 50, alignItems: 'start' }}>
    {CLIPS.map((c, i) => {
      const at = start + i * every;
      if (t < at) return <div key={i} />;
      const p = easeOutBack(clamp((t - at) / 0.28), 1.6);
      const drop = (1 - easeOutCubic(clamp((t - at) / 0.28))) * -60;
      return (
        <div key={i} style={{ transform: `translateY(${drop + (rand(i * 5) - 0.5) * 30}px) scale(${0.6 + 0.4 * p}) rotate(${(rand(i) - 0.5) * 9}deg)`, opacity: clamp((t - at) / 0.08) }}>
          <Clipping c={c} i={i} />
        </div>
      );
    })}
  </div>
);

export const Marquee: React.FC<{ t: number; text: string; rows?: number; size?: number; speed?: number; outlineEvery?: number }> = ({ t, text, rows = 6, size = 190, speed = 260, outlineEvery = 2 }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: 'rotate(-8deg) scale(1.25)' }}>
    {Array.from({ length: rows }).map((_, r) => {
      const dir = r % 2 ? 1 : -1;
      const off = ((t * speed * dir) % 2000) - 1000;
      const outline = r % outlineEvery === 1;
      return (
        <div key={r} style={{ whiteSpace: 'nowrap', fontFamily: F.display, fontSize: size, lineHeight: 0.98, transform: `translateX(${off - 400}px)`, color: outline ? 'transparent' : r % 3 === 0 ? C.fire : C.cream, WebkitTextStroke: outline ? `3px ${C.gold}` : undefined }}>
          {Array.from({ length: 8 }).map(() => text).join('  ')}
        </div>
      );
    })}
  </div>
);
