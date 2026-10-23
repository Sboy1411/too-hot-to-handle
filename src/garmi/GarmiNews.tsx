import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import audio from '../data/audio.json';
import { Backdrop, CaptionBox, RedWipe, StrapBar, Ticker, TopBar } from './chrome';
import { useGarmiFonts } from './fonts';
import { CCTV, Debate, EndCard, Forecast, HeatMap, Opener, Profile, SignalLost, Thermometer } from './scenes';
import { CloseUp, Studio, World, blueScreens, bootScreens } from './studio';
import {
  END_T, FPS, HIJACK, L, SONG_IN, SONG_OUT, clamp, easeInCubic, easeInOutCubic, easeInOutSine, easeOutCubic, keys, lerp, seg, shake,
} from './timeline';

const BEATS = (audio as { beats: number[] }).beats;
/** Decaying pulse on each beat of the song (0 before the song starts). */
const beatPulse = (t: number) => {
  if (t < SONG_IN) return 0;
  const s = t - SONG_IN;
  let last = -1;
  for (const b of BEATS) { if (b <= s) last = b; else break; }
  return last < 0 ? 0 : Math.exp(-(s - last) * 7);
};

const HAZE_ID = 'garmi-haze';
const Haze: React.FC<{ t: number; amt: number }> = ({ t, amt }) => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <filter id={HAZE_ID} x="-5%" y="-60%" width="110%" height="220%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves={2} seed={4} result="n" />
      <feOffset in="n" dy={-((t * 90) % 400)} result="o" />
      <feDisplacementMap in="SourceGraphic" in2="o" scale={amt * 26} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

/** What is on air inside the picture box. */
const Picture: React.FC<{ t: number }> = ({ t }) => {
  const pulse = beatPulse(t);
  if (t < 6.4) {
    const p = easeInOutSine(seg(t, 2.2, 6.4));
    return (
      <World cam={{ x: 540, y: lerp(462, 448, p), z: lerp(1.0, 1.05, p) }}>
        <Studio t={t} fire={0} screen={blueScreens(t, false)} />
      </World>
    );
  }
  if (t < 10.2) {
    const p = easeInOutSine(seg(t, 6.4, 10.2));
    return (
      <World cam={{ x: lerp(536, 546, p), y: 352, z: lerp(1.3, 1.34, p) }}>
        <Studio t={t} fire={0} screen={blueScreens(t, true)} />
      </World>
    );
  }
  if (t < 17.7) return <HeatMap t={t} mode="walk" />;
  if (t < 24.7) return <CCTV t={t} />;
  if (t < 27.95) return <CloseUp t={t} />;
  if (t < HIJACK) return <SignalLost t={t} />;
  if (t < 38.74) {
    const cam = {
      x: keys(t, [[HIJACK, 540], [31.5, 540], [36.0, 572], [36.45, 636], [38.74, 640]], easeInOutCubic),
      y: keys(t, [[HIJACK, 420], [31.5, 400], [36.0, 186], [36.45, 196], [38.74, 196]], easeInOutCubic),
      z: keys(t, [[HIJACK, 0.98], [31.5, 1.02], [36.0, 2.25], [38.74, 2.5]], easeInOutCubic),
    };
    const haze = seg(t, 36.0, 38.7);
    const back = easeOutCubic(seg(t, HIJACK, HIJACK + 0.25));
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
        <Haze t={t} amt={haze} />
        <div style={{ position: 'absolute', inset: 0, opacity: back, filter: `${haze > 0 ? `url(#${HAZE_ID}) ` : ''}brightness(${(0.82 + pulse * 0.1) * (1 + haze * 0.35)}) saturate(${1 + haze * 0.4})` }}>
          <World cam={cam}>
            <Studio t={t} fire={1} anchor={false} thatMan screen={bootScreens(t)} pulse={pulse} />
          </World>
        </div>
        {haze > 0 && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 40% 40%, rgba(255,140,50,0.45), rgba(255,77,26,0.35) 60%, rgba(160,20,0,0.4))', opacity: haze * 0.9, mixBlendMode: 'screen' }} />}
        {t >= 36.0 && <Thermometer t={t} />}
      </div>
    );
  }
  if (t < 41.2) return <HeatMap t={t} mode="wave" />;
  if (t < 44.2) return <Forecast t={t} />;
  if (t < 47.1) return <Debate t={t} />;
  return <Profile t={t} pulse={pulse} />;
};

const Layout: React.FC<{ t: number }> = ({ t }) => {
  const sh = shake(t);
  const whole = shake(t, true);
  const mag = Math.hypot(sh.x, sh.y);
  const verse = clamp(1 - (t - 38.74) / 0.32) * (t >= 38.74 ? 1 : 0);
  const crack = t >= 34.3 ? clamp(1 - (t - 34.3) / 0.14) * 0.55 : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translate(${whole.x}px, ${whole.y}px)` }}>
      <Backdrop t={t} />
      <TopBar t={t} />
      <div style={{ position: 'absolute', left: 0, top: L.pic.y, width: 1080, height: L.pic.h, overflow: 'hidden', background: '#000' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${1 + Math.min(0.08, mag / 260)})` }}>
          <Picture t={t} />
        </div>
        <RedWipe t={t} />
        {crack > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: crack }} />}
      </div>
      <StrapBar t={t} />
      <CaptionBox t={t} />
      <Ticker t={t} />
      {verse > 0 && <div style={{ position: 'absolute', inset: -60, background: '#fff', opacity: verse * 0.92 }} />}
    </div>
  );
};

export const GarmiNews: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ready = useGarmiFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  if (t >= END_T) return <AbsoluteFill><EndCard t={t} /></AbsoluteFill>;
  if (t >= SONG_OUT) {
    // old CRT switching off: squeeze to a bright line, then a dot, then black
    const a = seg(t, SONG_OUT, SONG_OUT + 0.13);
    const b = seg(t, SONG_OUT + 0.13, SONG_OUT + 0.27);
    const c = seg(t, SONG_OUT + 0.27, END_T);
    const sy = lerp(1, 0.004, easeInCubic(a));
    return (
      <AbsoluteFill style={{ background: '#000' }}>
        {a < 1 && (
          <div style={{ position: 'absolute', inset: 0, transform: `scaleY(${sy}) scaleX(${1 + a * 0.04})`, filter: `brightness(${1 + a * 4}) contrast(${1 - a * 0.4})` }}>
            <Layout t={SONG_OUT - 0.001} />
          </div>
        )}
        {a >= 1 && c < 1 && (
          <div style={{ position: 'absolute', left: 540, top: 960, transform: 'translate(-50%, -50%)', width: Math.max(14, 1080 * (1 - easeInCubic(b))), height: b < 1 ? 8 : 14, borderRadius: 8, background: '#fff', boxShadow: '0 0 30px #fff, 0 0 70px #cfe6ff, 0 0 140px #9ec9ff', opacity: 1 - easeInCubic(c) }} />
        )}
      </AbsoluteFill>
    );
  }
  const op = t < 2.4 ? <Opener t={t} sh={shake(t)} /> : null;
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {t >= 2.2 && <Layout t={t} />}
      {op}
    </AbsoluteFill>
  );
};
