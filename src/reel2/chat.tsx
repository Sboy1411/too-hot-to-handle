import React from 'react';
import { Img, staticFile } from 'remotion';
import { Mirror, Uncle } from '../garmi/art';
import { textW, wrapWords } from '../garmi/fonts';
import { FONT } from '../garmi/timeline';
import { clamp, easeOutBack, easeOutCubic, lerp, rand, seg } from '../garmi/timeline';
import { C, CHAT_OPEN, GROUP_RENAME, M, MSGS, Member, Msg, SONG_END, TYPING_NAME, V, clockAt, phoneTemp } from './timeline';

// ───────────────────────── avatars ─────────────────────────
export const Avatar: React.FC<{ m: Member; d: number; id: string; ring?: string }> = ({ m, d, id, ring }) => {
  const a = m.av;
  let inner: React.ReactNode = null;
  if (a.kind === 'letter') {
    inner = <div style={{ position: 'absolute', inset: 0, background: a.bg, color: '#fff', fontFamily: FONT.archivo, fontWeight: 900, fontSize: d * 0.46, lineHeight: `${d}px`, textAlign: 'center' }}>{m.name[0]}</div>;
  } else if (a.kind === 'img') {
    const w = (d * 1254) / a.r;
    inner = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: a.file === 'thatman' ? 'radial-gradient(circle at 50% 40%, #ffb547, #ff4d1a 60%, #8f1a08)' : 'radial-gradient(circle at 50% 35%, #4a4f63, #1c1f2a)' }} />
        <Img src={staticFile(`garmi/${a.file}.webp`)} style={{ position: 'absolute', width: w, height: w, left: d / 2 - (a.fx * w) / 1254, top: d / 2 - (a.fy * w) / 1254 }} />
      </>
    );
  } else if (a.kind === 'uncle') {
    inner = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, #ff8cc6, #c2357c)' }} />
        <Uncle id={`${id}-u`} style={{ position: 'absolute', left: -d * 0.18, top: -d * 0.02, width: d * 1.36, height: d * 1.5 }} />
      </>
    );
  } else if (a.kind === 'mirror') {
    inner = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, #6a5418, #2a1f06)' }} />
        <Mirror id={`${id}-m`} style={{ position: 'absolute', left: d * 0.2, top: d * 0.08, width: d * 0.6, height: d * 0.77 }} />
      </>
    );
  } else {
    inner = <div style={{ position: 'absolute', inset: 0, background: a.bg, fontSize: d * 0.52, lineHeight: `${d}px`, textAlign: 'center' }}>{a.e}</div>;
  }
  return (
    <div style={{ position: 'relative', width: d, height: d, borderRadius: d / 2, overflow: 'hidden', flex: '0 0 auto', boxShadow: ring ? `0 0 0 4px ${ring}` : 'none' }}>{inner}</div>
  );
};

// ───────────────────────── status bar + header ─────────────────────────
export const StatusBar: React.FC<{ t: number; light?: boolean }> = ({ t, light }) => {
  const temp = phoneTemp(t);
  const hot = clamp((temp - 40) / 40);
  const col = temp >= 60 ? '#ff5a2a' : temp >= 42 ? C.gold : '#c9ced8';
  const fg = light ? '#fff' : '#f2f3f6';
  const blink = temp >= 90 && Math.floor(t * 4) % 2 === 0;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 34, height: 70, color: fg }}>
      <div style={{ position: 'absolute', left: 64, top: 12, fontFamily: FONT.inter, fontWeight: 600, fontSize: 36 }}>{clockAt(t)}</div>
      <div style={{ position: 'absolute', right: 56, top: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: `rgba(255,${Math.round(lerp(255, 77, hot))},${Math.round(lerp(255, 26, hot))},${0.12 + hot * 0.25})`, color: col, fontFamily: FONT.mono, fontWeight: 800, fontSize: 26, opacity: blink ? 0.55 : 1, boxShadow: temp >= 60 ? '0 0 18px rgba(255,77,26,0.6)' : 'none' }}>
          <svg width="16" height="28" viewBox="0 0 16 28"><rect x="5" y="1" width="6" height="18" rx="3" fill="none" stroke={col} strokeWidth="2" /><circle cx="8" cy="22" r="5" fill={col} /><rect x="7" y={Math.max(3, 17 - hot * 14)} width="2" height={Math.min(16, 4 + hot * 14)} fill={col} /></svg>
          {temp}°C
        </div>
        <svg width="40" height="26" viewBox="0 0 40 26">{[0, 1, 2, 3].map((k) => <rect key={k} x={k * 10} y={18 - k * 6} width="7" height={8 + k * 6} rx="1.5" fill={fg} />)}</svg>
        <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 28 }}>5G</div>
        <svg width="58" height="28" viewBox="0 0 58 28">
          <rect x="1" y="1" width="50" height="26" rx="7" fill="none" stroke={fg} strokeWidth="2.5" opacity="0.6" />
          <rect x="5" y="5" width={Math.max(4, 42 * (1 - hot * 0.75))} height="18" rx="4" fill={temp >= 90 ? '#ff3b30' : fg} />
          <rect x="53" y="9" width="4" height="10" rx="2" fill={fg} opacity="0.6" />
        </svg>
      </div>
    </div>
  );
};

const Icon: React.FC<{ kind: 'video' | 'phone' | 'back' }> = ({ kind }) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="#f2f3f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'video' && <><rect x="6" y="16" width="30" height="24" rx="6" /><path d="M36 25 L50 17 L50 39 L36 31 Z" /></>}
    {kind === 'phone' && <path d="M18 8 L24 8 L28 18 L23 22 C26 29 29 32 34 35 L38 30 L48 34 L48 40 C48 44 45 48 40 47 C25 45 11 31 9 16 C8 11 12 8 18 8 Z" />}
    {kind === 'back' && <path d="M34 10 L18 28 L34 46" />}
  </svg>
);

export const ChatHeader: React.FC<{ t: number }> = ({ t }) => {
  const renamed = t >= GROUP_RENAME;
  const glitch = t >= GROUP_RENAME && t < GROUP_RENAME + 0.3 ? Math.floor(t * 30) % 2 : 0;
  const typing = TYPING_NAME(t);
  const joined = t >= V(56.62);
  const members = joined ? 'THAT MAN 🔥, Riya, Aman, Kabir, Simran, Uncle…' : 'Riya, Aman, Kabir, Simran, Uncle, DJ Sector 17, You';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 108, height: 160, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(18,19,26,0.92)' }}>
      <div style={{ position: 'absolute', left: 14, top: 52 }}><Icon kind="back" /></div>
      <div style={{ position: 'absolute', left: 78, top: 32, width: 96, height: 96, borderRadius: 48, background: renamed ? 'radial-gradient(circle at 40% 35%, #ffd08a, #ff4d1a 55%, #a3150a)' : 'radial-gradient(circle at 40% 35%, #b07cff, #6a2bc2 60%, #2d0f5c)', fontSize: 52, lineHeight: '96px', textAlign: 'center' }}>
        {renamed ? '🔥' : '🎉'}
      </div>
      <div style={{ position: 'absolute', left: 196, top: 36, right: 200 }}>
        <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 40, color: '#fff', whiteSpace: 'nowrap', transform: glitch ? 'translateX(6px)' : 'none', textShadow: glitch ? '-4px 0 rgba(0,255,255,0.7), 4px 0 rgba(255,0,80,0.7)' : 'none' }}>
          {renamed !== !!glitch ? 'TOO HOT TO HANDLE 🔥' : 'SECTOR 17 PARTY 🎉'}
        </div>
        <div style={{ fontFamily: FONT.inter, fontWeight: 400, fontSize: 26, color: typing ? '#7ee08a' : C.dim, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{typing ?? members}</div>
      </div>
      <div style={{ position: 'absolute', right: 120, top: 52 }}><Icon kind="video" /></div>
      <div style={{ position: 'absolute', right: 40, top: 52 }}><Icon kind="phone" /></div>
    </div>
  );
};

// ───────────────────────── message layout ─────────────────────────
export const AV = 76;
const BX = 32 + AV + 16; // bubble left
const BW_MAX = 760;
const PAD_X = 24;
const TEXT_MAX = BW_MAX - PAD_X * 2;
const FS = 46, LH = 58, NAME_H = 40, TIME_H = 28, PAD_T = 16, PAD_B = 12, GAP = 16;
const DELETED = '🚫 This message was deleted';

const SCR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&?!';
export const scrambleText = (s: string, amt: number, seed: number) =>
  amt <= 0 ? s : Array.from(s).map((ch, i) => (ch === ' ' || ch.codePointAt(0)! > 0x2000 || rand(seed * 7.1 + i * 3.3) > amt ? ch : SCR[Math.floor(rand(seed * 13.7 + i * 1.9) * SCR.length)])).join('');

type Laid = { m: Msg; h: number; lines?: string[]; w: number; text?: string };
const layoutMsg = (m: Msg, t: number): Laid => {
  if (m.kind === 'system') {
    return { m, h: 64, w: Math.min(980, textW(m.text!, `600 26px ${FONT.inter}`) + 52) };
  }
  if (m.kind === 'typing') return { m, h: PAD_T + NAME_H + 46 + PAD_B, w: 190 };
  if (m.kind === 'photo') return { m, h: PAD_T + NAME_H + 640 + 12, w: 600 };
  if (m.kind === 'audio') return { m, h: PAD_T + NAME_H + 124 + TIME_H + PAD_B, w: 700 };
  if (m.kind === 'voice') return { m, h: PAD_T + NAME_H + 100 + TIME_H + PAD_B, w: 620 };
  if (m.kind === 'emoji') return { m, h: PAD_T + NAME_H + 110 + TIME_H + PAD_B, w: Math.max(300, textW(m.text!, `400 92px ${FONT.inter}`) + PAD_X * 2), text: m.text };
  const deleted = m.del !== undefined && t >= m.del;
  const text = deleted ? DELETED : m.text!;
  const weight = m.hot ? 600 : 400;
  const words = text.split(' ');
  const lines = wrapWords(words, FONT.inter, weight, FS, TEXT_MAX).map((ln) => ln.map((i) => words[i]).join(' '));
  const tw = Math.max(...lines.map((l) => textW(l, `${weight} ${FS}px ${FONT.inter}`)), textW(M[m.from!].name, `600 30px ${FONT.inter}`), 140);
  return { m, h: PAD_T + NAME_H + lines.length * LH + TIME_H + PAD_B, w: Math.min(BW_MAX, tw + PAD_X * 2), lines, text };
};

export type ChatFx = {
  bottom: number; // chat body bottom (px)
  scrollTo?: { id: string; amt: number }; // scroll back so this message sits near the top
  scramble?: number;
  sway?: number;
  warm?: number;
  flash?: string; // id of a message to highlight
};

const Waveform: React.FC<{ n: number; seed: number; prog: number; w: number; h: number; col: string; dim: string; t: number; live?: boolean }> = ({ n, seed, prog, w, h, col, dim, t, live }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    {Array.from({ length: n }, (_, k) => {
      const base = 0.25 + 0.75 * Math.abs(Math.sin(k * 0.9 + seed) * Math.cos(k * 0.37 + seed * 2));
      const bh = h * (live && k / n < prog ? Math.min(1, base * (0.8 + 0.4 * Math.abs(Math.sin(t * 9 + k)))) : base);
      const x = (k + 0.5) * (w / n);
      return <rect key={k} x={x - 3} y={(h - bh) / 2} width={6} height={bh} rx={3} fill={k / n < prog ? col : dim} />;
    })}
  </svg>
);

/** The chat itself (between header and the bottom area). Messages pop in at their time and the list stays scrolled to the newest one. */
export const ChatBody: React.FC<{ t: number; fx: ChatFx }> = ({ t, fx }) => {
  const top = 270;
  const H = fx.bottom - top;
  const shown = MSGS.filter((m) => t >= m.t && !(m.kind === 'typing' && t >= (m.end ?? 0)));
  const laid = shown.map((m) => layoutMsg(m, t));
  let y = 22;
  const pos = laid.map((l) => {
    const grow = l.m.t < 0 ? 1 : easeOutCubic(clamp((t - l.m.t) / 0.2));
    const out = { y, grow };
    y += (l.h + GAP) * grow;
    return out;
  });
  const content = y + 12;
  let off = Math.max(0, content - H);
  if (fx.scrollTo && fx.scrollTo.amt > 0) {
    const k = laid.findIndex((l) => l.m.id === fx.scrollTo!.id);
    if (k >= 0) off = lerp(off, Math.max(0, pos[k].y - 30), fx.scrollTo.amt);
  }
  const scr = fx.scramble ?? 0;
  const seed = Math.floor(t * 20);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, height: H, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: -off }}>
        {laid.map((l, i) => {
          const { m } = l;
          const p = pos[i];
          const pop = m.t < 0 ? 1 : easeOutBack(clamp((t - m.t) / 0.24), 1.6);
          const op = m.t < 0 ? 1 : clamp((t - m.t) / 0.1);
          const sway = fx.sway ? Math.sin(t * 6 + i * 0.8) * fx.sway : 0;
          if (m.kind === 'system') {
            return (
              <div key={m.id} style={{ position: 'absolute', left: 0, right: 0, top: p.y, height: l.h, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: op }}>
                <div style={{ padding: '10px 26px', borderRadius: 24, background: m.id === 'rn' || m.id === 'jn' ? 'rgba(255,77,26,0.18)' : C.sys, color: m.id === 'rn' || m.id === 'jn' ? '#ffb38a' : '#a3a9b6', fontFamily: FONT.inter, fontWeight: 600, fontSize: 26, whiteSpace: 'nowrap', transform: `scale(${lerp(0.85, 1, pop)})` }}>
                  {scrambleText(m.text!, scr, seed + i)}
                </div>
              </div>
            );
          }
          const mem = M[m.from!];
          const hot = !!m.hot;
          const deleted = m.del !== undefined && t >= m.del;
          const justDel = deleted ? clamp(1 - (t - m.del!) / 0.3) : 0;
          return (
            <div key={m.id} style={{ position: 'absolute', left: 0, right: 0, top: p.y, height: l.h, opacity: op }}>
              <div style={{ position: 'absolute', left: 32, top: l.h - AV - 6 }}>
                <Avatar m={mem} d={AV} id={`av-${m.id}`} ring={hot ? C.fire : undefined} />
              </div>
              <div style={{ position: 'absolute', left: BX, top: 0, width: l.w, height: l.h, transformOrigin: '0% 100%', transform: `scale(${pop}) skewX(${sway * 5}deg) translateX(${sway * 10}px)`, borderRadius: '8px 30px 30px 30px', background: hot ? 'linear-gradient(135deg, #ff6a2a, #e0281a)' : deleted ? '#1a1b22' : C.bubble, boxShadow: hot ? '0 0 26px rgba(255,77,26,0.45)' : justDel > 0 ? `0 0 0 3px rgba(255,80,80,${justDel})` : 'none', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: PAD_X, top: PAD_T, fontFamily: FONT.inter, fontWeight: 600, fontSize: 30, color: hot ? '#ffe7a8' : mem.color, whiteSpace: 'nowrap' }}>{scrambleText(mem.name, scr, seed + i * 5)}</div>
                <div style={{ position: 'absolute', left: PAD_X, right: PAD_X, top: PAD_T + NAME_H }}>
                  {m.kind === 'text' && l.lines!.map((ln, k) => (
                    <div key={k} style={{ fontFamily: FONT.inter, fontWeight: hot ? 600 : 400, fontStyle: deleted ? 'italic' : 'normal', fontSize: FS, lineHeight: `${LH}px`, color: deleted ? '#8d93a1' : '#fff', whiteSpace: 'nowrap' }}>{scrambleText(ln, scr, seed + i * 11 + k)}</div>
                  ))}
                  {m.kind === 'emoji' && <div style={{ fontSize: 92, lineHeight: '110px' }}>{m.text}</div>}
                  {m.kind === 'typing' && (
                    <div style={{ display: 'flex', gap: 12, height: 46, alignItems: 'center' }}>
                      {[0, 1, 2].map((k) => <div key={k} style={{ width: 16, height: 16, borderRadius: 8, background: '#cfd3dc', opacity: 0.4 + 0.6 * Math.max(0, Math.sin(t * 9 - k * 0.9)), transform: `translateY(${-6 * Math.max(0, Math.sin(t * 9 - k * 0.9))}px)` }} />)}
                    </div>
                  )}
                  {m.kind === 'photo' && <DoorPhoto t={t} at={m.t} />}
                  {m.kind === 'audio' && <AudioFile t={t} />}
                  {m.kind === 'voice' && <VoiceNote t={t} />}
                </div>
                {m.time && m.kind !== 'photo' && (
                  <div style={{ position: 'absolute', right: 18, bottom: 8, fontFamily: FONT.inter, fontWeight: 400, fontSize: 21, color: hot ? '#ffe0c8' : '#8d93a1' }}>{m.time}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {fx.warm ? <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(255,77,26,0.35), rgba(255,77,26,0) 60%)', opacity: fx.warm, pointerEvents: 'none' }} /> : null}
    </div>
  );
};

/** Simran's photo: That Man in the doorway, backlit, a little blurry. 552×640 */
export const DoorPhoto: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const dev = clamp((t - at) / 0.5); // photo "loads" from blurred
  return (
    <div style={{ position: 'relative', width: 552, height: 640, borderRadius: 18, overflow: 'hidden', background: '#120a1c' }}>
      <div style={{ position: 'absolute', inset: 0, filter: `blur(${lerp(14, 1.2, dev)}px)` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1c0f2e 0%, #2a1236 50%, #12081a 100%)' }} />
        {[[80, 120, '#ff4fa3'], [470, 90, '#4fb4ff'], [300, 60, '#b07cff']].map(([x, y, c], k) => (
          <div key={k} style={{ position: 'absolute', left: (x as number) - 70, top: (y as number) - 70, width: 140, height: 140, borderRadius: 70, background: c as string, opacity: 0.35, filter: 'blur(20px)' }} />
        ))}
        {/* the doorway, blazing */}
        <div style={{ position: 'absolute', left: 156, top: 96, width: 240, height: 544, background: 'linear-gradient(180deg, #fff6e0 0%, #ffd08a 35%, #ff8a2a 75%, #c23a0a 100%)', boxShadow: '0 0 90px 30px rgba(255,140,40,0.75)' }} />
        <div style={{ position: 'absolute', left: 136, top: 80, width: 280, height: 560, border: '20px solid #241430', borderBottom: 'none' }} />
        <div style={{ position: 'absolute', left: 60, top: 520, width: 432, height: 200, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,160,60,0.6), transparent 70%)' }} />
        <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: 276 - 230, top: 150, width: 460, height: 460, filter: 'brightness(0.55) contrast(1.2) drop-shadow(0 0 18px rgba(255,170,80,0.95))' }} />
        {/* partygoers in the foreground */}
        {[[40, 560, 1.0], [470, 580, 1.1], [150, 610, 0.9], [380, 600, 0.95]].map(([x, y, s], k) => (
          <div key={k} style={{ position: 'absolute', left: x as number, top: y as number, transform: `scale(${s})`, transformOrigin: '0 0' }}>
            <div style={{ position: 'absolute', left: 26, top: 0, width: 70, height: 84, borderRadius: '50% 50% 45% 45%', background: '#07040b' }} />
            <div style={{ position: 'absolute', left: 0, top: 70, width: 122, height: 120, borderRadius: '60px 60px 0 0', background: '#07040b' }} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
      <div style={{ position: 'absolute', right: 14, bottom: 12, fontFamily: FONT.inter, fontSize: 21, color: '#fff', textShadow: '0 1px 3px #000' }}>11:58</div>
      {dev < 1 && <div style={{ position: 'absolute', left: 236, top: 280, width: 80, height: 80, borderRadius: 40, border: '6px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', transform: `rotate(${t * 720}deg)`, opacity: 1 - dev }} />}
    </div>
  );
};

const PlayBtn: React.FC<{ d: number; playing: boolean; bg: string }> = ({ d, playing, bg }) => (
  <div style={{ width: d, height: d, borderRadius: d / 2, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
    {playing ? (
      <div style={{ display: 'flex', gap: d * 0.12 }}>
        <div style={{ width: d * 0.12, height: d * 0.38, background: '#fff', borderRadius: 3 }} />
        <div style={{ width: d * 0.12, height: d * 0.38, background: '#fff', borderRadius: 3 }} />
      </div>
    ) : (
      <div style={{ width: 0, height: 0, marginLeft: d * 0.08, borderTop: `${d * 0.2}px solid transparent`, borderBottom: `${d * 0.2}px solid transparent`, borderLeft: `${d * 0.32}px solid #fff` }} />
    )}
  </div>
);

export const PLAY_TAP = 12.62;
/** The DJ's track. Tapping play starts the song. */
const AudioFile: React.FC<{ t: number }> = ({ t }) => {
  const playing = t >= 13.0;
  const prog = playing ? clamp((t - 13.0) / 143.3) : 0;
  const elapsed = playing ? Math.floor(t - 13.0) : 0;
  return (
    <div style={{ width: 652 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <PlayBtn d={92} playing={playing} bg={C.fire} />
        <div>
          <Waveform n={34} seed={3} prog={prog} w={420} h={64} col="#ff9a5a" dim="#5b5f6e" t={t} live={playing} />
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, color: '#a3a9b6', marginTop: 4 }}>{playing ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}` : '2:23'}</div>
        </div>
      </div>
      <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 28, color: '#fff', marginTop: 8, whiteSpace: 'nowrap' }}>🎵 TOO HOT TO HANDLE.mp3</div>
    </div>
  );
};

/** That Man's voice note. */
const VoiceNote: React.FC<{ t: number }> = ({ t }) => {
  const at = V(60.62);
  const prog = clamp((t - at - 0.3) / 3);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, width: 572 }}>
      <PlayBtn d={84} playing={prog > 0 && prog < 1} bg="rgba(255,255,255,0.25)" />
      <Waveform n={30} seed={7} prog={prog} w={380} h={60} col="#fff" dim="rgba(255,255,255,0.4)" t={t} live />
      <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, color: '#ffe0c8' }}>0:07</div>
    </div>
  );
};

/** The input bar at the bottom of the chat. */
export const InputBar: React.FC = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 1514, height: 110, background: 'rgba(18,19,26,0.96)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ position: 'absolute', left: 28, top: 16, width: 840, height: 76, borderRadius: 38, background: '#1f2129', display: 'flex', alignItems: 'center', padding: '0 26px', gap: 18, color: '#7f8594', fontFamily: FONT.inter, fontSize: 32 }}>
      <span style={{ fontSize: 34 }}>🙂</span> Message
    </div>
    <div style={{ position: 'absolute', left: 890, top: 16, width: 76, height: 76, borderRadius: 38, background: C.fire, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="34" height="40" viewBox="0 0 34 40" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"><rect x="10" y="2" width="14" height="24" rx="7" fill="#fff" /><path d="M4 18 C4 34 30 34 30 18 M17 31 L17 38" /></svg>
    </div>
  </div>
);

/** Chat wallpaper: faint party doodles. */
export const Wallpaper: React.FC<{ warm: number }> = ({ warm }) => (
  <div style={{ position: 'absolute', inset: 0 }}>
    <div style={{ position: 'absolute', inset: 0, background: C.bg }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #2a0e06, #170704)', opacity: warm }} />
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>
      <defs>
        <pattern id="doodle" width="180" height="180" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="30" r="6" fill="#fff" />
          <path d="M90 20 l14 24 h-28 z" fill="none" stroke="#fff" strokeWidth="3" />
          <path d="M140 100 v-34 l20 -6 v30" fill="none" stroke="#fff" strokeWidth="3" />
          <circle cx="137" cy="101" r="6" fill="#fff" />
          <circle cx="157" cy="91" r="6" fill="#fff" />
          <path d="M40 120 l6 12 13 2 -10 9 3 13 -12 -7 -12 7 3 -13 -10 -9 13 -2 z" fill="none" stroke="#fff" strokeWidth="3" />
          <rect x="100" y="140" width="16" height="16" transform="rotate(30 108 148)" fill="none" stroke="#fff" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width="1080" height="1920" fill="url(#doodle)" />
    </svg>
  </div>
);

export { SONG_END, CHAT_OPEN };
