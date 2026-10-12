import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Embers } from './layers/Embers';
import { Grain, Vignette } from './layers/Finish';
import { C, F, HEAT_GRADIENT } from './theme';
import { clamp, lerp, rand, easeOutExpo, easeOutCubic, easeInOutCubic, FPS } from './lib/time';
import { PSH_FROM, PSH_HIT, PSH_TO, LOGO_FROM, LOGO_STING, LOGO_HIT1, LOGO_HIT2 } from './lib/outro';

/** Slow silk lines, the reference reveal's white waves redone as embers-on-black. */
const Silk: React.FC<{ t: number; o: number }> = ({ t, o }) => {
  const lines = [0, 1, 2, 3, 4].map((i) => {
    const ph = t * (0.25 + i * 0.04) + i * 1.7;
    const y0 = 610 + i * 46;
    const a = 120 + i * 30;
    const d = `M-100,${y0 + Math.sin(ph) * a} C500,${y0 - a + Math.sin(ph + 1) * 60} 1300,${y0 + a + Math.cos(ph) * 70} 2020,${y0 - 140 + Math.sin(ph + 2) * a}`;
    return <path key={i} d={d} stroke={i % 2 ? C.gold : C.fire} strokeWidth={i === 2 ? 2.2 : 1.2} opacity={0.18 + (i === 2 ? 0.2 : 0)} fill="none" />;
  });
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', opacity: o, filter: 'blur(0.6px)' }}>
      {lines}
    </svg>
  );
};

const Glow: React.FC<{ o: number; y?: number }> = ({ o, y = 62 }) => (
  <AbsoluteFill style={{ opacity: o, background: `radial-gradient(ellipse 60% 45% at 50% ${y}%, rgba(255,77,26,0.28), rgba(232,22,46,0.08) 55%, transparent 80%)` }} />
);

export const PSH: React.FC<{ t: number }> = ({ t }) => {
  const pre = clamp((t - PSH_FROM) / (PSH_HIT - PSH_FROM));
  const d = t - PSH_HIT;
  const hit = d >= 0 ? easeOutExpo(clamp(d / 0.55)) : 0;
  const out = clamp((t - (PSH_TO - 0.55)) / 0.55);
  const flash = d >= 0 ? Math.exp(-d * 5) : 0;
  const shake = d >= 0 ? Math.exp(-d * 7) : 0;
  const f = Math.floor(t * FPS);
  const sx = (rand(f * 1.7) - 0.5) * 30 * shake;
  const sy = (rand(f * 2.3) - 0.5) * 30 * shake;
  const scale = lerp(1.35, 1, hit) * (1 + Math.max(0, d) * 0.012);
  const sweep = clamp((d - 0.9) / 1.4);
  const text = (extra: React.CSSProperties) => (
    <div style={{ fontFamily: F.display, fontSize: 400, lineHeight: 1, letterSpacing: '0.08em', paddingLeft: '0.08em', ...extra }}>PSH</div>
  );
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <Glow o={pre * 0.6 + hit * 0.6 * (1 + 0.15 * Math.sin(t * 7))} y={58} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `translate(${sx}px, ${sy}px) scale(${scale})`, opacity: hit, filter: `blur(${(1 - hit) * 14 + out * 16}px)` }}>
        <div style={{ position: 'relative' }}>
          {text({ position: 'absolute', inset: 0, color: 'transparent', textShadow: `0 0 60px rgba(255,77,26,${0.55 + flash * 0.4}), 0 0 140px rgba(232,22,46,0.35)` })}
          {text({ position: 'relative', backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', color: 'transparent' })}
          {/* glint that passes once after the hit */}
          {text({ position: 'absolute', inset: 0, color: 'transparent', WebkitBackgroundClip: 'text', backgroundImage: `linear-gradient(105deg, transparent ${lerp(-30, 110, sweep) - 12}%, rgba(255,255,255,0.95) ${lerp(-30, 110, sweep)}%, transparent ${lerp(-30, 110, sweep) + 12}%)`, opacity: sweep > 0 && sweep < 1 ? 1 : 0 })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, rgba(255,226,180,${flash * 0.55}), rgba(255,77,26,${flash * 0.25}) 40%, transparent 75%)`, mixBlendMode: 'screen' }} />
    </AbsoluteFill>
  );
};

// BOLO BEATS letterforms, traced over Albert's logo (original artwork coords:
// letters span x 465..1214, y 396..494). Stroke 11, square geometric sans.
const LOGO_CX_BOLO = 633;
const LOGO_CX_ALL = 839.5;
const LOGO_CY = 445;
const BOLO = [
  { k: 'B1', el: <path d="M470.5,405.5 H503 A18.5,18.5 0 0 1 503,442.5 H470.5 M470.5,442.5 H507 A20,20 0 0 1 507,482.5 H470.5 M470.5,400 V488" /> },
  { k: 'O1', el: <circle cx={593.5} cy={442} r={41} /> },
  { k: 'L', el: <path d="M660.5,400 V482.5 H706" /> },
  { k: 'O2', el: <circle cx={757.5} cy={445} r={39} /> },
];
const BEATS = [
  { k: 'B2', el: <path d="M856.5,405.5 H889 A18.5,18.5 0 0 1 889,442.5 H856.5 M856.5,442.5 H893 A20,20 0 0 1 893,482.5 H856.5 M856.5,400 V488" /> },
  { k: 'E', el: <path d="M988,405.5 H940.5 V482.5 H988 M940.5,442.5 H985" /> },
  { k: 'A', el: <path d="M1003,488 L1044,410 L1085,488" /> },
  { k: 'T', el: <path d="M1087,405.5 H1136 M1111.5,405.5 V488" /> },
  { k: 'S', el: <path d="M1205,416 C1198,408 1190,405.5 1180,405.5 C1166,405.5 1155,413 1155,424 C1155,437 1168,440 1181,443 C1196,446 1208,452 1208,463 C1208,475 1196,482.5 1181,482.5 C1168,482.5 1158,478 1151,469" /> },
];
const TAIL = 'M563,468 L553,494 L582,481 Z';

export const Logo: React.FC<{ t: number }> = ({ t }) => {
  const lt = t - LOGO_FROM;
  const bg = clamp(lt / 0.3);
  const a = clamp((lt - LOGO_HIT1) / 0.55); // BOLO in
  const aE = easeOutCubic(a);
  const b = clamp((lt - LOGO_HIT2) / 0.55); // slide + BEATS in
  const bE = easeInOutCubic(b);
  const out = clamp((lt - (LOGO_STING - 0.35)) / 0.35);
  const cx = lerp(LOGO_CX_BOLO, LOGO_CX_ALL, bE);
  const scale = 1.55 * lerp(0.94, 1, aE) * (1 + lt * 0.006);
  const flash2 = lt >= LOGO_HIT2 ? Math.exp(-(lt - LOGO_HIT2) * 4) : 0;
  const sweep = clamp((lt - (LOGO_HIT2 + 0.45)) / 0.6);
  const sx = lerp(400, 1300, sweep);
  // sound waves in the speech bubble light up one after the other, then keep breathing
  const w1 = clamp((lt - LOGO_HIT1 - 0.25) / 0.25) * (0.75 + 0.25 * Math.sin(lt * 6));
  const w2 = clamp((lt - LOGO_HIT1 - 0.45) / 0.25) * (0.75 + 0.25 * Math.sin(lt * 6 - 1.2));
  const letterStyle = (i: number, p: number): React.CSSProperties => {
    const q = clamp((p - i * 0.08) / 0.6);
    return { opacity: q, transform: `translateY(${(1 - easeOutCubic(q)) * 14}px)`, transformBox: 'fill-box', transformOrigin: 'center' } as React.CSSProperties;
  };
  const gradStroke = { stroke: 'url(#bbMolten)', fill: 'none', strokeWidth: 11 } as const;
  const content = (glow: boolean) => (
    <g>
      <g {...gradStroke} stroke={glow ? C.fire : 'url(#bbMolten)'}>
        {BOLO.map((l, i) => (
          <g key={l.k} style={letterStyle(i, a * 1.5)}>{l.el}</g>
        ))}
      </g>
      <path d={TAIL} fill={glow ? C.fire : 'url(#bbMolten)'} style={letterStyle(1, a * 1.5)} />
      <g clipPath="url(#bbReveal)" {...gradStroke} stroke={glow ? C.fire : 'url(#bbMolten)'}>
        {BEATS.map((l, i) => (
          <g key={l.k} style={letterStyle(i, b * 1.4)}>{l.el}</g>
        ))}
      </g>
      <g fill="none" stroke={glow ? C.fire : C.gold} strokeWidth={6} strokeLinecap="round">
        <path d="M603,431 A14,14 0 0 1 603,453" opacity={w1} />
        <path d="M611,421 A27,27 0 0 1 611,463" opacity={w2} />
      </g>
    </g>
  );
  // sparks off the speech bubble on the first hit
  const sparks = Array.from({ length: 26 }, (_, i) => {
    const age = lt - LOGO_HIT1;
    if (age < 0 || age > 1.2) return null;
    const ang = rand(i * 3.3) * Math.PI * 2;
    const sp = 60 + rand(i * 5.1) * 140;
    const r = sp * easeOutCubic(age / 1.2);
    return <circle key={i} cx={593.5 + Math.cos(ang) * (44 + r)} cy={442 + Math.sin(ang) * (44 + r) + age * age * 40} r={1.6 + rand(i) * 1.6} fill={rand(i * 9) > 0.5 ? C.gold : C.cream} opacity={(1 - age / 1.2) * 0.9} />;
  });
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <AbsoluteFill style={{ opacity: bg }}>
        <Glow o={0.55 + 0.25 * aE + flash2 * 0.3} y={52} />
        <Silk t={t} o={0.8} />
        <Embers t={t} amount={0.35} />
      </AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="bbMolten" gradientUnits="userSpaceOnUse" x1="0" y1="396" x2="0" y2="494">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.35" stopColor={C.cream} />
            <stop offset="0.62" stopColor={C.gold} />
            <stop offset="1" stopColor={C.fire} />
          </linearGradient>
          <clipPath id="bbReveal">
            <rect x={830} y={380} width={lerp(0, 420, easeOutCubic(b))} height={130} />
          </clipPath>
          <linearGradient id="bbSweep" gradientUnits="userSpaceOnUse" x1={sx - 70} y1="0" x2={sx + 70} y2="0">
            <stop offset="0" stopColor="#000" />
            <stop offset="0.5" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="bbSweepMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <rect x="0" y="0" width="1920" height="1080" fill="url(#bbSweep)" />
          </mask>
          <filter id="bbBlur" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <g transform={`translate(960 ${540}) scale(${scale}) translate(${-cx} ${-LOGO_CY})`}>
          <g filter="url(#bbBlur)" opacity={0.55 + flash2 * 0.45}>{content(true)}</g>
          <g style={{ filter: `blur(${(1 - aE) * 6}px)` }}>{content(false)}</g>
          {sweep > 0 && sweep < 1 && (
            <g mask="url(#bbSweepMask)" style={{ mixBlendMode: 'screen' }}>
              <g stroke="#fff" fill="none" strokeWidth={11}>
                {BOLO.map((l) => <g key={l.k}>{l.el}</g>)}
                {BEATS.map((l) => <g key={l.k}>{l.el}</g>)}
              </g>
            </g>
          )}
          <g>{sparks}</g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Everything after the song: black pause, PSH, BOLO BEATS. */
export const Outro: React.FC<{ t: number; frame: number }> = ({ t, frame }) => (
  <AbsoluteFill style={{ background: C.black }}>
    {t >= PSH_FROM && t < PSH_TO && <PSH t={t} />}
    {t >= LOGO_FROM && <Logo t={t} />}
    <Vignette />
    <Grain frame={frame} />
  </AbsoluteFill>
);
