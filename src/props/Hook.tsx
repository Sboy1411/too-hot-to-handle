import React from 'react';
import { C, F } from '../theme';
import { clamp, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';

export const Flame: React.FC<{ t: number; size?: number; seed?: number }> = ({ t, size = 200, seed = 0 }) => {
  const j = (k: number) => Math.sin(t * (9 + k) + seed + k * 2) * 6 + Math.sin(t * (17 + k) + k) * 3;
  const outer = `M50 ${2 + j(1) * 0.5} C ${62 + j(2)} 30, ${88 + j(3)} 55, 80 85 C 74 110, 26 110, 20 85 C ${12 + j(4)} 55, ${38 + j(5)} 30, 50 ${2 + j(1) * 0.5} Z`;
  const inner = `M50 ${40 + j(6) * 0.4} C ${58 + j(7) * 0.5} 58, ${68} 70, 64 88 C 60 102, 40 102, 36 88 C 32 70, ${42 + j(8) * 0.5} 58, 50 ${40 + j(6) * 0.4} Z`;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 -5 100 115" style={{ overflow: 'visible', filter: `drop-shadow(0 0 ${size * 0.15}px rgba(255,120,30,0.9))` }}>
      <defs>
        <linearGradient id="flameOuter" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={C.red} /><stop offset="0.5" stopColor={C.fire} /><stop offset="1" stopColor={C.gold} /></linearGradient>
        <linearGradient id="flameInner" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#fff7d6" /><stop offset="1" stopColor={C.gold} /></linearGradient>
      </defs>
      <path d={outer} fill="url(#flameOuter)" />
      <path d={inner} fill="url(#flameInner)" />
    </svg>
  );
};

export const Candle: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const p = easeOutCubic(clamp((t - start) / 0.5));
  const lit = clamp((t - start - 0.35) / 0.25);
  return (
    <div style={{ position: 'relative', width: 200, height: 640, transform: `translateY(${(1 - p) * 500}px)` }}>
      <div style={{ position: 'absolute', left: 30, right: 30, top: 230, bottom: 0, borderRadius: '14px 14px 6px 6px', background: 'linear-gradient(90deg, #d9c7b0, #fff3e2 40%, #cbb79e)' }} />
      <div style={{ position: 'absolute', left: 30, right: 30, top: 230, height: 50, borderRadius: '14px 14px 30px 30px', background: '#fff8ec' }} />
      <div style={{ position: 'absolute', left: 97, top: 205, width: 6, height: 34, background: '#2a1a12', borderRadius: 3 }} />
      <div style={{ position: 'absolute', left: 30, top: 40, opacity: lit, transform: `scale(${0.5 + lit * 0.5})`, transformOrigin: '70px 190px' }}>
        <Flame t={t} size={140} />
      </div>
      <div style={{ position: 'absolute', left: -300, top: -120, width: 800, height: 600, background: 'radial-gradient(circle at 50% 50%, rgba(255,170,80,0.35), transparent 60%)', opacity: lit }} />
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

const HEADS = ['SCANDAL!', 'TOO HOT?', 'HEART WENT POP', 'OOPS!', 'WHO IS HE?', 'EXCLUSIVE', 'CAUGHT ON CAM', 'SCANDAL!', 'MELTDOWN', 'FIRE ALARM', 'SCANDAL!', 'EYES ON HIM'];
export const TabloidWall: React.FC<{ t: number; start: number; cols?: number; every?: number }> = ({ t, start, cols = 4, every = 0.13 }) => (
  <div style={{ position: 'absolute', inset: -40, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24, padding: 40 }}>
    {HEADS.map((h, i) => {
      const at = start + i * every;
      const p = easeOutBack(clamp((t - at) / 0.25), 1.8);
      if (t < at) return <div key={i} />;
      return (
        <div key={i} style={{ background: i % 3 === 0 ? C.red : '#f1e9dc', color: i % 3 === 0 ? '#fff' : '#141012', padding: '18px 22px', transform: `scale(${p}) rotate(${(rand(i) - 0.5) * 10}deg)`, boxShadow: '0 20px 50px rgba(0,0,0,0.6)', fontFamily: F.display, fontSize: 64, lineHeight: 0.95, overflow: 'hidden' }}>
          <div style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: '0.2em', opacity: 0.7, marginBottom: 8 }}>THE DAILY HEAT · NO.{100 + i}</div>
          {h}
          {Array.from({ length: 3 }).map((_, k) => <div key={k} style={{ height: 6, background: 'currentColor', opacity: 0.2, marginTop: 8, width: `${60 + rand(i * 5 + k) * 40}%` }} />)}
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
