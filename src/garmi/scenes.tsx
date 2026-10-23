import React from 'react';
import { Img, staticFile } from 'remotion';
import { Anchor, MeltingAviators, Mirror, Uncle } from './art';
import { fitOne } from './fonts';
import {
  BLAZE_T, C, COMMENTS, COMMENTS_T, DEBATE, FONT, FORECAST, HIGHLIGHT_T, SPOT_T, STAMP_T, TM_T,
  clamp, easeInCubic, easeInOutCubic, easeInOutSine, easeOutBack, easeOutCubic, keys, lerp, noise1, rand, seg,
} from './timeline';

const frameOf = (t: number) => Math.round(t * 30);

// ───────────────────────── 1 · BREAKING NEWS opener (full screen) ─────────────────────────
export const Opener: React.FC<{ t: number; sh: { x: number; y: number; r: number } }> = ({ t, sh }) => {
  const flash = clamp(1 - t / 0.13);
  const slam = easeOutCubic(seg(t, 0, 0.16));
  const news = easeOutBack(seg(t, 0.04, 0.3), 1.6);
  const bar = easeOutCubic(seg(t, 0.3, 0.62));
  const sub = easeOutCubic(seg(t, 0.48, 0.75));
  const d = lerp(-760, 1120, easeInOutCubic(seg(t, 2.2, 2.4)));
  const clip = `polygon(${d}px 0, 1080px 0, 1080px 1920px, ${d + 700}px 1920px)`;
  const head = 'CITY HITS 49°C AT MIDNIGHT';
  const hs = fitOne(head, FONT.anton, 400, 940, 92);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: -60, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)` }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, #ff4a3a 0%, #D7141E 38%, #8a0710 78%, #4a0206 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: `repeating-conic-gradient(from ${t * 14}deg at 50% 40%, rgba(255,255,255,0.13) 0deg 7deg, rgba(255,255,255,0) 7deg 18deg)` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(40,0,0,0.55) 100%)' }} />
          {/* channel logo */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', justifyContent: 'center', opacity: slam }}>
            <div style={{ display: 'flex', height: 80, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
              <div style={{ background: '#fff', color: C.red, fontFamily: FONT.anton, fontSize: 58, lineHeight: '80px', padding: '0 18px' }}>GARMI</div>
              <div style={{ background: C.navy, color: '#fff', fontFamily: FONT.anton, fontSize: 58, lineHeight: '80px', padding: '0 16px' }}>24×7</div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontFamily: FONT.anton, fontSize: 270, lineHeight: 1, color: '#fff', letterSpacing: '0.01em', transform: `scale(${lerp(1.5, 1, slam)})`, textShadow: '0 12px 0 rgba(90,0,0,0.45), 0 0 60px rgba(255,255,255,0.25)' }}>
            BREAKING
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 790, display: 'flex', justifyContent: 'center', transform: `translateX(${(1 - news) * 900}px)` }}>
            <div style={{ background: '#fff', color: C.red, fontFamily: FONT.anton, fontSize: 250, lineHeight: '270px', padding: '0 54px', letterSpacing: '0.04em', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }}>NEWS</div>
          </div>
          {/* headline bar rises in */}
          <div style={{ position: 'absolute', left: 60, right: 60, top: 1250, height: 230, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - bar) * 170}px)`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ fontFamily: FONT.anton, fontSize: hs, color: C.navy, whiteSpace: 'nowrap', paddingTop: 6 }}>{head}</div>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 160, height: 62, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - sub) * 80}px)`, color: '#fff', fontFamily: FONT.mono, fontWeight: 700, fontSize: 32, letterSpacing: '0.08em' }}>
              GARMI 24×7 · <span style={{ color: '#ff5a5f', margin: '0 10px' }}>● LIVE</span> · 11:58 PM
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />
      </div>
      {t > 2.2 && (
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, width: 1080, height: 1920 }}>
          <polygon points={`${d - 70},0 ${d},0 ${d + 700},1920 ${d + 630},1920`} fill={C.red} />
          <polygon points={`${d - 14},0 ${d},0 ${d + 700},1920 ${d + 686},1920`} fill="#fff" />
        </svg>
      )}
    </>
  );
};

// ───────────────────────── 4/5/13 · live heat map ─────────────────────────
type P = [number, number];
const ROUTE: P[] = [[190, 770], [330, 700], [430, 580], [560, 470], [680, 400], [760, 280], [880, 190]];
const STUDIO: P = [880, 190];
const ROADS: { pts: P[]; w: number }[] = [
  { pts: [[-20, 770], [190, 770], [330, 700], [1100, 700]], w: 16 },
  { pts: [[250, 940], [330, 700], [430, 580], [560, 470], [680, 400], [760, 280], [880, 190], [960, -20]], w: 18 },
  { pts: [[560, -20], [560, 940]], w: 13 },
  { pts: [[-20, 300], [1100, 300]], w: 11 },
  { pts: [[680, 400], [1100, 400]], w: 10 },
  { pts: [[880, 190], [1100, 190]], w: 10 },
  { pts: [[880, -20], [880, 940]], w: 10 },
  { pts: [[-20, 540], [300, 560], [430, 580]], w: 9 },
  { pts: [[190, 770], [190, 940]], w: 10 },
  { pts: [[120, -20], [200, 300], [190, 770]], w: 9 },
  { pts: [[330, 700], [420, 940]], w: 8 },
  { pts: [[760, 280], [760, 940]], w: 8 },
];
const BUBBLES = [
  { x: 262, y: 712, c: 24, h: 46 }, { x: 352, y: 626, c: 23, h: 47 }, { x: 506, y: 540, c: 25, h: 48 },
  { x: 610, y: 410, c: 22, h: 45 }, { x: 740, y: 352, c: 26, h: 49 }, { x: 806, y: 214, c: 24, h: 47 },
  { x: 140, y: 470, c: 23 }, { x: 380, y: 210, c: 22 }, { x: 980, y: 560, c: 25 }, { x: 680, y: 820, c: 24 }, { x: 990, y: 300, c: 26 }, { x: 470, y: 860, c: 23 },
];
const segLen = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]));
const ROUTE_LEN = segLen.reduce((a, b) => a + b, 0);
const along = (d: number) => {
  let acc = 0;
  const pts: P[] = [ROUTE[0]];
  for (let i = 0; i < segLen.length; i++) {
    if (d <= acc + segLen[i]) {
      const f = (d - acc) / segLen[i];
      const q: P = [lerp(ROUTE[i][0], ROUTE[i + 1][0], f), lerp(ROUTE[i][1], ROUTE[i + 1][1], f)];
      pts.push(q);
      return { p: q, pts };
    }
    acc += segLen[i];
    pts.push(ROUTE[i + 1]);
  }
  return { p: ROUTE[ROUTE.length - 1], pts };
};
/** Route distance of the point nearest to (x, y). */
const project = (x: number, y: number) => {
  let best = { d: 0, dist: 1e9 }, acc = 0;
  for (let i = 0; i < segLen.length; i++) {
    const [ax, ay] = ROUTE[i], [bx, by] = ROUTE[i + 1];
    const f = clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (segLen[i] * segLen[i]));
    const dist = Math.hypot(ax + (bx - ax) * f - x, ay + (by - ay) * f - y);
    if (dist < best.dist) best = { d: acc + f * segLen[i], dist };
    acc += segLen[i];
  }
  return best.d;
};
const WALK_A = 10.2, WALK_B = 17.7, WALK_END = 0.74;
const walkD = (t: number) => ROUTE_LEN * WALK_END * seg(t, WALK_A, WALK_B);
const passT = (d: number) => WALK_A + (WALK_B - WALK_A) * (d / ROUTE_LEN / WALK_END);
const WAVE_T = 38.74, WAVE_DUR = 1.6, WAVE_R = 1500;
const waveR = (t: number) => WAVE_R * easeOutCubic(seg(t, WAVE_T, WAVE_T + WAVE_DUR));
const waveHitT = (r: number) => WAVE_T + WAVE_DUR * (1 - Math.cbrt(1 - clamp(r / WAVE_R)));
const ptsStr = (pts: P[]) => pts.map((p) => p.join(',')).join(' ');

const MapLabel: React.FC<{ x: number; y: number; text: string; rot?: number; anchor?: 'start' | 'middle' | 'end'; size?: number; color?: string }> = ({ x, y, text, rot = 0, anchor = 'start', size = 23, color = '#b7c8ec' }) => (
  <text x={x} y={y} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined} textAnchor={anchor} fontFamily="Archivo" fontWeight={800} fontSize={size} letterSpacing={size * 0.12} fill={color} stroke="#071027" strokeWidth={5} paintOrder="stroke">
    {text}
  </text>
);

export const HeatMap: React.FC<{ t: number; mode: 'walk' | 'wave' }> = ({ t, mode }) => {
  const wave = mode === 'wave';
  const d = wave ? ROUTE_LEN : walkD(t);
  const { p: hot, pts: trail } = along(d);
  const R = wave ? waveR(t) : 0;
  const lean = wave ? 0 : easeInOutSine(seg(t, 13.5, 14.7)) + Math.max(0, t - 14.7) * 0.03;
  const card = easeOutBack(seg(t, 13.75, 14.1), 1.8);
  const pulse = 1 + 0.12 * Math.sin(t * 11);
  const takeover = wave ? clamp(R / 1100) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070f22' }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '190px 770px', transform: `perspective(1500px) translateY(${-lean * 40}px) rotateX(${lean * 15}deg) scale(${1 + lean * 0.24}) rotateZ(${-lean * 2}deg)` }}>
        <svg viewBox="0 0 1080 920" style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 920, overflow: 'visible' }}>
          <defs>
            <filter id="mglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
            <radialGradient id="hotg">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.25" stopColor="#fff1c4" />
              <stop offset="0.55" stopColor="#ffb547" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ff4d1a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="waveg">
              <stop offset="0" stopColor="#ff6a1a" stopOpacity="0.55" />
              <stop offset="0.9" stopColor="#ff4d1a" stopOpacity="0.5" />
              <stop offset="0.985" stopColor="#ffd08a" stopOpacity="0.95" />
              <stop offset="1" stopColor="#ffd08a" stopOpacity="0" />
            </radialGradient>
            <clipPath id="waveclip"><circle cx={STUDIO[0]} cy={STUDIO[1]} r={Math.max(0.1, R)} /></clipPath>
          </defs>
          <rect x={-300} y={-300} width={1680} height={1520} fill="#0a1530" />
          {/* blocks */}
          {Array.from({ length: 22 * 19 }, (_, k) => {
            const cx = (k % 22) * 50 - 10, cy = Math.floor(k / 22) * 50 - 10;
            return <rect key={k} x={cx + 4} y={cy + 4} width={42} height={42} rx={3} fill={rand(k) > 0.5 ? '#0e1d3e' : '#0c1936'} />;
          })}
          {/* river */}
          <path d="M-60 360 C180 400 290 470 470 520 S740 590 830 690 S990 860 1140 900" stroke="#163e74" strokeWidth={62} fill="none" />
          <path d="M-60 360 C180 400 290 470 470 520 S740 590 830 690 S990 860 1140 900" stroke="#1d5193" strokeWidth={40} fill="none" />
          {/* roads */}
          {ROADS.map((r, k) => <polyline key={k} points={ptsStr(r.pts)} stroke="#2a4479" strokeWidth={r.w} fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
          {ROADS.map((r, k) => <polyline key={`c${k}`} points={ptsStr(r.pts)} stroke="#4b6aa8" strokeWidth={1.6} strokeDasharray="10 10" fill="none" opacity={0.7} />)}
          {/* the wave paints the city orange */}
          {wave && R > 0 && (
            <g clipPath="url(#waveclip)">
              <rect x={-300} y={-300} width={1680} height={1520} fill="#3a1206" />
              {ROADS.map((r, k) => <polyline key={`w${k}`} points={ptsStr(r.pts)} stroke="#ff6a1a" strokeWidth={r.w} fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
              <path d="M-60 360 C180 400 290 470 470 520 S740 590 830 690 S990 860 1140 900" stroke="#ff9a3a" strokeWidth={40} fill="none" opacity={0.8} />
            </g>
          )}
          {wave && R > 0 && R < WAVE_R && <circle cx={STUDIO[0]} cy={STUDIO[1]} r={R} fill="url(#waveg)" />}
          {/* landmarks + labels */}
          <g>
            <rect x={548} y={452} width={24} height={34} rx={3} fill="#c9d6f2" stroke="#071027" strokeWidth={3} />
            <circle cx={560} cy={462} r={7} fill="#0a1530" />
            <MapLabel x={110} y={830} text="SECTOR 17" size={26} color="#e4ecff" />
            <MapLabel x={436} y={512} text="MALL ROAD" rot={-40} size={20} />
            <MapLabel x={586} y={500} text="CLOCK TOWER" size={20} />
            <MapLabel x={800} y={660} text="RIVERSIDE" size={20} />
            <MapLabel x={250} y={262} text="OLD CITY" size={24} />
            <MapLabel x={846} y={146} text="GARMI 24×7 STUDIO" anchor="end" size={22} color="#ffffff" />
          </g>
          {/* glowing trail + hot spot */}
          {d > 1 && (
            <g>
              <polyline points={ptsStr(trail)} stroke="#ff4d1a" strokeWidth={40} fill="none" opacity={0.5} filter="url(#mglow)" strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={ptsStr(trail)} stroke="#ff8a2a" strokeWidth={14} fill="none" opacity={0.9} strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={ptsStr(trail)} stroke="#ffe2b0" strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          )}
          {/* temperature bubbles */}
          {BUBBLES.map((b, k) => {
            let flipT = Infinity, val = b.h ?? b.c;
            if (!wave && b.h) flipT = passT(project(b.x, b.y));
            const waveT = wave ? waveHitT(Math.hypot(b.x - STUDIO[0], b.y - STUDIO[1])) : Infinity;
            const hotNow = (!wave && t >= flipT) || wave;
            const ninety = wave && t >= waveT;
            if (ninety) val = 99;
            else if (!hotNow) val = b.c;
            const since = ninety ? t - waveT : t - flipT;
            const pop = since >= 0 && since < 0.5 ? 1 + 0.45 * Math.exp(-since * 9) * Math.cos(since * 22) : 1;
            const flip = ninety && since < 0.2 ? Math.abs(Math.cos((since / 0.2) * Math.PI)) : 1;
            const fill = ninety ? '#ff5a12' : hotNow ? C.red : '#1f6fe0';
            return (
              <g key={k} transform={`translate(${b.x} ${b.y}) scale(${pop * flip} ${pop})`}>
                <circle r={34} fill={fill} stroke="#fff" strokeWidth={3} style={{ filter: hotNow ? 'drop-shadow(0 0 10px rgba(255,80,30,0.9))' : 'drop-shadow(0 0 6px rgba(40,120,255,0.7))' }} />
                <text y={9} textAnchor="middle" fontFamily="Archivo" fontWeight={900} fontSize={26} fill="#fff">{val}°</text>
              </g>
            );
          })}
          {/* studio pin */}
          <g transform={`translate(${STUDIO[0]} ${STUDIO[1]})`}>
            <path d="M0 0 C-18 -24 -26 -38 -26 -52 C-26 -68 -14 -80 0 -80 C14 -80 26 -68 26 -52 C26 -38 18 -24 0 0 Z" fill={C.red} stroke="#fff" strokeWidth={3} />
            <circle cy={-53} r={9} fill="#fff" />
          </g>
          {/* S17 marker */}
          <circle cx={ROUTE[0][0]} cy={ROUTE[0][1]} r={12} fill="#ff4d1a" stroke="#fff" strokeWidth={3} />
          {/* hot spot */}
          <circle cx={hot[0]} cy={hot[1]} r={150 * pulse} fill="url(#hotg)" opacity={0.45} />
          <circle cx={hot[0]} cy={hot[1]} r={58 * pulse} fill="url(#hotg)" />
        </svg>
        {/* party card at the start of the trail */}
        {!wave && card > 0 && (
          <div style={{ position: 'absolute', left: 58, top: 560, width: 'max-content', transformOrigin: '20% 100%', transform: `rotateX(${-lean * 15}deg) scale(${card})` }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.5)', border: `4px solid ${C.fire}` }}>
              <div style={{ width: 78, height: 78, borderRadius: 39, overflow: 'hidden', background: 'radial-gradient(circle, #ff8cc6, #c2357c)', flex: '0 0 auto', position: 'relative', border: '3px solid #1b1210' }}>
                <Uncle id="card-uncle" style={{ position: 'absolute', left: -14, top: -4, width: 106, height: 117 }} />
              </div>
              <div>
                <div style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 26, color: C.navy, whiteSpace: 'nowrap' }}>🎉 SECTOR 17 PARTY</div>
                <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 22, color: '#444', marginTop: 4, whiteSpace: 'nowrap' }}>
                  <span style={{ color: C.red }}>"dead"</span> until 11:58 PM
                </div>
              </div>
            </div>
            <div style={{ width: 0, height: 0, marginLeft: 120, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: `20px solid ${C.fire}` }} />
          </div>
        )}
      </div>
      {wave && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(255,120,40,0.35), rgba(255,77,26,0.15) 60%, transparent)', opacity: takeover, mixBlendMode: 'screen' }} />}
      {/* legend (screen space) */}
      <div style={{ position: 'absolute', left: 26, top: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: wave ? C.fire : C.red, color: '#fff', fontFamily: FONT.archivo, fontWeight: 900, fontSize: 22, letterSpacing: '0.1em', padding: '6px 12px', borderRadius: 4 }}>● LIVE HEAT MAP</div>
      </div>
      <div style={{ position: 'absolute', right: 26, bottom: 22, width: 250, background: 'rgba(7,15,34,0.75)', padding: '8px 10px', borderRadius: 8 }}>
        <div style={{ height: 14, borderRadius: 7, background: 'linear-gradient(90deg, #1f6fe0, #ffd21f, #ff4d1a, #b00d14)', border: '2px solid rgba(255,255,255,0.7)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.archivo, fontWeight: 800, fontSize: 18, color: '#c9d6f2', marginTop: 4 }}>
          <span>20°</span><span>35°</span><span>{wave ? '99°' : '50°'}</span>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────── 6/7 · CCTV + evidence photo ─────────────────────────
const Street: React.FC = () => (
  <svg viewBox="0 0 1080 920" style={{ position: 'absolute', inset: 0, width: 1080, height: 920 }}>
    <defs>
      <radialGradient id="lamp" cx="0.5" cy="0" r="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="pool"><stop offset="0" stopColor="#ddd" stopOpacity="0.5" /><stop offset="1" stopColor="#ddd" stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="1080" height="920" fill="#121212" />
    <rect width="1080" height="420" fill="#1b1b1b" />
    {/* buildings in perspective toward (540, 400) */}
    <polygon points="0,0 400,250 400,560 0,800" fill="#2a2a2a" />
    <polygon points="1080,0 680,250 680,560 1080,800" fill="#262626" />
    <polygon points="400,250 470,300 470,520 400,560" fill="#1e1e1e" />
    <polygon points="680,250 610,300 610,520 680,560" fill="#1e1e1e" />
    {Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, (_, c) => {
      const f = c / 4, g = c / 4 + 0.12;
      const y0 = 60 + r * 120, y1 = y0 + 60;
      const lx = (u: number, y: number) => [u * 400, y * (1 - u) + (250 + (y - 0) * (310 / 800)) * u];
      const a = lx(f, y0), b = lx(g, y0), cc = lx(g, y1), d = lx(f, y1);
      const lit = rand(r * 7 + c) > 0.55;
      const pts = [a, b, cc, d].map((q) => q.join(',')).join(' ');
      const mir = [a, b, cc, d].map((q) => `${1080 - q[0]},${q[1]}`).join(' ');
      return (
        <g key={`${r}${c}`}>
          <polygon points={pts} fill={lit ? '#8a8a8a' : '#333'} />
          <polygon points={mir} fill={rand(r * 3 + c * 5) > 0.6 ? '#7a7a7a' : '#313131'} />
        </g>
      );
    }))}
    {/* road + pavements */}
    <polygon points="0,920 1080,920 620,430 460,430" fill="#2b2b2b" />
    <polygon points="0,800 0,920 120,920 470,470 440,470" fill="#3a3a3a" />
    <polygon points="1080,800 1080,920 960,920 610,470 640,470" fill="#3a3a3a" />
    {Array.from({ length: 7 }, (_, k) => {
      const u0 = Math.pow(k / 7, 1.7), u1 = Math.pow((k + 0.45) / 7, 1.7);
      const y0 = 430 + u0 * 490, y1 = 430 + u1 * 490;
      const w0 = 2 + u0 * 14, w1 = 2 + u1 * 14;
      return <polygon key={k} points={`${540 - w0},${y0} ${540 + w0},${y0} ${540 + w1},${y1} ${540 - w1},${y1}`} fill="#9a9a9a" />;
    })}
    {/* lamp posts */}
    {[{ x: 210, dir: 1 }, { x: 870, dir: -1 }].map(({ x, dir }) => (
      <g key={x}>
        <polygon points={`${x + dir * 80},170 ${x + dir * 80 - 150},820 ${x + dir * 80 + 150},820`} fill="url(#lamp)" />
        <ellipse cx={x + dir * 80} cy={800} rx={190} ry={40} fill="url(#pool)" />
        <rect x={x - 7} y={150} width={14} height={680} fill="#0c0c0c" />
        <path d={`M${x} 156 Q${x + dir * 40} 130 ${x + dir * 80} 150`} stroke="#0c0c0c" strokeWidth={10} fill="none" />
        <rect x={x + dir * 80 - 26} y={148} width={52} height={20} rx={6} fill="#eee" />
      </g>
    ))}
  </svg>
);

export const CCTV: React.FC<{ t: number }> = ({ t }) => {
  const f = frameOf(t);
  const k = f % 8;
  const jitter = (rand(f * 1.7) - 0.5) * 3;
  const sec = 41 + Math.floor(t - 17.7);
  const stamp = `2026-10-22 23:${String(57 + Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const rec = Math.floor(t * 2) % 2 === 0;
  const box = seg(t, 18.6, 18.74);
  const boxS = box < 1 ? lerp(1.6, 1, easeOutCubic(box)) : 1 + 0.01 * Math.sin(t * 20);
  const photo = t >= 21.2;
  const slide = easeOutCubic(seg(t, 21.2, 21.6));
  const melt = easeInOutSine(seg(t, 21.6, 23.6));
  const roll = ((t * 0.18) % 1.3) * 1100 - 150;
  const dim = photo ? lerp(1, 0.72, slide) : 1;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, filter: `grayscale(1) contrast(1.15) brightness(${dim})`, transform: `translateX(${jitter}px)` }}>
        <div style={{ position: 'absolute', inset: 0, filter: 'blur(1.4px)' }}>
          <Street />
          {/* him, blown out by his own heat */}
          <div style={{ position: 'absolute', left: 540 - 300, top: 160, width: 600, height: 760, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,255,255,0.85), rgba(255,255,255,0.35) 45%, rgba(255,255,255,0) 72%)' }} />
          <svg viewBox="0 0 220 300" style={{ position: 'absolute', left: 540 - 110, top: 540, width: 220, height: 300, filter: 'blur(7px)' }}>
            <path d="M40 0 L180 0 L172 120 L160 290 L124 290 L114 110 L106 110 L96 290 L60 290 L48 120 Z" fill="#dcdcdc" />
          </svg>
          <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: 540 - 205, top: 205, width: 400, height: 400, filter: 'brightness(3.1) contrast(0.55) blur(5px)' }} />
          <div style={{ position: 'absolute', left: 540 - 300, top: 170, width: 600, height: 720, background: 'radial-gradient(ellipse 40% 48% at 50% 50%, rgba(255,255,255,0.9), rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 72%)', mixBlendMode: 'screen' }} />
          <div style={{ position: 'absolute', left: 540 - 150, top: 480, width: 300, height: 200, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,255,255,0.95), rgba(255,255,255,0) 75%)' }} />
        </div>
        <Img src={staticFile(`garmi/noise${k}.png`)} style={{ position: 'absolute', left: -((f * 37) % 60), top: -((f * 53) % 60), width: 1200, height: 1040, opacity: 0.32, mixBlendMode: 'overlay', imageRendering: 'pixelated' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.38) 0 2px, transparent 2px 5px)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: roll, height: 70, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.09), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)' }} />
      </div>
      {/* HUD */}
      <div style={{ position: 'absolute', left: 28, top: 24, fontFamily: FONT.mono, fontWeight: 700, color: '#f2f2f2', textShadow: '0 2px 4px #000', lineHeight: 1.3 }}>
        <div style={{ fontSize: 32, letterSpacing: '0.06em' }}>CAM 04 · SECTOR 17</div>
        <div style={{ fontSize: 28, opacity: 0.9 }}>{stamp}</div>
      </div>
      <div style={{ position: 'absolute', right: 30, top: 26, fontFamily: FONT.mono, fontWeight: 800, fontSize: 32, color: '#ff2a2a', opacity: rec ? 1 : 0.15, textShadow: '0 2px 4px #000' }}>● REC</div>
      {t >= 18.6 && (
        <div style={{ position: 'absolute', left: 330, top: 196, width: 420, height: 620, transform: `scale(${boxS})`, opacity: box < 1 ? (Math.floor(t * 60) % 2 ? 1 : 0.5) : 1 }}>
          <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255,255,255,0.75)' }} />
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => (
            <div key={`${x}${y}`} style={{ position: 'absolute', left: x ? undefined : -6, right: x ? -6 : undefined, top: y ? undefined : -6, bottom: y ? -6 : undefined, width: 50, height: 50, borderLeft: x ? 'none' : '7px solid #fff', borderRight: x ? '7px solid #fff' : 'none', borderTop: y ? 'none' : '7px solid #fff', borderBottom: y ? '7px solid #fff' : 'none' }} />
          ))}
          <div style={{ position: 'absolute', left: -6, top: -56, background: '#fff', color: '#000', fontFamily: FONT.mono, fontWeight: 800, fontSize: 24, padding: '6px 12px', whiteSpace: 'nowrap' }}>
            SUBJECT: UNKNOWN · <span style={{ color: Math.floor(t * 4) % 2 ? '#d00' : '#000' }}>TEMP ERROR</span>
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', left: 26, bottom: 26, background: C.red, color: '#fff', fontFamily: FONT.anton, fontSize: 44, padding: '4px 18px', letterSpacing: '0.04em', boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}>EXCLUSIVE</div>
      {/* police evidence photo */}
      {photo && (
        <div style={{ position: 'absolute', left: 452, top: 150, width: 580, height: 640, transform: `translateX(${(1 - slide) * 700}px) rotate(${lerp(14, 5, slide)}deg)`, transformOrigin: '50% 50%' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#f7f5ef', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: 22, top: 22, right: 22, height: 500, overflow: 'hidden', background: 'linear-gradient(180deg, #5d6a73 0%, #46525b 60%, #39434b 100%)' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, background: '#e8d9a8', borderTop: '2px solid #111' }}>
              {Array.from({ length: 54 }, (_, k) => <div key={k} style={{ position: 'absolute', left: 6 + k * 10, top: 0, width: 2, height: k % 5 ? 10 : 18, background: '#111' }} />)}
            </div>
            <div style={{ position: 'absolute', left: 20, top: 18, width: 56, height: 56, background: C.yellow, border: '3px solid #111', fontFamily: FONT.anton, fontSize: 40, lineHeight: '50px', textAlign: 'center', color: '#111' }}>B</div>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.25), transparent 60%)' }} />
            <MeltingAviators p={melt} id="ev" style={{ position: 'absolute', left: 26, top: 70, width: 480, height: 351 }} />
          </div>
          <div style={{ position: 'absolute', left: 22, right: 22, top: 536, textAlign: 'center', fontFamily: FONT.archivo, fontWeight: 900, fontSize: 27, color: C.navy, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>EXHIBIT B · OFFICER'S SUNGLASSES</div>
          <div style={{ position: 'absolute', left: 22, right: 22, top: 578, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 18, color: '#7a6f60', letterSpacing: '0.1em' }}>SECTOR 17 · 23:58 · DO NOT TOUCH (HOT)</div>
          <div style={{ position: 'absolute', left: 200, top: -18, width: 180, height: 46, background: 'rgba(255,248,220,0.6)', transform: 'rotate(-4deg)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      )}
    </div>
  );
};

// ───────────────────────── 9 · signal lost ─────────────────────────
const BARS = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
export const SignalLost: React.FC<{ t: number }> = ({ t }) => {
  const f = frameOf(t);
  const showBars = rand(f * 3.7) > 0.45;
  const by = rand(f * 1.3) * 600, bh = 160 + rand(f * 2.1) * 420, bx = (rand(f * 5.5) - 0.5) * 300;
  const flash = clamp(1 - (t - 27.95) / 0.1);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <Img src={staticFile(`garmi/noise${f % 8}.png`)} style={{ position: 'absolute', left: -((f * 41) % 80), top: -((f * 29) % 80), width: 1240, height: 1060, imageRendering: 'pixelated', filter: 'contrast(1.6)' }} />
      {showBars && (
        <div style={{ position: 'absolute', left: bx, top: by, width: 1080, height: bh, display: 'flex', opacity: 0.85 }}>
          {BARS.map((c) => <div key={c} style={{ flex: 1, background: c }} />)}
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, right: 0, top: (rand(f) * 900) | 0, height: 18, background: 'rgba(255,255,255,0.6)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: '#000', padding: '22px 40px', border: '2px solid #444' }}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 800, fontSize: 58, color: '#fff', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>SIGNAL LOST</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: C.fire, opacity: flash * 0.75, mixBlendMode: 'screen' }} />
    </div>
  );
};

// ───────────────────────── 12 · studio thermometer ─────────────────────────
export const Thermometer: React.FC<{ t: number }> = ({ t }) => {
  const inP = easeOutBack(seg(t, 36.0, 36.4), 1.3);
  const v = lerp(56, 99, Math.pow(seg(t, 36.05, 38.7), 1.6));
  const y = (val: number) => 650 - ((val - 50) / 50) * 600;
  const lvl = y(v);
  const shown = Math.round(v);
  return (
    <div style={{ position: 'absolute', left: 780, top: 34, width: 280, height: 860, transform: `translateX(${(1 - inP) * 420}px)` }}>
      <svg viewBox="0 0 280 860" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="merc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c40d06" />
            <stop offset="0.45" stopColor="#ff4d1a" />
            <stop offset="0.7" stopColor="#ffb547" />
            <stop offset="1" stopColor="#d81a08" />
          </linearGradient>
        </defs>
        <rect x={98} y={20} width={84} height={700} rx={42} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth={6} />
        <circle cx={140} cy={760} r={84} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth={6} />
        <rect x={116} y={lvl} width={48} height={760 - lvl} rx={24} fill="url(#merc)" style={{ filter: 'drop-shadow(0 0 12px rgba(255,90,30,0.9))' }} />
        <circle cx={140} cy={760} r={66} fill="url(#merc)" style={{ filter: 'drop-shadow(0 0 18px rgba(255,90,30,0.9))' }} />
        <rect x={124} y={lvl + 10} width={10} height={700 - lvl} rx={5} fill="#fff" opacity={0.45} />
        {Array.from({ length: 11 }, (_, k) => {
          const val = 50 + k * 5;
          return (
            <g key={k}>
              <line x1={190} x2={k % 2 ? 210 : 226} y1={y(val)} y2={y(val)} stroke="#fff" strokeWidth={4} />
              {k % 2 === 0 && <text x={234} y={y(val) + 8} fontFamily="JetBrains Mono" fontWeight={800} fontSize={22} fill="#fff">{val}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', right: 200, top: lvl - 70, fontFamily: FONT.anton, fontSize: 140, lineHeight: '140px', color: '#fff', textShadow: '0 0 30px rgba(255,90,30,0.95), 0 6px 0 rgba(120,20,0,0.6)', whiteSpace: 'nowrap' }}>{shown}°</div>
    </div>
  );
};

// ───────────────────────── 14 · 7-day forecast ─────────────────────────
export const Forecast: React.FC<{ t: number }> = ({ t }) => {
  const stamp = seg(t, STAMP_T, STAMP_T + 0.1);
  const cardW = 235, cardH = 318;
  const pos = (i: number) => (i < 4 ? { x: 40 + i * (cardW + 20), y: 168 } : { x: 167 + (i - 4) * (cardW + 20), y: 520 });
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #2063d0 0%, #0f3a8a 55%, #08204f 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'absolute', left: 44, top: 34, fontFamily: FONT.anton, fontSize: 84, lineHeight: 1, color: '#fff', letterSpacing: '0.02em' }}>7-DAY FORECAST</div>
      <div style={{ position: 'absolute', right: 44, top: 46, textAlign: 'right', fontFamily: FONT.archivo, fontWeight: 800, fontSize: 22, color: '#bcd3ff', letterSpacing: '0.12em', lineHeight: 1.35 }}>GARMI 24×7<br />WEATHER</div>
      {FORECAST.map((c, i) => {
        const { x, y } = pos(i);
        const a = easeInOutCubic(seg(t, c.t, c.t + 0.26)) * 180;
        const back = a > 90;
        const pop = 1 + 0.08 * Math.sin(clamp((t - c.t) / 0.3) * Math.PI);
        const enter = easeOutBack(seg(t, 41.2 + i * 0.02, 41.42 + i * 0.02), 1.4);
        return (
          <div key={c.d} style={{ position: 'absolute', left: x, top: y, width: cardW, height: cardH, transform: `perspective(1000px) rotateY(${back ? a - 180 : a}deg) scale(${pop * enter})` }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 22, border: '3px solid rgba(255,255,255,0.45)', background: back ? 'linear-gradient(180deg, #FFB547 0%, #FF4D1A 55%, #D7141E 100%)' : 'linear-gradient(180deg, #4a98f5 0%, #2563c8 60%, #1a4aa3 100%)', boxShadow: back ? '0 0 40px rgba(255,77,26,0.7)' : '0 10px 24px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', padding: '18px 0' }}>
              <div style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: '0.08em' }}>{c.d}</div>
              <div style={{ fontSize: 92, lineHeight: '100px' }}>{back ? '🔥' : c.e}</div>
              <div style={{ fontFamily: FONT.anton, fontSize: back ? 100 : 88, lineHeight: 1, color: '#fff', textShadow: back ? '0 4px 0 rgba(120,10,0,0.5)' : 'none' }}>{back ? 99 : c.v}°</div>
            </div>
          </div>
        );
      })}
      {t >= STAMP_T && (
        <div style={{ position: 'absolute', left: 540, top: 470, transform: `translate(-50%, -50%) rotate(-13deg) scale(${lerp(2.3, 1, easeInCubic(stamp))})`, opacity: clamp(stamp * 3) }}>
          <div style={{ border: `10px solid ${C.red}`, padding: 8, background: 'rgba(255,246,230,0.9)', boxShadow: '0 10px 40px rgba(0,0,0,0.45)', WebkitMaskImage: `url(${staticFile('garmi/grunge.png')})`, WebkitMaskSize: '100% 100%' }}>
            <div style={{ border: `4px solid ${C.red}`, padding: '10px 34px', fontFamily: FONT.anton, fontSize: 108, lineHeight: 1.05, color: C.red, whiteSpace: 'nowrap', letterSpacing: '0.02em', background: 'rgba(255,246,230,0.9)' }}>FORECAST: TOO HOT</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ───────────────────────── 15 · debate panel ─────────────────────────
const CELL_BG: Record<string, string> = {
  anchor: 'radial-gradient(circle at 50% 30%, #2a62c4, #0d2a66 70%, #071636)',
  trench: 'radial-gradient(circle at 50% 30%, #7a5a8c, #3a2450 70%, #1a1026)',
  leather: 'radial-gradient(circle at 50% 30%, #8c2a2a, #4a0e10 70%, #200506)',
  hoodie: 'radial-gradient(circle at 50% 30%, #5a2a8c, #2a0f4a 70%, #12061f)',
  uncle: 'radial-gradient(circle at 50% 30%, #c4467e, #6a1a44 70%, #2a0a1c)',
  mirror: 'radial-gradient(circle at 50% 30%, #8a6a22, #4a360c 70%, #1f1604)',
};
const Portrait: React.FC<{ file: string; w: number; fx: number; fy: number; at: [number, number] }> = ({ file, w, fx, fy, at }) => {
  const s = w / 1254;
  return <Img src={staticFile(`garmi/${file}.webp`)} style={{ position: 'absolute', left: at[0] - fx * s, top: at[1] - fy * s, width: w, height: w }} />;
};
const DebateCast: React.FC<{ id: string; t: number }> = ({ id, t }) => {
  if (id === 'anchor') return <Anchor id="deb-anchor" style={{ position: 'absolute', left: 4, top: 70, width: 352, height: 458 }} />;
  if (id === 'trench') return <Portrait file="trench" w={560} fx={700} fy={220} at={[176, 196]} />;
  if (id === 'leather') return <Portrait file="leather" w={560} fx={780} fy={230} at={[190, 196]} />;
  if (id === 'hoodie') return <Portrait file="hoodie" w={560} fx={770} fy={300} at={[200, 200]} />;
  if (id === 'uncle') return <Uncle id="deb-uncle" bob={Math.sin(t * 6) * 3} style={{ position: 'absolute', left: 10, top: 66, width: 340, height: 374 }} />;
  return <Mirror id="deb-mirror" sweat={seg(t, 44.2, 47.1)} style={{ position: 'absolute', left: 70, top: 64, width: 220, height: 281 }} />;
};

export const Debate: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: 'absolute', inset: 0, background: '#050a18' }}>
    {DEBATE.map((c, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = col * 362, y = row * 462;
      const enter = easeOutCubic(seg(t, 44.2 + i * 0.04, 44.42 + i * 0.04));
      const b = easeOutBack(seg(t, c.bubble, c.bubble + 0.22), 2.2);
      const nameSize = fitOne(c.name, FONT.anton, 400, 316, 32);
      return (
        <div key={c.id} style={{ position: 'absolute', left: x, top: y, width: 356, height: 458, overflow: 'hidden', background: CELL_BG[c.id], opacity: enter, transform: `scale(${lerp(0.92, 1, enter)})` }}>
          {Array.from({ length: 5 }, (_, k) => (
            <div key={k} style={{ position: 'absolute', left: rand(k + i * 9) * 320, top: rand(k + i * 9 + 4) * 200, width: 40 + rand(k + i) * 40, height: 40 + rand(k + i) * 40, borderRadius: '50%', background: '#fff', opacity: 0.06, filter: 'blur(4px)' }} />
          ))}
          <DebateCast id={c.id} t={t} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.65))' }} />
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 14 }}>
            <div style={{ display: 'inline-block', background: c.id === 'anchor' ? C.red : C.fire, color: '#fff', fontFamily: FONT.anton, fontSize: nameSize, lineHeight: 1.25, padding: '0 10px', whiteSpace: 'nowrap' }}>{c.name}</div>
            <div style={{ background: C.off, color: C.navy, fontFamily: FONT.inter, fontWeight: 600, fontSize: 20, lineHeight: '30px', padding: '0 10px', display: 'inline-block', whiteSpace: 'nowrap' }}>{c.sub}</div>
          </div>
          <div style={{ position: 'absolute', left: 8, top: 8, width: 14, height: 14, borderRadius: 7, background: '#ff3b3b', boxShadow: '0 0 8px #ff3b3b' }} />
          {t >= c.bubble && (
            <div style={{ position: 'absolute', left: 18, top: 16, transformOrigin: '30% 120%', transform: `scale(${b}) rotate(${(1 - clamp((t - c.bubble) / 0.3)) * -6}deg)` }}>
              <div style={{ background: C.yellow, color: '#111', fontFamily: FONT.anton, fontSize: 36, lineHeight: 1, padding: '12px 18px', borderRadius: 18, border: '3px solid #111', whiteSpace: 'nowrap', boxShadow: '0 6px 0 rgba(0,0,0,0.35)' }}>WHO'S THAT MAN?</div>
              <div style={{ position: 'absolute', left: 70, bottom: -20, width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '22px solid #111' }} />
              <div style={{ position: 'absolute', left: 73, bottom: -14, width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: `17px solid ${C.yellow}` }} />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ───────────────────────── 16–19 · That Man, full screen ─────────────────────────
const EMBERS = Array.from({ length: 36 }, (_, k) => ({ x: rand(k * 3.1) * 1080, sp: 60 + rand(k * 7.7) * 120, ph: rand(k * 1.3), s: 3 + rand(k * 5.9) * 6, sw: rand(k * 2.2) * 40 }));
const Embers: React.FC<{ t: number; amt?: number }> = ({ t, amt = 1 }) => (
  <>
    {EMBERS.map((e, k) => {
      const y = 940 - (((t * e.sp) / 920 + e.ph) % 1) * 1000;
      const x = e.x + Math.sin(t * 1.3 + k) * e.sw;
      return <div key={k} style={{ position: 'absolute', left: x, top: y, width: e.s, height: e.s, borderRadius: '50%', background: '#ffd08a', boxShadow: '0 0 10px #ff7a2a, 0 0 20px #ff4d1a', opacity: amt * (0.4 + 0.6 * rand(k)) }} />;
    })}
  </>
);

const AVATAR = ['#e94e77', '#4e9de9', '#f5a623', '#7ed321', '#9b59b6', '#d4a017', '#ff4d1a', '#1abc9c', '#34495e', '#e67e22'];
const Comments: React.FC<{ t: number }> = ({ t }) => {
  const out = clamp((t - 56.0) / 0.3);
  if (t < COMMENTS_T || out >= 1) return null;
  const ROW = 90;
  return (
    <div style={{ position: 'absolute', left: 560, top: 0, width: 500, height: 920, opacity: 1 - out }}>
      {COMMENTS.map((c, i) => {
        const ti = COMMENTS_T + i * 0.2;
        if (t < ti) return null;
        let push = 0;
        for (let j = i + 1; j < COMMENTS.length; j++) push += easeOutCubic(seg(t, COMMENTS_T + j * 0.2, COMMENTS_T + j * 0.2 + 0.14)) * ROW;
        const ein = easeOutCubic(seg(t, ti, ti + 0.16));
        const bottom = 24 + push;
        const fadeTop = clamp((920 - bottom - 70) / 90);
        return (
          <div key={c.u} style={{ position: 'absolute', right: 0, bottom, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 8px 8px', borderRadius: 40, background: 'rgba(10,4,2,0.72)', border: '1px solid rgba(255,180,120,0.25)', transform: `translateX(${(1 - ein) * 80}px)`, opacity: ein * fadeTop, maxWidth: 500 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: AVATAR[i], flex: '0 0 auto', color: '#fff', fontFamily: FONT.archivo, fontWeight: 900, fontSize: 28, lineHeight: '56px', textAlign: 'center' }}>{c.u[0].toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 19, color: '#ffc89a', lineHeight: 1.2 }}>@{c.u}</div>
              <div style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 28, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{c.m}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Beam: React.FC<{ px: number; ang: number; op: number; len?: number; spread?: number }> = ({ px, ang, op, len = 1350, spread = 6.5 }) => {
  const r = (spread * Math.PI) / 180;
  const hw = Math.tan(r) * len;
  return (
    <div style={{ position: 'absolute', left: px, top: -90, width: 0, height: 0, transform: `rotate(${ang}deg)` }}>
      <svg width={hw * 2 + 40} height={len} viewBox={`${-hw - 20} 0 ${hw * 2 + 40} ${len}`} style={{ position: 'absolute', left: -hw - 20, top: 0, filter: 'blur(12px)', mixBlendMode: 'screen', opacity: op }}>
        <defs>
          <linearGradient id={`beam${px}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff8e8" stopOpacity="0.95" />
            <stop offset="0.6" stopColor="#ffe2b0" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffc880" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon points={`-10,0 10,0 ${hw},${len} ${-hw},${len}`} fill={`url(#beam${px})`} />
      </svg>
    </div>
  );
};

export const Profile: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const panX = keys(t, [[47.1, 0], [53.05, 0], [53.45, -170], [56.0, -170], [56.5, 0]], easeInOutCubic);
  const zoom = keys(t, [[47.1, 1.0], [53.2, 1.07], [53.45, 1.02], [56.3, 1.05], [58.9, 1.04], [62.43, 1.13]], easeInOutSine);
  // name strap
  const nIn = easeOutCubic(seg(t, 47.25, 47.6)), nIn2 = easeOutCubic(seg(t, 47.4, 47.75));
  const nOut = easeInCubic(seg(t, 52.95, 53.25));
  const tm = seg(t, TM_T, TM_T + 0.22);
  const vibe = seg(t, TM_T + 0.02, TM_T + 0.14);
  // highlight box
  const hiIn = easeOutBack(seg(t, HIGHLIGHT_T, HIGHLIGHT_T + 0.3), 1.6), hiOut = easeInCubic(seg(t, 59.0, 59.3));
  // spotlights
  const sp = t - SPOT_T;
  const blaze = t >= BLAZE_T ? Math.exp(-(t - BLAZE_T) * 2.2) : 0;
  const burn = t >= BLAZE_T ? 0.22 + 0.78 * blaze : 0;
  const beams = [
    { px: 90, from: -70, to: -24 },
    { px: 330, from: -60, to: -9 },
    { px: 760, from: 60, to: 18 },
    { px: 1000, from: 70, to: 30 },
  ];
  const beamOp = sp > 0 ? clamp(sp / 0.35) * (0.42 + burn * 0.7) : 0;
  const pool = sp > 0 ? clamp((sp - 0.4) / 0.5) * (0.6 + burn) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#1a0402' }}>
      <div style={{ position: 'absolute', inset: 0, filter: `brightness(${1 + burn * 0.55}) saturate(${1 + burn * 0.25}) contrast(${1 + burn * 0.08})` }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${panX}px) scale(${zoom})`, transformOrigin: '470px 300px' }}>
          <div style={{ position: 'absolute', left: -300, top: -200, width: 1680, height: 1320, background: `radial-gradient(circle at 770px 520px, #ffd9a0 0%, #FFB547 12%, #FF7a2a 26%, #FF4D1A 40%, #9a1a07 62%, #2a0603 88%)`, filter: `brightness(${0.95 + pulse * 0.12})` }} />
          <div style={{ position: 'absolute', left: -300, top: -200, width: 1680, height: 1320, background: `repeating-conic-gradient(from ${t * 8}deg at 770px 520px, rgba(255,240,200,0.10) 0deg 5deg, transparent 5deg 16deg)` }} />
          <Img src={staticFile('garmi/thatman.webp')} style={{ position: 'absolute', left: -117, top: 43, width: 1150, height: 1150, filter: 'drop-shadow(0 0 30px rgba(255,140,40,0.55))' }} />
        </div>
        <Embers t={t} />
        {/* spotlights */}
        {sp > 0 && beams.map((b, k) => {
          const u = Math.max(0, sp - k * 0.08);
          const ang = b.to + (b.from - b.to) * Math.exp(-u * 3.2) * Math.cos(u * 6.5);
          return <Beam key={k} px={b.px} ang={ang} op={beamOp} />;
        })}
        {pool > 0 && <div style={{ position: 'absolute', left: 470 - 330, top: 760 - 150, width: 660, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,250,235,0.85), rgba(255,220,170,0.35) 45%, transparent 70%)', mixBlendMode: 'screen', opacity: clamp(pool) }} />}
      </div>
      {/* name strap on the picture */}
      {t < 53.3 && (
        <div style={{ position: 'absolute', left: 34, top: 626, transform: `translateX(${-nOut * 900}px)` }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: C.red, padding: '6px 26px 0', transform: `translateX(${(1 - nIn) * -900}px)`, boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}>
            <span style={{ fontFamily: FONT.anton, fontSize: 104, lineHeight: '120px', color: '#fff', letterSpacing: '0.02em' }}>THAT MAN</span>
            <span style={{ display: 'inline-block', width: 66, fontFamily: FONT.anton, fontSize: 60, lineHeight: '60px', color: '#fff', alignSelf: 'flex-start', marginTop: 10, textAlign: 'center', opacity: tm > 0 ? 1 : 0, transform: `scale(${tm > 0 ? lerp(3.2, 1, easeOutBack(tm, 2)) : 1})` }}>™</span>
            <span style={{ fontSize: 80, lineHeight: '120px' }}>🔥</span>
          </div>
          <br />
          <div style={{ display: 'inline-block', background: C.off, padding: '4px 26px 0', transform: `translateX(${(1 - nIn2) * -900}px)`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            <span style={{ fontFamily: FONT.anton, fontSize: 62, lineHeight: '78px', color: C.navy, letterSpacing: '0.03em' }}>THE BRAND, MAN</span>
          </div>
        </div>
      )}
      {t >= TM_T + 0.02 && t < 53.3 && (
        <div style={{ position: 'absolute', left: 690, top: 44, transform: `rotate(12deg) scale(${lerp(2.4, 1, easeInCubic(vibe))}) translateX(${-nOut * 0}px)`, opacity: clamp(vibe * 3) * (1 - nOut) }}>
          <div style={{ border: `8px solid ${C.fire}`, padding: 6, background: 'rgba(255,246,230,0.92)', WebkitMaskImage: `url(${staticFile('garmi/grunge.png')})`, WebkitMaskSize: '100% 100%' }}>
            <div style={{ border: `3px solid ${C.fire}`, padding: '6px 20px', fontFamily: FONT.anton, fontSize: 70, lineHeight: 1.05, color: C.fire, whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>THE VIBE™</div>
          </div>
        </div>
      )}
      <Comments t={t} />
      {/* the anchor, shrunk into a HIGHLIGHT box */}
      {t >= HIGHLIGHT_T && hiOut < 1 && (
        <div style={{ position: 'absolute', left: 30, top: 600, width: 330, height: 290, transformOrigin: '0% 100%', transform: `scale(${hiIn * (1 - hiOut)})` }}>
          <div style={{ position: 'absolute', left: 0, top: 44, width: 330, height: 246, overflow: 'hidden', border: `5px solid ${C.yellow}`, background: 'radial-gradient(circle at 50% 30%, #2a62c4, #0d2a66 70%, #071636)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}>
            <Anchor id="hi-anchor" style={{ position: 'absolute', left: 60, top: 10, width: 210, height: 273 }} />
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0, background: C.yellow, color: C.navy, fontFamily: FONT.anton, fontSize: 36, lineHeight: '48px', padding: '0 16px', letterSpacing: '0.06em' }}>HIGHLIGHT</div>
        </div>
      )}
      {blaze > 0 && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 47% 60%, #fff 0%, rgba(255,240,210,0.7) 40%, rgba(255,200,140,0.2) 100%)', opacity: clamp(blaze * 1.3), mixBlendMode: 'screen' }} />}
    </div>
  );
};

// ───────────────────────── 21 · end card ─────────────────────────
export const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const a = easeOutCubic(seg(t, 62.9, 63.45));
  const sub = easeOutCubic(seg(t, 63.35, 63.8));
  const fade = 1 - seg(t, 65.07, 65.37);
  const grad = 'linear-gradient(180deg, #FFF4D6 0%, #FFE2A0 22%, #FFB547 45%, #FF4D1A 72%, #D7141E 100%)';
  const line = (txt: string, size: number) => (
    <div style={{ fontFamily: FONT.anton, fontSize: size, lineHeight: 1.0, letterSpacing: '0.01em', background: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', whiteSpace: 'nowrap' }}>{txt}</div>
  );
  const s1 = fitOne('TOO HOT', FONT.anton, 400, 900, 330);
  const s2 = fitOne('TO HANDLE', FONT.anton, 400, 900, 330);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: fade }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 960 - 420, height: 840, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,77,26,0.22), transparent 70%)', opacity: a }} />
        <Embers t={t} amt={0.5 * a} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, transform: `scale(${lerp(1.08, 1, a)})`, filter: `blur(${(1 - a) * 10}px) drop-shadow(0 0 30px rgba(255,90,30,0.55))` }}>
          {line('TOO HOT', s1)}
          {line('TO HANDLE', s2)}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', fontFamily: FONT.inter, fontWeight: 400, fontSize: 40, color: '#8e8e8e', letterSpacing: '0.04em', opacity: sub, transform: `translateY(${(1 - sub) * 16}px)` }}>
          full song on the channel
        </div>
      </div>
    </div>
  );
};

export { noise1 };
