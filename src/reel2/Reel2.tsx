import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import audio from '../data/audio.json';
import { textW, useGarmiFonts, wrapWords } from '../garmi/fonts';
import { FONT, clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, noise1, seg } from '../garmi/timeline';
import { ChatBody, ChatHeader, InputBar, StatusBar, Wallpaper } from './chat';
import {
  AlertFinal, AngleMark, Camera, ControlPanel, EndLock, Flames, HeartPop, LockScreen, NameBanner, NoScandal, Overheat, Playlist,
  ProfileViewer, Shutdown, VideoCall, Vinyl,
} from './screens';
import { C, CHAT_OPEN, END_CARD, FPS, HITS, LINES, PLAY, SHOTS, SONG_END, SONG_FROM, V } from './timeline';

const BEATS = (audio as { beats: number[] }).beats;
const beatPulse = (t: number) => {
  if (t < PLAY) return 0;
  const s = t - PLAY + SONG_FROM;
  let last = -1;
  for (const b of BEATS) { if (b <= s) last = b; else break; }
  return last < 0 ? 0 : Math.exp(-(s - last) * 7);
};

const shake = (t: number) => {
  let x = 0, y = 0, r = 0;
  for (const h of HITS) {
    if (t < h.t) continue;
    const e = h.amp * Math.exp(-(t - h.t) * h.decay);
    if (e < 0.05) continue;
    x += e * noise1((t - h.t) * 38, h.t);
    y += e * noise1((t - h.t) * 41, h.t + 7);
    r += e * 0.03 * noise1((t - h.t) * 30, h.t + 13);
  }
  return { x, y, r };
};

const inShot = (t: number, k: keyof typeof SHOTS, pad = 0) => t >= SHOTS[k][0] - pad && t < SHOTS[k][1] + pad;

// ───────────────────────── live lyrics (sung words + English) ─────────────────────────
const PILL = { x: 36, y: 1322, w: 908, h: 174 };
const LyricPill: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const enter = easeOutCubic(seg(t, PLAY, PLAY + 0.3));
  let line = null as (typeof LINES)[number] | null;
  for (const l of LINES) if (t >= l.a && t < l.b) line = l;
  const fam = FONT.inter;
  let body: React.ReactNode = null;
  if (line) {
    const words = line.text.split(' ');
    const avail = PILL.w - 150;
    let size = 40;
    let lines = wrapWords(words, fam, 600, size, avail);
    while (lines.length > (line.en ? 1 : 2) && size > 30) { size -= 2; lines = wrapWords(words, fam, 600, size, avail); }
    if (lines.length > 2) { size = 30; lines = wrapWords(words, fam, 600, size, avail); }
    const enSize = line.en ? Math.min(30, (avail / textW(line.en, `600 100px ${fam}`)) * 100) : 0;
    const l = line;
    body = (
      <div style={{ position: 'absolute', left: 124, right: 24, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
        {lines.map((ln, li) => (
          <div key={li} style={{ fontFamily: fam, fontWeight: 600, fontSize: size, lineHeight: 1.2, color: '#fff', whiteSpace: 'nowrap' }}>
            {ln.map((wi, k) => {
              const at = l.words[wi] ?? l.a;
              const p = clamp((t - at) / 0.08);
              const pop = 1 + (1 - easeOutCubic(clamp((t - at) / 0.18))) * 0.12;
              return <span key={wi} style={{ display: 'inline-block', opacity: words[wi] === '—' ? p * 0.6 : p, transform: `translateY(${(1 - p) * 8}px) scale(${pop})`, transformOrigin: '50% 80%', marginRight: k < ln.length - 1 ? '0.26em' : 0 }}>{words[wi]}</span>;
            })}
          </div>
        ))}
        {line.en && <div style={{ fontFamily: fam, fontWeight: 600, fontSize: enSize, color: C.sub, whiteSpace: 'nowrap', opacity: clamp((t - line.a) / 0.15) }}>{line.en}</div>}
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: PILL.x, top: PILL.y, width: PILL.w, height: PILL.h, transform: `translateY(${(1 - enter) * 260}px)`, opacity: enter }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 34, background: 'rgba(8,8,12,0.92)', border: `2px solid rgba(255,120,60,${0.35 + pulse * 0.4})`, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', left: 26, top: PILL.h / 2 - 40, width: 80, height: 80, borderRadius: 40, background: 'repeating-radial-gradient(circle, #111 0 3px, #262630 4px 6px)', transform: `rotate(${t * 240}deg)`, boxShadow: `0 0 ${10 + pulse * 20}px rgba(255,90,30,0.6)` }}>
        <div style={{ position: 'absolute', left: 24, top: 24, width: 32, height: 32, borderRadius: 16, background: 'linear-gradient(160deg, #FFB547, #FF4D1A)' }} />
        <div style={{ position: 'absolute', left: 37, top: 37, width: 6, height: 6, borderRadius: 3, background: '#000' }} />
      </div>
      <div style={{ position: 'absolute', right: 22, top: 14, fontFamily: FONT.archivo, fontWeight: 800, fontSize: 17, letterSpacing: '0.14em', color: '#ff9a5a' }}>♪ LIVE LYRICS</div>
      {body}
    </div>
  );
};

export const Reel2: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ready = useGarmiFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  if (t >= END_CARD) return <AbsoluteFill><EndLock t={t} from={END_CARD} /></AbsoluteFill>;
  if (t >= SONG_END) return <AbsoluteFill><Shutdown t={t} from={SONG_END} to={END_CARD} /></AbsoluteFill>;

  const pulse = beatPulse(t);
  const music = t >= PLAY;
  const bottom = music ? lerp(1500, 1306, easeOutCubic(seg(t, PLAY, PLAY + 0.3))) : 1500;
  const sh = shake(t);
  // chat effects per lyric
  const scrollAmt = easeInOutCubic(seg(t, SHOTS.deleted[0], SHOTS.deleted[0] + 0.3)) * (1 - easeInOutCubic(seg(t, V(72.0), V(72.45))));
  const sway = seg(t, SHOTS.candle[0], SHOTS.candle[0] + 0.4) * (1 - seg(t, SHOTS.candle[1] - 0.15, SHOTS.candle[1]));
  const flames = seg(t, V(74.4), V(74.4) + 0.35) * (1 - seg(t, SHOTS.candle[1] - 0.1, SHOTS.candle[1] + 0.25));
  const tilt = t >= V(75.2) && t < SHOTS.candle[1] ? 9 * easeOutBack(clamp((t - V(75.2)) / 0.25), 1.6) : 0;
  const scramble = t >= SHOTS.scramble[0] && t < SHOTS.scramble[1] + 0.1 ? Math.min(1, seg(t, SHOTS.scramble[0], V(76.7)) * 0.6 + seg(t, V(76.7), V(76.75)) * 0.4) * (1 - seg(t, SHOTS.scramble[1] - 0.1, SHOTS.scramble[1] + 0.1)) : 0;
  const warm = t < 7.1 ? 0 : t < SHOTS.overheat[1] ? lerp(0.12, 0.45, seg(t, 7.1, SHOTS.overheat[0])) : 0.8;
  const glitch = scramble > 0.5 ? (Math.floor(t * 30) % 3) * 4 : 0;
  const open = easeOutCubic(seg(t, 1.92, CHAT_OPEN));

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${1 + Math.min(0.06, Math.hypot(sh.x, sh.y) / 300)})` }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${lerp(0.94, 1, open)})` }}>
          <Wallpaper warm={warm} />
          <div style={{ position: 'absolute', inset: 0, transform: `rotate(${-tilt}deg)`, transformOrigin: '50% 60%', filter: glitch ? `drop-shadow(${glitch}px 0 0 rgba(0,255,255,0.6)) drop-shadow(${-glitch}px 0 0 rgba(255,0,80,0.6))` : undefined }}>
            <ChatBody t={t} fx={{ bottom, scrollTo: { id: 'r1', amt: scrollAmt }, scramble, sway, warm: music ? warm : 0 }} />
          </div>
          <ChatHeader t={t} />
          <InputBar />
          {flames > 0 && <Flames t={t} amt={flames} />}
          {tilt > 0 && <AngleMark t={t} deg={tilt} />}
          {inShot(t, 'banner') && <NameBanner t={t} />}
          {inShot(t, 'profile') && <ProfileViewer t={t} />}
          {inShot(t, 'vinyl') && <Vinyl t={t} pulse={pulse} />}
          {inShot(t, 'alert') && <AlertFinal t={t} />}
          {inShot(t, 'overheat') && <Overheat t={t} pulse={pulse} />}
          {t >= V(70.75) && t < SHOTS.deleted[1] && <NoScandal t={t} />}
          {inShot(t, 'panel') && <ControlPanel t={t} />}
          {inShot(t, 'call') && <VideoCall t={t} pulse={pulse} />}
          {inShot(t, 'playlist') && <Playlist t={t} pulse={pulse} />}
          {inShot(t, 'camera') && <Camera t={t} />}
          {inShot(t, 'pop') && <HeartPop t={t} />}
        </div>
        <StatusBar t={t} />
        {music && <LyricPill t={t} pulse={pulse} />}
        {t < CHAT_OPEN && <LockScreen t={t} />}
      </div>
    </AbsoluteFill>
  );
};
