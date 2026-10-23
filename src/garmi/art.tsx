import React from 'react';
import { clamp, lerp } from './timeline';

// Illustrated, faceless cast drawn to sit next to the supplied portraits: dark ink outline, two-tone cel shading,
// warm skin, soft rim light. No eyes, nose or mouth on anyone.
const INK = '#1b1210';
const SW = 3.2;

const skin = { base: '#d9a079', shade: '#b97c58', deep: '#9a5f42', light: '#ecc09d' };

/** News anchor: dark bob, teal blazer, white blouse, lapel mic. viewBox 400×520, head centre ≈ (200,150).
 *  yaw: -1…1 turns the head (positive = toward her left, i.e. screen right). rim: warm light from screen right. */
export const Anchor: React.FC<{ yaw?: number; rim?: number; id: string; style?: React.CSSProperties }> = ({ yaw = 0, rim = 0, id, style }) => {
  const fx = yaw * 22; // face shift
  const hx = -yaw * 8; // back-of-hair shift
  const squeeze = 1 - Math.abs(yaw) * 0.12;
  return (
    <svg viewBox="0 0 400 520" style={{ overflow: 'visible', ...style }}>
      <defs>
        <linearGradient id={`${id}-blz`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b5755" />
          <stop offset="0.45" stopColor="#13807d" />
          <stop offset="1" stopColor="#0f6c6a" />
        </linearGradient>
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1d1a" />
          <stop offset="1" stopColor="#140d0c" />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor={skin.light} />
          <stop offset="0.55" stopColor={skin.base} />
          <stop offset="1" stopColor={skin.shade} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#ff7a2a" stopOpacity="0" />
          <stop offset="1" stopColor="#ff8a3a" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* hair, back mass of the bob */}
      <g transform={`translate(${hx} 0)`}>
        <path d="M96 168 C90 96 136 46 200 46 C266 46 312 96 304 170 C301 208 309 236 298 256 C282 266 262 262 250 252 L150 252 C138 262 118 266 102 256 C91 236 99 208 96 168 Z" fill={`url(#${id}-hair)`} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      </g>
      {/* neck */}
      <path d="M176 214 L176 292 C186 300 214 300 224 292 L224 214 Z" fill={skin.base} stroke={INK} strokeWidth={SW} />
      <path d="M176 214 L224 214 L224 258 C210 248 190 248 176 258 Z" fill={skin.shade} />
      {/* blouse (white, V neck) */}
      <path d="M150 300 C168 292 182 290 188 292 L200 350 L212 292 C220 290 234 292 250 300 L262 520 L138 520 Z" fill="#f3f2ee" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M188 292 L200 350 L212 292 C206 300 194 300 188 292 Z" fill={skin.base} stroke={INK} strokeWidth={2} />
      <path d="M200 350 L194 520 L206 520 Z" fill="#d9dad6" />
      {/* blazer */}
      <path d="M52 520 C50 430 60 360 104 330 C132 312 160 302 182 296 L172 336 L196 470 L178 520 Z" fill={`url(#${id}-blz)`} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M348 520 C350 430 340 360 296 330 C268 312 240 302 218 296 L228 336 L204 470 L222 520 Z" fill={`url(#${id}-blz)`} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {/* lapels */}
      <path d="M182 296 L160 330 L176 350 L162 362 L196 470 L172 336 Z" fill="#0d6462" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M218 296 L240 330 L224 350 L238 362 L204 470 L228 336 Z" fill="#0d6462" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      {/* blazer shading + seams */}
      <path d="M60 520 C60 450 66 392 92 352 C82 400 82 460 90 520 Z" fill="#094846" opacity="0.8" />
      <path d="M118 340 C140 330 150 326 160 324" stroke="#2bb0ab" strokeWidth={3} fill="none" opacity="0.7" strokeLinecap="round" />
      <path d="M282 340 C262 330 252 326 242 324" stroke="#2bb0ab" strokeWidth={3} fill="none" opacity="0.55" strokeLinecap="round" />
      <path d="M110 420 C112 460 114 490 116 520" stroke={INK} strokeWidth={2} fill="none" opacity="0.5" />
      <path d="M290 420 C288 460 286 490 284 520" stroke={INK} strokeWidth={2} fill="none" opacity="0.5" />
      {/* lapel mic */}
      <path d="M150 386 C140 420 150 470 132 520" stroke="#111" strokeWidth={2} fill="none" />
      <rect x="143" y="368" width="15" height="22" rx="5" fill="#1a1a1a" stroke="#000" strokeWidth={1.5} transform="rotate(-18 150 379)" />
      <circle cx="150" cy="371" r="3.4" fill="#444" />
      {/* head */}
      <g transform={`translate(${fx} 0) translate(200 150) scale(${squeeze} 1) translate(-200 -150)`}>
        <path d="M150 140 C150 92 174 74 200 74 C228 74 250 92 250 140 C250 188 230 224 200 230 C170 224 150 188 150 140 Z" fill={`url(#${id}-face)`} stroke={INK} strokeWidth={SW} />
        <path d="M150 140 C150 188 170 224 200 230 C182 214 166 186 162 140 Z" fill={skin.shade} opacity="0.55" />
      </g>
      {/* hair front: side-swept fringe and the two side locks */}
      <g transform={`translate(${fx * 0.55} 0)`}>
        <path d="M146 156 C140 96 178 60 214 62 C258 66 266 116 256 160 C244 126 222 108 196 106 C178 116 160 134 146 156 Z" fill={`url(#${id}-hair)`} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M150 130 C136 172 138 222 152 258 L124 258 C106 214 116 160 150 130 Z" fill={`url(#${id}-hair)`} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <g opacity={clamp(1 - yaw * 1.4)}>
          <path d="M250 130 C264 172 262 222 248 258 L276 258 C294 214 284 160 250 130 Z" fill={`url(#${id}-hair)`} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        </g>
        {/* highlights */}
        <path d="M170 86 C190 72 226 72 242 90" stroke="#5a4038" strokeWidth={5} fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M160 104 C176 88 196 84 212 86" stroke="#6b4c42" strokeWidth={3} fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M132 200 C130 220 134 238 140 252" stroke="#4a3530" strokeWidth={3} fill="none" strokeLinecap="round" opacity="0.7" />
      </g>
      {rim > 0 && (
        <g opacity={rim} style={{ mixBlendMode: 'screen' }}>
          <path d="M96 168 C90 96 136 46 200 46 C266 46 312 96 304 170 C301 208 309 236 298 256 L298 520 L348 520 C350 430 340 360 296 330 L296 300 Z" fill={`url(#${id}-rim)`} />
        </g>
      )}
    </svg>
  );
};

/** Anchor's hands resting on the desk with a sheet of papers. viewBox 300×90. */
export const AnchorHands: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 300 90" style={style}>
    <path d="M70 46 L230 40 L240 74 L66 82 Z" fill="#f6f6f2" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
    <path d="M80 54 L200 50 M82 62 L220 57 M84 70 L170 67" stroke="#9aa3ad" strokeWidth={2} />
    <path d="M40 60 C52 40 84 38 104 46 C110 54 104 66 92 68 C70 74 50 74 40 60 Z" fill={skin.base} stroke={INK} strokeWidth={2.4} />
    <path d="M260 56 C248 38 216 36 196 44 C190 52 196 64 208 66 C230 72 250 72 260 56 Z" fill={skin.base} stroke={INK} strokeWidth={2.4} />
    <path d="M10 66 C20 50 36 48 44 54 L42 74 C30 78 16 76 10 66 Z" fill="#0f6c6a" stroke={INK} strokeWidth={2.4} />
    <path d="M290 62 C280 46 264 44 256 50 L258 70 C270 74 284 72 290 62 Z" fill="#0f6c6a" stroke={INK} strokeWidth={2.4} />
  </svg>
);

/** Sector 17 uncle: bald, big black moustache, cream kurta, pink party hat. viewBox 400×440, head centre ≈ (200,190). */
export const Uncle: React.FC<{ id: string; bob?: number; style?: React.CSSProperties }> = ({ id, bob = 0, style }) => (
  <svg viewBox="0 0 400 440" style={{ overflow: 'visible', ...style }}>
    <defs>
      <radialGradient id={`${id}-head`} cx="0.4" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#d9a47a" />
        <stop offset="0.6" stopColor="#bf875e" />
        <stop offset="1" stopColor="#9c6644" />
      </radialGradient>
      <linearGradient id={`${id}-kurta`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#d8c8a2" />
        <stop offset="0.5" stopColor="#f3e8cf" />
        <stop offset="1" stopColor="#dccca8" />
      </linearGradient>
      <linearGradient id={`${id}-hat`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ff4f9c" />
        <stop offset="0.6" stopColor="#ff7cb8" />
        <stop offset="1" stopColor="#e23d88" />
      </linearGradient>
    </defs>
    {/* kurta body */}
    <path d="M40 440 C40 360 70 312 130 296 C156 290 176 288 200 288 C224 288 244 290 270 296 C330 312 360 360 360 440 Z" fill={`url(#${id}-kurta)`} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M60 440 C62 380 80 344 112 320 C96 360 92 400 96 440 Z" fill="#c9b78f" opacity="0.8" />
    {/* neck + mandarin collar + placket */}
    <path d="M166 250 L166 300 C180 310 220 310 234 300 L234 250 Z" fill="#b07a54" stroke={INK} strokeWidth={SW} />
    <path d="M160 294 C176 306 224 306 240 294 L244 312 C226 324 174 324 156 312 Z" fill="#efe3c6" stroke={INK} strokeWidth={2.6} />
    <path d="M200 316 L200 440" stroke={INK} strokeWidth={2.4} />
    {[340, 372, 404].map((y) => <circle key={y} cx={208} cy={y} r={4.5} fill="#c9a24a" stroke={INK} strokeWidth={1.5} />)}
    <g transform={`translate(0 ${bob}) rotate(${bob * 0.6} 200 280)`}>
      {/* ears */}
      <ellipse cx="128" cy="196" rx="16" ry="24" fill="#b07a54" stroke={INK} strokeWidth={SW} />
      <ellipse cx="272" cy="196" rx="16" ry="24" fill="#b07a54" stroke={INK} strokeWidth={SW} />
      {/* bald head */}
      <path d="M134 180 C134 120 164 96 200 96 C238 96 266 120 266 180 C266 232 240 268 200 272 C160 268 134 232 134 180 Z" fill={`url(#${id}-head)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx="176" cy="128" rx="20" ry="11" fill="#f4d2b2" opacity="0.75" transform="rotate(-24 176 128)" />
      {/* grey side hair */}
      <path d="M136 178 C134 160 140 150 146 146 C148 166 146 190 142 206 C138 198 136 188 136 178 Z" fill="#6f6862" stroke={INK} strokeWidth={2} />
      <path d="M264 178 C266 160 260 150 254 146 C252 166 254 190 258 206 C262 198 264 188 264 178 Z" fill="#6f6862" stroke={INK} strokeWidth={2} />
      {/* the moustache */}
      <path d="M200 214 C186 204 160 204 146 214 C134 222 124 224 112 218 C120 236 142 244 164 238 C180 234 192 228 200 226 C208 228 220 234 236 238 C258 244 280 236 288 218 C276 224 266 222 254 214 C240 204 214 204 200 214 Z" fill="#141010" stroke={INK} strokeWidth={2} />
      <path d="M160 214 C172 210 186 212 196 218" stroke="#3b3330" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* party hat */}
      <g transform="rotate(14 214 104)">
        <path d="M168 112 L222 -6 L262 104 C240 116 192 120 168 112 Z" fill={`url(#${id}-hat)`} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M184 76 L246 70 M198 44 L236 40" stroke="#ffe066" strokeWidth={6} />
        {[[200, 96], [232, 92], [214, 60], [226, 20]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={5} fill="#fff" opacity="0.9" />)}
        <circle cx="222" cy="-10" r="13" fill="#ffe066" stroke={INK} strokeWidth={2.4} />
        <path d="M172 112 C150 160 140 200 146 240" stroke="#111" strokeWidth={1.6} fill="none" opacity="0.7" />
      </g>
    </g>
  </svg>
);

/** Gold oval mirror with a fresh crack and a sweat drop. viewBox 360×460. */
export const Mirror: React.FC<{ id: string; sweat?: number; style?: React.CSSProperties }> = ({ id, sweat = 0, style }) => {
  const cx = 214, cy = 176;
  const rays = [
    [[cx, cy], [250, 150], [276, 158], [300, 128]],
    [[cx, cy], [230, 210], [256, 240], [262, 290], [292, 330]],
    [[cx, cy], [186, 200], [170, 246], [128, 268]],
    [[cx, cy], [196, 150], [168, 120], [150, 84]],
    [[cx, cy], [226, 140], [232, 96], [258, 60]],
    [[cx, cy], [180, 178], [130, 170], [84, 190]],
    [[cx, cy], [208, 214], [204, 270], [182, 330], [190, 380]],
  ];
  const dropY = lerp(118, 170, sweat);
  return (
    <svg viewBox="0 0 360 460" style={{ overflow: 'visible', ...style }}>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0b0" />
          <stop offset="0.3" stopColor="#e7b84e" />
          <stop offset="0.6" stopColor="#a8701d" />
          <stop offset="1" stopColor="#f2cf72" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9e7f2" />
          <stop offset="0.45" stopColor="#8fa9c2" />
          <stop offset="1" stopColor="#4b6684" />
        </linearGradient>
      </defs>
      {/* crest + foot */}
      <path d="M150 36 C160 8 200 8 210 36 C196 26 164 26 150 36 Z" fill={`url(#${id}-gold)`} stroke={INK} strokeWidth={2.6} />
      <circle cx="180" cy="20" r="10" fill={`url(#${id}-gold)`} stroke={INK} strokeWidth={2.6} />
      <path d="M140 432 C160 452 200 452 220 432 L210 420 L150 420 Z" fill={`url(#${id}-gold)`} stroke={INK} strokeWidth={2.6} />
      <ellipse cx="180" cy="228" rx="150" ry="198" fill={`url(#${id}-gold)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx="180" cy="228" rx="134" ry="182" fill="none" stroke="#7b4e12" strokeWidth={4} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        return <circle key={a} cx={180 + Math.cos(r) * 142} cy={228 + Math.sin(r) * 190} r={6} fill="#fff3c4" stroke={INK} strokeWidth={1.6} />;
      })}
      <ellipse cx="180" cy="228" rx="124" ry="170" fill={`url(#${id}-glass)`} stroke={INK} strokeWidth={2.6} />
      <path d="M96 140 L150 86 M92 196 L190 98 M240 330 L270 300" stroke="#fff" strokeWidth={10} opacity="0.35" strokeLinecap="round" />
      {/* the crack */}
      <g stroke="#fbfdff" strokeWidth={2.4} fill="none" strokeLinejoin="round">
        {rays.map((r, i) => <polyline key={i} points={r.map((p) => p.join(',')).join(' ')} />)}
        <polygon points={`${cx - 16},${cy - 4} ${cx - 4},${cy - 18} ${cx + 14},${cy - 10} ${cx + 16},${cy + 8} ${cx + 2},${cy + 18} ${cx - 14},${cy + 12}`} />
      </g>
      <g stroke="#2a3a4c" strokeWidth={1} fill="none" opacity="0.6">
        {rays.map((r, i) => <polyline key={i} points={r.map((p) => `${p[0] + 1.5},${p[1] + 1.5}`).join(' ')} />)}
      </g>
      {/* sweat drop on the frame */}
      <g transform={`translate(306 ${dropY})`}>
        <path d="M0 -26 C10 -10 16 0 16 10 C16 20 8 26 0 26 C-8 26 -16 20 -16 10 C-16 0 -10 -10 0 -26 Z" fill="#8fd3ff" stroke={INK} strokeWidth={2.4} />
        <ellipse cx="-5" cy="8" rx="4" ry="7" fill="#fff" opacity="0.85" />
      </g>
    </svg>
  );
};

/** Gold aviators melting on an evidence table. p: 0 intact → 1 a puddle. viewBox 520×380. */
export const MeltingAviators: React.FC<{ p: number; id: string; style?: React.CSSProperties }> = ({ p, id, style }) => {
  const sag = p * 120;
  const narrow = p * 26;
  const lens = (cx: number, flip: number) => {
    // aviator teardrop: wide top, pointed lower-inner corner; sag pulls the bottom into a drip
    const o = (dx: number) => cx + dx * flip;
    const by = 196 + sag;
    return `M${o(-92)} 104 C${o(-60)} 92 ${o(40)} 90 ${o(66)} 104 C${o(76)} 118 ${o(70)} ${150 + sag * 0.3} ${o(40 - narrow)} ${180 + sag * 0.7}
      C${o(20 - narrow * 0.6)} ${by} ${o(-20 + narrow * 0.4)} ${by + 4} ${o(-40 + narrow)} ${by - 10}
      C${o(-80 + narrow * 0.8)} ${180 + sag * 0.4} ${o(-100)} ${140 + sag * 0.15} ${o(-92)} 104 Z`;
  };
  const drip = (x: number, len: number, w: number) => {
    const y0 = 190 + sag * 0.9, y1 = y0 + len;
    return (
      <g>
        <path d={`M${x - w} ${y0} C${x - w} ${y0 + len * 0.5} ${x - w * 0.5} ${y1 - 8} ${x} ${y1} C${x + w * 0.5} ${y1 - 8} ${x + w} ${y0 + len * 0.5} ${x + w} ${y0} Z`} fill={`url(#${id}-lens)`} />
        <circle cx={x} cy={y1 + w * 0.8} r={w * 0.9} fill="#1c2a26" opacity={clamp(p * 3 - 0.6)} />
      </g>
    );
  };
  const bridgeSag = p * 40;
  const puddle = clamp(p * 1.4 - 0.2);
  return (
    <svg viewBox="0 0 520 380" style={{ overflow: 'visible', ...style }}>
      <defs>
        <linearGradient id={`${id}-lens`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4b45" />
          <stop offset="0.6" stopColor="#1a2724" />
          <stop offset="1" stopColor="#0c1311" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8c5d16" />
          <stop offset="0.5" stopColor="#f1c862" />
          <stop offset="1" stopColor="#a7731f" />
        </linearGradient>
        <radialGradient id={`${id}-pud`} cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#4e5f57" />
          <stop offset="0.5" stopColor="#1d2a26" />
          <stop offset="0.85" stopColor="#b88a2e" />
          <stop offset="1" stopColor="#6d4b14" />
        </radialGradient>
      </defs>
      {/* puddle */}
      <ellipse cx="262" cy="346" rx={30 + puddle * 200} ry={6 + puddle * 22} fill={`url(#${id}-pud)`} stroke={INK} strokeWidth={puddle > 0.02 ? 2 : 0} opacity={puddle > 0.01 ? 1 : 0} />
      <ellipse cx={232} cy={340} rx={puddle * 60} ry={puddle * 5} fill="#fff" opacity={0.35 * puddle} />
      {/* temples drooping */}
      <path d={`M${66} 112 C40 ${120 + p * 60} 22 ${150 + p * 120} 10 ${170 + p * 150}`} stroke={`url(#${id}-gold)`} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={`M${454} 112 C480 ${120 + p * 60} 498 ${150 + p * 120} 510 ${170 + p * 150}`} stroke={`url(#${id}-gold)`} strokeWidth={7} fill="none" strokeLinecap="round" />
      {/* drips */}
      {drip(150, 30 + p * 120, 9)}
      {drip(178, 10 + p * 80, 6)}
      {drip(372, 34 + p * 130, 10)}
      {drip(340, 8 + p * 70, 6)}
      {/* lenses */}
      <path d={lens(160, 1)} fill={`url(#${id}-lens)`} stroke={`url(#${id}-gold)`} strokeWidth={7} strokeLinejoin="round" />
      <path d={lens(360, -1)} fill={`url(#${id}-lens)`} stroke={`url(#${id}-gold)`} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M90 122 C110 112 140 110 170 116`} stroke="#fff" strokeWidth={6} opacity={0.45 * (1 - p)} strokeLinecap="round" fill="none" />
      <path d={`M300 118 C330 110 360 112 380 120`} stroke="#fff" strokeWidth={6} opacity={0.45 * (1 - p)} strokeLinecap="round" fill="none" />
      {/* double bridge */}
      <path d={`M226 104 C246 ${92 + bridgeSag} 274 ${92 + bridgeSag} 294 104`} stroke={`url(#${id}-gold)`} strokeWidth={6} fill="none" />
      <path d={`M222 128 C246 ${118 + bridgeSag * 1.2} 274 ${118 + bridgeSag * 1.2} 298 128`} stroke={`url(#${id}-gold)`} strokeWidth={5} fill="none" />
    </svg>
  );
};
