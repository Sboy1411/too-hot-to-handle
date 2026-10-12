import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Thermal, heat, heatGlow } from './thermal';
import { HeatGrain, HeatVignette } from './world';
import { VF } from './fonts';
import { FPS, clamp, lerp, rand, easeOutCubic, easeInOutCubic, easeOutExpo } from '../lib/time';

/**
 * After the song (Albert's rules, see project memory): black pause, a silent screen with only "PSH",
 * then the BOLO BEATS logo for exactly 4 s on the first 4 s of Bolo_Beats.wav.
 * Both are seen through the thermal camera like the rest of the cut. Audio: build-outro-audio.sh.
 */
export const OUTRO_START = 143.4; // the cut has faded to black by here
export const PSH_FROM = 144.4;
export const PSH_TO = 147.4;
export const LOGO_FROM = 147.8;
export const LOGO_DUR = 4.0;
export const OUTRO_END = LOGO_FROM + LOGO_DUR;
const HIT1 = 0.3; // Bolo_Beats.wav: soft hit, BOLO appears
const HIT2 = 2.93; // second hit, BEATS opens out

/** Only "PSH": it warms up into a heat signature, holds white-hot, then cools and slumps back to black. Silent. */
const PSH: React.FC<{ t: number }> = ({ t }) => {
  const lt = t - PSH_FROM;
  const dur = PSH_TO - PSH_FROM;
  const warm = easeOutCubic(clamp(lt / 0.9));
  const cool = easeInOutCubic(clamp((lt - (dur - 0.9)) / 0.9));
  const breathe = 0.04 * Math.sin(lt * 2.4);
  const v = clamp(warm * (0.92 + breathe) * (1 - cool));
  const year = 1979 + 26 * cool; // the letters sag a little as they cool
  const scale = 1.06 - 0.06 * warm + 0.012 * lt;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          fontFamily: VF.melt,
          fontVariationSettings: `'YEAR' ${Math.round(year)}`,
          fontSize: 330,
          lineHeight: 1,
          letterSpacing: '0.02em',
          color: heat(v),
          textShadow: heatGlow(v, 330, 0.8),
          filter: `blur(${(1 - warm) * 18}px)`,
          transform: `scale(${scale})`,
        }}
      >
        PSH
      </div>
    </AbsoluteFill>
  );
};

// BOLO BEATS letterforms, traced over Albert's logo (artwork coords: x 465..1214, y 396..494).
const CX_BOLO = 633;
const CX_ALL = 839.5;
const CY = 445;
const BOLO = [
  'M470.5,405.5 H503 A18.5,18.5 0 0 1 503,442.5 H470.5 M470.5,442.5 H507 A20,20 0 0 1 507,482.5 H470.5 M470.5,400 V488',
  'M552.5,442 A41,41 0 1 0 634.5,442 A41,41 0 1 0 552.5,442',
  'M660.5,400 V482.5 H706',
  'M718.5,445 A39,39 0 1 0 796.5,445 A39,39 0 1 0 718.5,445',
];
const BEATS = [
  'M856.5,405.5 H889 A18.5,18.5 0 0 1 889,442.5 H856.5 M856.5,442.5 H893 A20,20 0 0 1 893,482.5 H856.5 M856.5,400 V488',
  'M988,405.5 H940.5 V482.5 H988 M940.5,442.5 H985',
  'M1003,488 L1044,410 L1085,488',
  'M1087,405.5 H1136 M1111.5,405.5 V488',
  'M1205,416 C1198,408 1190,405.5 1180,405.5 C1166,405.5 1155,413 1155,424 C1155,437 1168,440 1181,443 C1196,446 1208,452 1208,463 C1208,475 1196,482.5 1181,482.5 C1168,482.5 1158,478 1151,469',
];
const TAIL = 'M563,468 L553,494 L582,481 Z';
const WAVES = ['M603,431 A14,14 0 0 1 603,453', 'M611,421 A27,27 0 0 1 611,463'];

/** Heat of a letter that ignites at `at`: flashes white-hot, settles to a warm hold. */
const ignite = (lt: number, at: number, hold = 0.78) => {
  const d = lt - at;
  if (d < 0) return 0;
  return clamp(easeOutExpo(clamp(d / 0.12)) * (hold + (1 - hold) * Math.exp(-d * 3.5)));
};

const Logo: React.FC<{ t: number }> = ({ t }) => {
  const lt = t - LOGO_FROM;
  const slide = easeInOutCubic(clamp((lt - HIT2) / 0.45));
  const reveal = easeOutCubic(clamp((lt - HIT2) / 0.35));
  const fade = 1 - easeInOutCubic(clamp((lt - (LOGO_DUR - 0.35)) / 0.35));
  const cx = lerp(CX_BOLO, CX_ALL, slide);
  const scale = 1.55 * (1 + lt * 0.006);
  const pulse = (k: number) => 0.7 + 0.3 * Math.sin(lt * 6 - k * 1.2);
  const letter = (d: string, v: number, key: string | number, w = 11) => (v > 0.003 ? <path key={key} d={d} stroke={heat(v)} strokeWidth={w} fill="none" /> : null);
  const art = (
    <>
      {BOLO.map((d, i) => letter(d, ignite(lt, HIT1 + i * 0.06) * fade, 'o' + i))}
      <path d={TAIL} fill={heat(ignite(lt, HIT1 + 0.06) * fade)} />
      <g clipPath="url(#bbReveal)">{BEATS.map((d, i) => letter(d, ignite(lt, HIT2 + 0.05 + i * 0.05) * fade, 'e' + i))}</g>
      {WAVES.map((d, i) => (
        <path key={'w' + i} d={d} stroke={heat(ignite(lt, HIT1 + 0.25 + i * 0.2, 0.9) * pulse(i) * fade)} strokeWidth={6} strokeLinecap="round" fill="none" />
      ))}
    </>
  );
  // A puff of heat off the speech bubble on each hit.
  const puff = (at: number) => {
    const d = lt - at;
    return d < 0 || d > 1 ? 0 : Math.exp(-d * 4);
  };
  const sparks = Array.from({ length: 24 }, (_, i) => {
    const age = lt - HIT1;
    if (age < 0 || age > 1.1) return null;
    const ang = rand(i * 3.3) * Math.PI * 2;
    const r = (60 + rand(i * 5.1) * 130) * easeOutCubic(age / 1.1);
    return <circle key={i} cx={593.5 + Math.cos(ang) * (44 + r)} cy={442 + Math.sin(ang) * (44 + r)} r={1.5 + rand(i) * 1.5} fill={heat(0.95 * (1 - age / 1.1))} />;
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 34% 30% at 50% 50%, ${heat(0.2 * puff(HIT1) + 0.2 * puff(HIT2) + 0.06 * fade * clamp(lt / 0.4))}, transparent 70%)` }} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="bbReveal">
            <rect x={830} y={380} width={lerp(0, 420, reveal)} height={130} />
          </clipPath>
          <filter id="bbBloom" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <g transform={`translate(960 540) scale(${scale}) translate(${-cx} ${-CY})`}>
          <g filter="url(#bbBloom)" opacity={0.9}>{art}</g>
          {art}
          {sparks}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const ViralOutro: React.FC<{ t: number; frame: number }> = ({ t, frame }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Thermal id="th-outro" blend={[{ name: 'IRONBOW', w: 1 }]}>
      {t >= PSH_FROM && t < PSH_TO && <PSH t={t} />}
      {t >= LOGO_FROM && t < OUTRO_END && <Logo t={t} />}
      <HeatVignette />
      <HeatGrain frame={frame} amt={0.05} />
    </Thermal>
  </AbsoluteFill>
);

export const VIRAL_FRAMES = Math.ceil(OUTRO_END * FPS);
