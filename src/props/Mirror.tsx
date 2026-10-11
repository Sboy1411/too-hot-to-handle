import React from 'react';
import { C } from '../theme';
import { clamp, easeInOutCubic, easeOutCubic } from '../lib/time';

/** Ornate chrome mirror that draws itself on, with a glass sheen; optional crack and lipstick kiss. */
export const Mirror: React.FC<{ t: number; start: number; w?: number; h?: number; crack?: number; sheenAt?: number; children?: React.ReactNode; draw?: number }> = ({
  t, start, w = 760, h = 900, crack = 0, sheenAt, children, draw = 1.4,
}) => {
  const p = easeInOutCubic(clamp((t - start) / draw));
  const glass = clamp((t - start - draw * 0.5) / 0.6);
  const rx = w / 2, ry = h / 2;
  const sheen = sheenAt !== undefined ? clamp((t - sheenAt) / 0.9) : -1;
  const orn = Array.from({ length: 24 }).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return { x: rx + Math.cos(a) * (rx + 26), y: ry + Math.sin(a) * (ry + 26), a };
  });
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <svg width={w + 120} height={h + 120} viewBox={`-60 -60 ${w + 120} ${h + 120}`} style={{ position: 'absolute', left: -60, top: -60, overflow: 'visible' }}>
        <defs>
          <linearGradient id="chromeStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#8d96a8" />
            <stop offset="0.5" stopColor="#f4f7ff" />
            <stop offset="0.7" stopColor="#5b6272" />
            <stop offset="1" stopColor="#dfe5f2" />
          </linearGradient>
          <radialGradient id="glass" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor="rgba(160,180,255,0.16)" />
            <stop offset="1" stopColor="rgba(10,12,20,0.55)" />
          </radialGradient>
          <clipPath id="mirrorClip">
            <ellipse cx={rx} cy={ry} rx={rx - 6} ry={ry - 6} />
          </clipPath>
        </defs>
        <ellipse cx={rx} cy={ry} rx={rx - 4} ry={ry - 4} fill="url(#glass)" opacity={glass} />
        <ellipse cx={rx} cy={ry} rx={rx} ry={ry} fill="none" stroke="url(#chromeStroke)" strokeWidth={10} pathLength={1} strokeDasharray={`${p} 1`} />
        <ellipse cx={rx} cy={ry} rx={rx + 18} ry={ry + 18} fill="none" stroke="url(#chromeStroke)" strokeWidth={2} pathLength={1} strokeDasharray={`${p} 1`} opacity={0.8} strokeDashoffset={-0.5} />
        <ellipse cx={rx} cy={ry} rx={rx - 16} ry={ry - 16} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1} opacity={glass} />
        {orn.map((o, i) => {
          const op = clamp((p - i / 24) * 6);
          return <circle key={i} cx={o.x} cy={o.y} r={i % 2 ? 3 : 6} fill={i % 2 ? '#cfd6e4' : C.gold} opacity={op} />;
        })}
        {/* crown ornament */}
        <path d={`M ${rx - 70} -24 Q ${rx} -95 ${rx + 70} -24 Q ${rx} -50 ${rx - 70} -24 Z`} fill="url(#chromeStroke)" opacity={clamp((p - 0.8) * 5)} />
        <circle cx={rx} cy={-62} r={9} fill={C.gold} opacity={clamp((p - 0.85) * 6)} />
        {sheen >= 0 && sheen < 1 && (
          <g clipPath="url(#mirrorClip)">
            <rect x={-w + sheen * w * 2.6} y={-100} width={120} height={h + 200} fill="rgba(255,255,255,0.18)" transform={`rotate(20 ${rx} ${ry})`} />
            <rect x={-w + sheen * w * 2.6 + 150} y={-100} width={30} height={h + 200} fill="rgba(255,255,255,0.12)" transform={`rotate(20 ${rx} ${ry})`} />
          </g>
        )}
        {crack > 0 && (
          <g clipPath="url(#mirrorClip)" stroke="rgba(235,240,255,0.85)" strokeWidth={2} fill="none" strokeLinecap="round">
            {CRACKS.map((d, i) => (
              <path key={i} d={d} pathLength={1} strokeDasharray={`${clamp(crack * 1.4 - i * 0.08)} 1`} transform={`translate(${rx * 1.15} ${ry * 0.8})`} />
            ))}
          </g>
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: `ellipse(${rx - 8}px ${ry - 8}px at 50% 50%)` }}>
        {children}
      </div>
    </div>
  );
};

const CRACKS = [
  'M0 0 L60 -40 L110 -60 L180 -140',
  'M0 0 L-40 -70 L-60 -150 L-120 -260',
  'M0 0 L-90 20 L-170 10 L-300 60',
  'M0 0 L20 80 L70 150 L60 280',
  'M0 0 L90 40 L160 120 L260 150',
  'M-40 -70 L-110 -60',
  'M20 80 L-40 140',
  'M60 -40 L80 10',
];

export const Lips: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({ size = 260, color = C.pink, style }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 200 120" style={style}>
    <defs>
      <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} />
        <stop offset="1" stopColor="#b3003b" />
      </linearGradient>
    </defs>
    <path d="M10 60 C 40 20, 70 18, 100 38 C 130 18, 160 20, 190 60 C 150 58, 120 56, 100 62 C 80 56, 50 58, 10 60 Z" fill="url(#lip)" opacity={0.92} />
    <path d="M10 62 C 50 64, 80 62, 100 66 C 120 62, 150 64, 190 62 C 160 110, 40 110, 10 62 Z" fill="url(#lip)" opacity={0.88} />
    {Array.from({ length: 14 }).map((_, i) => (
      <path key={i} d={`M${20 + i * 12} ${i % 2 ? 72 : 46} l ${i % 3 - 1} 14`} stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} />
    ))}
  </svg>
);

/** Doorway of light that eases open, spilling a soft beam onto the floor. */
export const DoorLight: React.FC<{ t: number; start: number; dur?: number; cx?: number }> = ({ t, start, dur = 2.4, cx = 960 }) => {
  const p = easeInOutCubic(clamp((t - start) / dur));
  const on = clamp((t - start) / 0.5);
  const dw = 24 + 250 * p;
  const top = 250, h = 540;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: on }}>
      <div style={{ position: 'absolute', left: cx - 420, top: top - 140, width: 840, height: h + 280, background: 'radial-gradient(ellipse at center, rgba(255,190,120,0.28), transparent 65%)' }} />
      <div style={{ position: 'absolute', left: cx - dw / 2 - 14, top: top - 14, width: dw + 28, height: h + 14, border: '6px solid #2a1a14', borderBottom: 'none' }} />
      <div style={{ position: 'absolute', left: cx - dw / 2, top, width: dw, height: h, background: 'linear-gradient(180deg,#ffe9cc,#ffc58a)' }} />
      <div
        style={{
          position: 'absolute', left: 0, top: top + h, width: 1920, height: 1080 - top - h,
          clipPath: `polygon(${cx - dw / 2}px 0, ${cx + dw / 2}px 0, ${cx + dw * 1.6}px 100%, ${cx - dw * 1.6}px 100%)`,
          background: 'linear-gradient(180deg, rgba(255,200,150,0.42), rgba(255,140,60,0))',
        }}
      />
    </div>
  );
};
