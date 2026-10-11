import React from 'react';
import { C, F } from '../theme';
import { clamp, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, rand } from '../lib/time';

/** RGB-split glitch wrapper: renders children three times with channel offsets + slice jitter. */
export const Glitch: React.FC<{ t: number; amt: number; children: React.ReactNode }> = ({ t, amt, children }) => {
  const f = Math.floor(t * 30);
  const on = rand(f * 1.9) < 0.75 ? amt : amt * 0.2;
  const dx = (rand(f * 3.7) - 0.5) * 40 * on;
  const dy = (rand(f * 5.1) - 0.5) * 10 * on;
  const slices = Array.from({ length: 4 }).map((_, i) => ({ y: rand(f * 7 + i) * 100, h: 2 + rand(f * 11 + i) * 9, x: (rand(f * 13 + i) - 0.5) * 120 * on }));
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${dx}px, ${dy}px)`, mixBlendMode: 'screen', filter: 'url(#onlyRed)', opacity: 0.9 }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${-dx}px, ${-dy}px)`, mixBlendMode: 'screen', filter: 'url(#onlyCyan)', opacity: 0.9 }}>{children}</div>
      <div style={{ position: 'relative' }}>{children}</div>
      {on > 0.3 && slices.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${s.y}%`, height: `${s.h}%`, overflow: 'hidden', transform: `translateX(${s.x}px)`, background: 'rgba(7,6,10,0.4)' }} />
      ))}
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id="onlyRed"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id="onlyCyan"><feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" /></filter>
      </svg>
    </div>
  );
};

export const Scanlines: React.FC<{ opacity?: number }> = ({ opacity = 0.25 }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 2px, transparent 2px, transparent 5px)', opacity, pointerEvents: 'none' }} />
);

export const TrendChart: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const p = easeInOutCubic(clamp((t - start) / 2.2));
  const W = 1300, H = 520;
  const pts = Array.from({ length: 41 }).map((_, i) => {
    const x = (i / 40) * W;
    const g = Math.pow(i / 40, 2.6);
    const y = H - 30 - g * (H - 80) - Math.sin(i * 1.7) * 18 * (1 - g) - rand(i) * 20;
    return [x, y];
  });
  const n = Math.max(2, Math.floor(p * 40) + 1);
  const vis = pts.slice(0, n);
  const line = vis.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' ');
  const area = `${line} L${vis[vis.length - 1][0]},${H} L0,${H} Z`;
  const tip = vis[vis.length - 1];
  const fans = Math.floor(lerp(0, 1_240_000, Math.pow(p, 2)));
  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.fire} stopOpacity={0.55} />
            <stop offset="1" stopColor={C.fire} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={0} x2={W} y1={(i * H) / 4} y2={(i * H) / 4} stroke="rgba(255,255,255,0.08)" />)}
        <path d={area} fill="url(#trendArea)" />
        <path d={line} fill="none" stroke={C.gold} strokeWidth={6} strokeLinejoin="round" />
        <circle cx={tip[0]} cy={tip[1]} r={12} fill={C.cream} />
        <circle cx={tip[0]} cy={tip[1]} r={26 + Math.sin(t * 12) * 6} fill="none" stroke={C.gold} strokeWidth={2} opacity={0.6} />
      </svg>
      <div style={{ position: 'absolute', left: tip[0] - 160, top: tip[1] - 120, fontFamily: F.mono, color: C.cream, textAlign: 'right', width: 300 }}>
        <div style={{ fontSize: 18, opacity: 0.6, letterSpacing: '0.2em' }}>FANS</div>
        <div style={{ fontFamily: F.display, fontSize: 56, color: C.gold }}>{fans.toLocaleString('en-US')}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: -70, fontFamily: F.mono, fontSize: 22, letterSpacing: '0.25em', color: C.cream, display: 'flex', gap: 16, alignItems: 'center', opacity: clamp(p * 4) }}>
        <span style={{ background: C.red, padding: '4px 12px', color: '#fff' }}>#1</span> TRENDING NOW
      </div>
    </div>
  );
};

const CROWD = ['AYY!', 'WHO?', 'OMG', 'SHOR', 'OYE!', 'BALLE', 'WOW', 'LOOK!', 'HAAYE', 'SHOR', 'OH NO', 'WAIT', 'HIM??', 'SHOR', 'AAAH', 'YO!'];
export const CrowdNoise: React.FC<{ t: number; start: number; focus: number }> = ({ t, start, focus }) => {
  const fp = easeInOutCubic(clamp((t - focus) / 0.5));
  return (
    <>
      {Array.from({ length: 34 }).map((_, i) => {
        const at = start + rand(i * 2.7) * 0.9;
        const p = clamp((t - at) / 0.2);
        const f = Math.floor(t * 15);
        const x = 80 + rand(i * 4.1) * 1700 + (rand(f + i) - 0.5) * 8;
        const y = 120 + rand(i * 6.3) * 820 + (rand(f * 3 + i) - 0.5) * 8;
        const s = 26 + rand(i * 9.2) * 54;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, fontFamily: i % 3 ? F.display : F.mono, fontSize: s, color: i % 5 === 0 ? C.fire : C.cream, opacity: p * (0.25 + rand(i) * 0.5) * (1 - fp * 0.85), transform: `rotate(${(rand(i * 8) - 0.5) * 24}deg) scale(${1 - fp * 0.3})`, filter: fp > 0 ? `blur(${fp * 8}px)` : undefined }}>
            {CROWD[i % CROWD.length]}
          </div>
        );
      })}
    </>
  );
};

export const AlertDialog: React.FC<{ t: number; start: number; title: string; body: string }> = ({ t, start, title, body }) => {
  const p = easeOutBack(clamp((t - start) / 0.35), 2);
  const f = Math.floor(t * 30);
  const jitter = t - start < 0.5 ? (rand(f) - 0.5) * 16 : 0;
  return (
    <div style={{ width: 760, background: '#16161b', border: '1px solid #3a3a44', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.7)', transform: `scale(${p}) translateX(${jitter}px)`, fontFamily: F.sans, color: C.cream }}>
      <div style={{ height: 44, background: '#202028', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, opacity: 0.6, fontFamily: F.mono }}>system.alert</div>
      </div>
      <div style={{ padding: '34px 44px', display: 'flex', gap: 30, alignItems: 'center' }}>
        <svg width={90} height={80} viewBox="0 0 90 80"><path d="M45 4 L86 76 L4 76 Z" fill={C.gold} /><rect x={41} y={26} width={8} height={28} fill="#16161b" /><rect x={41} y={60} width={8} height={8} fill="#16161b" /></svg>
        <div>
          <div style={{ fontSize: 34, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 21, opacity: 0.65, marginTop: 6, fontFamily: F.mono }}>{body}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, padding: '0 44px 30px' }}>
        <div style={{ padding: '12px 26px', borderRadius: 10, background: '#2a2a33', fontSize: 19 }}>Ignore</div>
        <div style={{ padding: '12px 26px', borderRadius: 10, background: C.fire, fontSize: 19, fontWeight: 600 }}>Look again</div>
      </div>
    </div>
  );
};

export const HazardBand: React.FC<{ t: number; start: number; y: number; angle?: number; text: string; dir?: number }> = ({ t, start, y, angle = -6, text, dir = 1 }) => {
  const p = easeOutExpo(clamp((t - start) / 0.4));
  const off = (t * 220 * dir) % 2400;
  return (
    <div style={{ position: 'absolute', left: -200, width: 2320, top: y, height: 110, transform: `rotate(${angle}deg) scaleX(${p})`, overflow: 'hidden', background: `repeating-linear-gradient(45deg, ${C.gold} 0 40px, #111 40px 80px)`, backgroundPosition: `${off}px 0`, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
      <div style={{ position: 'absolute', inset: '18px 0', background: '#111', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontFamily: F.display, fontSize: 56, color: C.gold, letterSpacing: '0.08em', transform: `translateX(${-off * 0.6}px)` }}>
        {Array.from({ length: 12 }).map(() => `${text}  ✕  `).join('')}
      </div>
    </div>
  );
};

export const Phone: React.FC<{ t: number; start: number; name: string; msg: string }> = ({ t, start, name, msg }) => {
  const enter = easeOutCubic(clamp((t - start) / 0.45));
  const notif = easeOutBack(clamp((t - start - 0.25) / 0.4), 1.6);
  const buzz = t - start > 0.25 && t - start < 0.9 ? Math.sin(t * 120) * 4 : 0;
  return (
    <div style={{ width: 470, height: 940, borderRadius: 62, background: 'linear-gradient(160deg, #2a1410, #0b0708 60%)', border: '10px solid #1b1b1f', position: 'relative', overflow: 'hidden', boxShadow: '0 50px 140px rgba(0,0,0,0.8), 0 0 0 2px #333', transform: `translateY(${(1 - enter) * 700}px) rotate(${-6 + enter * 6 + buzz * 0.3}deg) translateX(${buzz}px)` }}>
      <div style={{ position: 'absolute', top: 14, left: '50%', width: 130, height: 36, marginLeft: -65, borderRadius: 20, background: '#000' }} />
      <div style={{ position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: F.sans, color: C.cream }}>
        <div style={{ fontSize: 24, opacity: 0.7 }}>Saturday, 11 October</div>
        <div style={{ fontSize: 130, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.03em' }}>11:11</div>
      </div>
      <div style={{ position: 'absolute', top: 360, left: 20, right: 20, borderRadius: 26, background: 'rgba(60,40,40,0.75)', padding: '20px 22px', fontFamily: F.sans, color: C.cream, transform: `translateY(${(1 - notif) * -80}px) scale(${0.9 + 0.1 * notif})`, opacity: clamp(notif * 2) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}, ${C.fire})` }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, opacity: 0.6 }}><span>MESSAGES</span><span>now</span></div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em' }}>{name}</div>
          </div>
        </div>
        <div style={{ fontSize: 21, marginTop: 8, opacity: 0.85 }}>{msg}</div>
      </div>
      {[0, 1].map((i) => (
        <div key={i} style={{ position: 'absolute', top: 540 + i * 110, left: 20, right: 20, height: 92, borderRadius: 26, background: 'rgba(60,40,40,0.4)', opacity: clamp(notif * 2 - 0.5 - i * 0.3) * 0.7 }} />
      ))}
    </div>
  );
};

export const Crosshair: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const p = easeInOutCubic(clamp((t - start) / 0.6));
  const ring = 380 - 160 * p;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {[1, 2].map((i) => (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: (1920 * i) / 3, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.12)', transform: `scaleY(${p})` }} />
          <div style={{ position: 'absolute', top: (1080 * i) / 3, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.12)', transform: `scaleX(${p})` }} />
        </React.Fragment>
      ))}
      <div style={{ position: 'absolute', left: 960, top: 0, bottom: 0, width: 1, background: 'rgba(255,181,71,0.45)', transform: `scaleY(${p})` }} />
      <div style={{ position: 'absolute', top: 540, left: 0, right: 0, height: 1, background: 'rgba(255,181,71,0.45)', transform: `scaleX(${p})` }} />
      <div style={{ position: 'absolute', left: 960 - ring, top: 540 - ring, width: ring * 2, height: ring * 2, borderRadius: '50%', border: `2px solid rgba(255,181,71,${0.6 * p})` }} />
      <div style={{ position: 'absolute', left: 1000, top: 560, fontFamily: F.mono, fontSize: 18, color: C.gold, opacity: p, letterSpacing: '0.1em' }}>
        X 960.00 · Y 540.00<br />OFFSET 0.000
      </div>
    </div>
  );
};

export const Vinyl: React.FC<{ t: number; start: number; size?: number; label?: string }> = ({ t, start, size = 760, label = 'SMOOTH · LIKE · VINYL · SMOOTH · LIKE · VINYL · ' }) => {
  const enter = easeOutExpo(clamp((t - start) / 0.6));
  const rot = (t - start) * 200;
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: `translateX(${(1 - enter) * 900}px)` }}>
      <defs>
        <radialGradient id="vinylG"><stop offset="0" stopColor="#222" /><stop offset="1" stopColor="#050505" /></radialGradient>
        <linearGradient id="vinylSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0.35" stopColor="rgba(255,255,255,0)" /><stop offset="0.5" stopColor="rgba(255,255,255,0.14)" /><stop offset="0.65" stopColor="rgba(255,255,255,0)" /></linearGradient>
        <path id="labelPath" d={`M ${r} ${r} m -${r * 0.27} 0 a ${r * 0.27} ${r * 0.27} 0 1 1 ${r * 0.54} 0 a ${r * 0.27} ${r * 0.27} 0 1 1 -${r * 0.54} 0`} />
      </defs>
      <g transform={`rotate(${rot} ${r} ${r})`}>
        <circle cx={r} cy={r} r={r - 2} fill="url(#vinylG)" />
        {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={r} cy={r} r={r * 0.36 + i * (r * 0.6 / 40)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />)}
        <circle cx={r} cy={r} r={r * 0.34} fill={C.fire} />
        <circle cx={r} cy={r} r={r * 0.34} fill="none" stroke={C.gold} strokeWidth={3} />
        <text fontFamily="Space Mono" fontSize={r * 0.055} fill={C.cream} letterSpacing={4}><textPath href="#labelPath">{label}</textPath></text>
        <text x={r} y={r - r * 0.06} textAnchor="middle" fontFamily="Anton" fontSize={r * 0.1} fill={C.cream}>TOO HOT</text>
        <text x={r} y={r + r * 0.12} textAnchor="middle" fontFamily="Anton" fontSize={r * 0.07} fill={C.cream}>TO HANDLE</text>
        <circle cx={r} cy={r} r={10} fill="#050505" />
      </g>
      <circle cx={r} cy={r} r={r - 2} fill="url(#vinylSheen)" />
    </svg>
  );
};

export const Stamp: React.FC<{ t: number; start: number; text: string; color?: string; size?: number; rot?: number }> = ({ t, start, text, color = C.red, size = 150, rot = -12 }) => {
  const local = t - start;
  if (local < 0) return null;
  const p = easeOutCubic(clamp(local / 0.16));
  return (
    <div style={{ display: 'inline-block', border: `${size * 0.06}px solid ${color}`, borderRadius: size * 0.08, padding: `${size * 0.04}px ${size * 0.2}px`, fontFamily: F.display, fontSize: size, color, lineHeight: 1.05, letterSpacing: '0.04em', transform: `rotate(${rot}deg) scale(${2.4 - 1.4 * p})`, opacity: clamp(local / 0.05) * 0.95, background: 'rgba(7,6,10,0.55)', maskImage: 'radial-gradient(circle at 30% 40%, #000 60%, rgba(0,0,0,0.75) 100%)' }}>
      {text}
    </div>
  );
};

export const Struck: React.FC<{ t: number; start: number; children: React.ReactNode; color?: string }> = ({ t, start, children, color = C.red }) => {
  const p = easeOutCubic(clamp((t - start) / 0.25));
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <span style={{ position: 'absolute', left: '-6%', width: '112%', top: '50%', height: '0.09em', background: color, transform: `scaleX(${p}) rotate(-4deg)`, transformOrigin: 'left' }} />
    </span>
  );
};
