import React, { useEffect, useRef } from 'react';
import { AbsoluteFill } from 'remotion';
import { C, F, HEAT_GRADIENT } from '../../theme';
import { VF } from '../../viral/fonts';
import { Cracks } from '../../viral/fx';
import { beatAt, clamp, easeInCubic, easeOutBack, easeOutCubic, lerp, rand } from '../../lib/time';
import { Anchor, Mirror, Portrait, Uncle } from './art';
import { INK, L, NAVY, RED, tempColor } from './broadcast';
import { COMMENTS, SG, ST, kf, songOf, tempAt } from './script';

// The pictures on air, each drawn in the 1080 x L.picH picture box.
const W = 1080, H = L.picH;
const ease = (t: number, a: number, d: number) => easeOutCubic(clamp((t - a) / d));
const pop = (t: number, a: number, d = 0.25, s = 2) => (t < a ? 0 : easeOutBack(clamp((t - a) / d), s));

// ───────────────────────── BREAKING NEWS opener (full frame) ─────────────────────────
export const Slam: React.FC<{ t: number }> = ({ t }) => {
  const out = clamp((t - (ST.studio - 0.2)) / 0.3);
  if (out >= 1) return null;
  const head = ease(t, 0.3, 0.3);
  const spin = t * 18;
  const zoom = 1.03 - 0.03 * ease(t, 0, 0.4) + 0.012 * Math.sin(t * 9);
  return (
    <AbsoluteFill style={{ clipPath: `polygon(${out * 140}% 0, 100% 0, 100% 100%, ${out * 140 - 40}% 100%)` }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, #E3101C 0%, #8E0610 45%, #2A0205 100%)' }} />
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${spin}deg at 50% 42%, rgba(255,255,255,0.09) 0deg 7deg, transparent 7deg 20deg)` }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${zoom})` }}>
        <div style={{ marginTop: -170, textAlign: 'center', fontFamily: VF.cond, lineHeight: 0.92 }}>
          <div style={{ fontSize: 250, color: '#fff', letterSpacing: 6, textShadow: '0 12px 0 #6B0008, 0 20px 40px rgba(0,0,0,0.5)' }}>BREAKING</div>
          <div style={{ display: 'inline-block', marginTop: 16, padding: '10px 50px 0', background: '#fff', color: RED, fontSize: 250, letterSpacing: 6, boxShadow: '0 20px 40px rgba(0,0,0,0.45)' }}>NEWS</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 50, right: 50, top: 1240, padding: '22px 30px 14px', background: '#fff', textAlign: 'center', fontFamily: VF.cond, fontSize: 84, lineHeight: 1, color: '#7A0A10', transform: `translateY(${(1 - head) * 60}px)`, opacity: head, boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}>CITY HITS 49°C AT MIDNIGHT</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1400, textAlign: 'center', fontFamily: VF.hud, fontSize: 36, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: 4, opacity: head }}>GARMI 24×7 · LIVE · 11:58 PM</div>
    </AbsoluteFill>
  );
};

// ───────────────────────── the studio ─────────────────────────
const WALL = { x: 78, y: 70, cw: 300, ch: 176, gap: 12 };
const screens = Array.from({ length: 6 }, (_, i) => ({ c: i % 3, r: Math.floor(i / 3) }));

/** What the monitor wall shows: the heat story, nothing, or him spread across all six screens. */
const WallScreen: React.FC<{ t: number; c: number; r: number; mode: 'news' | 'him'; boot: number; sky: boolean }> = ({ t, c, r, mode, boot, sky }) => {
  const x = WALL.x + c * (WALL.cw + WALL.gap), y = WALL.y + r * (WALL.ch + WALL.gap);
  const wallW = 3 * WALL.cw + 2 * WALL.gap;
  const flash = boot > 0 && boot < 1 ? 1 - boot : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: WALL.cw, height: WALL.ch, overflow: 'hidden', background: '#05070E', border: '3px solid #1C2540', borderRadius: 4 }}>
      {mode === 'news' ? (
        <div style={{ position: 'absolute', inset: 0, background: c === 1 ? `radial-gradient(circle at 50% 60%, ${C.gold}, ${C.fire} 40%, #4A0A06 85%)` : 'linear-gradient(160deg, #10213F, #0A1328)' }}>
          {c === 1 && r === 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VF.cond, fontSize: 96, color: '#fff', textShadow: '0 0 20px rgba(255,120,30,0.9)' }}>{Math.round(tempAt(t))}°C</div>}
          {sky && c !== 1 && r === 0 && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: c === 0 ? 'linear-gradient(180deg, #F7A440, #C2452A 70%, #3A1530)' : 'linear-gradient(180deg, #0A1230, #1B2A5C)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <div style={{ fontSize: 78, lineHeight: 1 }}>{c === 0 ? '🌇' : '🌙'}</div>
              <div style={{ fontFamily: VF.cond, fontSize: 34, letterSpacing: 2, color: '#fff' }}>{c === 0 ? 'SUNSET 6:58 PM' : 'NOW 11:58 PM'}</div>
            </div>
          )}
          {c === 1 && r === 1 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VF.cond, fontSize: 48, letterSpacing: 3, color: '#fff' }}>HEAT ALERT</div>}
          {c !== 1 && <div style={{ position: 'absolute', left: 20, right: 20, top: 30, bottom: 30, background: 'repeating-linear-gradient(90deg, rgba(110,150,220,0.25) 0 2px, transparent 2px 46px), repeating-linear-gradient(0deg, rgba(110,150,220,0.25) 0 2px, transparent 2px 40px)' }} />}
        </div>
      ) : boot > 0 ? (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 80%, ${C.ember}, #6B1A06 45%, #120402 90%)` }}>
          <Portrait src="that-man" w={wallW} x={-(x - WALL.x)} y={-(y - WALL.y) - 150} style={{ filter: `brightness(${1 + flash * 2})` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 5px)' }} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 40%)' }} />
    </div>
  );
};

export const Studio: React.FC<{ t: number; zoom: number; origin: string; dark?: number; mode: 'news' | 'him'; boots?: number[]; crack?: number; rim?: number; turn?: number; heat?: number; sky?: boolean }> = ({ t, zoom, origin, dark = 0, mode, boots = [], crack = 0, rim = 0.4, turn = 0, heat = 0, sky = false }) => (
  <AbsoluteFill style={{ overflow: 'hidden' }}>
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: origin }}>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0B1838 0%, #070C1E 60%, #04060E 100%)' }} />
      {/* light strips and a soft key light */}
      {[18, 1040].map((x) => <div key={x} style={{ position: 'absolute', left: x, top: 40, width: 22, height: 560, borderRadius: 11, background: mode === 'him' ? C.fire : '#3E7BFF', boxShadow: `0 0 60px 14px ${mode === 'him' ? 'rgba(255,90,20,0.45)' : 'rgba(62,123,255,0.4)'}`, opacity: 0.85 }} />)}
      <div style={{ position: 'absolute', left: WALL.x - 18, top: WALL.y - 18, width: 3 * WALL.cw + 2 * WALL.gap + 36, height: 2 * WALL.ch + WALL.gap + 36, borderRadius: 10, background: '#0A0F1E', boxShadow: mode === 'him' && boots.some((b) => b > 0) ? '0 0 90px rgba(255,100,30,0.45)' : '0 0 50px rgba(40,80,200,0.25)' }} />
      {screens.map((s, i) => <WallScreen key={i} t={t} c={s.c} r={s.r} mode={mode} boot={mode === 'him' ? boots[i] ?? 0 : 1} sky={sky} />)}
      {crack > 0 && <Cracks x={560} y={WALL.y + WALL.ch} p={crack} v={0.92} seed={5} n={12} r={620} w={3} />}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 40% 35% at 50% 62%, rgba(255,240,220,0.13), transparent 70%)' }} />
      <div style={{ position: 'absolute', left: 280, top: 300 }}><Anchor w={520} rim={rim} turn={turn} /></div>
      {/* the desk */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#24304F" />
            <stop offset="0.12" stopColor="#141C33" />
            <stop offset="1" stopColor="#070A14" />
          </linearGradient>
        </defs>
        <path d={`M -40 ${H} L -40 690 Q 540 610 1120 690 L 1120 ${H} Z`} fill="url(#desk)" />
        <path d="M -40 690 Q 540 610 1120 690" fill="none" stroke="rgba(160,190,255,0.5)" strokeWidth={4} />
        <path d="M -40 760 Q 540 690 1120 760" fill="none" stroke={mode === 'him' ? C.fire : RED} strokeWidth={14} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: VF.cond, fontSize: 64, letterSpacing: 8, color: 'rgba(255,255,255,0.8)' }}>{mode === 'him' && boots[0] > 0 ? 'THAT MAN 🔥' : 'GARMI 24×7'}</div>
    </AbsoluteFill>
    {heat > 0 && <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 80% at 50% 40%, rgba(255,120,30,${0.18 * heat}), rgba(255,40,10,${0.5 * heat}) 100%)`, mixBlendMode: 'screen' }} />}
    {dark > 0 && <AbsoluteFill style={{ background: '#000', opacity: dark }} />}
  </AbsoluteFill>
);

/** Studio thermometer while "you know what happens when I walk in, right?" plays. */
export const Thermometer: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const p = ease(s, SG.race[0] - 0.2, 0.3) * (1 - ease(s, SG.map - 0.05, 0.1));
  if (p <= 0) return null;
  const temp = tempAt(t);
  const lvl = clamp((temp - 40) / 60);
  return (
    <div style={{ position: 'absolute', right: 60, top: 120, width: 170, height: 640, opacity: p, transform: `translateX(${(1 - p) * 80}px)` }}>
      <div style={{ position: 'absolute', left: 50, top: 0, width: 70, height: 520, borderRadius: 35, background: 'rgba(10,14,30,0.85)', border: '6px solid #E8E4DC' }}>
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, height: `${8 + 88 * lvl}%`, borderRadius: 24, background: `linear-gradient(0deg, ${RED}, ${C.fire}, ${C.gold})`, boxShadow: `0 0 30px ${C.fire}` }} />
      </div>
      <div style={{ position: 'absolute', left: 25, top: 480, width: 120, height: 120, borderRadius: 60, background: RED, border: '6px solid #E8E4DC', boxShadow: `0 0 ${30 + 40 * lvl}px ${C.fire}` }} />
      <div style={{ position: 'absolute', left: -220, top: 40 + 400 * (1 - lvl), width: 250, textAlign: 'right', fontFamily: VF.cond, fontSize: 92, color: tempColor(temp), textShadow: '0 0 24px rgba(255,80,20,0.8)' }}>{Math.round(temp)}°</div>
    </div>
  );
};

// ───────────────────────── the heat map ─────────────────────────
const PATH: [number, number][] = [[170, 790], [170, 590], [430, 590], [430, 410], [700, 410], [700, 240], [880, 220]];
const SEG = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const TOTAL = SEG.reduce((a, b) => a + b, 0);
const along = (p: number): [number, number] => {
  let d = clamp(p) * TOTAL;
  for (let i = 0; i < SEG.length; i++) {
    if (d <= SEG[i]) {
      const k = d / SEG[i];
      return [lerp(PATH[i][0], PATH[i + 1][0], k), lerp(PATH[i][1], PATH[i + 1][1], k)];
    }
    d -= SEG[i];
  }
  return PATH[PATH.length - 1];
};
const BUBBLES: { x: number; y: number; v: number; on: number }[] = [
  { x: 250, y: 700, v: 24, on: 0.12 }, { x: 300, y: 530, v: 25, on: 0.3 }, { x: 510, y: 500, v: 23, on: 0.48 },
  { x: 610, y: 350, v: 24, on: 0.66 }, { x: 800, y: 330, v: 26, on: 0.84 }, { x: 900, y: 700, v: 22, on: 2 }, { x: 140, y: 300, v: 23, on: 2 },
];
const LABELS: [string, number, number][] = [['SECTOR 17', 120, 850], ['MALL ROAD', 230, 630], ['CLOCK TOWER', 452, 432], ['RIVERSIDE', 40, 360], ['OLD CITY', 760, 600], ['GARMI 24×7 STUDIO', 690, 150]];

export const HeatMap: React.FC<{ t: number; hot: boolean }> = ({ t, hot }) => {
  const s = songOf(t);
  const p = hot ? 1 : kf(t, [[ST.map + 0.3, 0], [ST.cctv - 0.1, 0.78]]);
  const party = hot ? 0 : ease(t, ST.party, 0.6);
  const pin = hot ? 0 : pop(t, ST.party + 0.25, 0.3);
  const [hx, hy] = along(p);
  const wave = hot ? easeOutCubic(clamp((s - SG.map) / 0.7)) * 1500 : 0;
  const pulse = 1 + 0.08 * Math.sin(t * 9);
  const trail = PATH.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');
  const zoom = hot ? 1.04 - 0.04 * ease(s, SG.map, 0.6) : 1 + 0.05 * clamp((t - ST.map) / 3) + 0.1 * party;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${lerp(50, 16, party)}% ${lerp(50, 86, party)}%` }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="hotspot">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.18" stopColor="#FFF0B0" />
              <stop offset="0.38" stopColor={C.gold} />
              <stop offset="0.6" stopColor={C.fire} stopOpacity={0.85} />
              <stop offset="1" stopColor={RED} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="wave">
              <stop offset="0" stopColor="#FFF6DA" />
              <stop offset="0.35" stopColor={C.gold} />
              <stop offset="0.7" stopColor={C.fire} />
              <stop offset="0.93" stopColor={RED} />
              <stop offset="1" stopColor={RED} stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="#081428" />
          <path d="M -20 260 C 200 320 360 230 560 330 C 760 430 900 400 1100 500 L 1100 590 C 900 490 760 520 560 420 C 360 320 200 410 -20 350 Z" fill="#0E2D52" />
          {Array.from({ length: 12 }).map((_, i) => <path key={`h${i}`} d={`M -20 ${60 + i * 80} L 1100 ${40 + i * 80}`} stroke="#12243F" strokeWidth={4} />)}
          {Array.from({ length: 14 }).map((_, i) => <path key={`v${i}`} d={`M ${30 + i * 80} -20 L ${50 + i * 80} 940`} stroke="#12243F" strokeWidth={4} />)}
          <path d="M 170 940 L 170 590 L 430 590 L 430 410 L 700 410 L 700 240 L 1100 200 M -20 590 L 1100 590 M 430 -20 L 430 940 M 700 410 L 1100 470" stroke="#22406A" strokeWidth={14} fill="none" strokeLinejoin="round" />
          {!hot && <path d={trail} stroke={C.fire} strokeWidth={22} fill="none" strokeLinejoin="round" strokeDasharray={`${p * TOTAL} 99999`} opacity={0.85} style={{ filter: 'blur(5px)' }} />}
          {!hot && <path d={trail} stroke={C.gold} strokeWidth={7} fill="none" strokeLinejoin="round" strokeDasharray={`${p * TOTAL} 99999`} />}
          {hot && <circle cx={880} cy={220} r={wave} fill="url(#wave)" opacity={0.92} />}
          <circle cx={hx} cy={hy} r={(hot ? 150 : 110) * pulse} fill="url(#hotspot)" />
          <g transform="translate(880 220)">
            <circle r={18} fill={RED} stroke="#fff" strokeWidth={5} />
          </g>
        </svg>
        {pin > 0 && (
          <div style={{ position: 'absolute', left: 196, top: 748, display: 'flex', alignItems: 'center', gap: 16, padding: '10px 26px 10px 10px', borderRadius: 20, background: 'rgba(255,246,232,0.96)', border: `4px solid ${C.fire}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transform: `scale(${pin})`, transformOrigin: '0% 50%' }}>
            <div style={{ width: 92, height: 92, borderRadius: 46, overflow: 'hidden', background: '#FFD9B0', position: 'relative' }}>
              <div style={{ position: 'absolute', left: -18, top: -8 }}><Uncle w={128} /></div>
            </div>
            <div>
              <div style={{ fontFamily: VF.cond, fontSize: 48, letterSpacing: 1, color: '#2A0A04', lineHeight: 1.05 }}>🎉 SECTOR 17 PARTY</div>
              <div style={{ fontFamily: VF.grot, fontWeight: 700, fontSize: 31, color: '#8A2A0A' }}>"dead" until 11:58 PM</div>
            </div>
          </div>
        )}
        {LABELS.filter(([s0]) => !(pin > 0 && s0 === 'SECTOR 17')).map(([s0, x, y]) => <div key={s0} style={{ position: 'absolute', left: x, top: y, fontFamily: VF.grot, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: hot && wave > 400 ? 'rgba(60,10,0,0.8)' : 'rgba(170,195,235,0.85)' }}>{s0}</div>)}
        {BUBBLES.map((b, i) => {
          const d = hot ? Math.hypot(b.x - 880, b.y - 220) : 0;
          const on = hot ? wave > d : p >= b.on;
          const k = hot ? clamp((wave - d) / 120) : ease(p, b.on, 0.05);
          const v = hot ? 99 : on ? 45 + ((i * 7) % 5) : b.v;
          return (
            <div key={i} style={{ position: 'absolute', left: b.x - 62, top: b.y - 40, width: 124, height: 80, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? `linear-gradient(180deg, ${C.fire}, ${RED})` : 'linear-gradient(180deg, #3A7BD5, #1D4E9E)', border: '4px solid rgba(255,255,255,0.85)', fontFamily: VF.cond, fontSize: 48, color: '#fff', transform: `scale(${on ? 1 + 0.25 * (1 - k) : 1})`, boxShadow: on ? '0 0 26px rgba(255,80,20,0.8)' : '0 6px 14px rgba(0,0,0,0.4)' }}>{v}°</div>
          );
        })}
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 30, top: 26, display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px 6px', background: 'rgba(5,10,24,0.85)', borderRadius: 8, fontFamily: VF.cond, fontSize: 40, letterSpacing: 2, color: INK }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: RED, opacity: Math.floor(t * 2) % 2 ? 0.4 : 1 }} />LIVE HEAT MAP
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── CCTV still ─────────────────────────
const Grain: React.FC<{ t: number; amt: number; w?: number; h?: number; color?: boolean }> = ({ t, amt, w = 270, h = 230, color = false }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = Math.floor(t * 30);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(w, h);
    let seed = (f * 2654435761) >>> 0;
    for (let i = 0; i < w * h; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const v = seed >>> 24;
      const o = i * 4;
      img.data[o] = v; img.data[o + 1] = color ? (v * 7) & 255 : v; img.data[o + 2] = color ? (v * 13) & 255 : v; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [f, w, h, color]);
  return <canvas ref={ref} width={w} height={h} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: amt, mixBlendMode: color ? 'normal' : 'overlay', imageRendering: 'pixelated' }} />;
};

export const CCTV: React.FC<{ t: number }> = ({ t }) => {
  const local = t - ST.cctv;
  const secs = 41 + Math.floor(local);
  const zoom = 1 + 0.08 * clamp(local / 3);
  const box = ease(t, ST.cctv + 0.9, 0.3);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#1B231E' }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, filter: 'grayscale(1) contrast(1.15)' }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <rect width={W} height={H} fill="#2A302C" />
          <path d={`M 0 ${H} L 380 360 L 700 360 L ${W} ${H} Z`} fill="#3A403B" />
          <path d="M 540 360 L 540 920" stroke="#5C635D" strokeWidth={8} strokeDasharray="40 40" />
          {[120, 960].map((x, i) => <g key={x}><rect x={x} y={140} width={14} height={520} fill="#1E2420" /><circle cx={x + 7 + (i ? -40 : 40)} cy={150} r={24} fill="#F0F0E0" opacity={0.7} /></g>)}
          <rect x={300} y={160} width={480} height={200} fill="#232925" />
        </svg>
        {/* him, blown out by his own heat */}
        <Portrait src="that-man" w={620} x={230} y={220} style={{ filter: 'brightness(2.1) contrast(0.75) blur(2.5px)', opacity: 0.85 }} />
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 52% 45%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 16%, transparent 40%)' }} />
      </AbsoluteFill>
      <Grain t={t} amt={0.55} />
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 6px)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)' }} />
      <div style={{ position: 'absolute', left: 300, top: 250, width: 480, height: 460, border: '4px solid rgba(255,255,255,0.9)', opacity: box, transform: `scale(${lerp(1.3, 1, box)})` }}>
        <div style={{ position: 'absolute', left: -4, top: -52, padding: '4px 12px', background: 'rgba(255,255,255,0.9)', color: '#111', fontFamily: VF.hud, fontSize: 26, fontWeight: 700, whiteSpace: 'nowrap' }}>SUBJECT: UNKNOWN · TEMP ERROR</div>
      </div>
      <div style={{ position: 'absolute', left: 30, top: 24, fontFamily: VF.hud, fontSize: 30, fontWeight: 600, color: '#E8F0E8', lineHeight: 1.3 }}>CAM 04 · SECTOR 17<br />2026-10-22 23:57:{String(secs).padStart(2, '0')}</div>
      <div style={{ position: 'absolute', right: 34, top: 28, display: 'flex', alignItems: 'center', gap: 10, fontFamily: VF.hud, fontSize: 30, fontWeight: 700, color: '#FF4A4A' }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: '#FF3030', opacity: Math.floor(t * 2) % 2 ? 0.3 : 1 }} />REC
      </div>
      <div style={{ position: 'absolute', left: 30, bottom: 30, padding: '8px 20px 2px', background: RED, color: '#fff', fontFamily: VF.cond, fontSize: 44, letterSpacing: 3 }}>EXCLUSIVE</div>
      <Evidence t={t} />
    </AbsoluteFill>
  );
};

/** Exhibit B: a police officer's aviators, melted. Slides in for "their sunglasses melted". */
const Evidence: React.FC<{ t: number }> = ({ t }) => {
  const k = ease(t, ST.glasses, 0.45);
  if (k <= 0) return null;
  const drip = clamp((t - ST.glasses - 0.3) / 2.2);
  const lens = (cx: number, flip: number) => {
    const d = 26 + 70 * drip; // the lower edge sags and runs
    return (
      <g transform={`translate(${cx} 0) scale(${flip} 1)`}>
        <path d={`M -112 -40 C -112 -70 -10 -74 40 -58 C 70 -48 66 -20 58 6 C 48 40 20 ${44 + d * 0.5} -6 ${50 + d * 0.6} L -20 ${50 + d} C -24 ${60 + d} -36 ${60 + d} -38 ${50 + d} L -44 ${46 + d * 0.4} C -84 40 -112 10 -112 -40 Z`} fill="url(#lens)" stroke="#C9A24A" strokeWidth={7} />
        <circle cx={-29} cy={58 + d} r={9 + 4 * drip} fill="#141018" />
        <path d="M -86 -36 C -60 -52 -20 -54 8 -46" stroke="rgba(255,255,255,0.55)" strokeWidth={8} strokeLinecap="round" fill="none" />
      </g>
    );
  };
  return (
    <div style={{ position: 'absolute', right: 40, top: 520, width: 470, height: 330, transform: `translateX(${(1 - k) * 560}px) rotate(${lerp(10, 4, k)}deg)`, background: '#F4EFE6', borderRadius: 10, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', padding: 18 }}>
      <div style={{ position: 'relative', width: '100%', height: 236, background: 'linear-gradient(180deg, #E9E2D6, #CFC6B6)', overflow: 'hidden' }}>
        <svg width={434} height={236} viewBox="-217 -100 434 236" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="lens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3B2A3A" />
              <stop offset="0.5" stopColor="#1B1420" />
              <stop offset="1" stopColor="#120C14" />
            </linearGradient>
          </defs>
          <path d={`M -42 -52 Q 0 ${-72 + 26 * drip} 42 -52`} stroke="#C9A24A" strokeWidth={8} fill="none" />
          <path d={`M -200 -50 L -150 -54 M 200 -50 L 150 -54`} stroke="#C9A24A" strokeWidth={8} strokeLinecap="round" />
          {lens(-100, 1)}
          {lens(100, -1)}
          <path d={`M -150 ${118} C -80 ${100} 60 ${126} 160 ${112}`} stroke="#120C14" strokeWidth={10 * drip} strokeLinecap="round" fill="none" opacity={drip} />
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, fontFamily: VF.hud, fontWeight: 700, color: '#2A2220' }}>
        <span style={{ fontSize: 30 }}>EXHIBIT B</span>
        <span style={{ fontSize: 22, color: RED }}>OFFICER'S SUNGLASSES</span>
      </div>
    </div>
  );
};

/** Signal lost: snow, colour bars flashing through, and the warning. */
export const Static: React.FC<{ t: number }> = ({ t }) => {
  const bars = ['#C0C0C0', '#C0C000', '#00C0C0', '#00C000', '#C000C0', '#C00000', '#0000C0'];
  const f = Math.floor(t * 30);
  return (
    <AbsoluteFill style={{ background: '#111', overflow: 'hidden' }}>
      {f % 4 === 1 && <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>{bars.map((b) => <div key={b} style={{ flex: 1, background: b }} />)}</div>}
      <Grain t={t} amt={0.95} w={216} h={184} color={false} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '14px 40px 6px', background: '#000', color: '#fff', fontFamily: VF.hud, fontSize: 60, fontWeight: 700, letterSpacing: 6 }}>SIGNAL LOST</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ───────────────────────── 7-day forecast ─────────────────────────
const DAYS = [['MON', '⛅', 31], ['TUE', '☀️', 33], ['WED', '🌧️', 27], ['THU', '⛅', 30], ['FRI', '☀️', 34], ['SAT', '🌤️', 32], ['SUN', '⛅', 31]] as const;

export const Forecast: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const stamp = pop(s, SG.stamp + 0.15, 0.22, 2.6);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0C1D3E, #071026)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 46, textAlign: 'center', fontFamily: VF.cond, fontSize: 76, letterSpacing: 4, color: INK }}>7-DAY FORECAST</div>
      {DAYS.map(([d, icon, v], i) => {
        const row = i < 4 ? 0 : 1;
        const col = row ? i - 4 : i;
        const n = row ? 3 : 4;
        const cw = 228, gap = 22;
        const x = (W - (n * cw + (n - 1) * gap)) / 2 + col * (cw + gap);
        const y = 190 + row * 350;
        const f = clamp((s - SG.flips[i]) / 0.22);
        const flipped = f >= 0.5;
        const sq = Math.abs(Math.cos(f * Math.PI)); // card turns edge-on halfway through
        return (
          <div key={d} style={{ position: 'absolute', left: x, top: y, width: cw, height: 320, borderRadius: 22, transform: `scaleX(${f > 0 && f < 1 ? sq : 1})`, background: flipped ? `linear-gradient(180deg, ${C.gold}, ${C.fire} 55%, ${RED})` : 'linear-gradient(180deg, #1F4A8A, #143163)', border: `4px solid ${flipped ? '#FFE2B0' : 'rgba(255,255,255,0.25)'}`, boxShadow: flipped ? '0 0 40px rgba(255,90,20,0.65)' : '0 10px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0 24px' }}>
            <div style={{ fontFamily: VF.cond, fontSize: 46, letterSpacing: 3, color: '#fff' }}>{d}</div>
            <div style={{ fontSize: 104, lineHeight: 1 }}>{flipped ? '🔥' : icon}</div>
            <div style={{ fontFamily: VF.cond, fontSize: 62, color: '#fff' }}>{flipped ? '99°' : `${v}°`}</div>
          </div>
        );
      })}
      {stamp > 0 && (
        <div style={{ position: 'absolute', left: 140, top: 330, width: 800, padding: '24px 0 14px', border: `12px solid ${RED}`, borderRadius: 18, textAlign: 'center', fontFamily: VF.cond, fontSize: 108, lineHeight: 1, color: RED, background: 'rgba(255,240,225,0.94)', transform: `rotate(-8deg) scale(${lerp(1.8, 1, Math.min(1, stamp))})`, opacity: Math.min(1, stamp * 1.4), boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>FORECAST:<br />TOO HOT</div>
      )}
    </AbsoluteFill>
  );
};

// ───────────────────────── the debate panel ─────────────────────────
type Guest = { name: string; role: string; bg: string; art: (w: number) => React.ReactNode };
const GUESTS: Guest[] = [
  { name: 'ANCHOR', role: 'GARMI 24×7', bg: 'linear-gradient(160deg, #1A2F5E, #0B1530)', art: () => <div style={{ position: 'absolute', left: 120, top: 40 }}><Anchor w={300} rim={0.3} /></div> },
  { name: 'TRENCH COAT GUY', role: 'fashion expert', bg: 'linear-gradient(160deg, #5C3B1E, #22150A)', art: () => <Portrait src="rival-trench" w={420} x={60} y={-20} /> },
  { name: 'LEATHER JACKET GUY', role: 'gym expert', bg: 'linear-gradient(160deg, #5A0E16, #1E0407)', art: () => <Portrait src="rival-leather" w={420} x={70} y={-30} /> },
  { name: 'HOODIE GUY', role: 'music expert', bg: 'linear-gradient(160deg, #3A1450, #12061C)', art: () => <Portrait src="rival-hoodie" w={430} x={40} y={-40} /> },
  { name: 'UNCLE', role: 'Sector 17, since 9 pm', bg: 'linear-gradient(160deg, #2E4A2A, #0E180C)', art: () => <div style={{ position: 'absolute', left: 130, top: 20 }}><Uncle w={280} /></div> },
  { name: 'THE MIRROR', role: 'jealous', bg: 'linear-gradient(160deg, #2C3550, #0E1220)', art: () => <div style={{ position: 'absolute', left: 150, top: 14 }}><Mirror w={240} /></div> },
];
const SHOUT_ORDER = [5, 0, 1, 2, 3, 4]; // panel index for each shout time (the anchor gives in last)

export const Debate: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const pw = W / 2, ph = H / 3;
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {GUESTS.map((g, i) => {
        const x = (i % 2) * pw, y = Math.floor(i / 2) * ph;
        const inP = pop(s, SG.debate + i * 0.05, 0.25, 1.6);
        const k = SHOUT_ORDER.indexOf(i);
        const sh = pop(s, SG.shouts[(k + 1) % 6], 0.2, 3);
        const shake = s > SG.shouts[(k + 1) % 6] ? Math.sin(s * 50 + i) * 4 : 0;
        return (
          <div key={g.name} style={{ position: 'absolute', left: x + 3, top: y + 3, width: pw - 6, height: ph - 6, overflow: 'hidden', background: g.bg, transform: `scale(${inP})` }}>
            {g.art(pw)}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 62, background: 'rgba(8,14,34,0.92)', display: 'flex', alignItems: 'center', gap: 12, padding: '4px 16px 0' }}>
              <span style={{ fontFamily: VF.cond, fontSize: 32, letterSpacing: 1, color: '#fff' }}>{g.name}</span>
              <span style={{ fontFamily: F.sans, fontSize: 22, color: '#9FB0D4' }}>{g.role}</span>
            </div>
            {sh > 0 && (
              <div style={{ position: 'absolute', right: 14, top: 18, padding: '10px 18px 4px', background: '#FFD23F', borderRadius: 12, fontFamily: VF.cond, fontSize: 40, lineHeight: 1, color: NAVY, transform: `rotate(${(i % 2 ? 4 : -4) + shake * 0.3}deg) scale(${sh})`, transformOrigin: '100% 0%', boxShadow: '0 8px 20px rgba(0,0,0,0.45)' }}>WHO'S THAT MAN?</div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ───────────────────────── him on air ─────────────────────────
const USER_COLORS = ['#FF6FAE', '#5EE6A8', '#FFC24A', '#7FB2FF', '#C9A0FF', '#FF9A4D'];

export const Him: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const local = s - SG.him;
  const zoom = 1.02 + 0.06 * clamp(local / 12);
  const spot = clamp((s - SG.spot) / (SG.blaze - SG.spot));
  const blaze = s >= SG.blaze ? Math.exp(-(s - SG.blaze) * 2.2) : 0;
  const darkAround = ease(s, SG.spot, 0.6);
  const name = ease(s, SG.him + 0.2, 0.35);
  const brand = ease(s, SG.brand, 0.3);
  const tm = pop(s, SG.tm, 0.22, 2.8);
  const showComments = s >= SG.comments && s < SG.headline + 0.4;
  const pip = pop(s, SG.headline + 0.45, 0.3, 1.8) * (1 - ease(s, SG.spot, 0.3));
  const hl = ease(s, SG.highlight, 0.2);
  const pulse = beatAt(s).pulse;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#0A0403' }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 70%, ${C.ember} 0%, #8A2408 32%, #1A0603 72%)`, opacity: 1 - 0.75 * darkAround }} />
      <AbsoluteFill style={{ transform: `scale(${zoom + 0.03 * pulse * (s > SG.spot ? 1 : 0.3)})`, transformOrigin: '50% 40%' }}>
        <Portrait src="that-man" w={1080} x={0} y={-30} style={{ filter: `brightness(${1 + 0.9 * blaze + 0.25 * spot})` }} />
      </AbsoluteFill>
      {/* spotlights converge on him and blaze on "spotlight" */}
      {s >= SG.spot - 0.1 && [60, 1020, 300, 780].map((x0, i) => {
        const target = Math.atan2(-(540 - x0), 900) * (180 / Math.PI); // rotation that points a hanging beam at his feet
        const start = target + (i % 2 ? 34 : -34);
        const ang = lerp(start, target, easeOutCubic(clamp(spot * 1.15 - i * 0.05)));
        const w = 260 + 120 * blaze;
        return <div key={i} style={{ position: 'absolute', left: x0 - w / 2, top: -60, width: w, height: 1150, transformOrigin: '50% 0%', transform: `rotate(${ang}deg)`, background: `linear-gradient(180deg, rgba(255,246,225,${0.42 + 0.3 * blaze}), rgba(255,215,160,${0.08 + 0.18 * blaze}) 80%, transparent)`, clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)', mixBlendMode: 'screen', filter: 'blur(10px)', opacity: ease(s, SG.spot - 0.1, 0.3) }} />;
      })}
      {spot > 0 && <AbsoluteFill style={{ background: `radial-gradient(ellipse 46% 40% at 50% 52%, rgba(255,236,200,${0.28 * spot + 0.3 * blaze}), transparent 70%)`, mixBlendMode: 'screen' }} />}
      {blaze > 0.01 && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(255,250,235,${0.85 * blaze}), rgba(255,180,90,${0.3 * blaze}) 35%, transparent 65%)`, mixBlendMode: 'screen' }} />}
      {/* name strap inside the picture */}
      <div style={{ position: 'absolute', left: 40, bottom: 44, opacity: name * (1 - darkAround), transform: `translateX(${(1 - name) * -60}px)` }}>
        <div style={{ display: 'inline-block', padding: '10px 26px 2px', background: `linear-gradient(90deg, ${C.fire}, ${C.pink})`, fontFamily: VF.cond, fontSize: 86, letterSpacing: 2, color: '#fff' }}>THAT MAN 🔥{tm > 0 && <sup style={{ fontSize: 48, marginLeft: 4 }}>™</sup>}</div>
        <div style={{ display: 'block', width: 'fit-content', marginTop: 6, padding: '8px 22px 4px', background: INK, fontFamily: VF.cond, fontSize: 50, letterSpacing: 2, color: NAVY, opacity: brand, transform: `translateY(${(1 - brand) * 16}px)` }}>THE BRAND, MAN</div>
      </div>
      {tm > 0 && s < SG.comments + 0.3 && (
        <div style={{ position: 'absolute', right: 34, top: 40, padding: '14px 28px 6px', border: `9px solid ${C.gold}`, borderRadius: 16, fontFamily: VF.cond, fontSize: 78, lineHeight: 1, color: C.gold, transform: `rotate(9deg) scale(${lerp(1.8, 1, Math.min(1, tm))})`, opacity: Math.min(1, tm * 1.4) * (1 - ease(s, SG.comments, 0.25)), textShadow: '0 0 20px rgba(255,160,40,0.6)' }}>THE VIBE™</div>
      )}
      {showComments && <Comments t={t} />}
      {pip > 0.01 && (
        <div style={{ position: 'absolute', left: 36, bottom: 40, width: 300, height: 250, transform: `scale(${pip})`, transformOrigin: '0% 100%' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', border: '5px solid #fff', background: 'linear-gradient(160deg, #1A2F5E, #0B1530)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}>
            <div style={{ position: 'absolute', left: 40, top: 20 }}><Anchor w={220} rim={0.2} /></div>
          </div>
          <div style={{ position: 'absolute', left: -5, top: -50, padding: '6px 16px 0', background: '#FFD23F', fontFamily: VF.cond, fontSize: 38, letterSpacing: 2, color: NAVY, opacity: hl, transform: `scale(${lerp(1.4, 1, hl)})`, transformOrigin: '0 100%' }}>HIGHLIGHT</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** "Tu bas scroll kare remark": the live chat floods the picture (the group chat crew is watching). */
const Comments: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const out = ease(s, SG.headline + 0.1, 0.3);
  const shown = COMMENTS.filter((c) => s >= c.at);
  return (
    <div style={{ position: 'absolute', left: 300, right: 26, bottom: 24, display: 'flex', flexDirection: 'column', gap: 10, opacity: 1 - out }}>
      {shown.slice(-8).map((c, i, arr) => {
        const k = ease(s, c.at, 0.2);
        const col = USER_COLORS[COMMENTS.indexOf(c) % USER_COLORS.length];
        return (
          <div key={c.user} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', borderRadius: 18, background: 'rgba(8,10,20,0.86)', transform: `translateY(${(1 - k) * 40}px)`, opacity: k * (i < arr.length - 7 ? 0.6 : 1), fontFamily: F.sans }}>
            <div style={{ width: 46, height: 46, borderRadius: 23, flexShrink: 0, background: `${col}33`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 24 }}>{c.user[0].toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: col }}>@{c.user}</div>
              <div style={{ fontSize: 32, color: '#fff', lineHeight: 1.2 }}>{c.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** CRT switch-off for the whole frame: squash to a line, then to a dot, then dark. */
export const crtAt = (t: number) => {
  const d = songOf(t) - SG.off;
  if (d < 0) return null;
  const sy = d < 0.12 ? lerp(1, 0.006, easeInCubic(d / 0.12)) : 0.006;
  const sx = d < 0.12 ? 1 : d < 0.24 ? lerp(1, 0.004, easeInCubic((d - 0.12) / 0.12)) : 0.004;
  const glow = d < 0.5 ? 1 - d / 0.5 : 0;
  return { sx, sy, glow, gone: d > 0.5 };
};
