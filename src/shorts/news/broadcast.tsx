import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, F, HEAT_GRADIENT } from '../../theme';
import { VF } from '../../viral/fonts';
import { Slices } from '../../viral/fx';
import { beatAt, clamp, easeOutBack, easeOutCubic, lerp } from '../../lib/time';
import { CC, LYRICS, SG, STRAPS, ST, TICKER, at, songOf, strapAt, tempAt } from './script';

// The channel's on-air graphics around the picture: top bar, headline strap, live captions, ticker.
// GARMI 24x7 is a made-up channel ("garmi" is heat).

export const L = { barY: 96, barH: 104, picY: 210, picH: 920, strapY: 1142, strapH: 136, ccY: 1292, ccH: 176, tickY: 1482, tickH: 66 };
export const RED = '#D7141E';
export const NAVY = '#0B1630';
export const INK = '#F4F1EA';
const YELLOW = '#FFD23F';

const ease = (t: number, a: number, d: number) => easeOutCubic(clamp((t - a) / d));
let mctx: CanvasRenderingContext2D | null = null;
/** Rendered width of a string (fonts are loaded before the first frame), so the ticker loops seamlessly. */
const textWidth = (s: string, font: string) => {
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  mctx!.font = font;
  return mctx!.measureText(s).width;
};

/** Hot colour for a temperature: white at 24°, orange by 60°, red-hot past 99°. */
export const tempColor = (v: number) => {
  const h = clamp((v - 40) / 60);
  return `rgb(255,${Math.round(lerp(236, 70, h))},${Math.round(lerp(200, 30, h))})`;
};

export const TopBar: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const swap = s >= SG.logo;
  const glitch = clamp(1 - Math.abs(s - SG.logo) / 0.25);
  const temp = tempAt(t);
  const blink = Math.floor(t * 2) % 2 === 0;
  const logo = swap ? (
    <div style={{ display: 'flex', alignItems: 'center', height: 76, padding: '0 24px', borderRadius: 10, background: `linear-gradient(90deg, ${C.fire}, ${C.pink})`, fontFamily: VF.cond, fontSize: 50, letterSpacing: 2, color: '#fff', boxShadow: `0 0 30px rgba(255,80,20,0.6)` }}>THAT MAN 🔥</div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'stretch', height: 76, borderRadius: 10, overflow: 'hidden', fontFamily: VF.cond, fontSize: 50, letterSpacing: 2 }}>
      <div style={{ background: RED, color: '#fff', padding: '4px 18px 0' }}>GARMI</div>
      <div style={{ background: '#fff', color: RED, padding: '4px 16px 0' }}>24×7</div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: L.barY, height: L.barH, display: 'flex', alignItems: 'center', gap: 20, padding: '0 36px', fontFamily: F.sans }}>
      <div style={{ position: 'relative', width: 330, height: 76 }}>
        <Slices t={t} amt={glitch} n={6} maxShift={60}>
          <div style={{ position: 'absolute', left: 0, top: 0 }}>{logo}</div>
        </Slices>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 56, padding: '0 20px', borderRadius: 8, background: RED, color: '#fff', fontWeight: 600, fontSize: 32, letterSpacing: 2 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', opacity: blink ? 1 : 0.35 }} />LIVE
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: VF.hud, fontSize: 34, fontWeight: 600, color: INK }}>11:58 PM</div>
        <div style={{ fontFamily: VF.hud, fontSize: 34, fontWeight: 700, color: tempColor(temp), textShadow: temp > 60 ? `0 0 18px rgba(255,90,20,0.8)` : 'none' }}>{Math.round(temp)}°C</div>
      </div>
    </div>
  );
};

/** Largest strap size (up to 64px) that keeps the headline on one line next to its tag. */
const fitSize = (st: { tag: string; text: string }) => {
  const room = 1024 - (textWidth(st.tag, '40px Anton') + 2 * st.tag.length + 52) - 56;
  return Math.min(64, Math.floor((64 * room) / (textWidth(st.text, '64px Anton') + 0.5 * st.text.length)));
};

/** Headline strap: red tag + white bar. Each new strap flips up into place. */
export const Strap: React.FC<{ t: number }> = ({ t }) => {
  const i = strapAt(t);
  if (i < 0) return null;
  const s = songOf(t);
  const enter = ease(t, STRAPS[0].at, 0.35);
  const hidden = t >= ST.static && s < 0.3 ? 1 : 0; // the strap drops out with the signal
  const cur = STRAPS[i], prev = i > 0 ? STRAPS[i - 1] : null;
  const p = ease(t, cur.at, 0.28);
  const pulse = s >= 0 ? beatAt(s).pulse : 0;
  const hot = s >= 0;
  const row = (st: { tag: string; text: string }, y: number, o: number) => (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, height: L.strapH, display: 'flex', opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 26px 0', background: hot ? `linear-gradient(180deg, ${C.fire}, ${RED})` : RED, color: '#fff', fontFamily: VF.cond, fontSize: 40, letterSpacing: 2, whiteSpace: 'nowrap', transform: `scale(${1 + 0.04 * pulse})`, transformOrigin: '0 50%' }}>{st.tag}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '8px 26px 0', background: INK, color: NAVY, fontFamily: VF.cond, fontSize: fitSize(st), lineHeight: 1.02, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{st.text}</div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 28, right: 28, top: L.strapY, height: L.strapH, overflow: 'hidden', borderRadius: 6, transform: `translateX(${(1 - enter) * -1120}px)`, opacity: 1 - hidden, boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}>
      {prev && p < 1 && row(prev, -L.strapH * p, 1)}
      {row(cur, L.strapH * (1 - p), 1)}
    </div>
  );
};

/** Closed captions: the anchor's words appear as they are "spoken"; after the hijack they caption the song. */
export const Captions: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  let body: React.ReactNode = null;
  if (s < 0) {
    const c = CC.find((c) => t >= c.at && t < c.to + 0.05);
    if (c) {
      const words = c.text.split(' ');
      const n = Math.min(words.length, Math.floor((t - c.at) / 0.13) + 1);
      body = (
        <div style={{ fontSize: 46, fontWeight: 600, lineHeight: 1.28, color: '#fff' }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: '#9AA6C4', marginRight: 14, letterSpacing: 2 }}>ANCHOR:</span>
          {words.slice(0, n).join(' ')}
        </div>
      );
    }
  } else {
    const l = LYRICS.find((l) => s >= l.start - 0.05 && s < (LYRICS[LYRICS.indexOf(l) + 1]?.start ?? SG.off) - 0.05);
    if (l && s < SG.off) {
      const shown = l.words.filter((w) => s >= w.t - 0.08);
      body = (
        <>
          <div style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.22, color: '#fff' }}>
            <span style={{ color: C.gold, marginRight: 12 }}>♪</span>
            {shown.map((w) => w.w).join(' ')}
          </div>
          {l.en && <div style={{ marginTop: 8, fontSize: 32, lineHeight: 1.25, color: YELLOW, opacity: ease(s, l.start, 0.2) }}>{l.en}</div>}
        </>
      );
    }
  }
  if (!body) return null;
  return (
    <div style={{ position: 'absolute', left: 28, right: 28, top: L.ccY, minHeight: 100, maxHeight: L.ccH, padding: '18px 28px 18px 96px', background: 'rgba(0,0,0,0.86)', borderRadius: 6, fontFamily: F.sans, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 24, top: 24, width: 52, height: 38, border: '3px solid #C9CED9', borderRadius: 6, color: '#C9CED9', fontSize: 22, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CC</div>
      {body}
    </div>
  );
};

export const Ticker: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const hot = s >= 0;
  const text = hot ? TICKER.song : TICKER.story;
  const w = textWidth(text, `800 34px Archivo`);
  const x = -(((t - (hot ? at(0) : 0)) * (hot ? 260 : 230)) % w);
  const enter = ease(t, ST.studio, 0.4);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: L.tickY, height: L.tickH, display: 'flex', overflow: 'hidden', transform: `translateY(${(1 - enter) * 90}px)`, opacity: enter }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', padding: '4px 22px 0', background: hot ? C.fire : NAVY, color: '#fff', fontFamily: VF.cond, fontSize: 34, letterSpacing: 2 }}>{hot ? 'NOW' : 'LATEST'}</div>
      <div style={{ position: 'relative', flex: 1, background: hot ? C.gold : YELLOW, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: x, top: 0, height: L.tickH, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontFamily: VF.grot, fontWeight: 800, fontSize: 34, color: NAVY }}>{text}{text}{text}</div>
      </div>
    </div>
  );
};

/** Under the ticker: the channel's backdrop (this band sits under the platform's own captions). */
export const Base: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const hot = s >= 0 ? clamp((s - SG.race[0]) / 3) : 0;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #050913 0%, ${NAVY} 30%, #050913 100%)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,90,20,${0.55 * hot}), transparent 70%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', fontFamily: VF.cond, fontSize: 150, letterSpacing: 10, color: 'rgba(255,255,255,0.035)' }}>{s >= SG.logo ? 'THAT MAN' : 'GARMI 24×7'}</div>
    </AbsoluteFill>
  );
};

/** The end card after the TV switches off. */
export const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(songOf(t), SG.card, 0.4);
  if (p <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: p }}>
      <div style={{ transform: `translateY(${(1 - p) * 30}px) scale(${lerp(0.94, 1, easeOutBack(p, 1.6))})` }}>
        <div style={{ fontFamily: F.display, fontSize: 112, letterSpacing: 6, lineHeight: 1, backgroundImage: HEAT_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', display: 'inline-block' }}>TOO HOT TO HANDLE</div>
        <div style={{ fontFamily: F.sans, fontSize: 42, color: '#B7B3C0', marginTop: 18 }}>full song on the channel</div>
      </div>
    </AbsoluteFill>
  );
};
