import React from 'react';
import {
  ANCHOR_LINES, C, Caption, FONT, HIJACK, L, LOGO_SWITCH, SONG_LINES, STRAPS, TICKER_SONG, TICKER_STORY, TICKER_SWITCH,
  WIPES, WIPE_DUR, WORD_STEP, clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, rand, seg, tempShown,
} from './timeline';
import { fitOne, textW, wrapWords } from './fonts';

const hot = (t: number) => t >= HIJACK;

// ───────────────────────── backdrop ─────────────────────────
export const Backdrop: React.FC<{ t: number }> = ({ t }) => {
  const warm = seg(t, HIJACK, HIJACK + 1.2);
  const mark = t >= LOGO_SWITCH ? 'THAT MAN' : 'GARMI 24×7';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0d1a38 0%, #0B1630 45%, #060c1e 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: warm, background: 'linear-gradient(180deg, #2a0d07 0%, #1c0805 45%, #0d0302 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, background: 'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1572, textAlign: 'center', fontFamily: FONT.anton, fontSize: mark.length > 9 ? 190 : 210, lineHeight: 1.12, color: '#fff', opacity: 0.055, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
        {mark.split(' ').map((w) => <div key={w}>{w}</div>)}
      </div>
    </div>
  );
};

// ───────────────────────── top bar ─────────────────────────
const LogoGarmi: React.FC = () => (
  <div style={{ display: 'flex', height: 64, boxShadow: '0 4px 14px rgba(0,0,0,0.45)' }}>
    <div style={{ background: C.red, color: '#fff', fontFamily: FONT.anton, fontSize: 46, lineHeight: '64px', padding: '0 14px', letterSpacing: '0.02em' }}>GARMI</div>
    <div style={{ background: '#fff', color: C.red, fontFamily: FONT.anton, fontSize: 46, lineHeight: '64px', padding: '0 12px' }}>24×7</div>
  </div>
);
const LogoThatMan: React.FC = () => (
  <div style={{ display: 'flex', height: 64, alignItems: 'center', background: 'linear-gradient(90deg, #FF4D1A, #FF2E6E)', color: '#fff', fontFamily: FONT.anton, fontSize: 46, lineHeight: '64px', padding: '0 16px', letterSpacing: '0.02em', boxShadow: '0 0 26px rgba(255,77,26,0.6)' }}>
    THAT MAN <span style={{ fontSize: 38, marginLeft: 8 }}>🔥</span>
  </div>
);

export const TopBar: React.FC<{ t: number }> = ({ t }) => {
  const warm = seg(t, HIJACK, HIJACK + 1.2);
  const g = t - LOGO_SWITCH;
  const glitching = g > -0.12 && g < 0.3;
  const showNew = t >= LOGO_SWITCH ? !(glitching && rand(Math.floor(t * 30) * 3.1) < 0.3) : glitching && rand(Math.floor(t * 30) * 7.7) < 0.45;
  const slices = glitching ? [0, 1, 2, 3].map((i) => (rand(Math.floor(t * 30) + i * 17) - 0.5) * 40) : [0, 0, 0, 0];
  const temp = tempShown(t);
  const tempCol = temp >= 56 ? C.fire : C.gold;
  const dot = 0.35 + 0.65 * (Math.sin(t * Math.PI * 2 * 0.9) > -0.2 ? 1 : 0);
  return (
    <div style={{ position: 'absolute', left: 0, top: L.top.y, width: 1080, height: L.top.h }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #13244a, #0a1530)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: warm, background: 'linear-gradient(180deg, #3a1208, #1a0604)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: warm > 0.5 ? C.fire : C.red }} />
      <div style={{ position: 'absolute', left: 30, top: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative' }}>
          {glitching ? (
            <div style={{ position: 'relative' }}>
              {slices.map((dx, i) => (
                <div key={i} style={{ position: i ? 'absolute' : 'relative', left: 0, top: 0, transform: `translateX(${dx}px)`, clipPath: `inset(${i * 25}% 0 ${100 - (i + 1) * 25}% 0)`, filter: i % 2 ? 'drop-shadow(4px 0 0 rgba(0,255,255,0.7)) drop-shadow(-4px 0 0 rgba(255,0,80,0.7))' : 'none' }}>
                  {showNew ? <LogoThatMan /> : <LogoGarmi />}
                </div>
              ))}
            </div>
          ) : showNew ? <LogoThatMan /> : <LogoGarmi />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 18px 0 14px', borderRadius: 23, background: C.red, color: '#fff', fontFamily: FONT.archivo, fontWeight: 800, fontSize: 28, letterSpacing: '0.08em' }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', opacity: dot }} />LIVE
        </div>
      </div>
      <div style={{ position: 'absolute', right: 32, top: 12, textAlign: 'right' }}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 40, lineHeight: '46px', color: '#fff', letterSpacing: '0.02em' }}>11:58 PM</div>
        <div style={{ fontFamily: FONT.mono, fontWeight: 800, fontSize: 30, lineHeight: '36px', color: tempCol, textShadow: temp >= 56 ? '0 0 14px rgba(255,77,26,0.8)' : 'none' }}>
          <span style={{ fontSize: 22, color: '#9fb0d0', fontWeight: 600, marginRight: 10, letterSpacing: '0.1em' }}>CITY</span>{temp}°C
        </div>
      </div>
    </div>
  );
};

// ───────────────────────── lower-third strap ─────────────────────────
const TAG_W = 236;
const SCR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&?!';
const StrapFace: React.FC<{ tag: string; text: string; t: number; hotNow: boolean; scramble?: { from: string; p: number } }> = ({ tag, text, hotNow, scramble }) => {
  const tagLines = tag.split(' ').length > 1 && tag.length > 8 ? (() => { const w = tag.split(' '); const k = Math.ceil(w.length / 2); return [w.slice(0, k).join(' '), w.slice(k).join(' ')]; })() : [tag];
  const tagSize = Math.min(...tagLines.map((ln) => fitOne(ln, FONT.anton, 400, TAG_W - 36, tagLines.length > 1 ? 44 : 56)));
  let shown = text;
  if (scramble) {
    const n = Math.max(text.length, scramble.from.length);
    shown = Array.from({ length: n }, (_, i) => {
      const k = i / n;
      if (scramble.p >= k * 0.75 + 0.25) return text[i] ?? '';
      if (scramble.p < k * 0.75) return scramble.from[i] ?? '';
      const ch = text[i] ?? ' ';
      return ch === ' ' ? ' ' : SCR[Math.floor(rand(i * 13 + Math.floor(scramble.p * 40)) * SCR.length)];
    }).join('');
  }
  const size = fitOne(scramble ? text : shown, FONT.anton, 400, 1032 - TAG_W - 52, 72, 0.01);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <div style={{ width: TAG_W, height: '100%', background: hotNow ? 'linear-gradient(160deg, #FF4D1A, #D7141E)' : C.red, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', fontFamily: FONT.anton, fontSize: tagSize, lineHeight: 1.08, letterSpacing: '0.02em' }}>
        {tagLines.map((ln) => <div key={ln}>{ln}</div>)}
      </div>
      <div style={{ flex: 1, height: '100%', background: C.off, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 26px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: hotNow ? C.fire : C.navy }} />
        <div style={{ fontFamily: FONT.anton, fontSize: size, color: C.navy, whiteSpace: 'nowrap', letterSpacing: '0.01em', lineHeight: 1, paddingTop: 4 }}>{shown}</div>
      </div>
    </div>
  );
};

export const StrapBar: React.FC<{ t: number }> = ({ t }) => {
  let i = -1;
  STRAPS.forEach((s, k) => { if (t >= s.t) i = k; });
  if (i < 0) return null;
  const cur = STRAPS[i], prev = STRAPS[i - 1];
  const age = t - cur.t;
  const hotNow = cur.t >= HIJACK - 0.01;
  const layers: React.ReactNode[] = [];
  if (cur.rewrite && prev) {
    const p = clamp(age / 0.6);
    layers.push(
      <div key={i} style={{ position: 'absolute', inset: 0 }}>
        <StrapFace tag={age < 0.12 ? prev.tag : cur.tag} text={cur.text} t={t} hotNow={hotNow} scramble={{ from: prev.text, p }} />
      </div>,
    );
  } else {
    const pIn = clamp((age - 0.06) / 0.3);
    const pOut = clamp(age / 0.13);
    if (prev && prev.text && pOut < 1) {
      layers.push(
        <div key={i - 1} style={{ position: 'absolute', inset: 0, transformOrigin: '50% 0%', transform: `perspective(900px) rotateX(${pOut * 92}deg)`, opacity: 1 - pOut }}>
          <StrapFace tag={prev.tag} text={prev.text} t={t} hotNow={prev.t >= HIJACK - 0.01} />
        </div>,
      );
    }
    if (cur.text) {
      const e = easeOutBack(pIn, 1.4);
      layers.push(
        <div key={i} style={{ position: 'absolute', inset: 0, transformOrigin: '50% 100%', transform: `perspective(900px) rotateX(${(1 - e) * -96}deg)`, opacity: clamp(pIn * 4) }}>
          <StrapFace tag={cur.tag} text={cur.text} t={t} hotNow={hotNow} />
        </div>,
      );
    }
  }
  return <div style={{ position: 'absolute', left: 24, top: L.strap.y, width: 1032, height: L.strap.h }}>{layers}</div>;
};

// ───────────────────────── closed captions ─────────────────────────
const NoteIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: '-0.12em', marginRight: 12 }}>
    <path d="M9 3 L21 1 L21 15.5 A3.5 3 0 1 1 18 12.6 L18 5.2 L12 6.2 L12 18.5 A3.5 3 0 1 1 9 15.6 Z" fill={color} />
  </svg>
);

const CC_X = 24, CC_W = 1032, PAD_X = 30, TEXT_W = CC_W - PAD_X * 2 - 64;
const active = (t: number, lines: Caption[]) => {
  let cur: Caption | null = null;
  for (const c of lines) if (t >= c.a && t < c.b) cur = c;
  return cur;
};

export const CaptionBox: React.FC<{ t: number }> = ({ t }) => {
  const hide = t >= 27.95 && t < HIJACK;
  const cap = active(t, ANCHOR_LINES) ?? active(t, SONG_LINES);
  let body: React.ReactNode = null;
  if (cap && !hide) {
    const words = cap.text.split(' ');
    const isSong = cap.kind === 'song';
    const fam = FONT.inter;
    const label = isSong ? 0 : textW('ANCHOR:', `600 24px ${fam}`, 1.5) + 14;
    const note = isSong ? 46 : 0;
    const avail = TEXT_W - label - note;
    const maxLines = isSong && cap.en ? 1 : 2;
    let size = 42;
    let lines = wrapWords(words, fam, 600, size, avail);
    while (lines.length > maxLines && size > 32) {
      size -= 2;
      lines = wrapWords(words, fam, 600, size, avail);
    }
    if (lines.length > maxLines) {
      size = 36;
      lines = wrapWords(words, fam, 600, size, avail);
    }
    const reveal = (i: number) => (isSong ? cap.words?.[i] ?? cap.a : cap.a + i * WORD_STEP);
    const enSize = cap.en ? Math.min(32, fitOne(cap.en, fam, 600, TEXT_W + 40, 32)) : 0;
    body = (
      <div style={{ position: 'absolute', left: PAD_X, top: 0, bottom: 0, width: TEXT_W + 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
        {lines.map((ln, li) => (
          <div key={li} style={{ fontFamily: fam, fontWeight: 600, fontSize: size, lineHeight: 1.22, color: '#fff', whiteSpace: 'nowrap' }}>
            {li === 0 && !isSong && <span style={{ fontSize: 24, color: '#9ba3ae', letterSpacing: '0.06em', marginRight: 14, verticalAlign: '0.12em' }}>ANCHOR:</span>}
            {li === 0 && isSong && <NoteIcon size={size * 0.9} color={C.gold} />}
            {ln.map((wi, k) => {
              const at = reveal(wi);
              const p = clamp((t - at) / 0.08);
              const pop = isSong ? 1 + (1 - easeOutCubic(clamp((t - at) / 0.18))) * 0.12 : 1;
              return (
                <span key={wi} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 8}px) scale(${pop})`, transformOrigin: '50% 80%', marginRight: k < ln.length - 1 ? '0.26em' : 0 }}>
                  {words[wi]}
                </span>
              );
            })}
          </div>
        ))}
        {cap.en && (
          <div style={{ fontFamily: fam, fontWeight: 600, fontSize: enSize, lineHeight: 1.2, color: C.sub, whiteSpace: 'nowrap', opacity: clamp((t - cap.a) / 0.15), paddingLeft: isSong ? size * 0.9 + 12 : 0 }}>
            {cap.en}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: CC_X, top: L.cc.y, width: CC_W, height: L.cc.h, background: 'rgba(0,0,0,0.93)', borderRadius: 8, overflow: 'hidden', opacity: hide ? 0.85 : 1 }}>
      <div style={{ position: 'absolute', right: 18, top: 16, width: 50, height: 32, border: '2.5px solid #d6d6d6', borderRadius: 6, color: '#e6e6e6', fontFamily: FONT.archivo, fontWeight: 800, fontSize: 19, lineHeight: '28px', textAlign: 'center', letterSpacing: '0.04em' }}>CC</div>
      {body}
    </div>
  );
};
// ───────────────────────── ticker ─────────────────────────
const TickerText: React.FC<{ text: string; t: number; t0: number; speed: number }> = ({ text, t, t0, speed }) => {
  const font = `800 30px ${FONT.archivo}`;
  const w = textW(text, font, 0.6);
  const x = -(((t - t0) * speed) % w);
  const parts = text.split('•');
  const run = (
    <span>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 && <span style={{ color: C.red }}>•</span>}
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <div style={{ position: 'absolute', left: x, top: 0, height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'pre', fontFamily: FONT.archivo, fontWeight: 800, fontSize: 30, letterSpacing: '0.6px', color: C.navy }}>
      {run}{run}{run}
    </div>
  );
};

export const Ticker: React.FC<{ t: number }> = ({ t }) => {
  const sw = seg(t, TICKER_SWITCH, TICKER_SWITCH + 0.3);
  const labelHot = t >= TICKER_SWITCH + 0.15;
  return (
    <div style={{ position: 'absolute', left: 0, top: L.ticker.y, width: 1080, height: L.ticker.h, background: C.yellow, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 190, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-sw * 66}px)` }}>
          <TickerText text={TICKER_STORY} t={t} t0={0} speed={190} />
        </div>
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - sw) * 66}px)` }}>
          <TickerText text={TICKER_SONG} t={t} t0={TICKER_SWITCH} speed={190} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 176, height: '100%', background: labelHot ? C.fire : C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: FONT.archivo, fontWeight: 900, fontSize: 30, letterSpacing: '0.1em', clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)' }}>
        {labelHot ? 'NOW' : 'LATEST'}
      </div>
    </div>
  );
};

// ───────────────────────── red skewed wipe (inside the picture box) ─────────────────────────
export const RedWipe: React.FC<{ t: number }> = ({ t }) => {
  const w = WIPES.find((x) => Math.abs(t - x) <= WIPE_DUR / 2 + 0.001);
  if (w === undefined) return null;
  const p = easeInOutCubic(seg(t, w - WIPE_DUR / 2, w + WIPE_DUR / 2));
  const BW = 1560;
  const x = lerp(-BW - 420, 1080 + 420, p);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: -40, bottom: -40, left: x, width: BW, transform: 'skewX(-18deg)', background: C.red, boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 46, background: '#fff' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 80, background: C.navy }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 90, width: 14, background: hot(w) ? C.fire : '#ff5a5f' }} />
      </div>
      <div style={{ position: 'absolute', left: x + BW / 2 - 200, top: 400, width: 400, textAlign: 'center', fontFamily: FONT.anton, fontSize: 92, color: '#fff', opacity: 0.95, transform: 'skewX(-12deg)', letterSpacing: '0.02em' }}>
        {hot(w) ? 'THAT MAN' : 'GARMI'}
      </div>
    </div>
  );
};
