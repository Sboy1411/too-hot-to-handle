import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import audio from '../data/audio.json';
import { useGarmiFonts, wrapWords } from '../garmi/fonts';
import { FONT, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, noise1, seg } from '../garmi/timeline';
import { ChatBody, ChatHeader, DoorPhoto, InputBar, StatusBar, Wallpaper } from './chat';
import {
  AlertFinal, AngleMark, Camera, ControlPanel, EndLock, Flames, HeartPop, LockScreen, NameBanner, NoScandal, Overheat, Playlist,
  ProfileViewer, Shutdown, VideoCall, Vinyl,
} from './screens';
import { CutName, FPS, ShotName, TL, TLContext, buildTL, useTL } from './timeline';

const BEATS = (audio as { beats: number[] }).beats;
const beatPulse = (tl: TL, t: number) => {
  if (t < tl.PLAY) return 0;
  const s = t - tl.PLAY + tl.SONG_FROM;
  let last = -1;
  for (const b of BEATS) { if (b <= s) last = b; else break; }
  return last < 0 ? 0 : Math.exp(-(s - last) * 7);
};

const shake = (tl: TL, t: number) => {
  let x = 0, y = 0, r = 0;
  for (const h of tl.HITS) {
    if (t < h.t) continue;
    const e = h.amp * Math.exp(-(t - h.t) * h.decay);
    if (e < 0.05) continue;
    x += e * noise1((t - h.t) * 38, h.t);
    y += e * noise1((t - h.t) * 41, h.t + 7);
    r += e * 0.03 * noise1((t - h.t) * 30, h.t + 13);
  }
  return { x, y, r };
};

// ───────────────────────── live lyrics (sung words) ─────────────────────────
const PILL = { x: 36, y: 1322, w: 908, h: 174 };
const LyricPill: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const { LINES, LYRICS_FROM, pillLabel } = useTL();
  const enter = easeOutCubic(seg(t, LYRICS_FROM, LYRICS_FROM + 0.3));
  let line = null as (typeof LINES)[number] | null;
  for (const l of LINES) if (t >= l.a && t < l.b) line = l;
  const fam = FONT.inter;
  let body: React.ReactNode = null;
  if (line) {
    // the sung line only (no translation): one line when it fits, else two
    const words = line.text.split(' ');
    const avail = PILL.w - 150;
    let size = 46;
    let lines = wrapWords(words, fam, 600, size, avail);
    while (lines.length > 1 && size > 40) { size -= 2; lines = wrapWords(words, fam, 600, size, avail); }
    if (lines.length > 1) { size = 44; lines = wrapWords(words, fam, 600, size, avail); }
    const l = line;
    body = (
      <div style={{ position: 'absolute', left: 124, right: 24, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
        {lines.map((ln, li) => (
          <div key={li} style={{ fontFamily: fam, fontWeight: 600, fontSize: size, lineHeight: 1.2, color: '#fff', whiteSpace: 'nowrap' }}>
            {ln.map((wi, k) => {
              const at = l.words[wi] ?? l.a;
              const p = clamp((t - at) / 0.08);
              const pop = 1 + (1 - easeOutCubic(clamp((t - at) / 0.18))) * 0.12;
              return <span key={wi} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 8}px) scale(${pop})`, transformOrigin: '50% 80%', marginRight: k < ln.length - 1 ? '0.26em' : 0 }}>{words[wi]}</span>;
            })}
          </div>
        ))}
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
      <div style={{ position: 'absolute', right: 22, top: 14, fontFamily: FONT.archivo, fontWeight: 800, fontSize: 17, letterSpacing: '0.14em', color: '#ff9a5a' }}>{pillLabel}</div>
      {body}
    </div>
  );
};

// ───────────────────────── discovery cuts: the POV hook and the push into the photo ─────────────────────────
const HookText: React.FC<{ t: number }> = ({ t }) => {
  const { hook, STORY, DROP } = useTL();
  if (!hook || t >= DROP) return null;
  const second = t >= STORY.photo;
  const at = second ? STORY.photo : 0;
  const lines = second ? hook.b : hook.a;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {lines.map((ln, i) => {
        const p = at === 0 ? 1 : easeOutBack(clamp((t - at - i * 0.06) / 0.22), 1.8); // the first frame already carries the whole hook
        return (
          <div key={`${second}${i}`} style={{ background: '#fff', color: '#0a0a0a', borderRadius: 18, padding: '6px 26px 10px', fontFamily: FONT.archivo, fontWeight: 900, fontSize: 74, lineHeight: 1.08, whiteSpace: 'nowrap', transform: `scale(${p})`, boxShadow: '0 10px 30px rgba(0,0,0,0.55)' }}>{ln}</div>
        );
      })}
    </div>
  );
};

const PhotoZoom: React.FC<{ t: number }> = ({ t }) => {
  const { hook, STORY, DROP } = useTL();
  const a = DROP - 0.84; // about two beats before the drop: cut in on the photo, then push into it
  if (!hook || t < a || t >= DROP) return null;
  const p = easeInCubic(seg(t, a, DROP));
  const s = lerp(1.35, 2.1, p);
  const cutIn = clamp((t - a) / 0.08);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: cutIn }}>
      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0.88 }} />
      <div style={{ position: 'absolute', left: 540 - 276, top: 900 - 320, width: 552, height: 640, transform: `scale(${s})`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 80px rgba(255,140,40,0.6)' }}>
        <DoorPhoto t={t} at={STORY.photo} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#ffd8b0', opacity: easeInCubic(seg(t, DROP - 0.18, DROP)) * 0.7, mixBlendMode: 'screen' }} />
    </div>
  );
};

// ───────────────────────── one frame ─────────────────────────
const Frame: React.FC = () => {
  const tl = useTL();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { V, SHOTS, STORY, on } = tl;
  if (t >= tl.END_CARD) return <AbsoluteFill><EndLock t={t} from={tl.END_CARD} /></AbsoluteFill>;
  if (tl.shutdown && t >= tl.SONG_END) return <AbsoluteFill><Shutdown t={t} from={tl.SONG_END} to={tl.END_CARD} /></AbsoluteFill>;

  const inShot = (k: ShotName) => on(k) && t >= SHOTS[k][0] && t < SHOTS[k][1];
  const pulse = beatPulse(tl, t);
  const lyrics = t >= tl.LYRICS_FROM;
  const bottom = lyrics ? lerp(1500, 1306, easeOutCubic(seg(t, tl.LYRICS_FROM, tl.LYRICS_FROM + 0.3))) : 1500;
  const sh = shake(tl, t);
  // chat effects per lyric line
  const scrollAmt = on('deleted') ? easeInOutCubic(seg(t, SHOTS.deleted[0], SHOTS.deleted[0] + 0.3)) * (1 - easeInOutCubic(seg(t, V(72.0), V(72.45)))) : 0;
  const sway = on('candle') ? seg(t, SHOTS.candle[0], SHOTS.candle[0] + 0.4) * (1 - seg(t, SHOTS.candle[1] - 0.15, SHOTS.candle[1])) : 0;
  const flames = on('candle') ? seg(t, V(74.4), V(74.4) + 0.35) * (1 - seg(t, SHOTS.candle[1] - 0.1, SHOTS.candle[1] + 0.25)) : 0;
  const tilt = on('candle') && t >= V(75.2) && t < SHOTS.candle[1] ? 9 * easeOutBack(clamp((t - V(75.2)) / 0.25), 1.6) : 0;
  const scramble = on('scramble') && t >= SHOTS.scramble[0] && t < SHOTS.scramble[1] + 0.1 ? Math.min(1, seg(t, SHOTS.scramble[0], V(76.7)) * 0.6 + seg(t, V(76.7), V(76.75)) * 0.4) * (1 - seg(t, SHOTS.scramble[1] - 0.1, SHOTS.scramble[1] + 0.1)) : 0;
  const hotFrom = tl.cut === 'full' ? SHOTS.overheat[1] : tl.DROP;
  const warm = t < STORY.photo ? 0 : t < hotFrom ? lerp(0.12, 0.45, seg(t, STORY.photo, hotFrom)) : 0.8;
  const glitch = scramble > 0.5 ? (Math.floor(t * 30) % 3) * 4 : 0;
  const open = STORY.lock ? easeOutCubic(seg(t, STORY.open, tl.CHAT_OPEN)) : 1;

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${1 + Math.min(0.06, Math.hypot(sh.x, sh.y) / 300)})` }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${lerp(0.94, 1, open)})` }}>
          <Wallpaper warm={warm} />
          <div style={{ position: 'absolute', inset: 0, transform: `rotate(${-tilt}deg)`, transformOrigin: '50% 60%', filter: glitch ? `drop-shadow(${glitch}px 0 0 rgba(0,255,255,0.6)) drop-shadow(${-glitch}px 0 0 rgba(255,0,80,0.6))` : undefined }}>
            <ChatBody t={t} fx={{ bottom, scrollTo: { id: 'r1', amt: scrollAmt }, scramble, sway, warm: lyrics ? warm : 0 }} />
          </div>
          <ChatHeader t={t} />
          <InputBar />
          {flames > 0 && <Flames t={t} amt={flames} />}
          {tilt > 0 && <AngleMark t={t} deg={tilt} />}
          {inShot('banner') && <NameBanner t={t} />}
          {inShot('profile') && <ProfileViewer t={t} />}
          {inShot('vinyl') && <Vinyl t={t} pulse={pulse} />}
          {inShot('alert') && <AlertFinal t={t} />}
          {inShot('overheat') && <Overheat t={t} pulse={pulse} />}
          {on('deleted') && t >= V(70.75) && t < SHOTS.deleted[1] && <NoScandal t={t} />}
          {inShot('panel') && <ControlPanel t={t} />}
          {inShot('call') && <VideoCall t={t} pulse={pulse} />}
          {inShot('playlist') && <Playlist t={t} pulse={pulse} />}
          {inShot('camera') && <Camera t={t} />}
          {inShot('pop') && <HeartPop t={t} />}
          <PhotoZoom t={t} />
        </div>
        <StatusBar t={t} />
        {lyrics && <LyricPill t={t} pulse={pulse} />}
        <HookText t={t} />
        {STORY.lock && t < tl.CHAT_OPEN && <LockScreen t={t} />}
      </div>
    </AbsoluteFill>
  );
};

export const Reel2: React.FC<{ cut?: CutName }> = ({ cut = 'full' }) => {
  const tl = useMemo(() => buildTL(cut), [cut]);
  const ready = useGarmiFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  return (
    <TLContext.Provider value={tl}>
      <Frame />
    </TLContext.Provider>
  );
};
