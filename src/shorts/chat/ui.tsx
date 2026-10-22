import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, F } from '../../theme';
import { VF } from '../../viral/fonts';
import { clamp, easeOutBack, easeOutCubic, lerp, rand } from '../../lib/time';
import { CAPTION, M, MSGS, Msg, PEOPLE, REACTIONS, START, TYPED, heatAt, lyricWords, tempAt } from './script';

// A generic dark-mode group chat (no real app's look), laid out on the 1080x1920 frame.
export const BG = '#0C0B10';
const BAR = 'rgba(19,18,24,0.97)';
const IN = '#24232B';
const OUT = '#3D63F5';
const TEXT = '#F3F1F7';
const MUTED = '#9B98A6';
export const Y = { status: 92, header: 242, input: 1052, kb: 1180 };

const ease = (t: number, at: number, d: number) => easeOutCubic(clamp((t - at) / d));
const pop = (t: number, at: number, d = 0.22) => (at < START ? 1 : easeOutBack(clamp((t - at) / d), 2.2));

// ───────────────────────── icons ─────────────────────────
const Thermo: React.FC<{ h: number; fill: string; level?: number }> = ({ h, fill, level = 0.6 }) => (
  <svg width={h * 0.42} height={h} viewBox="0 0 42 100">
    <rect x={12} y={4} width={18} height={66} rx={9} fill="none" stroke={fill} strokeWidth={6} />
    <circle cx={21} cy={78} r={17} fill={fill} />
    <rect x={17} y={14 + 52 * (1 - level)} width={8} height={60 - 52 * (1 - level)} rx={4} fill={fill} />
  </svg>
);
const Chevron = () => (
  <svg width={34} height={56} viewBox="0 0 34 56"><path d="M28 4 L6 28 L28 52" fill="none" stroke={TEXT} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// ───────────────────────── status bar + header ─────────────────────────
export const StatusBar: React.FC<{ t: number }> = ({ t }) => {
  const temp = tempAt(t);
  const warn = clamp((temp - 40) / 20);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: Y.status, background: BAR, display: 'flex', alignItems: 'center', padding: '8px 64px 0', fontFamily: F.sans, color: TEXT }}>
      <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: 0.5 }}>11:58</div>
      <div style={{ flex: 1 }} />
      <svg width={52} height={34} viewBox="0 0 52 34" style={{ marginRight: 22 }}>
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 13} y={26 - i * 8} width={9} height={8 + i * 8} rx={2} fill={TEXT} opacity={i < 3 ? 1 : 0.35} />)}
      </svg>
      <div style={{ fontSize: 32, fontWeight: 600, marginRight: 22 }}>5G</div>
      <div style={{ position: 'relative', width: 66, height: 32, border: `3px solid ${TEXT}`, borderRadius: 10, opacity: 0.95 }}>
        <div style={{ position: 'absolute', left: 3, top: 3, bottom: 3, width: 36, borderRadius: 5, background: warn > 0.5 ? C.gold : TEXT }} />
        <div style={{ position: 'absolute', right: -9, top: 8, width: 5, height: 11, borderRadius: 3, background: TEXT }} />
      </div>
    </div>
  );
};

/** Temperature readout in the header: white when cool, molten and pulsing when hot. */
const TempChip: React.FC<{ t: number }> = ({ t }) => {
  const temp = tempAt(t);
  const h = clamp((temp - 30) / 35);
  const col = h < 0.5 ? `rgb(255,${Math.round(lerp(255, 160, h * 2))},${Math.round(lerp(255, 60, h * 2))})` : `rgb(255,${Math.round(lerp(160, 60, (h - 0.5) * 2))},${Math.round(lerp(60, 30, (h - 0.5) * 2))})`;
  const beat = h > 0.55 ? 1 + 0.06 * Math.max(0, Math.sin(t * Math.PI * 2 * 2.53)) : 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px 10px 18px', borderRadius: 40, background: `rgba(255,${Math.round(lerp(255, 70, h))},${Math.round(lerp(255, 20, h))},${lerp(0.08, 0.28, h)})`, boxShadow: h > 0.4 ? `0 0 ${30 * h}px rgba(255,80,20,${0.6 * h})` : 'none', transform: `scale(${beat})` }}>
      <Thermo h={44} fill={col} level={0.25 + 0.75 * h} />
      <div style={{ fontFamily: F.sans, fontSize: 36, fontWeight: 600, color: col, fontVariantNumeric: 'tabular-nums' }}>{Math.round(temp)}°C</div>
    </div>
  );
};

export const Header: React.FC<{ t: number }> = ({ t }) => {
  const renamed = clamp((t - M.rename) / 0.25);
  const typing = MSGS.find((m) => m.kind === 'typing' && t >= m.at && t < m.until!);
  const joined = t >= M.join;
  const members = joined ? 'Simran, Riya, Kabir, Aman, That Man 🔥, You' : 'Simran, Riya, Kabir, Aman, You';
  const flash = t >= M.rename ? Math.exp(-(t - M.rename) * 5) : 0;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: Y.status, height: Y.header - Y.status, background: BAR, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 36px 0 30px', fontFamily: F.sans, color: TEXT }}>
      <Chevron />
      <div style={{ position: 'relative', width: 96, height: 96, margin: '0 22px 0 20px', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 48, background: 'linear-gradient(135deg,#5B4BDB,#2E7BD8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, opacity: 1 - renamed }}>🎉</div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 48, background: `radial-gradient(circle at 50% 70%, ${C.gold}, ${C.fire} 55%, ${C.red})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, opacity: renamed, boxShadow: `0 0 ${40 * flash}px ${C.fire}` }}>🔥</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ position: 'relative', height: 54 }}>
          <div style={{ position: 'absolute', fontSize: 42, fontWeight: 600, whiteSpace: 'nowrap', opacity: 1 - renamed }}>party squad 🎉</div>
          <div style={{ position: 'absolute', fontSize: 42, fontWeight: 600, whiteSpace: 'nowrap', opacity: renamed, color: flash > 0.05 ? `rgb(255,${Math.round(255 - 120 * flash)},${Math.round(255 - 200 * flash)})` : TEXT, textShadow: `0 0 ${30 * flash}px ${C.fire}` }}>TOO HOT TO HANDLE 🔥</div>
        </div>
        <div style={{ fontSize: 29, color: typing ? (typing.from === 'him' ? '#FF9A4D' : PEOPLE[typing.from!].color) : MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 4 }}>
          {typing ? `${PEOPLE[typing.from!].name} is typing…` : members}
        </div>
      </div>
      <TempChip t={t} />
    </div>
  );
};

// ───────────────────────── messages ─────────────────────────
const EMBER_BG = `radial-gradient(circle at 50% 78%, ${C.ember} 0%, #8a2408 40%, #1a0603 82%)`;

/** His display picture (Albert's faceless portrait) on an ember backdrop, with a hot rim. */
export const HisFace: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ position: 'relative', width: size, height: size, borderRadius: size / 2, overflow: 'hidden', flexShrink: 0, background: EMBER_BG, boxShadow: `0 0 ${size * 0.4}px rgba(255,90,20,0.6)` }}>
    <Img src={staticFile('shorts/that-man-avatar.png')} style={{ width: '100%', height: '100%', display: 'block' }} />
    <div style={{ position: 'absolute', inset: 0, borderRadius: size / 2, boxShadow: `inset 0 0 0 ${Math.max(2, size * 0.045)}px rgba(255,150,70,0.75)` }} />
  </div>
);

const Avatar: React.FC<{ who: string }> = ({ who }) => {
  if (who === 'him') return <HisFace size={66} />;
  const p = PEOPLE[who as keyof typeof PEOPLE];
  return <div style={{ width: 66, height: 66, borderRadius: 33, background: `${p.color}33`, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.sans, fontWeight: 600, fontSize: 32 }}>{p.name[0]}</div>;
};

const Stamp: React.FC<{ light?: boolean }> = ({ light }) => (
  <span style={{ float: 'right', fontSize: 24, color: light ? 'rgba(255,255,255,0.7)' : MUTED, margin: '18px 0 -6px 22px' }}>11:58</span>
);

const Reacts: React.FC<{ t: number; id: string; right?: boolean }> = ({ t, id, right }) => {
  const rs = REACTIONS.filter((r) => r.msg === id && t >= r.at);
  if (!rs.length) return null;
  return (
    <div style={{ position: 'absolute', bottom: -34, [right ? 'right' : 'left']: 26, display: 'flex', gap: 8 }}>
      {rs.map((r) => {
        const s = pop(t, r.at, 0.3);
        // the heart on "Heart went pop" leaves its chip and inflates (fx.HeartPop draws it)
        const gone = r.emoji === '❤️' && t >= M.heart + 0.14;
        return (
          <div key={r.emoji} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px', borderRadius: 30, background: '#2C2B34', border: `4px solid ${BG}`, transform: `scale(${s})`, transformOrigin: right ? '100% 50%' : '0% 50%', fontFamily: F.sans, fontSize: 30, color: TEXT, opacity: gone ? 0 : 1 }}>
            <span>{r.emoji}</span>
            {r.n > 1 && <span style={{ fontSize: 26, fontWeight: 600, color: '#D8D5E0' }}>{r.n}</span>}
          </div>
        );
      })}
    </div>
  );
};

/** Fake photo, blown out by the heat: white core, orange falloff, a barely-there silhouette and a flare. */
const HotPhoto: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const dev = ease(t, at, 0.6); // the photo "develops" from pure white
  return (
    <div style={{ position: 'relative', width: 560, height: 420, borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(ellipse 60% 70% at 50% 46%, #ffffff 0%, #fff1d2 20%, #ffb547 42%, #e0501a 64%, #43110b 92%)' }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ position: 'absolute', left: 30 + rand(i * 3.1) * 500, top: 30 + rand(i * 5.3) * 340, width: 40 + rand(i) * 60, height: 40 + rand(i) * 60, borderRadius: '50%', background: `rgba(255,${200 + Math.round(rand(i * 2) * 55)},170,0.35)`, filter: 'blur(4px)' }} />
      ))}
      {/* him, barely: the same portrait as his DP, washed out by the glare */}
      <Img src={staticFile('shorts/that-man.png')} style={{ position: 'absolute', left: 50, top: 10, width: 460, height: 460, filter: 'brightness(1.5) contrast(0.7) saturate(1.2) blur(3px)', opacity: 0.75, mixBlendMode: 'multiply' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 34% 40% at 52% 36%, rgba(255,255,255,0.9), rgba(255,240,210,0.35) 60%, transparent)', mixBlendMode: 'screen' }} />
      <div style={{ position: 'absolute', left: -40, right: -40, top: 190, height: 6, background: 'rgba(255,255,255,0.95)', boxShadow: '0 0 30px 12px rgba(255,220,160,0.8)', transform: 'rotate(-4deg)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 1 - dev }} />
    </div>
  );
};

/** One of his messages: a lyric line that glows word by word as it's sung, with a small translation under it. */
const LyricText: React.FC<{ t: number; m: Msg; heat: number }> = ({ t, m, heat }) => {
  const ws = lyricWords(m);
  return (
    <>
      <div style={{ fontSize: 50, fontWeight: 600, lineHeight: 1.2, letterSpacing: -0.3 }}>
        {ws.map((w, i) => {
          const s = clamp((t - (w.t - 0.05)) / 0.12);
          const kick = s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0;
          return (
            <span key={i} style={{ display: 'inline-block', marginRight: 13, color: s > 0 ? `rgb(255,${Math.round(lerp(236, 246, s))},${Math.round(lerp(220, 214, s))})` : 'rgba(255,236,220,0.5)', textShadow: s > 0 ? `0 0 ${14 + 16 * heat}px rgba(255,150,50,${0.55 + 0.35 * heat}), 0 0 4px rgba(255,220,160,0.6)` : 'none', transform: `translateY(${-6 * kick}px) scale(${1 + 0.08 * kick})` }}>
              {w.w}
            </span>
          );
        })}
      </div>
      {m.tr && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,190,140,0.2)', fontSize: 30, lineHeight: 1.3, color: 'rgba(255,215,185,0.66)' }}>
          <span style={{ fontSize: 21, fontWeight: 600, letterSpacing: 2, marginRight: 12, color: 'rgba(255,190,140,0.6)' }}>EN</span>{m.tr}
        </div>
      )}
    </>
  );
};

/** The track as a shared link card: the in-story call to action. */
const SongCard: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const p = clamp((t - at - 0.5) / 2.6);
  return (
    <div style={{ display: 'flex', gap: 26, alignItems: 'center', width: 700 }}>
      <div style={{ position: 'relative', width: 210, height: 210, borderRadius: 22, overflow: 'hidden', flexShrink: 0, background: `radial-gradient(circle at 50% 80%, ${C.gold}, ${C.fire} 45%, #5a0d06 85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: VF.melt, fontVariationSettings: "'YEAR' 2026", fontSize: 40, lineHeight: 1.02, textAlign: 'center', color: C.cream, textShadow: '0 4px 14px rgba(80,0,0,0.6)' }}>TOO<br />HOT TO<br />HANDLE</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 3, color: 'rgba(255,200,150,0.7)' }}>SHARED A SONG</div>
        <div style={{ fontSize: 42, fontWeight: 600, lineHeight: 1.15, marginTop: 6, color: C.cream }}>TOO HOT TO HANDLE</div>
        <div style={{ fontSize: 30, color: 'rgba(255,225,200,0.75)', marginTop: 4 }}>full song on the channel</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
          <div style={{ width: 62, height: 62, borderRadius: 31, background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={24} height={28} viewBox="0 0 24 28"><path d="M3 2 L22 14 L3 26 Z" fill={C.red} /></svg>
          </div>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.18)' }}>
            <div style={{ width: `${8 + 30 * p}%`, height: '100%', borderRadius: 4, background: C.gold, boxShadow: `0 0 12px ${C.gold}` }} />
          </div>
          <div style={{ fontSize: 26, color: 'rgba(255,225,200,0.75)', fontVariantNumeric: 'tabular-nums' }}>2:32</div>
        </div>
      </div>
    </div>
  );
};

const Dots: React.FC<{ t: number; hot: boolean }> = ({ t, hot }) => (
  <div style={{ display: 'flex', gap: 12, padding: '8px 4px' }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ width: 18, height: 18, borderRadius: 9, background: hot ? C.ember : MUTED, transform: `translateY(${-9 * Math.max(0, Math.sin((t * 2.4 - i * 0.18) * Math.PI * 2))}px)`, boxShadow: hot ? `0 0 12px ${C.fire}` : 'none' }} />
    ))}
  </div>
);

const Row: React.FC<{ t: number; m: Msg; first: boolean; last: boolean; heat: number }> = ({ t, m, first, last, heat }) => {
  if (m.kind === 'system') {
    const s = pop(t, m.at);
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '22px 60px 6px' }}>
        <div style={{ maxWidth: 860, textAlign: 'center', padding: '14px 30px', borderRadius: 28, background: 'rgba(36,35,43,0.95)', fontSize: 30, lineHeight: 1.3, color: '#BDB9C8', transform: `scale(${s})` }}>{m.text}</div>
      </div>
    );
  }
  const who = m.from!;
  const out = who === 'you';
  const him = who === 'him';
  const s = pop(t, m.at);
  const enter = clamp((t - m.at) / 0.12);
  const rs = REACTIONS.some((r) => r.msg === m.id && t >= r.at);
  const radius = out ? `38px 38px ${last ? 10 : 38}px 38px` : `38px 38px 38px ${last ? 10 : 38}px`;
  const bubble: React.CSSProperties = him
    ? { background: 'linear-gradient(160deg,#3d1309,#5c1708 60%,#7a1f07)', border: '2px solid rgba(255,140,60,0.55)', boxShadow: `0 0 ${26 + 40 * heat}px rgba(255,90,20,${0.32 + 0.4 * heat})`, color: C.cream }
    : { background: out ? OUT : IN, color: TEXT };
  const pad = m.kind === 'photo' ? '10px 10px 18px' : m.kind === 'typing' ? '22px 30px' : '20px 32px 22px';
  return (
    <div style={{ display: 'flex', justifyContent: out ? 'flex-end' : 'flex-start', alignItems: 'flex-end', padding: `${first ? 20 : 6}px ${out ? 40 : 90}px ${rs ? 40 : 0}px ${out ? 160 : 26}px` }}>
      {!out && <div style={{ width: 84, flexShrink: 0, alignSelf: 'flex-end' }}>{last && <Avatar who={who} />}</div>}
      <div style={{ position: 'relative', maxWidth: m.kind === 'song' ? 800 : 780, padding: pad, borderRadius: radius, ...bubble, transform: `scale(${s})`, transformOrigin: out ? '100% 100%' : '0% 100%', opacity: enter, fontSize: m.big ? 54 : 44, lineHeight: 1.25, fontWeight: m.big ? 600 : 400 }}>
        {first && !out && <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 6, color: him ? '#FFB067' : PEOPLE[who].color, padding: m.kind === 'photo' ? '6px 18px 4px' : 0 }}>{PEOPLE[who].name}</div>}
        {m.kind === 'text' && <>{m.text}<Stamp light={out} /></>}
        {m.kind === 'photo' && <><HotPhoto t={t} at={m.at} /><div style={{ padding: '12px 20px 0', fontSize: 40 }}>{m.text}<Stamp /></div></>}
        {m.kind === 'typing' && <Dots t={t} hot={him} />}
        {m.kind === 'lyric' && <LyricText t={t} m={m} heat={heat} />}
        {m.kind === 'song' && <SongCard t={t} at={m.at} />}
        <Reacts t={t} id={m.id} right={out} />
      </div>
    </div>
  );
};

/** Bottom-anchored message list; each new row opens from 0 height so the history scrolls up smoothly. */
export const Feed: React.FC<{ t: number }> = ({ t }) => {
  const heat = heatAt(t);
  const vis = MSGS.filter((m) => m.at <= t && !(m.kind === 'typing' && t > m.until! + 0.16));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: Y.header, height: Y.input - Y.header, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 26, fontFamily: F.sans }}>
      {vis.map((m, i) => {
        const prev = vis[i - 1], next = vis[i + 1];
        const first = !prev || prev.kind === 'system' || prev.from !== m.from;
        const last = !next || next.kind === 'system' || next.from !== m.from;
        let o = m.at < START ? 1 : ease(t, m.at, 0.24);
        if (m.kind === 'typing') o *= 1 - ease(t, m.until!, 0.16);
        return (
          <div key={m.id} style={{ display: 'grid', gridTemplateRows: `${o}fr`, flexShrink: 0 }}>
            <div style={{ minHeight: 0, overflow: o < 0.999 ? 'hidden' : 'visible' }}>
              <Row t={t} m={m} first={first} last={last} heat={heat} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ───────────────────────── input + keyboard ─────────────────────────
const typedCount = (t: number) => Math.floor(clamp((t - TYPED.from) / (TYPED.to - TYPED.from)) * TYPED.text.length + (t >= TYPED.to ? 1 : 0));
const SENT = MSGS.find((m) => m.id === TYPED.msg)!.at;

export const InputBar: React.FC<{ t: number }> = ({ t }) => {
  const n = t >= SENT ? 0 : Math.min(TYPED.text.length, typedCount(t));
  const text = TYPED.text.slice(0, n);
  const caret = n > 0 && Math.floor(t * 2.2) % 2 === 0;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: Y.input, height: Y.kb - Y.input, background: BAR, display: 'flex', alignItems: 'center', gap: 22, padding: '0 30px', fontFamily: F.sans }}>
      <svg width={52} height={52} viewBox="0 0 52 52"><path d="M26 8 V44 M8 26 H44" stroke={MUTED} strokeWidth={5} strokeLinecap="round" /></svg>
      <div style={{ flex: 1, height: 88, borderRadius: 44, background: IN, display: 'flex', alignItems: 'center', padding: '0 32px', fontSize: 40, color: n ? TEXT : '#6E6B79', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {n ? text : 'Message'}
        {caret && <span style={{ display: 'inline-block', width: 4, height: 48, marginLeft: 3, background: OUT }} />}
      </div>
      <div style={{ width: 88, height: 88, borderRadius: 44, background: n ? OUT : '#2E2D35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {n ? (
          <svg width={40} height={40} viewBox="0 0 40 40"><path d="M20 34 V8 M8 19 L20 7 L32 19" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg width={36} height={46} viewBox="0 0 36 46"><rect x={10} y={2} width={16} height={28} rx={8} fill={MUTED} /><path d="M3 22 C3 32 9 37 18 37 C27 37 33 32 33 22 M18 37 V44" stroke={MUTED} strokeWidth={4} fill="none" strokeLinecap="round" /></svg>
        )}
      </div>
    </div>
  );
};

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const KW = 93.4, KH = 116, GAP = 14;
const keyPos = (c: string) => {
  const l = c.toLowerCase();
  for (let r = 0; r < 3; r++) {
    const i = ROWS[r].indexOf(l);
    if (i >= 0) {
      const x0 = r === 0 ? 10 : r === 1 ? 10 + (KW + GAP) / 2 : 10 + (KW + GAP) * 1.5;
      return { x: x0 + i * (KW + GAP), y: Y.kb + 106 + r * (KH + 22), w: KW };
    }
  }
  return { x: 10 + 2.5 * (KW + GAP) + 110, y: Y.kb + 106 + 3 * (KH + 22), w: 480 };
};

export const Keyboard: React.FC<{ t: number }> = ({ t }) => {
  const heat = heatAt(t);
  const n = typedCount(t);
  const pressing = t >= TYPED.from && t < TYPED.to + 0.08 && n > 0 && n <= TYPED.text.length ? TYPED.text[n - 1] : null;
  const since = (t - TYPED.from) % ((TYPED.to - TYPED.from) / TYPED.text.length);
  const kp = pressing ? keyPos(pressing) : null;
  const glow = clamp((heat - 0.25) / 0.6);
  const key = (x: number, y: number, w: number, label: React.ReactNode, dark = false, k = 0) => (
    <div key={`${x}-${y}`} style={{ position: 'absolute', left: x, top: y, width: w, height: KH, borderRadius: 16, background: dark ? '#26252C' : '#3A3941', boxShadow: `0 3px 0 rgba(0,0,0,0.5)${glow > 0 ? `, inset 0 -${10 + 30 * glow * rand(k)}px ${24 * glow}px rgba(255,${Math.round(90 + 60 * rand(k * 3))},20,${0.6 * glow})` : ''}`, color: TEXT, fontSize: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{label}</div>
  );
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: Y.kb, bottom: 0, background: '#17161C', fontFamily: F.sans }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 92, display: 'flex', alignItems: 'center', fontSize: 36, color: '#D9D6E2' }}>
        {['yaar', 'bro', '😭'].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center', borderLeft: i ? '2px solid #2C2B33' : 'none' }}>{s}</div>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, top: -Y.kb }}>
        {ROWS.map((row, r) => row.split('').map((c, i) => {
          const p = keyPos(c);
          return key(p.x, p.y, KW, c, false, r * 10 + i);
        }))}
        {key(10, Y.kb + 106 + 2 * (KH + 22), 1.4 * KW, '⇧', true, 40)}
        {key(1080 - 10 - 1.4 * KW, Y.kb + 106 + 2 * (KH + 22), 1.4 * KW, '⌫', true, 41)}
        {key(10, Y.kb + 106 + 3 * (KH + 22), 2.4 * KW, <span style={{ fontSize: 36 }}>123</span>, true, 42)}
        {key(10 + 2.4 * KW + GAP, Y.kb + 106 + 3 * (KH + 22), 110 - GAP, '☺', true, 43)}
        {key(10 + 2.5 * (KW + GAP) + 110, Y.kb + 106 + 3 * (KH + 22), 480, <span style={{ fontSize: 34, color: MUTED }}>space</span>, false, 44)}
        {key(1080 - 10 - 2.2 * KW, Y.kb + 106 + 3 * (KH + 22), 2.2 * KW, <span style={{ fontSize: 34 }}>return</span>, true, 45)}
        {kp && pressing !== ' ' && since < 0.09 && (
          <div style={{ position: 'absolute', left: kp.x - 14, top: kp.y - 150, width: KW + 28, height: 150 + KH, borderRadius: 22, background: '#55545D', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', paddingTop: 22, fontSize: 70, color: TEXT }}>{pressing}</div>
        )}
      </div>
      <div style={{ position: 'absolute', left: 400, width: 280, top: 700, height: 10, borderRadius: 5, background: '#E8E6EE' }} />
    </div>
  );
};

// ───────────────────────── system overlays ─────────────────────────
export const Banner: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.bannerIn - 0.1 || t > M.bannerOut + 0.5) return null;
  const inP = easeOutBack(clamp((t - M.bannerIn) / 0.4), 1.2);
  const outP = easeOutCubic(clamp((t - M.bannerOut) / 0.35));
  const y = lerp(-230, 34, inP) - 270 * outP;
  return (
    <div style={{ position: 'absolute', left: 28, right: 28, top: y, height: 176, borderRadius: 46, background: 'rgba(44,42,50,0.97)', boxShadow: '0 18px 50px rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', gap: 28, padding: '0 34px', fontFamily: F.sans }}>
      <div style={{ width: 100, height: 100, borderRadius: 26, background: `linear-gradient(160deg, ${C.gold}, ${C.fire})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Thermo h={66} fill="#fff" level={0.8} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', fontSize: 38, fontWeight: 600, color: TEXT }}>Phone is getting warm<span style={{ flex: 1 }} /><span style={{ fontSize: 26, fontWeight: 400, color: MUTED }}>now</span></div>
        <div style={{ fontSize: 30, color: '#C4C1CE', marginTop: 6, lineHeight: 1.3 }}>Some features are limited until it cools down.</div>
      </div>
    </div>
  );
};

/** The overheating alert. "Keep reading 🔥" gets tapped, and the phone melts. */
export const Modal: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.modal) return null;
  const p = clamp((t - M.modal) / 0.18);
  const s = lerp(0.78, 1, easeOutBack(clamp((t - M.modal) / 0.26), 2));
  let shake = 0;
  for (const k of [80.08, 80.66]) if (t >= k) shake += 18 * Math.exp(-(t - k) * 11) * Math.sin((t - k) * 70);
  const tap = t - M.tap;
  const glowPulse = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 * 2.5);
  return (
    <AbsoluteFill style={{ fontFamily: F.sans }}>
      <AbsoluteFill style={{ background: `rgba(0,0,0,${0.58 * p})` }} />
      <div style={{ position: 'absolute', left: 90, width: 900, top: 380, borderRadius: 56, background: '#1F1E25', boxShadow: `0 30px 90px rgba(0,0,0,0.6), 0 0 ${80 * glowPulse}px rgba(255,60,20,0.45)`, padding: '60px 56px 44px', textAlign: 'center', opacity: p, transform: `translateX(${shake}px) scale(${s})` }}>
        <div style={{ display: 'flex', justifyContent: 'center', filter: `drop-shadow(0 0 ${24 * glowPulse}px ${C.red})` }}><Thermo h={170} fill="#FF3B30" level={1} /></div>
        <div style={{ fontSize: 62, fontWeight: 600, color: TEXT, marginTop: 30, letterSpacing: 1 }}>TOO HOT TO HANDLE</div>
        <div style={{ fontSize: 36, color: '#B9B6C2', marginTop: 18, lineHeight: 1.38 }}>This phone needs to cool down before you can keep reading.</div>
        <div style={{ marginTop: 44, height: 116, borderRadius: 30, background: '#2F2E36', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, color: TEXT }}>Cool down</div>
        <div style={{ position: 'relative', overflow: 'hidden', marginTop: 20, height: 116, borderRadius: 30, background: `linear-gradient(90deg, ${C.fire}, ${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, fontWeight: 600, color: '#fff', filter: tap > 0 && tap < 0.3 ? 'brightness(0.8)' : undefined }}>
          Keep reading 🔥
          {tap > 0 && <div style={{ position: 'absolute', left: 394 - 300 * ease(tap, 0, 0.3), top: 58 - 300 * ease(tap, 0, 0.3), width: 600 * ease(tap, 0, 0.3), height: 600 * ease(tap, 0, 0.3), borderRadius: '50%', background: `rgba(255,255,255,${0.45 * (1 - clamp(tap / 0.3))})` }} />}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** His profile photo, opened full screen from the chat just before he starts typing. */
export const ProfileView: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.dpIn || t > M.dpOut + 0.2) return null;
  const inP = easeOutCubic(clamp((t - M.dpIn) / 0.22));
  const o = inP * (1 - clamp((t - M.dpOut) / 0.16));
  const typing = MSGS.some((m) => m.kind === 'typing' && m.from === 'him' && t >= m.at && t < m.until!);
  const drift = clamp((t - M.dpIn) / (M.dpOut - M.dpIn));
  return (
    <AbsoluteFill style={{ opacity: o, fontFamily: F.sans }}>
      <AbsoluteFill style={{ background: '#050406' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: Y.status, height: Y.header - Y.status, display: 'flex', alignItems: 'center', gap: 28, padding: '0 36px 0 30px', color: TEXT }}>
        <Chevron />
        <div>
          <div style={{ fontSize: 44, fontWeight: 600 }}>That Man 🔥</div>
          <div style={{ fontSize: 29, marginTop: 4, color: typing ? '#FF9A4D' : MUTED }}>{typing ? 'typing…' : 'online'}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 400, width: 1080, height: 1080, overflow: 'hidden', background: EMBER_BG, transform: `scale(${lerp(0.84, 1, inP)})` }}>
        {/* oversized so the portrait's curved bottom edge falls outside the square */}
        <Img src={staticFile('shorts/that-man.png')} style={{ position: 'absolute', left: -140, top: -10, width: 1360, height: 1360, transform: `scale(${1 + 0.05 * drift})`, transformOrigin: '50% 25%' }} />
      </div>
    </AbsoluteFill>
  );
};

/** Opening caption in the empty space above the first messages, gone before the chat fills up. */
export const Caption: React.FC<{ t: number }> = ({ t }) => {
  const out = clamp((t - CAPTION.out) / 0.3);
  if (out >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: 1 - out, transform: `translateY(${-30 * easeOutCubic(out)}px)`, fontFamily: F.sans }}>
      {CAPTION.lines.map((l) => (
        <div key={l} style={{ padding: '12px 32px 16px', borderRadius: 22, background: '#fff', color: '#121116', fontSize: 58, fontWeight: 600, letterSpacing: -0.5, boxShadow: '0 12px 34px rgba(0,0,0,0.5)' }}>{l}</div>
      ))}
    </div>
  );
};

/** Faint doodle wallpaper behind the messages. */
export const Wallpaper: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <pattern id="doodles" width={240} height={240} patternUnits="userSpaceOnUse">
        <g fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.05} strokeLinecap="round">
          <path d="M40 60 c-10-18 18-22 14-4 c-4 14-18 18-14 4z" />
          <circle cx={170} cy={50} r={14} />
          <path d="M150 170 l10 -22 l10 22 l-22 -14 h24 z" />
          <path d="M40 180 q20 -30 40 0 q-20 30 -40 0" />
          <path d="M110 110 h20 M120 100 v20" />
        </g>
      </pattern>
    </defs>
    <rect width={1080} height={1920} fill={BG} />
    <rect width={1080} height={1920} fill="url(#doodles)" />
  </svg>
);
