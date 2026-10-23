import React from 'react';
import { Img, staticFile } from 'remotion';
import { Anchor, AnchorHands } from './art';
import { BOOTS, BOOT_ORDER, C, CRACK_T, FONT, clamp, easeOutCubic, lerp, noise1, rand, seg, tempShown } from './timeline';

export type Cam = { x: number; y: number; z: number };
/** A 1080×920 world viewed through the picture box: world point (cam.x, cam.y) sits at the box centre, scaled by cam.z. */
export const World: React.FC<{ cam: Cam; children: React.ReactNode; style?: React.CSSProperties }> = ({ cam, children, style }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 920, transformOrigin: '0 0', transform: `translate(${540 - cam.x * cam.z}px, ${460 - cam.y * cam.z}px) scale(${cam.z})`, ...style }}>
    {children}
  </div>
);

export const WALL = { x: 136, y: 50, sw: 260, sh: 150, gap: 14 };
export const screenXY = (i: number) => ({ x: WALL.x + (i % 3) * (WALL.sw + WALL.gap), y: WALL.y + Math.floor(i / 3) * (WALL.sh + WALL.gap) });
const WALL_W = WALL.sw * 3 + WALL.gap * 2, WALL_H = WALL.sh * 2 + WALL.gap;

// ───────────────────────── monitor contents (260×150) ─────────────────────────
export const BlueGrid: React.FC<{ t: number; seed: number }> = ({ t, seed }) => {
  const scan = ((t * 0.35 + seed * 0.37) % 1) * 170 - 10;
  const pts = Array.from({ length: 14 }, (_, k) => `${k * 20},${96 - 30 * noise1(k * 0.6 + t * 0.8, seed) - 10 * Math.sin(k + seed)}`).join(' ');
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, #1c4fa6, #0a2259 70%, #061538)' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.55, backgroundImage: 'linear-gradient(#4f8cff55 1px, transparent 1px), linear-gradient(90deg, #4f8cff55 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: `${(t * 6 + seed * 7) % 20}px 0px` }} />
      <svg viewBox="0 0 260 150" style={{ position: 'absolute', inset: 0 }}>
        <polyline points={pts} fill="none" stroke="#8fd0ff" strokeWidth={2.5} opacity={0.85} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: scan, height: 14, background: 'linear-gradient(180deg, transparent, rgba(160,210,255,0.35), transparent)' }} />
      <div style={{ position: 'absolute', left: 10, top: 8, fontFamily: FONT.mono, fontSize: 12, fontWeight: 700, color: '#9cc4ff', letterSpacing: '0.1em' }}>GARMI · DATA {seed + 1}</div>
    </div>
  );
};

export const TempScreen: React.FC<{ v: number; t: number }> = ({ v, t }) => (
  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 60%, #FFB547 0%, ${C.fire} 45%, #b3200c 100%)`, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 12, top: 8, fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15, letterSpacing: '0.14em', color: '#fff' }}>● LIVE TEMP</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 22, textAlign: 'center', fontFamily: FONT.anton, fontSize: 104, lineHeight: '120px', color: '#fff', textShadow: '0 4px 0 rgba(120,10,0,0.45)', transform: `scale(${1 + 0.015 * Math.sin(t * 9)})` }}>
      {v}°C
    </div>
  </div>
);

export const HeatAlert: React.FC<{ t: number }> = ({ t }) => {
  const on = Math.sin(t * Math.PI * 2 * 1.3) > -0.3;
  return (
    <div style={{ position: 'absolute', inset: 0, background: on ? C.red : '#5a0508', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: -20, right: -20, top: 0, height: 22, background: `repeating-linear-gradient(-45deg, ${C.yellow} 0 14px, #111 14px 28px)`, backgroundPosition: `${t * 40}px 0` }} />
      <div style={{ position: 'absolute', left: -20, right: -20, bottom: 0, height: 22, background: `repeating-linear-gradient(-45deg, ${C.yellow} 0 14px, #111 14px 28px)`, backgroundPosition: `${-t * 40}px 0` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 22, bottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.anton, fontSize: 44, lineHeight: 1, color: '#fff', letterSpacing: '0.02em', whiteSpace: 'nowrap', gap: 8 }}><span style={{ fontSize: 34 }}>⚠</span>HEAT ALERT</div>
    </div>
  );
};

export const SkyScreen: React.FC<{ kind: 'sunset' | 'moon' }> = ({ kind }) => (
  <div style={{ position: 'absolute', inset: 0, background: kind === 'sunset' ? 'linear-gradient(180deg, #2b3d8f 0%, #c8457a 55%, #ff9a3d 100%)' : 'linear-gradient(180deg, #050b24 0%, #0d1d4f 100%)', overflow: 'hidden' }}>
    {kind === 'moon' && Array.from({ length: 18 }, (_, k) => <div key={k} style={{ position: 'absolute', left: rand(k) * 260, top: rand(k + 40) * 90, width: 3, height: 3, borderRadius: 2, background: '#fff', opacity: 0.4 + rand(k + 9) * 0.6 }} />)}
    <div style={{ position: 'absolute', left: 14, top: 10, fontSize: 70, lineHeight: '84px' }}>{kind === 'sunset' ? '🌇' : '🌙'}</div>
    <div style={{ position: 'absolute', right: 14, top: 18, textAlign: 'right', color: '#fff', fontFamily: FONT.anton, lineHeight: 1.0 }}>
      <div style={{ fontSize: 30, letterSpacing: '0.06em', opacity: 0.9 }}>{kind === 'sunset' ? 'SUNSET' : 'NOW'}</div>
      <div style={{ fontSize: 50 }}>{kind === 'sunset' ? '6:58' : '11:58'}</div>
      <div style={{ fontSize: 26 }}>PM</div>
    </div>
  </div>
);

/** One screen's share of the portrait spread across the whole wall. */
export const WallPortrait: React.FC<{ i: number; t: number }> = ({ i }) => {
  const { x, y } = screenXY(i);
  return (
    <div style={{ position: 'absolute', left: WALL.x - x, top: WALL.y - y, width: WALL_W, height: WALL_H }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 85% at 52% 42%, #ffd08a 0%, #FF8a2a 26%, #FF4D1A 50%, #8f1a08 85%, #3a0802 100%)' }} />
      <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: 84, top: -30, width: 640, height: 640 }} />
    </div>
  );
};

// ───────────────────────── crack across the monitor wall ─────────────────────────
const CRACK = (() => {
  const ix = 470, iy = 168;
  const rays: [number, number][][] = [];
  for (let k = 0; k < 15; k++) {
    let a = (k / 15) * Math.PI * 2 + rand(k * 3.3) * 0.35;
    let x = ix, y = iy;
    const pts: [number, number][] = [[x, y]];
    const len = 140 + rand(k * 7.1) * 330;
    const steps = 6 + Math.floor(rand(k * 1.9) * 4);
    for (let s = 0; s < steps; s++) {
      a += (rand(k * 31 + s) - 0.5) * 0.5;
      x += Math.cos(a) * (len / steps);
      y += Math.sin(a) * (len / steps);
      pts.push([x, y]);
    }
    rays.push(pts);
  }
  const rings = [26, 58].map((r, j) => Array.from({ length: 15 }, (_, k) => {
    const a = (k / 15) * Math.PI * 2 + rand(k * 3.3) * 0.35;
    const rr = r * (0.85 + rand(k + j * 50) * 0.3);
    return [ix + Math.cos(a) * rr, iy + Math.sin(a) * rr] as [number, number];
  }));
  return { ix, iy, rays, rings };
})();

export const WallCrack: React.FC<{ t: number }> = ({ t }) => {
  if (t < CRACK_T) return null;
  const p = easeOutCubic(seg(t, CRACK_T, CRACK_T + 0.14));
  const flash = clamp(1 - (t - CRACK_T) / 0.12);
  const cut = (pts: [number, number][]) => pts.slice(0, Math.max(2, Math.ceil(pts.length * p))).map((q) => q.join(',')).join(' ');
  return (
    <svg viewBox="0 0 1080 920" style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 920, overflow: 'visible' }}>
      <defs>
        <clipPath id="wallclip"><rect x={WALL.x} y={WALL.y} width={WALL_W} height={WALL_H} /></clipPath>
      </defs>
      <g clipPath="url(#wallclip)">
        <circle cx={CRACK.ix} cy={CRACK.iy} r={18 + flash * 60} fill="#fff" opacity={0.25 + flash * 0.6} />
        <g stroke="rgba(0,0,0,0.55)" strokeWidth={4} fill="none" transform="translate(1.5 1.5)">
          {CRACK.rays.map((r, k) => <polyline key={k} points={cut(r)} />)}
        </g>
        <g stroke="#f4fbff" strokeWidth={2.2} fill="none" strokeLinejoin="round">
          {CRACK.rays.map((r, k) => <polyline key={k} points={cut(r)} />)}
          {p > 0.5 && CRACK.rings.map((r, k) => <polygon key={k} points={r.map((q) => q.join(',')).join(' ')} opacity={0.85} />)}
        </g>
        <polygon points={CRACK.rings[0].map((q) => q.join(',')).join(' ')} fill="rgba(255,255,255,0.25)" />
      </g>
    </svg>
  );
};

// ───────────────────────── the studio set ─────────────────────────
type StudioProps = {
  t: number;
  fire: number; // 0 cool blue studio → 1 hijacked, orange
  screen: (i: number) => React.ReactNode;
  anchor?: boolean;
  thatMan?: boolean;
  pulse?: number;
  flicker?: number;
};

const Strip: React.FC<{ x: number; w: number; y0: number; y1: number; col: string; glow: number }> = ({ x, w, y0, y1, col, glow }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y0, width: w, height: y1 - y0, borderRadius: w / 2, background: '#fff', boxShadow: `0 0 ${10 * glow}px ${col}, 0 0 ${28 * glow}px ${col}, 0 0 ${60 * glow}px ${col}`, opacity: 0.95 }} />
);

export const Studio: React.FC<StudioProps> = ({ t, fire, screen, anchor = true, thatMan = false, pulse = 0, flicker = 1 }) => {
  const strip = fire > 0.5 ? C.fire : '#39a6ff';
  const glow = (0.9 + pulse * 0.6) * flicker;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 920 }}>
      {/* back wall */}
      <div style={{ position: 'absolute', left: -400, top: -400, width: 1880, height: 1720, background: 'linear-gradient(180deg, #0f2a5e 0%, #0b1f4a 30%, #07122e 60%, #040915 100%)' }} />
      <div style={{ position: 'absolute', left: -400, top: -400, width: 1880, height: 1720, opacity: fire, background: 'linear-gradient(180deg, #2a0b05 0%, #1f0704 30%, #120402 60%, #070100 100%)' }} />
      <div style={{ position: 'absolute', left: -400, top: -400, width: 1880, height: 1180, opacity: 0.06, backgroundImage: 'linear-gradient(90deg, #fff 2px, transparent 2px)', backgroundSize: '120px 100%' }} />
      {/* skyline on the back wall */}
      <svg viewBox="0 0 1080 260" style={{ position: 'absolute', left: -100, top: 360, width: 1280, height: 300, opacity: 0.75 }}>
        <path d="M0 260 L0 150 L40 150 L40 110 L80 110 L80 160 L120 160 L120 80 L150 60 L180 80 L180 170 L230 170 L230 120 L270 120 L270 40 L300 40 L300 140 L350 140 L350 100 L400 100 L400 170 L450 170 L450 70 L470 50 L490 70 L490 160 L540 160 L540 120 L590 120 L590 30 L620 30 L620 150 L670 150 L670 90 L720 90 L720 170 L760 170 L760 60 L800 60 L800 140 L850 140 L850 110 L900 110 L900 160 L950 160 L950 80 L990 80 L990 150 L1040 150 L1040 120 L1080 120 L1080 260 Z" fill={fire > 0.5 ? '#3a0e06' : '#123069'} />
        {Array.from({ length: 70 }, (_, k) => <rect key={k} x={20 + rand(k) * 1040} y={60 + rand(k + 99) * 180} width={4} height={6} fill={fire > 0.5 ? '#ff8a3a' : '#7fb6ff'} opacity={0.5 * (0.5 + 0.5 * rand(k + 7))} />)}
      </svg>
      {/* ceiling strip + side strips */}
      <Strip x={540} w={6} y0={-60} y1={-60} col={strip} glow={0} />
      <div style={{ position: 'absolute', left: WALL.x - 10, top: 24, width: WALL_W + 20, height: 6, borderRadius: 3, background: '#fff', boxShadow: `0 0 12px ${strip}, 0 0 34px ${strip}`, opacity: 0.9 * flicker }} />
      <Strip x={40} w={16} y0={40} y1={800} col={strip} glow={glow} />
      <Strip x={92} w={8} y0={120} y1={760} col={strip} glow={glow * 0.8} />
      <Strip x={1040} w={16} y0={40} y1={800} col={strip} glow={glow} />
      <Strip x={988} w={8} y0={120} y1={760} col={strip} glow={glow * 0.8} />
      {/* monitor wall */}
      <div style={{ position: 'absolute', left: WALL.x - 12, top: WALL.y - 12, width: WALL_W + 24, height: WALL_H + 24, background: '#03050a', borderRadius: 6, boxShadow: fire > 0.5 ? '0 0 80px rgba(255,77,26,0.45)' : '0 0 60px rgba(40,120,255,0.25)' }} />
      {Array.from({ length: 6 }, (_, i) => {
        const { x, y } = screenXY(i);
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: WALL.sw, height: WALL.sh, overflow: 'hidden', background: '#000' }}>
            {screen(i)}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 40%)' }} />
            <div style={{ position: 'absolute', inset: 0, opacity: 0.18, background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.6) 0 1px, transparent 1px 3px)' }} />
          </div>
        );
      })}
      <WallCrack t={t} />
      {/* floor */}
      <div style={{ position: 'absolute', left: -400, top: 790, width: 1880, height: 600, background: fire > 0.5 ? 'linear-gradient(180deg, #1a0603, #070100)' : 'linear-gradient(180deg, #0a1633, #03070f)' }} />
      <div style={{ position: 'absolute', left: 20, top: 800, width: 40, height: 200, background: `linear-gradient(180deg, ${strip}66, transparent)`, filter: 'blur(6px)', opacity: flicker }} />
      <div style={{ position: 'absolute', left: 1020, top: 800, width: 40, height: 200, background: `linear-gradient(180deg, ${strip}66, transparent)`, filter: 'blur(6px)', opacity: flicker }} />
      {/* chair + anchor */}
      <div style={{ position: 'absolute', left: 452, top: 470, width: 176, height: 220, borderRadius: '60px 60px 12px 12px', background: 'linear-gradient(180deg, #1b2233, #070a12)', border: '3px solid #000' }} />
      {anchor && (
        <>
          <Anchor id="studio-anchor" style={{ position: 'absolute', left: 370, top: 317, width: 340, height: 442, transformOrigin: '50% 80%', transform: `rotate(${Math.sin(t * 2.3) * 0.9 + noise1(t * 1.7, 3) * 0.8}deg) translateY(${Math.sin(t * 3.1) * 1.5}px)` }} />
        </>
      )}
      {/* desk */}
      <svg viewBox="0 0 900 300" style={{ position: 'absolute', left: 90, top: 612, width: 900, height: 300, overflow: 'visible' }}>
        <defs>
          <linearGradient id="desk-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={fire > 0.5 ? '#f6dcc6' : '#eef3fb'} />
            <stop offset="1" stopColor={fire > 0.5 ? '#c99a7e' : '#aebbd4'} />
          </linearGradient>
          <linearGradient id="desk-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={fire > 0.5 ? '#3a0d06' : '#13306a'} />
            <stop offset="1" stopColor={fire > 0.5 ? '#100201' : '#071430'} />
          </linearGradient>
        </defs>
        <path d="M10 40 Q450 -6 890 40 L890 66 Q450 116 10 66 Z" fill="url(#desk-top)" stroke="#000" strokeWidth={3} />
        <path d="M10 66 Q450 116 890 66 L870 250 Q450 300 30 250 Z" fill="url(#desk-front)" stroke="#000" strokeWidth={3} />
        <path d="M14 74 Q450 124 886 74" stroke={strip} strokeWidth={5} fill="none" opacity={0.95 * flicker} style={{ filter: `drop-shadow(0 0 8px ${strip}) drop-shadow(0 0 18px ${strip})` }} />
        <path d="M60 120 Q450 168 840 120" stroke="#fff" strokeWidth={1.5} fill="none" opacity={0.12} />
      </svg>
      <div style={{ position: 'absolute', left: 90, width: 900, top: 724, height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {thatMan ? (
          <div style={{ fontFamily: FONT.anton, fontSize: 74, lineHeight: 1, letterSpacing: '0.03em', background: 'linear-gradient(180deg, #fff3d6 0%, #FFB547 45%, #FF4D1A 100%)', WebkitBackgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 0 ${14 + pulse * 18}px rgba(255,90,30,0.9))` }}>
            THAT MAN <span style={{ WebkitTextFillColor: 'initial', color: '#fff' }}>🔥</span>
          </div>
        ) : (
          <div style={{ display: 'flex', height: 70, boxShadow: '0 0 30px rgba(60,140,255,0.35)' }}>
            <div style={{ background: C.red, color: '#fff', fontFamily: FONT.anton, fontSize: 52, lineHeight: '70px', padding: '0 16px' }}>GARMI</div>
            <div style={{ background: '#fff', color: C.red, fontFamily: FONT.anton, fontSize: 52, lineHeight: '70px', padding: '0 14px' }}>24×7</div>
          </div>
        )}
      </div>
      {anchor && <AnchorHands style={{ position: 'absolute', left: 390, top: 604, width: 300, height: 90 }} />}
    </div>
  );
};

/** Monitor content for the cool studio scenes. */
export const blueScreens = (t: number, cam2: boolean) => (i: number) => {
  if (i === 1) return <TempScreen v={tempShown(t)} t={t} />;
  if (i === 4) return <HeatAlert t={t} />;
  if (cam2 && i === 0) return <SkyScreen kind="sunset" />;
  if (cam2 && i === 2) return <SkyScreen kind="moon" />;
  return <BlueGrid t={t} seed={i} />;
};

/** Hijack: screens dark until their boot hit, then a white flash into their share of the portrait. */
export const bootScreens = (t: number) => (i: number) => {
  const k = BOOT_ORDER.indexOf(i);
  const tb = BOOTS[k];
  if (t < tb) {
    return <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #140604, #050101)' }} />;
  }
  const a = t - tb;
  const flash = clamp(1 - a / 0.2);
  const roll = a < 0.25 ? (1 - a / 0.25) * 40 : 0;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${roll}px) scale(${1 + flash * 0.08})`, filter: `brightness(${1 + flash * 1.4}) saturate(${1 + flash})` }}>
        <WallPortrait i={i} t={t} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />
    </div>
  );
};

// ───────────────────────── close-up of the anchor (24.7–27.95) ─────────────────────────
export const CloseUp: React.FC<{ t: number }> = ({ t }) => {
  const a = t - 24.7;
  // lights flicker faster and faster
  const f0 = 25.0;
  let lights = 1;
  if (t > f0) {
    const u = t - f0;
    const rate = 3 + u * u * 6; // flickers per second, accelerating
    const phase = 3 * u + u * u * u * 2;
    const k = Math.floor(phase);
    const dip = rand(k * 7.3) < clamp(0.35 + u * 0.22) ? 1 : 0;
    const depth = clamp(0.25 + u * 0.22, 0, 0.85);
    lights = 1 - dip * depth * (0.6 + 0.4 * rand(k * 3.1));
    if (rate < 0) lights = 1;
  }
  const dead = t >= 27.85;
  if (dead) lights = 0.06;
  const door = easeOutCubic(seg(t, 27.1, 27.85));
  const yaw = easeOutCubic(seg(t, 27.5, 27.78)) * 0.9;
  const push = 1 + a * 0.012;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#02040a' }}>
      <div style={{ position: 'absolute', inset: 0, filter: `brightness(${lights})`, transform: `scale(${push})`, transformOrigin: '45% 40%' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0f2a5e 0%, #0b1f4a 40%, #061230 100%)' }} />
        {/* defocused studio: strip lights + monitor behind her */}
        <div style={{ position: 'absolute', inset: 0, filter: 'blur(7px)' }}>
          {[60, 150, 1010].map((x, k) => (
            <div key={k} style={{ position: 'absolute', left: x, top: -20, width: k === 1 ? 14 : 26, height: 980, borderRadius: 13, background: '#dff1ff', boxShadow: '0 0 40px #39a6ff, 0 0 90px #39a6ff' }} />
          ))}
          {Array.from({ length: 9 }, (_, k) => (
            <div key={`b${k}`} style={{ position: 'absolute', left: 120 + rand(k) * 900, top: 40 + rand(k + 5) * 500, width: 30 + rand(k + 2) * 50, height: 30 + rand(k + 2) * 50, borderRadius: '50%', background: '#5aa8ff', opacity: 0.18 }} />
          ))}
        </div>
        <div style={{ position: 'absolute', left: 600, top: 90, width: 470, height: 270, background: '#03050a', padding: 10, filter: 'blur(2.2px)', boxShadow: '0 0 60px rgba(255,77,26,0.35)' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 260, height: 150, transform: 'scale(1.77)', transformOrigin: '0 0' }}>
              <TempScreen v={tempShown(t)} t={t} />
            </div>
          </div>
        </div>
        <Anchor id="closeup-anchor" yaw={yaw} rim={door * 0.9} style={{ position: 'absolute', left: 20, top: 30, width: 800, height: 1040, transformOrigin: '50% 75%', transform: `rotate(${noise1(t * 1.4, 5) * 0.8}deg) translateY(${Math.sin(t * 2.6) * 2}px)` }} />
      </div>
      {/* orange glow from the right, like a door opening */}
      {door > 0 && (
        <>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40 + door * 420, background: 'linear-gradient(270deg, rgba(255,200,120,0.95) 0%, rgba(255,120,40,0.75) 18%, rgba(255,77,26,0.25) 60%, transparent 100%)', mixBlendMode: 'screen', opacity: dead ? 0.35 : 1 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6 + door * 60, background: '#fff3d6', filter: 'blur(8px)', opacity: dead ? 0.3 : 1 }} />
        </>
      )}
    </div>
  );
};
