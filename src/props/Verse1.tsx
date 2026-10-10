import React from 'react';
import { C, F } from '../theme';
import { clamp, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';

const card: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
  border: '1px solid rgba(255,255,255,0.16)', borderRadius: 28, boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
};

export const MoodDial: React.FC<{ t: number; start: number; size?: number }> = ({ t, start, size = 360 }) => {
  const p = easeInOutCubic(clamp((t - start - 0.3) / 1.8));
  const ang = lerp(-130, 130, p);
  const r = size / 2;
  const labels = ['CHILL', 'COOL', 'WARM', 'HOT', 'FIRE'];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="dialArc" x1="0" x2="1">
          <stop offset="0" stopColor={C.ice} />
          <stop offset="0.5" stopColor={C.gold} />
          <stop offset="1" stopColor={C.red} />
        </linearGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 20} fill="rgba(10,6,8,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
      {Array.from({ length: 53 }).map((_, i) => {
        const a = ((-130 + (i * 260) / 52 - 90) * Math.PI) / 180;
        const lit = (i / 52) <= p;
        const l = i % 13 === 0 ? 26 : 12;
        return <line key={i} x1={r + Math.cos(a) * (r - 34)} y1={r + Math.sin(a) * (r - 34)} x2={r + Math.cos(a) * (r - 34 - l)} y2={r + Math.sin(a) * (r - 34 - l)} stroke={lit ? (i > 36 ? C.fire : C.gold) : 'rgba(255,255,255,0.25)'} strokeWidth={i % 13 === 0 ? 4 : 2} />;
      })}
      {labels.map((l, i) => {
        const a = ((-130 + (i * 260) / 4 - 90) * Math.PI) / 180;
        return <text key={l} x={r + Math.cos(a) * (r + 18)} y={r + Math.sin(a) * (r + 18) + 6} textAnchor="middle" fontFamily="Space Mono" fontSize={15} letterSpacing={3} fill={i <= p * 4 + 0.01 ? C.cream : 'rgba(255,255,255,0.35)'}>{l}</text>;
      })}
      <g transform={`rotate(${ang} ${r} ${r})`}>
        <line x1={r} y1={r} x2={r} y2={52} stroke={C.fire} strokeWidth={6} strokeLinecap="round" />
        <circle cx={r} cy={52} r={7} fill={C.cream} />
      </g>
      <circle cx={r} cy={r} r={34} fill="#1a1012" stroke={C.gold} strokeWidth={3} />
      <text x={r} y={r + 7} textAnchor="middle" fontFamily="Space Mono" fontSize={18} fill={C.gold}>{Math.round(p * 100)}</text>
    </svg>
  );
};

export const SunIcon: React.FC<{ size?: number; spin?: number }> = ({ size = 120, spin = 0 }) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120">
    <g transform={`rotate(${spin})`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1={0} y1={-34} x2={0} y2={-50} stroke={C.gold} strokeWidth={5} strokeLinecap="round" transform={`rotate(${i * 30})`} />
      ))}
    </g>
    <circle r={26} fill={C.gold} />
    <circle r={26} fill="url(#sunGrad)" />
    <defs>
      <radialGradient id="sunGrad"><stop offset="0" stopColor="#fff3c4" /><stop offset="1" stopColor={C.fire} /></radialGradient>
    </defs>
  </svg>
);

export const WeatherWidget: React.FC<{ t: number; start: number; from?: number; to?: number }> = ({ t, start, from = 24, to = 41 }) => {
  const enter = easeOutBack(clamp((t - start) / 0.5), 1.4);
  const p = easeInOutCubic(clamp((t - start - 0.4) / 2.0));
  const v = Math.round(lerp(from, to, p));
  return (
    <div style={{ ...card, width: 520, padding: '34px 40px', transform: `translateY(${(1 - enter) * 80}px) scale(${0.9 + enter * 0.1})`, opacity: clamp(enter * 2), fontFamily: F.sans, color: C.cream }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, opacity: 0.7, letterSpacing: '0.12em', fontFamily: F.mono }}>THE ROOM · NOW</div>
          <div style={{ fontFamily: F.display, fontSize: 150, lineHeight: 1, marginTop: 6 }}>{v}°</div>
        </div>
        <SunIcon size={150} spin={t * 40} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, marginTop: 10, fontWeight: 600 }}>
        <span>{p > 0.6 ? 'Heatwave' : 'Getting warmer'}</span>
        <span style={{ color: C.gold }}>H:{to}° L:{from}°</span>
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 22, fontFamily: F.mono, fontSize: 17, opacity: 0.85 }}>
        {['NOW', '+1H', '+2H', '+3H', '+4H'].map((h, i) => (
          <div key={h} style={{ flex: 1, textAlign: 'center', opacity: clamp((p - i * 0.15) * 4) }}>
            <div style={{ opacity: 0.6 }}>{h}</div>
            <div style={{ fontSize: 24, color: i > 2 ? C.fire : C.cream }}>{Math.round(lerp(from, to + 8, i / 4 * p))}°</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Scattered whispers, each fading in at its own time. */
export const Whispers: React.FC<{ t: number; start: number; items: string[]; seed?: number }> = ({ t, start, items, seed = 1 }) => (
  <>
    {items.map((s, i) => {
      const at = start + i * 0.22;
      const p = clamp((t - at) / 0.5);
      const x = 120 + rand(i * 3.3 + seed) * 1500;
      const y = 140 + rand(i * 7.9 + seed) * 760;
      const drift = (t - at) * 14;
      return (
        <div key={i} style={{ position: 'absolute', left: x, top: y - drift, fontFamily: F.mono, fontSize: 20 + rand(i + seed) * 16, color: 'rgba(255,243,226,0.55)', opacity: p * (0.35 + rand(i * 11) * 0.5), filter: `blur(${(1 - p) * 6 + (rand(i * 5) > 0.6 ? 1.5 : 0)}px)`, whiteSpace: 'nowrap' }}>
          {s}
        </div>
      );
    })}
  </>
);

export const BigGlyph: React.FC<{ t: number; start: number; glyph: string; size?: number; color?: string }> = ({ t, start, glyph, size = 900, color = C.fire }) => {
  const p = easeOutExpo(clamp((t - start) / 0.7));
  return (
    <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: size, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${color}`, opacity: 0.5 * p, transform: `scale(${1.4 - 0.4 * p}) rotate(${(1 - p) * -25 + (t - start) * 4}deg)` }}>
      {glyph}
    </div>
  );
};

const COMMENTS = [
  ['@heatseeker', 'who IS this 😳🔥'],
  ['@desi.vibes', 'the vibe is unmatched'],
  ['@nightowl', 'ok but why is my screen warm'],
  ['@reels.daily', 'too hot fr fr'],
  ['@punjabi_beats', 'brand. that is all.'],
  ['@hater_420', 'mid… *replays 40 times*'],
  ['@musicmood', 'mirror is jealous lmaoo'],
];
export const Feed: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const local = t - start;
  const scroll = local * 260 + easeOutCubic(clamp(local / 0.6)) * 80;
  const enter = easeOutCubic(clamp(local / 0.5));
  return (
    <div style={{ width: 520, height: 900, borderRadius: 54, border: '10px solid #1b1b1f', background: '#0b0b0d', overflow: 'hidden', position: 'relative', boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 2px #333', transform: `translateX(${(1 - enter) * 300}px) rotate(${4 - enter * 4}deg)`, opacity: enter }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: '#0b0b0d', zIndex: 2, fontFamily: F.sans, fontWeight: 600, color: C.cream, fontSize: 24, display: 'flex', alignItems: 'flex-end', padding: '0 28px 14px', borderBottom: '1px solid #222' }}>
        Comments
      </div>
      <div style={{ position: 'absolute', top: 90, left: 0, right: 0, transform: `translateY(${-scroll + 200}px)` }}>
        {[...COMMENTS, ...COMMENTS].map(([u, c], i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '22px 28px', fontFamily: F.sans, color: C.cream }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: `linear-gradient(135deg, ${[C.fire, C.pink, C.gold, C.ice][i % 4]}, #222)`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 17, opacity: 0.55, fontWeight: 600 }}>{u} · {i + 1}m</div>
              <div style={{ fontSize: 24, marginTop: 4 }}>{c}</div>
              <div style={{ fontSize: 15, opacity: 0.45, marginTop: 6 }}>♥ {(rand(i) * 900 + 100).toFixed(0)}   Reply</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Newspaper: React.FC<{ t: number; start: number; children: React.ReactNode }> = ({ t, start, children }) => {
  const p = easeOutExpo(clamp((t - start) / 0.6));
  return (
    <div style={{ width: 1500, padding: '40px 70px 60px', background: '#f1e9dc', color: '#141012', transform: `rotate(${-2 + (1 - p) * -10}deg) scale(${0.85 + p * 0.15})`, opacity: clamp(p * 2), boxShadow: '0 50px 140px rgba(0,0,0,0.8)', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 18, borderBottom: '2px solid #141012', paddingBottom: 10 }}>
        <span>VOL. 01 · NO. 152</span>
        <span>LATE EDITION</span>
        <span>PRICE: YOUR ATTENTION</span>
      </div>
      <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontWeight: 900, fontSize: 92, textAlign: 'center', lineHeight: 1.1, margin: '10px 0', borderBottom: '6px double #141012' }}>The Daily Heat</div>
      <div style={{ padding: '18px 0 0' }}>{children}</div>
      <div style={{ display: 'flex', gap: 30, marginTop: 24 }}>
        {[0, 1, 2].map((c) => (
          <div key={c} style={{ flex: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 8, background: '#141012', opacity: 0.18, marginBottom: 10, width: `${70 + rand(c * 9 + i) * 30}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Highlight: React.FC<{ t: number; start: number; color?: string; children: React.ReactNode; dur?: number }> = ({ t, start, color = 'rgba(255,214,0,0.85)', children, dur = 0.35 }) => {
  const p = easeOutCubic(clamp((t - start) / dur));
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ position: 'absolute', left: '-0.1em', right: '-0.1em', top: '30%', bottom: '5%', background: color, transformOrigin: 'left center', transform: `scaleX(${p}) skewX(-8deg)`, borderRadius: 4 }} />
      <span style={{ position: 'relative' }}>{children}</span>
    </span>
  );
};

/** Theatre spotlight sweeping in from the side and settling centre. */
export const Spotlight: React.FC<{ t: number; start: number; settle?: number }> = ({ t, start, settle = 1.6 }) => {
  const p = easeInOutCubic(clamp((t - start) / settle));
  const x = lerp(260, 960, p) + Math.sin((t - start) * 1.3) * 18 * p;
  const on = clamp((t - start) / 0.12);
  const flick = t - start < 0.3 ? (rand(Math.floor(t * 30)) > 0.4 ? 1 : 0.4) : 1;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: on * flick }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `polygon(${960 - 40}px -20px, ${960 + 40}px -20px, ${x + 420}px 1080px, ${x - 420}px 1080px)`, background: 'linear-gradient(180deg, rgba(255,250,235,0.65), rgba(255,220,170,0.12))', mixBlendMode: 'screen' }} />
      <div style={{ position: 'absolute', left: x - 460, top: 900, width: 920, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(255,240,215,0.6), transparent 70%)' }} />
      <div style={{ position: 'absolute', left: 900, top: -60, width: 120, height: 90, borderRadius: 20, background: 'radial-gradient(circle, #fff, rgba(255,230,190,0))' }} />
    </div>
  );
};
