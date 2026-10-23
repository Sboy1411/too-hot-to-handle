import React from 'react';
import { Img, staticFile } from 'remotion';
import { fitOne } from '../garmi/fonts';
import { FONT, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, noise1, rand, seg } from '../garmi/timeline';
import { Avatar } from './chat';
import { C, M, useTL } from './timeline';

const FIRE = 'linear-gradient(180deg, #FFF4D6 0%, #FFE2A0 22%, #FFB547 45%, #FF4D1A 72%, #D7141E 100%)';
const hit = (t: number, at: number, dur = 0.22) => (t >= at ? clamp(1 - (t - at) / dur) : 0);
const after = (t: number, at: number, dur: number) => clamp((t - at) / dur);

// ───────────────────────── lock screen (open + end card) ─────────────────────────
const Bokeh: React.FC<{ t: number; warm?: boolean }> = ({ t, warm }) => (
  <>
    {Array.from({ length: 14 }, (_, k) => {
      const cols = warm ? ['#ff4d1a', '#ffb547', '#d7141e'] : ['#ff4fa3', '#4fb4ff', '#9b6bff', '#ff9a3d'];
      const x = rand(k * 3.1) * 1080 + Math.sin(t * 0.4 + k) * 30;
      const y = rand(k * 5.7) * 1500 + Math.cos(t * 0.3 + k) * 30;
      const s = 120 + rand(k * 1.3) * 220;
      return <div key={k} style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', background: cols[k % cols.length], opacity: 0.16 + rand(k) * 0.14, filter: 'blur(30px)' }} />;
    })}
  </>
);

const AppIcon: React.FC<{ d?: number; fire?: boolean }> = ({ d = 66, fire }) => (
  <div style={{ width: d, height: d, borderRadius: d * 0.24, background: fire ? 'linear-gradient(160deg, #FFB547, #FF4D1A 55%, #D7141E)' : 'linear-gradient(160deg, #ff8a3d, #ff4d1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontSize: d * 0.5 }}>
    {fire ? '🔥' : (
      <svg width={d * 0.6} height={d * 0.6} viewBox="0 0 40 40"><path d="M8 6 H32 C35 6 37 8 37 11 V25 C37 28 35 30 32 30 H17 L9 37 V30 H8 C5 30 3 28 3 25 V11 C3 8 5 6 8 6 Z" fill="#fff" /></svg>
    )}
  </div>
);

const Notif: React.FC<{ title: string; body: string; when?: string; fire?: boolean; avatar?: keyof typeof M; w?: number }> = ({ title, body, when = 'now', fire, avatar, w = 1000 }) => (
  <div style={{ width: w, borderRadius: 40, background: 'rgba(38,38,48,0.86)', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', padding: '26px 30px', display: 'flex', gap: 22, alignItems: 'center' }}>
    {avatar ? <Avatar m={M[avatar]} d={70} id={`n-${title}-${body}`} /> : <AppIcon fire={fire} />}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.inter, fontWeight: 600, fontSize: 32, color: '#fff' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        <span style={{ fontWeight: 400, fontSize: 26, color: '#a9adba', marginLeft: 12 }}>{when}</span>
      </div>
      <div style={{ fontFamily: FONT.inter, fontWeight: 400, fontSize: 34, color: '#e8e9ee', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{body}</div>
    </div>
  </div>
);

export const LockScreen: React.FC<{ t: number }> = ({ t }) => {
  const { STORY } = useTL();
  const n1 = easeOutBack(seg(t, STORY.notif1, STORY.notif1 + 0.3), 1.3);
  const n2 = easeOutBack(seg(t, STORY.notif2, STORY.notif2 + 0.3), 1.3);
  const tap = t >= STORY.tap ? clamp((t - STORY.tap) / 0.3) : 0;
  const open = easeInCubic(seg(t, STORY.open, STORY.chat));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 1 - open, transform: `scale(${1 + open * 0.12})` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #160b2a 0%, #0b0a1c 50%, #05050c 100%)' }} />
      <Bokeh t={t} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', fontFamily: FONT.inter, fontWeight: 600, fontSize: 38, color: '#e8e6f2' }}>Thursday, 22 October</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 280, textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 300, fontStretch: '90%', fontSize: 250, lineHeight: 1, color: '#f4f2fb', letterSpacing: '-0.02em' }}>11:57</div>
      <div style={{ position: 'absolute', left: 40, top: 640 }}>
        <div style={{ transform: `translateY(${(1 - n2) * -60}px)`, opacity: clamp(n2 * 2), position: 'absolute', left: 0, top: 0 }}>
          <Notif title="SECTOR 17 PARTY 🎉" body="Aman: dj playing the same song since 9 😴" />
        </div>
        <div style={{ transform: `translateY(${(1 - n1) * -80 + n2 * 190}px) scale(${1 - n2 * 0.03})`, opacity: clamp(n1 * 2), position: 'absolute', left: 0, top: 0 }}>
          <Notif title="SECTOR 17 PARTY 🎉" body="Riya: this party is DEAD 💀" when={n2 > 0.5 ? '1m' : 'now'} />
        </div>
      </div>
      {tap > 0 && <div style={{ position: 'absolute', left: 520 - 70 * (1 + tap), top: 720 - 70 * (1 + tap), width: 140 * (1 + tap), height: 140 * (1 + tap), borderRadius: '50%', background: 'rgba(255,255,255,0.35)', opacity: 1 - tap }} />}
      {t >= STORY.tap && t < STORY.tap + 0.28 && <div style={{ position: 'absolute', left: 490, top: 670, width: 100, height: 100, borderRadius: 50, background: 'rgba(255,255,255,0.55)' }} />}
      {[150, 930].map((x) => (
        <div key={x} style={{ position: 'absolute', left: x - 50, top: 1690, width: 100, height: 100, borderRadius: 50, background: 'rgba(255,255,255,0.12)' }} />
      ))}
      <div style={{ position: 'absolute', left: 390, top: 1860, width: 300, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.7)' }} />
    </div>
  );
};

/** End card: the phone wakes on a lock screen with the title, and OUT NOW at the bottom. */
export const EndLock: React.FC<{ t: number; from: number }> = ({ t, from }) => {
  const { DUR, OUT_NOW, endFade, cut } = useTL();
  // the short cuts land everything at once and loop straight back to the start
  const k = cut === 'full' ? 1 : 0.3;
  const wake = cut === 'full' ? easeOutCubic(seg(t, from, from + 0.35)) : 1;
  const n = easeOutBack(seg(t, from + 0.35 * k, from + 0.65 * k), 1.3);
  const title = easeOutCubic(seg(t, from + 0.55 * k, from + 1.0 * k));
  const fade = endFade ? 1 - seg(t, DUR - 0.3, DUR) : 1;
  const s1 = fitOne('TOO HOT', FONT.anton, 400, 760, 240);
  const s2 = fitOne('TO HANDLE', FONT.anton, 400, 760, 240);
  const out = t >= OUT_NOW ? easeOutBack(after(t, OUT_NOW, 0.28), 1.8) : 0;
  const outFlash = hit(t, OUT_NOW, 0.25);
  const l1 = easeOutCubic(after(t, OUT_NOW + 0.3 * k, 0.3));
  const l2 = easeOutCubic(after(t, OUT_NOW + 0.55 * k, 0.3));
  const glow = 0.5 + 0.5 * Math.sin((t - OUT_NOW) * 5);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: wake * fade }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1c0804 0%, #0d0403 55%, #050101 100%)' }} />
        <Bokeh t={t} warm />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', fontFamily: FONT.inter, fontWeight: 600, fontSize: 38, color: '#f1dcd2' }}>Thursday, 22 October</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 280, textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 300, fontStretch: '90%', fontSize: 250, lineHeight: 1, color: '#fff3ea', letterSpacing: '-0.02em' }}>11:59</div>
        <div style={{ position: 'absolute', left: 40, top: 600, transform: `translateY(${(1 - n) * -70}px)`, opacity: clamp(n * 2) }}>
          <Notif title="TOO HOT TO HANDLE 🔥" body="OUT NOW · full song on the channel" fire />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: title, transform: `scale(${lerp(1.08, 1, title)})`, filter: `blur(${(1 - title) * 10}px) drop-shadow(0 0 34px rgba(255,90,30,0.55))` }}>
          {[['TOO HOT', s1], ['TO HANDLE', s2]].map(([txt, s]) => (
            <div key={txt as string} style={{ fontFamily: FONT.anton, fontSize: s as number, lineHeight: 1, background: FIRE, WebkitBackgroundClip: 'text', color: 'transparent', whiteSpace: 'nowrap' }}>{txt}</div>
          ))}
        </div>
        {/* OUT NOW */}
        {out > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1318, display: 'flex', justifyContent: 'center' }}>
            <div style={{ transform: `scale(${out})`, padding: '4px 56px 0', borderRadius: 26, background: 'linear-gradient(90deg, #FFB547, #FF4D1A 55%, #D7141E)', boxShadow: `0 0 ${30 + glow * 40}px rgba(255,90,30,${0.55 + glow * 0.3}), 0 14px 30px rgba(0,0,0,0.5)`, fontFamily: FONT.anton, fontSize: 124, lineHeight: '140px', color: '#fff', letterSpacing: '0.04em', textShadow: '0 4px 0 rgba(110,10,0,0.45)', whiteSpace: 'nowrap' }}>
              OUT NOW
            </div>
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1488, textAlign: 'center', fontFamily: FONT.inter, fontWeight: 600, fontSize: 42, color: '#ffe3d2', opacity: l1, transform: `translateY(${(1 - l1) * 20}px)` }}>
          🎧 streaming on all platforms
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1552, textAlign: 'center', fontFamily: FONT.inter, fontWeight: 600, fontSize: 38, color: C.gold, opacity: l2, transform: `translateY(${(1 - l2) * 20}px)` }}>
          link in bio 🔗
        </div>
        <div style={{ position: 'absolute', inset: 0, background: '#ffb27a', opacity: outFlash * 0.35, mixBlendMode: 'screen' }} />
        <div style={{ position: 'absolute', left: 390, top: 1860, width: 300, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.7)' }} />
      </div>
    </div>
  );
};

// ───────────────────────── "Phone vich mera naam bold letters" ─────────────────────────
export const NameBanner: React.FC<{ t: number }> = ({ t }) => {
  const { V } = useTL();
  const a = V(56.62), out = easeInCubic(seg(t, V(58.55), V(58.75)));
  const drop = easeOutBack(seg(t, a, a + 0.3), 1.2);
  const bold = V(57.8), letters = V(58.0);
  const name = 'THAT MAN';
  const reveal = (i: number) => lerp(V(56.9), V(57.45), i / (name.length - 1));
  const w = t < bold ? 200 : lerp(200, 900, easeOutCubic(after(t, bold, 0.08)));
  const punch = hit(t, bold, 0.3);
  const fs = fitOne(name, 'Archivo', 900, 740, 190);
  return (
    <div style={{ position: 'absolute', left: 32, top: 132, width: 1016, height: 470, transform: `translateY(${(1 - drop) * -520 - out * 620}px)` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 44, background: 'rgb(30,22,22)', border: `3px solid rgba(255,90,40,${0.4 + punch * 0.6})`, boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 ${30 + punch * 60}px rgba(255,77,26,0.5)` }} />
      <div style={{ position: 'absolute', left: 34, top: 30, display: 'flex', alignItems: 'center', gap: 20 }}>
        <Avatar m={M.man} d={90} id="banner-av" ring={C.fire} />
        <div>
          <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 30, color: '#ffb38a' }}>TOO HOT TO HANDLE 🔥 · now</div>
          <div style={{ fontFamily: FONT.inter, fontWeight: 400, fontSize: 28, color: '#c9ccd6' }}>new member joined the group</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, height: 240, display: 'flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'pre' }}>
        {Array.from(name).map((ch, i) => {
          const on = after(t, reveal(i), 0.08);
          const wave = t >= letters ? Math.sin(clamp((t - letters - i * 0.04) / 0.35) * Math.PI) * 26 : 0;
          return (
            <span key={i} style={{ display: 'inline-block', fontFamily: FONT.archivo, fontWeight: w, fontStretch: '100%', fontSize: fs * (1 + punch * 0.06), lineHeight: 1, color: '#fff', opacity: on, transform: `translateY(${(1 - on) * 30 - wave}px)`, textShadow: w > 600 ? '0 0 30px rgba(255,90,30,0.6)' : 'none' }}>{ch}</span>
          );
        })}
        <span style={{ fontSize: fs * 0.62, marginLeft: 18, opacity: after(t, bold, 0.1), transform: `scale(${t >= bold ? lerp(2, 1, easeOutBack(after(t, bold, 0.25))) : 0})`, display: 'inline-block' }}>🔥</span>
      </div>
    </div>
  );
};

// ───────────────────────── "Main classy, never off-center" ─────────────────────────
export const ProfileViewer: React.FC<{ t: number }> = ({ t }) => {
  const { V } = useTL();
  const a = V(58.72);
  const enter = easeOutCubic(seg(t, a, a + 0.22));
  const off = V(59.5);
  const nudge = t < off ? 0 : t < off + 0.1 ? easeOutCubic(after(t, off, 0.1)) : 1 - easeOutBack(after(t, off + 0.16, 0.16), 2);
  const snapped = t >= off + 0.24;
  const guide = snapped ? '#3cf08a' : nudge > 0.05 ? '#ff3b6b' : '#ff3bd5';
  const sz = 940;
  const x0 = 70, y0 = 330;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: enter }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 108, height: 150, display: 'flex', alignItems: 'center', gap: 20, paddingLeft: 40 }}>
        <svg width="40" height="56" viewBox="0 0 40 56" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"><path d="M30 8 L10 28 L30 48" /></svg>
        <div>
          <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 40, color: '#fff' }}>THAT MAN 🔥</div>
          <div style={{ fontFamily: FONT.inter, fontWeight: 400, fontSize: 26, color: C.dim }}>profile photo</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: x0, top: y0, width: sz, height: sz, overflow: 'hidden', transform: `scale(${lerp(0.9, 1, enter)})` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, #ffd08a 0%, #ff8a2a 25%, #ff4d1a 45%, #8f1a08 80%, #2a0603 100%)' }} />
        <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: sz / 2 - 0.52 * 1100 + nudge * 80, top: 40, width: 1100, height: 1100 }} />
      </div>
      {/* design guides: he stays dead centre */}
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
        <line x1={540} x2={540} y1={y0 - 20} y2={y0 + sz + 20} stroke={guide} strokeWidth={4} strokeDasharray={snapped ? '0' : '14 10'} />
        <line x1={x0 - 20} x2={x0 + sz + 20} y1={y0 + sz / 2} y2={y0 + sz / 2} stroke={guide} strokeWidth={4} strokeDasharray={snapped ? '0' : '14 10'} />
        <rect x={540 - 220 + nudge * 80} y={y0 + 40} width={440} height={520} fill="none" stroke={guide} strokeWidth={3} />
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => <rect key={`${i}${j}`} x={540 - 220 + nudge * 80 + i * 440 - 9} y={y0 + 40 + j * 520 - 9} width={18} height={18} fill="#fff" stroke={guide} strokeWidth={3} />)}
      </svg>
      <div style={{ position: 'absolute', left: 540, top: y0 + sz - 92, transform: 'translateX(-50%)', padding: '10px 26px', borderRadius: 30, background: guide, color: '#000', fontFamily: FONT.inter, fontWeight: 600, fontSize: 32, whiteSpace: 'nowrap' }}>
        {snapped ? '✓ centered' : nudge > 0.05 ? 'off-center?' : 'center'}
      </div>
    </div>
  );
};

// ───────────────────────── "…jiven vinyl jaan wool" ─────────────────────────
export const Vinyl: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const { V } = useTL();
  const a = V(61.75), b = V(63.27);
  const p = easeOutBack(seg(t, a, a + 0.35), 1.2) * (1 - easeInCubic(seg(t, b - 0.18, b)));
  const D = 760;
  const smooth = after(t, V(62.7), 0.3);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: clamp(p * 1.5) }} />
      <div style={{ position: 'absolute', left: 540 - D / 2, top: 760 - D / 2, width: D, height: D, transform: `scale(${p}) rotate(${t * 220}deg)` }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'repeating-radial-gradient(circle, #111 0px, #111 3px, #1d1d22 4px, #111 6px)', boxShadow: `0 0 ${40 + pulse * 40}px rgba(255,90,30,0.55)` }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 20deg, transparent 0deg, rgba(255,255,255,0.22) 30deg, transparent 60deg, transparent 180deg, rgba(255,255,255,0.16) 210deg, transparent 240deg)' }} />
        <div style={{ position: 'absolute', left: D / 2 - 140, top: D / 2 - 140, width: 280, height: 280, borderRadius: '50%', overflow: 'hidden', border: '6px solid #111' }}>
          <Avatar m={M.man} d={268} id="vinyl-label" />
        </div>
        <div style={{ position: 'absolute', left: D / 2 - 12, top: D / 2 - 12, width: 24, height: 24, borderRadius: 12, background: '#000' }} />
      </div>
      {/* the smooth wave ring */}
      <svg width="1080" height="1600" style={{ position: 'absolute', left: 0, top: 0, opacity: p }}>
        <path d={Array.from({ length: 181 }, (_, k) => {
          const ang = (k / 180) * Math.PI * 2;
          const r = D / 2 + 46 + (1 - smooth) * 18 * Math.sin(ang * 14 + t * 8) + smooth * 10 * Math.sin(ang * 4 - t * 3);
          return `${k ? 'L' : 'M'}${540 + Math.cos(ang) * r * p} ${760 + Math.sin(ang) * r * p}`;
        }).join(' ')} fill="none" stroke="#ff8a3d" strokeWidth={5} opacity={0.85} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1196, textAlign: 'center', fontFamily: FONT.inter, fontWeight: 600, fontSize: 34, color: '#ffb38a', opacity: p }}>🎙️ THAT MAN 🔥 · voice message · 0:07</div>
    </div>
  );
};

// ───────────────────────── "Style mera final, kise chahidi na trial" ─────────────────────────
export const AlertFinal: React.FC<{ t: number }> = ({ t }) => {
  const { V } = useTL();
  const a = V(63.27), b = V(66.3);
  const p = easeOutBack(seg(t, a, a + 0.25), 1.5);
  const out = seg(t, b - 0.08, b);
  const stamp = t >= V(63.9) ? easeInCubic(after(t, V(63.9), 0.12)) : 0;
  const strike = after(t, V(65.9), 0.18);
  const shk = hit(t, V(65.9), 0.3) * Math.sin(t * 90) * 12;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)', opacity: clamp(p) }} />
      <div style={{ position: 'absolute', left: 150, top: 470, width: 780, transform: `scale(${lerp(0.7, 1, p)})`, opacity: clamp(p * 2), borderRadius: 44, background: 'rgba(40,41,50,0.98)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', overflow: 'visible' }}>
        <div style={{ padding: '46px 50px 34px', textAlign: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, margin: '0 auto 26px', background: 'linear-gradient(160deg, #FFB547, #FF4D1A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 70, color: '#fff', fontFamily: FONT.inter, fontWeight: 600 }}>✓</div>
          <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 50, color: '#fff' }}>Style updated</div>
          <div style={{ fontFamily: FONT.inter, fontWeight: 400, fontSize: 34, color: '#b9bdc8', marginTop: 14, lineHeight: 1.35 }}>This style is final.<br />No free trial needed.</div>
        </div>
        <div style={{ display: 'flex', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ flex: 1, position: 'relative', padding: '30px 0', textAlign: 'center', fontFamily: FONT.inter, fontWeight: 400, fontSize: 36, color: strike > 0 ? '#6c7080' : '#7fb0ff', borderRight: '2px solid rgba(255,255,255,0.1)', transform: `translateX(${shk}px)` }}>
            Start free trial
            <div style={{ position: 'absolute', left: 40, top: '50%', height: 6, width: 310 * strike, background: '#ff3b30', borderRadius: 3, transform: 'rotate(-4deg)' }} />
          </div>
          <div style={{ flex: 1, padding: '30px 0', textAlign: 'center', fontFamily: FONT.inter, fontWeight: 600, fontSize: 36, color: '#ff8a3d' }}>OK</div>
        </div>
        {stamp > 0 && (
          <div style={{ position: 'absolute', right: -40, top: 30, transform: `rotate(14deg) scale(${lerp(2.4, 1, stamp)})`, opacity: clamp(stamp * 3), border: `8px solid ${C.fire}`, borderRadius: 10, padding: '4px 24px', fontFamily: FONT.anton, fontSize: 96, lineHeight: 1.1, color: C.fire, background: 'rgba(255,244,230,0.95)', WebkitMaskImage: `url(${staticFile('garmi/grunge.png')})`, WebkitMaskSize: '100% 100%' }}>FINAL</div>
        )}
      </div>
    </div>
  );
};

// ───────────────────────── hooks: big fire type ─────────────────────────
type Word = { w: string; at: number };
const BigType: React.FC<{ t: number; small: Word[]; big: Word[][]; top: number; size?: number }> = ({ t, small, big, top, size = 250 }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ display: 'flex', gap: 22, marginBottom: 6 }}>
      {small.map((x) => {
        const on = after(t, x.at, 0.1);
        return <span key={x.w} style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 54, color: '#fff', opacity: on, transform: `translateY(${(1 - on) * 20}px)`, display: 'inline-block' }}>{x.w}</span>;
      })}
    </div>
    {big.map((row, r) => (
      <div key={r} style={{ display: 'flex', gap: 30, height: size * 1.02 }}>
        {row.map((x) => {
          const on = t >= x.at;
          const s = on ? lerp(1.7, 1, easeOutCubic(after(t, x.at, 0.14))) : 0;
          return (
            <span key={x.w} style={{ display: 'inline-block', fontFamily: FONT.anton, fontSize: size, lineHeight: 1, background: FIRE, WebkitBackgroundClip: 'text', color: 'transparent', opacity: on ? 1 : 0, transform: `scale(${s})`, filter: `drop-shadow(0 0 ${on ? 26 + hit(t, x.at, 0.3) * 40 : 0}px rgba(255,90,30,0.75))` }}>{x.w}</span>
          );
        })}
      </div>
    ))}
  </div>
);

// ───────────────────────── "Ni I'm too hot to handle" (1): overheat ─────────────────────────
export const Overheat: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const { V } = useTL();
  const a = V(66.3);
  const flash = hit(t, a, 0.18);
  const words: Word[] = [{ w: 'Ni', at: V(66.4) }, { w: "I'm", at: V(66.6) }];
  const big: Word[][] = [[{ w: 'TOO', at: V(66.8) }, { w: 'HOT', at: V(66.9) }], [{ w: 'TO', at: V(67.3) }, { w: 'HANDLE', at: V(67.6) }]];
  const k = Math.floor(t * 30);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 42%, rgba(${150 + pulse * 60},20,6,1) 0%, #3a0503 45%, #0a0000 100%)` }} />
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: ((i * 210 + t * 160) % 2100) - 180, height: 90, background: 'linear-gradient(180deg, transparent, rgba(255,120,40,0.08), transparent)' }} />
      ))}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 220, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="190" height="190" viewBox="0 0 190 190">
          <circle cx="95" cy="95" r="88" fill="none" stroke="#ff4d1a" strokeWidth="8" opacity={0.6 + 0.4 * Math.sin(t * 12)} />
          <rect x="80" y="30" width="30" height="92" rx="15" fill="none" stroke="#fff" strokeWidth="7" />
          <circle cx="95" cy="138" r="24" fill="#ff3b1a" />
          <rect x="89" y="50" width="12" height="82" rx="6" fill="#ff3b1a" />
        </svg>
        <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 52, color: '#fff', marginTop: 18 }}>Temperature</div>
        <div style={{ fontFamily: FONT.inter, fontWeight: 400, fontSize: 34, color: '#ffc2ac', marginTop: 10, textAlign: 'center', lineHeight: 1.35 }}>This phone needs to cool down<br />before you can use it.</div>
      </div>
      <BigType t={t} small={words} big={big} top={720} size={250} />
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.85 }} />
      {k % 7 === 0 && <div style={{ position: 'absolute', left: 0, right: 0, top: rand(k) * 1500, height: 6, background: 'rgba(255,200,160,0.5)' }} />}
    </div>
  );
};

// ───────────────────────── "ho jaave na koi scandal" ─────────────────────────
export const NoScandal: React.FC<{ t: number }> = ({ t }) => {
  const { V } = useTL();
  const at = V(70.75);
  if (t < at) return null;
  const p = easeOutBack(after(t, at, 0.22), 2);
  const out = seg(t, V(72.2), V(72.45));
  return (
    <div style={{ position: 'absolute', left: 540, top: 860, transform: `translate(-50%, -50%) rotate(-8deg) scale(${p * (1 - out)})` }}>
      <div style={{ background: C.sub, color: '#111', border: '6px solid #111', borderRadius: 26, padding: '14px 40px', fontFamily: FONT.anton, fontSize: 120, lineHeight: 1.05, whiteSpace: 'nowrap', boxShadow: '0 14px 0 rgba(0,0,0,0.45)' }}>NO SCANDAL 🤐</div>
    </div>
  );
};

// ───────────────────────── "…candle, tu fire di ik angle" ─────────────────────────
export const Flames: React.FC<{ t: number; amt: number }> = ({ t, amt }) => {
  const flame = (k: number, x: number, h: number, w: number, sway: number) =>
    `M${x - w} 1330 C${x - w * 0.9} ${1330 - h * 0.45} ${x + sway - w * 0.5} ${1330 - h * 0.7} ${x + sway} ${1330 - h} C${x + sway + w * 0.5} ${1330 - h * 0.7} ${x + w * 0.9} ${1330 - h * 0.45} ${x + w} 1330 Z`;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1310, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg width="1080" height="1310" viewBox="0 0 1080 1310" style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', filter: 'blur(5px)' }}>
        <defs>
          <linearGradient id="flm" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff2a0a" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#ff7a1a" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flc" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff2c0" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ffd08a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 11 }, (_, k) => {
          const x = k * 104 + 20;
          const h = amt * (260 + 200 * (0.5 + 0.5 * noise1(t * 3 + k * 1.3, k)));
          const sway = noise1(t * 2.4 + k * 1.7, k + 5) * 46;
          return (
            <g key={k}>
              <path d={flame(k, x, h, 78, sway)} fill="url(#flm)" />
              <path d={flame(k, x, h * 0.55, 34, sway * 0.6)} fill="url(#flc)" />
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 380, background: 'linear-gradient(0deg, rgba(255,90,20,0.45), transparent)', opacity: amt }} />
    </div>
  );
};

export const AngleMark: React.FC<{ t: number; deg: number }> = ({ t, deg }) => {
  const { V } = useTL();
  const at = V(75.2);
  if (t < at || deg < 0.5) return null;
  const p = after(t, at, 0.25);
  return (
    <svg width="1080" height="1310" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity: p }}>
      <line x1={120} y1={1060} x2={980} y2={1060} stroke="#fff" strokeWidth={4} strokeDasharray="12 10" opacity={0.7} />
      <line x1={120} y1={1060} x2={120 + 860 * Math.cos((deg * Math.PI) / 180)} y2={1060 - 860 * Math.sin((deg * Math.PI) / 180)} stroke={C.gold} strokeWidth={5} />
      <path d={`M${120 + 300} 1060 A300 300 0 0 0 ${120 + 300 * Math.cos((deg * Math.PI) / 180)} ${1060 - 300 * Math.sin((deg * Math.PI) / 180)}`} fill="none" stroke={C.gold} strokeWidth={6} />
      <text x={450} y={1020} fontFamily="Archivo" fontWeight={900} fontSize={44} fill={C.gold}>∠ {Math.round(deg)}° FIRE ANGLE 🔥</text>
    </svg>
  );
};

// ───────────────────────── "Ni tu smile kare, main lose heart da panel" ─────────────────────────
const Tile: React.FC<{ x: number; y: number; w: number; h: number; on: boolean; children: React.ReactNode; r?: number; col?: string }> = ({ x, y, w, h, on, children, r = 50, col = '#ff8a3d' }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, background: on ? col : 'rgba(70,72,84,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{children}</div>
);
const Glyph: React.FC<{ k: string; c?: string }> = ({ k, c = '#fff' }) => (
  <svg width="70" height="70" viewBox="0 0 70 70" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    {k === 'plane' && <path d="M35 8 L35 62 M12 38 L35 26 L58 38 M24 58 L35 52 L46 58" />}
    {k === 'wifi' && <><path d="M10 28 C24 14 46 14 60 28" /><path d="M19 38 C28 30 42 30 51 38" /><circle cx="35" cy="50" r="4" fill={c} /></>}
    {k === 'bt' && <path d="M24 22 L46 46 L35 58 L35 12 L46 24 L24 48" />}
    {k === 'cell' && <>{[0, 1, 2, 3].map((i) => <path key={i} d={`M${16 + i * 12} 56 L${16 + i * 12} ${46 - i * 9}`} />)}</>}
    {k === 'moon' && <path d="M46 14 C30 16 22 32 28 46 C34 58 50 60 58 52 C44 52 36 40 40 28 C42 22 44 18 46 14 Z" />}
    {k === 'torch' && <path d="M24 10 H46 L42 26 V58 H28 V26 Z M35 36 V44" />}
    {k === 'lock' && <><rect x="18" y="32" width="34" height="26" rx="5" /><path d="M25 32 V24 C25 12 45 12 45 24 V32" /></>}
    {k === 'cam' && <><rect x="10" y="22" width="50" height="34" rx="7" /><circle cx="35" cy="39" r="9" /><path d="M26 22 L30 14 H40 L44 22" /></>}
    {k === 'sun' && <><circle cx="35" cy="35" r="10" />{Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <path key={i} d={`M${35 + Math.cos(a) * 18} ${35 + Math.sin(a) * 18} L${35 + Math.cos(a) * 26} ${35 + Math.sin(a) * 26}`} />; })}</>}
  </svg>
);

export const ControlPanel: React.FC<{ t: number }> = ({ t }) => {
  const { V } = useTL();
  const a = V(77.15), b = V(80.82);
  const down = easeOutCubic(seg(t, a, a + 0.28)) * (1 - easeInCubic(seg(t, b - 0.3, b)));
  const smile = V(77.6), lose = V(78.4), heart = V(78.6), panel = V(79.1);
  const chaos = t >= panel && t < panel + 0.9;
  const tog = (i: number, base: boolean) => (chaos ? rand(Math.floor(t * 14) * 7 + i * 13) > 0.5 : base);
  const level = t < lose ? 1 : lerp(1, 0.04, easeOutCubic(after(t, lose, 0.35))) + Math.sin(t * 40) * 0.03 * hit(t, lose, 0.6);
  const broken = t >= heart;
  const shk = chaos ? (rand(Math.floor(t * 30)) - 0.5) * 24 : 0;
  const toast = easeOutBack(seg(t, smile, smile + 0.25), 1.6) * (1 - seg(t, panel - 0.1, panel + 0.1));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,12,0.78)', opacity: down }} />
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - down) * -1400}px) translateX(${shk}px)` }}>
        <div style={{ position: 'absolute', left: 40, top: 210, width: 470, height: 470, borderRadius: 60, background: 'rgba(60,62,74,0.9)' }}>
          {[['plane', 0, 0, '#ff9a3d'], ['cell', 1, 0, C.green], ['wifi', 0, 1, '#3d8bff'], ['bt', 1, 1, '#3d8bff']].map(([k, i, j, col], n) => (
            <div key={k as string} style={{ position: 'absolute', left: 45 + (i as number) * 210, top: 45 + (j as number) * 210, width: 170, height: 170, borderRadius: 85, background: tog(n, n !== 0) ? (col as string) : 'rgba(110,112,124,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Glyph k={k as string} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 560, top: 210, width: 470, height: 470, borderRadius: 60, background: 'rgba(60,62,74,0.9)', padding: 40, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 120, height: 120, borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'radial-gradient(circle, #ffb547, #ff4d1a 60%, #8f1a08)' }}>
              <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: -50, top: -14, width: 220, height: 220 }} />
            </div>
            <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 30, color: '#fff', lineHeight: 1.25 }}>TOO HOT<br />TO HANDLE</div>
          </div>
          <div style={{ marginTop: 40, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.2)' }}><div style={{ width: '62%', height: '100%', borderRadius: 5, background: '#fff' }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 50, fontSize: 56, color: '#fff', fontFamily: FONT.inter }}>
            <span>⏮</span><span>⏸</span><span>⏭</span>
          </div>
        </div>
        {[['lock', 40, 720], ['moon', 290, 720], ['torch', 40, 970], ['cam', 290, 970]].map(([k, x, y], n) => (
          <Tile key={k as string} x={x as number} y={y as number} w={220} h={220} on={tog(n + 4, k === 'moon')} col={k === 'moon' ? '#7a5cff' : '#ff8a3d'}><Glyph k={k as string} /></Tile>
        ))}
        {/* brightness + HEART sliders */}
        <div style={{ position: 'absolute', left: 560, top: 720, width: 200, height: 470, borderRadius: 50, background: 'rgba(70,72,84,0.85)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(chaos ? rand(Math.floor(t * 14)) : 0.7) * 100}%`, background: '#fff' }} />
          <div style={{ position: 'absolute', left: 65, bottom: 30 }}><Glyph k="sun" c="#555" /></div>
        </div>
        <div style={{ position: 'absolute', left: 790, top: 720, width: 200, height: 470, borderRadius: 50, background: 'rgba(70,72,84,0.85)', overflow: 'hidden', boxShadow: broken ? 'none' : '0 0 40px rgba(255,60,90,0.6)' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${clamp(level) * 100}%`, background: 'linear-gradient(0deg, #ff2d55, #ff7a9a)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontSize: 74 }}>{broken ? '💔' : '❤️'}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 26, textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: '0.08em' }}>HEART</div>
        </div>
      </div>
      {toast > 0 && (
        <div style={{ position: 'absolute', left: 540, top: 132, transform: `translateX(-50%) scale(${toast})`, padding: '16px 34px', borderRadius: 40, background: 'rgba(40,40,50,0.96)', color: '#fff', fontFamily: FONT.inter, fontWeight: 600, fontSize: 34, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>🙂 you smiled · heart control lost</div>
      )}
    </div>
  );
};

// ───────────────────────── "Ni I'm too hot to handle" (2): his video call ─────────────────────────
export const VideoCall: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const { V } = useTL();
  const a = V(80.82), acc = V(81.85);
  const enter = easeOutCubic(seg(t, a, a + 0.2));
  const on = t >= acc;
  const flash = hit(t, acc, 0.2);
  const ring = (t * 1.6) % 1;
  const words: Word[] = [{ w: 'Ni', at: V(80.9) }, { w: "I'm", at: V(81.3) }];
  const big: Word[][] = [[{ w: 'TOO', at: V(81.4) }, { w: 'HOT', at: V(81.8) }], [{ w: 'TO', at: V(82.1) }, { w: 'HANDLE', at: V(82.4) }]];
  const secs = on ? Math.floor(t - acc) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000', opacity: enter }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 35%, #ffd08a 0%, #ff8a2a 22%, #ff4d1a 40%, #8f1a08 75%, #200402 100%)', filter: `brightness(${on ? 1 + pulse * 0.15 : 0.55})` }} />
      <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: -170, top: 120, width: 1420, height: 1420, filter: on ? 'none' : 'blur(16px) brightness(0.6)' }} />
      {!on && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center' }}>
            <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 70, color: '#fff' }}>THAT MAN 🔥</div>
            <div style={{ fontFamily: FONT.inter, fontWeight: 400, fontSize: 38, color: '#ffd9c8', marginTop: 6 }}>video calling…</div>
          </div>
          {[['#ff3b30', 250, 'decline'], [C.green, 830, 'accept']].map(([col, x, k]) => (
            <div key={k as string} style={{ position: 'absolute', left: (x as number) - 80, top: 1090, width: 160, height: 160 }}>
              {k === 'accept' && <div style={{ position: 'absolute', left: -60 * ring, top: -60 * ring, width: 160 + 120 * ring, height: 160 + 120 * ring, borderRadius: '50%', border: `5px solid ${C.green}`, opacity: 1 - ring }} />}
              <div style={{ position: 'absolute', inset: 0, borderRadius: 80, background: col as string, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${k === 'decline' ? 135 : 0}deg)` }}>
                <svg width="80" height="80" viewBox="0 0 56 56" fill="#fff"><path d="M18 8 L24 8 L28 18 L23 22 C26 29 29 32 34 35 L38 30 L48 34 L48 40 C48 44 45 48 40 47 C25 45 11 31 9 16 C8 11 12 8 18 8 Z" /></svg>
              </div>
            </div>
          ))}
          {t >= acc - 0.2 && <div style={{ position: 'absolute', left: 830 - 60, top: 1110, width: 120, height: 120, borderRadius: 60, background: 'rgba(255,255,255,0.5)' }} />}
        </>
      )}
      {on && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 130, textAlign: 'center', fontFamily: FONT.inter, fontWeight: 600, fontSize: 34, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>THAT MAN 🔥 · 00:0{secs}</div>
          <div style={{ position: 'absolute', right: 150, top: 200, width: 190, height: 300, borderRadius: 26, background: 'linear-gradient(160deg, #2a2d3a, #12131a)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 110 }}>🫠</div>
          <BigType t={t} small={words} big={big} top={640} size={230} />
        </>
      )}
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.8 }} />
    </div>
  );
};

// ───────────────────────── "Playlist 'te tera channel" ─────────────────────────
export const Playlist: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const { V } = useTL();
  const a = V(83.94);
  const enter = easeOutCubic(seg(t, a, a + 0.25));
  const toast = easeOutBack(seg(t, V(84.1), V(84.1) + 0.25), 1.6);
  const card = easeOutBack(seg(t, V(85.0), V(85.0) + 0.3), 1.3);
  const sub = t >= V(85.3) + 0.08;
  const bell = sub ? Math.sin((t - V(85.3)) * 30) * 18 * Math.exp(-(t - V(85.3)) * 4) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#140504', transform: `translateY(${(1 - enter) * 300}px)`, opacity: enter }}>
      <div style={{ position: 'absolute', inset: -100, background: 'radial-gradient(circle at 50% 30%, #ff7a2a, #a3150a 50%, #200402 90%)', filter: 'blur(30px)', opacity: 0.85 }} />
      <div style={{ position: 'absolute', left: 150, top: 260, width: 780, height: 780, borderRadius: 30, overflow: 'hidden', boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 ${pulse * 60}px rgba(255,140,40,0.5)`, transform: `scale(${1 + pulse * 0.015})` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, #ffd08a, #ff8a2a 30%, #ff4d1a 50%, #8f1a08 85%)' }} />
        <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: -60, top: 60, width: 900, height: 900 }} />
        <div style={{ position: 'absolute', left: 30, bottom: 26, fontFamily: FONT.anton, fontSize: 92, lineHeight: 0.95, background: FIRE, WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))' }}>TOO HOT<br />TO HANDLE</div>
      </div>
      <div style={{ position: 'absolute', left: 150, top: 1070, width: 780 }}>
        <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.25)' }}><div style={{ width: `${40 + (t - a) * 3}%`, height: '100%', borderRadius: 5, background: '#fff' }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, color: '#ffd9c8', marginTop: 10 }}><span>1:{String(24 + Math.floor(t - a)).padStart(2, '0')}</span><span>2:23</span></div>
      </div>
      {toast > 0 && (
        <div style={{ position: 'absolute', left: 540, top: 140, transform: `translateX(-50%) scale(${toast})`, padding: '18px 36px', borderRadius: 40, background: 'rgba(255,255,255,0.95)', color: '#111', fontFamily: FONT.inter, fontWeight: 600, fontSize: 34, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>✓ Added to your playlist</div>
      )}
      {card > 0 && (
        <div style={{ position: 'absolute', left: 60, top: 1140, width: 860, height: 150, borderRadius: 34, background: 'rgba(20,10,8,0.92)', border: '2px solid rgba(255,140,80,0.4)', display: 'flex', alignItems: 'center', padding: '0 26px', gap: 22, boxSizing: 'border-box', transform: `translateY(${(1 - card) * 200}px)`, opacity: clamp(card * 2) }}>
          <Avatar m={M.man} d={96} id="ch-av" ring={C.fire} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 34, color: '#fff' }}>THAT MAN 🔥</div>
            <div style={{ fontFamily: FONT.inter, fontWeight: 400, fontSize: 26, color: '#c9b5ab' }}>channel · new song</div>
          </div>
          <div style={{ padding: '18px 26px', borderRadius: 40, background: sub ? 'rgba(255,255,255,0.15)' : '#ff2d2d', color: '#fff', fontFamily: FONT.inter, fontWeight: 600, fontSize: 30, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 10 }}>
            {sub ? <><span style={{ display: 'inline-block', transform: `rotate(${bell}deg)` }}>🔔</span> Subscribed</> : 'Subscribe'}
          </div>
        </div>
      )}
      {t >= V(85.3) - 0.12 && t < V(85.3) + 0.2 && <div style={{ position: 'absolute', left: 800 - 50, top: 1215 - 50, width: 100, height: 100, borderRadius: 50, background: 'rgba(255,255,255,0.5)' }} />}
    </div>
  );
};

// ───────────────────────── "Eyes on me, tu ik angle" ─────────────────────────
export const Camera: React.FC<{ t: number }> = ({ t }) => {
  const { V } = useTL();
  const a = V(86.73);
  const enter = easeOutCubic(seg(t, a, a + 0.2));
  const eyes = V(87.0), ang = V(88.6);
  const lock = after(t, eyes, 0.18);
  const tilt = t >= ang ? 9 * easeOutBack(after(t, ang, 0.3), 1.6) : 0;
  const rec = Math.floor(t * 2) % 2 === 0;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: enter, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 230, width: 1080, height: 1290, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: -120, transform: `rotate(${tilt}deg)` }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 35%, #ffd08a, #ff8a2a 25%, #ff4d1a 45%, #6a1206 85%)' }} />
          <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: -60, top: 170, width: 1440, height: 1440 }} />
        </div>
        {/* thirds grid */}
        {[1, 2].map((k) => <div key={`v${k}`} style={{ position: 'absolute', left: (1080 * k) / 3, top: 0, width: 2, height: 1290, background: 'rgba(255,255,255,0.3)' }} />)}
        {[1, 2].map((k) => <div key={`h${k}`} style={{ position: 'absolute', top: (1290 * k) / 3, left: 0, height: 2, width: 1080, background: 'rgba(255,255,255,0.3)' }} />)}
        {/* detection box */}
        {t >= eyes && (
          <div style={{ position: 'absolute', left: 300, top: 120, width: 520, height: 560, transform: `scale(${lerp(1.35, 1, easeOutCubic(lock))})`, opacity: lock < 1 ? (Math.floor(t * 30) % 2 ? 1 : 0.4) : 1 }}>
            {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => (
              <div key={`${x}${y}`} style={{ position: 'absolute', left: x ? undefined : 0, right: x ? 0 : undefined, top: y ? undefined : 0, bottom: y ? 0 : undefined, width: 70, height: 70, borderLeft: x ? 'none' : '7px solid #ffd21f', borderRight: x ? '7px solid #ffd21f' : 'none', borderTop: y ? 'none' : '7px solid #ffd21f', borderBottom: y ? '7px solid #ffd21f' : 'none' }} />
            ))}
            <div style={{ position: 'absolute', left: 0, top: -64, padding: '6px 16px', background: '#ffd21f', color: '#111', fontFamily: FONT.mono, fontWeight: 800, fontSize: 28, whiteSpace: 'nowrap' }}>EYES ON ME · VIBE LOCKED</div>
          </div>
        )}
        {tilt > 0.3 && (
          <div style={{ position: 'absolute', left: 240, top: 640, width: 600, height: 0 }}>
            <div style={{ position: 'absolute', left: 0, width: 600, height: 4, background: '#ffd21f', transform: `rotate(${tilt}deg)` }} />
            <div style={{ position: 'absolute', left: 0, width: 600, height: 2, background: 'rgba(255,255,255,0.6)' }} />
            <div style={{ position: 'absolute', left: 250, top: 26, fontFamily: FONT.mono, fontWeight: 800, fontSize: 34, color: '#ffd21f' }}>{Math.round(tilt)}°</div>
          </div>
        )}
      </div>
      {/* camera chrome */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center', fontFamily: FONT.mono, fontWeight: 800, fontSize: 30, color: '#fff' }}>
        <span style={{ color: '#ff3b30', opacity: rec ? 1 : 0.3 }}>●</span> REC 00:00:0{Math.floor(t - a)}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1528, display: 'flex', justifyContent: 'center', gap: 50, fontFamily: FONT.inter, fontWeight: 600, fontSize: 28, color: '#cfd3dc', letterSpacing: '0.1em' }}>
        <span>PHOTO</span><span style={{ color: '#ffd21f' }}>VIDEO</span><span>PORTRAIT</span>
      </div>
      <div style={{ position: 'absolute', left: 540 - 70, top: 1610, width: 140, height: 140, borderRadius: 70, border: '8px solid #fff', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 12, background: '#ff3b30' }} />
      </div>
    </div>
  );
};

// ───────────────────────── "Heart went pop — oops! it's a scandal!" ─────────────────────────
const HEARTS = Array.from({ length: 26 }, (_, k) => ({ x: 80 + rand(k * 2.3) * 820, d: 0.9 + rand(k * 4.1) * 1.3, s: 50 + rand(k * 7.3) * 50, d0: rand(k * 1.7) * 1.2 }));
const HeartPath = 'M50 88 C20 66 4 50 4 30 C4 14 16 4 30 4 C40 4 46 9 50 16 C54 9 60 4 70 4 C84 4 96 14 96 30 C96 50 80 66 50 88 Z';
export const HeartPop: React.FC<{ t: number }> = ({ t }) => {
  const { V } = useTL();
  const a = V(89.28), pop = V(90.1), oops = V(90.4), scandal = V(91.6), its = V(91.3);
  const grow = t < pop ? easeInCubic(seg(t, a, pop)) : 1;
  const wob = 1 + Math.sin(t * 30) * 0.04 * grow;
  const popped = t >= pop;
  const burst = after(t, pop, 0.6);
  const flash = hit(t, pop, 0.2);
  const op = easeOutBack(after(t, oops, 0.22), 2.2);
  const sc = t >= its ? easeOutBack(after(t, scandal, 0.18), 1.5) : 0;
  const pre = t >= its ? after(t, its, 0.15) : 0;
  const notes: [keyof typeof M, string][] = [['riya', 'OMG 😱'], ['aman', 'nobody saw that 😭'], ['uncle', 'dancing again 🕺'], ['mirror', '…okay, jealous.']];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {HEARTS.map((h, k) => {
        const u = t - (a + h.d0);
        if (u < 0) return null;
        const y = 1300 - u * 520 * h.d;
        if (y < 150) return null;
        return <div key={k} style={{ position: 'absolute', left: h.x + Math.sin(u * 4 + k) * 30, top: y, fontSize: h.s, opacity: clamp(1 - u / 2.6) }}>❤️</div>;
      })}
      {!popped && (
        <svg width="600" height="560" viewBox="0 0 100 92" style={{ position: 'absolute', left: 240, top: 520, transform: `scale(${(0.25 + grow * 1.0) * wob})`, transformOrigin: '50% 55%', filter: 'drop-shadow(0 0 30px rgba(255,40,80,0.7))' }}>
          <path d={HeartPath} fill="#ff2d55" stroke="#fff" strokeWidth="2.5" />
          <ellipse cx="30" cy="24" rx="10" ry="6" fill="#fff" opacity="0.5" transform="rotate(-30 30 24)" />
        </svg>
      )}
      {popped && burst < 1 && Array.from({ length: 22 }, (_, k) => {
        const ang = (k / 22) * Math.PI * 2 + rand(k) * 0.3;
        const r = easeOutCubic(burst) * (380 + rand(k * 3) * 260);
        return <div key={k} style={{ position: 'absolute', left: 540 + Math.cos(ang) * r - 30, top: 790 + Math.sin(ang) * r - 30, fontSize: 60, opacity: 1 - burst, transform: `rotate(${ang * 57}deg)` }}>{k % 3 ? '❤️' : '💥'}</div>;
      })}
      {popped && <div style={{ position: 'absolute', left: 540 - 400 * burst, top: 790 - 400 * burst, width: 800 * burst, height: 800 * burst, borderRadius: '50%', border: `${20 * (1 - burst)}px solid rgba(255,255,255,0.8)`, opacity: 1 - burst }} />}
      {t >= oops && (
        <div style={{ position: 'absolute', left: 300, top: 360, transform: `rotate(-10deg) scale(${op * (1 - easeInCubic(seg(t, its - 0.05, its + 0.15)))})` }}>
          <div style={{ background: C.sub, color: '#111', border: '7px solid #111', borderRadius: 30, padding: '6px 40px', fontFamily: FONT.anton, fontSize: 170, lineHeight: 1.05, boxShadow: '0 16px 0 rgba(0,0,0,0.4)' }}>OOPS!</div>
        </div>
      )}
      {pre > 0 && (
        <div style={{ position: 'absolute', left: 540, top: 900, transform: `translate(-50%, -50%) rotate(5deg) scale(${sc > 0 ? lerp(2.2, 1, Math.min(1, sc)) : lerp(0.6, 0.9, pre)})`, opacity: sc > 0 ? 1 : pre * 0.8 }}>
          <div style={{ background: C.red, color: '#fff', padding: '0 46px', fontFamily: FONT.anton, fontSize: 210, lineHeight: 1.1, letterSpacing: '0.02em', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', border: '8px solid #fff' }}>{sc > 0 ? 'SCANDAL!' : "IT'S A…"}</div>
        </div>
      )}
      <div style={{ position: 'absolute', left: 32, top: 130, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {notes.map(([who, msg], k) => {
          const at = its + 0.05 + k * 0.16;
          if (t < at) return null;
          const p = easeOutBack(after(t, at, 0.22), 1.4);
          return (
            <div key={k} style={{ transform: `translateY(${(1 - p) * -60}px)`, opacity: clamp(p * 2) }}>
              <Notif title={`TOO HOT TO HANDLE 🔥`} body={`${M[who].name}: ${msg}`} avatar={who} w={1016} />
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.8 }} />
    </div>
  );
};

// ───────────────────────── the phone gives up ─────────────────────────
export const Shutdown: React.FC<{ t: number; from: number; to: number }> = ({ t, from, to }) => {
  const u = seg(t, from, to);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 900, textAlign: 'center', opacity: clamp(u * 4) * (1 - clamp((u - 0.8) * 5)), fontFamily: FONT.inter, fontWeight: 600, fontSize: 38, color: '#ffb38a' }}>
        <div style={{ width: 70, height: 70, margin: '0 auto 30px', borderRadius: 35, border: '7px solid rgba(255,140,80,0.25)', borderTopColor: '#ff8a3d', transform: `rotate(${t * 900}deg)` }} />
        too hot · shutting down…
      </div>
    </div>
  );
};

export { easeInOutCubic };
