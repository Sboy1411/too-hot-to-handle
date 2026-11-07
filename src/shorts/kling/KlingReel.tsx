import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import '../../fonts';
import { useFontsReady, VF } from '../../viral/fonts';
import { Slices } from '../../viral/fx';
import { C, F, HEAT_GRADIENT } from '../../theme';
import { FPS, clamp, easeOutBack, easeOutCubic, lerp, rand } from '../../lib/time';
import { BEAT_TIMES, DOWNBEATS, END, SCANDAL, SHOTS, START, Shot, lineAt, shotAt, shotById } from './script';

const ease = (t: number, a: number, d: number) => easeOutCubic(clamp((t - a) / d));
const pop = (t: number, a: number, d = 0.25, s = 2) => (t < a ? 0 : easeOutBack(clamp((t - a) / d), s));
const since = (t: number, list: number[]) => {
  let last = -99;
  for (const b of list) if (b <= t) last = b;
  return t - last;
};

// ───────────────────────── Kling shots ─────────────────────────

/** Stand-in until the Kling clip exists: the shot's name and action over a slow push on the character. */
const Slate: React.FC<{ t: number; s: Shot }> = ({ t, s }) => {
  const p = clamp((t - s.from) / (s.to - s.from));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 40%, ${s.tint}, #07050C 75%)`, overflow: 'hidden' }}>
      {s.him ? (
        <Img src={staticFile('shorts/that-man.png')} style={{ position: 'absolute', left: 40, top: 240, width: 1000, height: 1000, transform: `scale(${lerp(1, 1.12, p)})`, transformOrigin: '50% 30%', filter: 'drop-shadow(0 0 40px rgba(255,120,40,0.45))' }} />
      ) : (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontSize: 420, lineHeight: 1, transform: `scale(${lerp(1, 1.15, p)})` }}>{s.icon}</div>
      )}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 150, padding: '22px 28px', borderRadius: 18, background: 'rgba(8,6,14,0.72)', border: '2px solid rgba(255,181,71,0.5)' }}>
        <div style={{ fontFamily: VF.hud, fontSize: 30, fontWeight: 700, letterSpacing: 3, color: C.gold }}>{s.title}</div>
        <div style={{ fontFamily: F.sans, fontSize: 36, fontWeight: 600, color: '#F5EEE6', marginTop: 8, lineHeight: 1.25 }}>{s.note}</div>
        <div style={{ fontFamily: VF.hud, fontSize: 22, color: 'rgba(245,238,230,0.55)', marginTop: 10 }}>ANIMATIC · KLING CLIP GOES HERE</div>
      </div>
    </AbsoluteFill>
  );
};

/** Confetti for the still shots: falls from the top, or bursts out from (cx, cy) when `burst` is set. */
const Confetti: React.FC<{ t: number; a: number; n: number; burst?: [number, number]; colors: string[] }> = ({ t, a, n, burst, colors }) => {
  const dt = t - a;
  if (dt < 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }).map((_, i) => {
        const r1 = rand(i * 3.7 + 1), r2 = rand(i * 5.1 + 2), r3 = rand(i * 7.3 + 3);
        let x: number, y: number;
        if (burst) {
          const ang = r1 * Math.PI * 2, v = 900 + r2 * 1500;
          x = burst[0] + Math.cos(ang) * v * dt * Math.exp(-dt * 1.2);
          y = burst[1] + Math.sin(ang) * v * dt * Math.exp(-dt * 1.2) + 500 * dt * dt;
        } else {
          x = r1 * 1080 + Math.sin(dt * 2 + i) * 40;
          y = -60 + ((dt * (180 + r2 * 220) + r3 * 1900) % 2000);
        }
        const w = 14 + r3 * 18;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: w * 0.45, background: colors[i % colors.length], borderRadius: 3, transform: `rotate(${dt * (200 + r2 * 500) + r1 * 360}deg)`, boxShadow: '0 0 8px rgba(255,180,80,0.5)' }} />;
      })}
    </AbsoluteFill>
  );
};

/** A Kling shot made from its key frame alone (no clip): a slow push plus a code effect per shot. */
const Still: React.FC<{ t: number; s: Shot }> = ({ t, s }) => {
  const d = s.to - s.from, p = clamp((t - s.from) / d);
  const img = staticFile(`shorts/kling/${s.still}`);
  let scale = lerp(1.04, 1.16, easeOutCubic(p)), origin = '50% 40%', extra: React.ReactNode = null, filter = '', liftY = 0;
  if (s.id === 'k5') {
    // the ice bar melts: the cold blue drains away, drips run down, steam rises
    filter = `saturate(${lerp(0.9, 1.25, p)}) hue-rotate(${lerp(0, -18, p)}deg) brightness(${lerp(1, 1.08, p)})`;
    extra = (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <AbsoluteFill style={{ background: `rgba(255,120,40,${0.28 * p})`, mixBlendMode: 'overlay' }} />
        {Array.from({ length: 26 }).map((_, i) => {
          const x = rand(i * 2.3) * 1080, start = rand(i * 4.1) * 0.6, len = 80 + rand(i * 6.7) * 380;
          const q = clamp((p - start) / 0.4);
          return <div key={i} style={{ position: 'absolute', left: x, top: 120 + rand(i * 8.9) * 900, width: 6 + rand(i) * 6, height: len * q, borderRadius: 6, background: 'linear-gradient(180deg, rgba(190,235,255,0.0), rgba(190,235,255,0.75))', opacity: 0.8 }} />;
        })}
        {Array.from({ length: 14 }).map((_, i) => {
          const y = 1800 - ((t - s.from) * (120 + rand(i * 3) * 120) + rand(i * 9) * 500) % 1400;
          return <div key={`s${i}`} style={{ position: 'absolute', left: rand(i * 5.5) * 1000 - 60, top: y, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.28), transparent 65%)', filter: 'blur(10px)' }} />;
        })}
      </AbsoluteFill>
    );
  } else if (s.id === 'k6') {
    // every head turns: hold, a flash on the downbeat, then a fast zoom in on him
    const z = ease(t, s.from + 1.0, 0.35);
    scale = lerp(1.03, 1.06, p) + 0.55 * z; origin = '50% 52%';
    extra = <Confetti t={t} a={s.from} n={60} colors={['#FFB547', '#FF4D1A', '#FF2E6E', '#FFFFFF']} />;
  } else if (s.id === 'k7') {
    // the heart balloon swells and wobbles, then pops into confetti on "pop" (90.1)
    const POP = 90.1;
    const before = t < POP;
    const swell = clamp((t - s.from) / (POP - s.from));
    const wob = Math.sin((t - s.from) * 18) * 0.03 * swell;
    scale = 1.06;
    if (!before) {
      // after the pop the camera drops into the crowd (the balloon leaves the frame) and the crowd jumps
      const k = t - POP;
      scale = lerp(2.7, 2.55, clamp(k / 1.2)); origin = '50% 100%';
      liftY = -Math.abs(Math.sin(k * 9)) * 40 * Math.exp(-k * 2.5);
    }
    extra = (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {before && (
          <div style={{ position: 'absolute', left: 540, top: 600, width: 0, height: 0 }}>
            <div style={{ position: 'absolute', left: -380, top: -360, width: 760, height: 720, transform: `scale(${lerp(0.75, 1.3, swell) + wob}, ${lerp(0.75, 1.3, swell) - wob})`, background: 'radial-gradient(circle at 50% 50%, rgba(255,60,80,0.0) 45%, rgba(255,60,80,0.35) 60%, transparent 72%)' }} />
          </div>
        )}
        {!before && <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 33%, rgba(255,235,200,0.9), transparent 45%)', opacity: Math.exp(-(t - POP) * 6) }} />}
        <Confetti t={t} a={POP} n={120} burst={[540, 320]} colors={['#FF2E4A', '#FFD34D', '#FFB547', '#FFFFFF', '#E0306A']} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: '#07050C', overflow: 'hidden' }}>
      <Img src={img} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translateY(${liftY}px) scale(${scale})`, transformOrigin: origin, filter: filter || undefined }} />
      {extra}
    </AbsoluteFill>
  );
};

/** One Kling shot: the clip from its in-point, else the key frame still, else the slate. `until` keeps it running past its own end (for the glitch). */
const KlingShot: React.FC<{ t: number; s: Shot; until?: number }> = ({ t, s, until }) => {
  if (!s.clip) return s.still ? <Still t={t} s={s} /> : <Slate t={t} s={s} />;
  const from = Math.round((s.from - START) * FPS);
  const len = Math.round(((until ?? s.to) - s.from) * FPS);
  return (
    <Sequence from={from} durationInFrames={len} layout="none">
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(`shorts/kling/${s.clip}`)} startFrom={Math.round((s.in ?? 0) * FPS)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
    </Sequence>
  );
};

/** "Tere nazran ne keeta scramble": the candle shot tears into RGB bands and pixel blocks. */
const Scramble: React.FC<{ t: number; s: Shot }> = ({ t, s }) => {
  const src = shotById(s.of!);
  const k = 0.55 + 0.45 * Math.abs(Math.sin((t - s.from) * 9));
  const f = Math.floor(t * 15);
  const under = <KlingShot t={t} s={src} until={s.to} />;
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Slices t={t} amt={k} n={12} seed={4} maxShift={220}>
        <AbsoluteFill style={{ filter: 'saturate(1.6) contrast(1.2)' }}>{under}</AbsoluteFill>
      </Slices>
      <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.55, transform: `translateX(${18 * k}px)`, filter: 'url(#red-only)' }}>{under}</AbsoluteFill>
      <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.55, transform: `translateX(${-18 * k}px)`, filter: 'url(#cyan-only)' }}>{under}</AbsoluteFill>
      {Array.from({ length: 14 }).map((_, i) => {
        const x = rand(f * 3.1 + i * 7.7) * 1000, y = rand(f * 5.3 + i * 2.9) * 1800;
        const w = 40 + rand(f + i * 1.7) * 220, h = 20 + rand(f * 2 + i) * 90;
        const col = ['#FF2E6E', '#2EF0FF', '#FFE14D', '#FFFFFF'][i % 4];
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: col, opacity: rand(f * 9 + i) > 0.5 ? 0.85 : 0, mixBlendMode: 'difference' }} />;
      })}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: VF.cond, fontSize: 210, letterSpacing: 6, color: '#fff', textShadow: '8px 0 #FF2E6E, -8px 0 #2EF0FF', transform: `translateX(${(rand(f * 4.4) - 0.5) * 60}px) skewX(${(rand(f * 6.6) - 0.5) * 30}deg)`, opacity: f % 3 === 0 ? 0.2 : 1, marginTop: -260 }}>SCRAMBLED</div>
      </AbsoluteFill>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id="red-only"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id="cyan-only"><feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" /></filter>
      </svg>
    </AbsoluteFill>
  );
};

// ───────────────────────── "Playlist 'te tera channel" ─────────────────────────

const TRACKS = ['Midnight Drive', 'Neon Love', 'Late Night Calls', 'Summer 99', 'TOO HOT TO HANDLE'];

const PhoneShot: React.FC<{ t: number; s: Shot }> = ({ t, s }) => {
  const enter = pop(t, s.from, 0.35, 1.4);
  const jump = ease(t, 84.1, 0.45); // the song jumps to #1 on "Playlist"
  const playing = t >= 85.0;
  const kick = Math.exp(-since(t, BEAT_TIMES) * 8);
  const order = [4, 0, 1, 2, 3]; // after the jump
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 60% at 50% 45%, #5A1A10, #120608 75%)`, overflow: 'hidden' }}>
      {Array.from({ length: 40 }).map((_, i) => {
        const y = (1 - ((t * (0.15 + rand(i) * 0.25) + rand(i * 3)) % 1)) * 2000 - 40;
        return <div key={i} style={{ position: 'absolute', left: rand(i * 7) * 1080, top: y, width: 6, height: 6, borderRadius: 3, background: C.gold, opacity: 0.5, boxShadow: `0 0 12px ${C.fire}` }} />;
      })}
      <div style={{ position: 'absolute', left: 150, top: 150, width: 780, height: 1500, borderRadius: 90, background: '#0B0A10', border: '14px solid #22202A', boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 ${60 + 60 * kick}px rgba(255,90,20,0.35)`, overflow: 'hidden', transform: `translateY(${(1 - enter) * 500}px) rotate(${lerp(-12, -4, enter)}deg)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '34px 54px 0', fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: '#fff' }}>
          <span>11:58</span><span>{t >= 85.3 ? '🔥 99%' : '▮▮▮ 61%'}</span>
        </div>
        <div style={{ margin: '40px 46px 0', display: 'flex', gap: 30, alignItems: 'center' }}>
          <div style={{ width: 210, height: 210, borderRadius: 18, background: `linear-gradient(135deg, ${C.gold}, ${C.fire} 55%, ${C.red})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 110 }}>🔥</div>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: '#A8A2B4' }}>PLAYLIST</div>
            <div style={{ fontFamily: F.sans, fontSize: 56, fontWeight: 800, color: '#fff', lineHeight: 1.05 }}>On Repeat</div>
            <div style={{ fontFamily: F.sans, fontSize: 26, color: '#A8A2B4', marginTop: 6 }}>5 songs · 11:58 PM</div>
          </div>
        </div>
        <div style={{ position: 'relative', margin: '50px 30px 0', height: 5 * 150 }}>
          {TRACKS.map((name, i) => {
            const before = i, after = order.indexOf(i);
            const y = lerp(before, after, jump) * 150 - (i === 4 ? Math.sin(jump * Math.PI) * 60 : 0);
            const hot = i === 4;
            return (
              <div key={name} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 130, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px', background: hot ? `linear-gradient(90deg, rgba(255,77,26,${0.25 + 0.3 * jump}), rgba(255,46,110,0.15))` : 'transparent', boxShadow: hot && jump > 0 ? `0 0 ${40 * jump}px rgba(255,90,20,0.6)` : 'none', zIndex: hot ? 2 : 1, transform: hot ? `scale(${1 + 0.05 * Math.sin(jump * Math.PI)})` : undefined }}>
                <div style={{ width: 40, fontFamily: F.sans, fontSize: 30, fontWeight: 700, color: hot ? C.gold : '#7D778A', textAlign: 'center' }}>{Math.round(lerp(before, after, jump)) + 1}</div>
                <div style={{ width: 90, height: 90, borderRadius: 10, background: hot ? `linear-gradient(135deg, ${C.gold}, ${C.red})` : ['#36305A', '#5A3048', '#2F4A5A', '#4A4A30'][i] }} />
                <div style={{ flex: 1, fontFamily: hot ? VF.cond : F.sans, fontSize: hot ? 44 : 36, fontWeight: hot ? 400 : 600, color: hot ? '#fff' : '#D8D2E2', letterSpacing: hot ? 1 : 0 }}>{name}</div>
                {hot && playing && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 50 }}>
                    {[0, 1, 2, 3].map((b) => <div key={b} style={{ width: 9, height: 12 + 38 * Math.abs(Math.sin(t * (9 + b * 2.3) + b)), background: C.gold, borderRadius: 4 }} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 30, right: 30, bottom: 50, height: 170, borderRadius: 28, background: '#1A1722', display: 'flex', alignItems: 'center', gap: 26, padding: '0 30px', opacity: ease(t, 85.0, 0.25), transform: `translateY(${(1 - ease(t, 85.0, 0.25)) * 80}px)` }}>
          <div style={{ width: 110, height: 110, borderRadius: 14, background: `linear-gradient(135deg, ${C.gold}, ${C.red})` }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: VF.cond, fontSize: 40, color: '#fff' }}>TOO HOT TO HANDLE</div>
            <div style={{ fontFamily: F.sans, fontSize: 26, color: '#A8A2B4' }}>now playing · on repeat</div>
          </div>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: C.fire, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, color: '#fff', transform: `scale(${1 + 0.12 * kick})`, boxShadow: `0 0 ${30 * kick}px ${C.fire}` }}>❚❚</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── "oops! it's a scandal!" ─────────────────────────

const FrontPage: React.FC<{ t: number }> = ({ t }) => {
  const p = pop(t, SCANDAL, 0.42, 1.3);
  if (p <= 0) return null;
  const spin = lerp(540, -5, Math.min(1, p));
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 860, height: 1120, marginTop: -160, background: '#F2EADB', boxShadow: '0 40px 120px rgba(0,0,0,0.65)', transform: `rotate(${spin}deg) scale(${lerp(0.15, 1, Math.min(1, p))})`, padding: '34px 42px', fontFamily: F.sans, color: '#16110E' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #16110E', paddingBottom: 8, fontFamily: VF.hud, fontSize: 22, fontWeight: 700 }}>
          <span>11:58 PM EDITION</span><span>PRICE: ONE HEART</span>
        </div>
        <div style={{ fontFamily: VF.serif, fontStyle: 'italic', fontWeight: 900, fontSize: 84, textAlign: 'center', margin: '10px 0 4px' }}>The Daily Garmi</div>
        <div style={{ borderTop: '2px solid #16110E', borderBottom: '2px solid #16110E', height: 10 }} />
        <div style={{ fontFamily: VF.cond, fontSize: 250, lineHeight: 0.95, textAlign: 'center', color: '#C8101C', marginTop: 18 }}>SCANDAL!</div>
        <div style={{ fontFamily: VF.cond, fontSize: 52, textAlign: 'center', letterSpacing: 1, marginTop: 6 }}>HEART WENT POP AT ROOFTOP PARTY</div>
        <div style={{ display: 'flex', gap: 26, marginTop: 26 }}>
          <div style={{ width: 400, height: 420, background: '#2A2420', overflow: 'hidden', position: 'relative' }}>
            <Img src={staticFile('shorts/that-man.png')} style={{ position: 'absolute', left: -60, top: -10, width: 520, height: 520, filter: 'grayscale(1) contrast(1.4)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(0,0,0,0.35) 1.2px, transparent 1.6px) 0 0 / 7px 7px' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6 }}>
            <div style={{ fontFamily: VF.cond, fontSize: 36, lineHeight: 1.05 }}>"WHO'S THAT MAN?" CITY ASKS</div>
            {Array.from({ length: 11 }).map((_, i) => <div key={i} style={{ height: 12, background: '#8E8578', width: `${i % 4 === 3 ? 62 : 100}%`, borderRadius: 2 }} />)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── lyrics ─────────────────────────

const Lyrics: React.FC<{ t: number }> = ({ t }) => {
  const l = lineAt(t);
  if (!l) return null;
  const inP = ease(t, l.from, 0.18);
  const out = clamp((l.to - t) / 0.12);
  const op = Math.min(inP, out);
  const word = (w: { w: string; t: number }, i: number, big: boolean) => {
    const on = t >= w.t - 0.03;
    const k = pop(t, w.t - 0.03, 0.18, 2.4);
    const sung = on && (i === l.words.length - 1 || t < l.words[i + 1].t);
    const style: React.CSSProperties = big
      ? { display: 'inline-block', marginRight: 22, opacity: on ? 1 : 0.18, transform: `scale(${on ? lerp(1.35, 1, Math.min(1, k)) : 1})`, backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: on ? 'drop-shadow(0 6px 0 #4A0A06) drop-shadow(0 0 24px rgba(255,90,20,0.6))' : undefined }
      : { display: 'inline-block', marginRight: 16, opacity: on ? 1 : 0.3, color: sung ? C.gold : '#fff', transform: `translateY(${on ? (1 - Math.min(1, k)) * 14 : 0}px) scale(${sung ? 1.06 : 1})` };
    const text = w.w.replace(/[,.]$/, '');
    return <span key={i} style={style}>{big ? text.toUpperCase() : text}</span>;
  };
  if (l.big) {
    // "Ni I'm" small, then TOO HOT TO HANDLE as the title, word by word
    const lead = l.words.slice(0, 2), title = l.words.slice(2);
    return (
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1190, textAlign: 'center', opacity: op }}>
        <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 60, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.8)' }}>{lead.map((w, i) => word(w, i, false))}</div>
        <div style={{ fontFamily: VF.cond, fontSize: 150, lineHeight: 1.02, letterSpacing: 2 }}>{title.map((w, i) => word(w, i + 2, true))}</div>
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 38, color: '#FFD27A', marginTop: 10, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>{l.en}</div>
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: 1240, textAlign: 'center', opacity: op }}>
      <div style={{ display: 'inline-block', padding: '18px 30px 20px', borderRadius: 26, background: 'rgba(10,6,12,0.55)', backdropFilter: 'blur(6px)' }}>
        <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 64, lineHeight: 1.15, textShadow: '0 4px 16px rgba(0,0,0,0.7)' }}>{l.words.map((w, i) => word(w, i, false))}</div>
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 36, color: '#FFD27A', marginTop: 8 }}>{l.en}</div>
      </div>
    </div>
  );
};

// ───────────────────────── end card ─────────────────────────

const EndCard: React.FC<{ t: number }> = ({ t }) => {
  // the front page holds over the echo, then the card
  const p = ease(t, 93.0, 0.4);
  if (p <= 0) return null;
  return (
    <AbsoluteFill style={{ background: '#000', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: Math.min(1, p * 3) }}>
      <div style={{ transform: `translateY(${(1 - p) * 30}px) scale(${lerp(0.94, 1, easeOutBack(p, 1.6))})` }}>
        <div style={{ fontFamily: F.display, fontSize: 112, letterSpacing: 6, lineHeight: 1, backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', display: 'inline-block' }}>TOO HOT TO HANDLE</div>
        <div style={{ fontFamily: F.sans, fontSize: 42, color: '#B7B3C0', marginTop: 18 }}>full song on the channel</div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── the reel ─────────────────────────

const Picture: React.FC<{ t: number }> = ({ t }) => {
  const s = shotAt(t);
  if (s.kind === 'kling') return <KlingShot t={t} s={s} />;
  if (s.kind === 'glitch') return <Scramble t={t} s={s} />;
  if (s.kind === 'phone') return <PhoneShot t={t} s={s} />;
  return <AbsoluteFill style={{ background: '#000' }} />;
};

const CUTS = SHOTS.slice(1, -1).map((s) => s.from);

export const KlingReel: React.FC = () => {
  const frame = useCurrentFrame();
  const ready = useFontsReady();
  const t = START + frame / FPS;
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const kick = t < 92.1 ? Math.exp(-since(t, DOWNBEATS) * 7) : 0;
  const cut = Math.exp(-since(t, CUTS) * 10);
  const heat = clamp((t - START) / (92.1 - START));
  const shake = t >= 90.1 && t < 90.7 ? 22 * Math.exp(-(t - 90.1) * 8) : 0; // the heart pops
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${1.02 + 0.025 * kick}) translate(${shake * Math.sin(t * 70)}px, ${shake * Math.cos(t * 55)}px)` }}>
        <Picture t={t} />
      </AbsoluteFill>
      {/* one grade over every shot: warmer as the chorus goes on, a vignette, a little grain-like flicker */}
      <AbsoluteFill style={{ background: `rgba(255,96,24,${0.06 + 0.1 * heat})`, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />
      <FrontPage t={t} />
      <Lyrics t={t} />
      <EndCard t={t} />
      <AbsoluteFill style={{ background: '#fff', opacity: 0.28 * cut + (t >= 90.1 && t < 91 ? 0.6 * Math.exp(-(t - 90.1) * 7) : 0), pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: clamp((t - (END - 0.35)) / 0.3), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
