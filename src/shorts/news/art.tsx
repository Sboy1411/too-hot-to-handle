import React from 'react';
import { Img, staticFile } from 'remotion';

// Code-drawn cast for the bulletin, faceless like Albert's portraits. Each figure sits in a 600x700 box, waist up.

const SKIN = '#D9A27A';
const SKIN_SHADE = '#B9805B';

/** The anchor: a faceless newsreader with a bob, teal blazer and a lapel mic. `rim` is the orange edge light. */
export const Anchor: React.FC<{ w: number; rim?: number; turn?: number }> = ({ w, rim = 0.4, turn = 0 }) => (
  <svg width={w} height={(w * 700) / 600} viewBox="0 0 600 700" style={{ overflow: 'visible', display: 'block' }}>
    <defs>
      <linearGradient id="anchor-skin" x1="0" x2="1">
        <stop offset="0" stopColor="#B57B56" />
        <stop offset="0.45" stopColor={SKIN} />
        <stop offset="0.8" stopColor="#E7B48E" />
        <stop offset="1" stopColor="#C68D66" />
      </linearGradient>
      <linearGradient id="anchor-blazer" x1="0" x2="1">
        <stop offset="0" stopColor="#09333C" />
        <stop offset="0.5" stopColor="#0F5462" />
        <stop offset="1" stopColor="#0B3D47" />
      </linearGradient>
      <linearGradient id="anchor-hair" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#3B2A22" />
        <stop offset="1" stopColor="#140D0A" />
      </linearGradient>
    </defs>
    {/* hair behind the head */}
    <path d="M 196 200 C 190 110 240 66 300 66 C 362 66 410 110 404 200 C 402 252 410 300 420 334 C 384 350 352 336 340 316 L 260 316 C 248 336 218 350 180 334 C 190 300 198 252 196 200 Z" fill="url(#anchor-hair)" />
    {/* neck */}
    <path d="M 270 248 L 270 330 Q 300 350 330 330 L 330 248 Z" fill={SKIN_SHADE} />
    <g transform={`rotate(${turn * 9} 300 260)`}>
      <ellipse cx={300} cy={188} rx={76} ry={94} fill="url(#anchor-skin)" />
      {/* side-swept fringe and the strand over the left cheek */}
      <path d="M 222 166 C 228 98 296 74 350 92 C 390 106 408 150 406 204 L 404 262 C 396 214 380 150 330 126 C 300 150 254 164 222 166 Z" fill="url(#anchor-hair)" />
      <path d="M 226 150 C 204 192 204 254 214 306 L 194 306 C 186 244 194 180 226 150 Z" fill="#1A120E" />
      <path d="M 252 118 C 290 100 336 102 366 122" fill="none" stroke="#5A4134" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
    </g>
    {/* blazer, blouse, lapels */}
    <path d="M 70 700 L 82 452 C 88 392 118 362 180 346 L 262 318 L 300 372 L 338 318 L 420 346 C 482 362 512 392 518 452 L 530 700 Z" fill="url(#anchor-blazer)" />
    <path d="M 266 318 L 300 520 L 334 318 Q 300 338 266 318 Z" fill="#F1E6DA" />
    <path d="M 264 318 L 226 374 L 252 394 L 236 424 L 300 528 L 300 470 Z" fill="#0A3A44" />
    <path d="M 336 318 L 374 374 L 348 394 L 364 424 L 300 528 L 300 470 Z" fill="#0C4652" />
    <path d="M 124 470 C 132 560 142 640 150 700 M 476 470 C 468 560 458 640 450 700" fill="none" stroke="#06262D" strokeWidth={6} opacity={0.7} />
    <circle cx={252} cy={438} r={8} fill="#111" />
    <path d="M 252 446 L 256 476" stroke="#111" strokeWidth={3} />
    {/* rim light from the monitor wall */}
    {rim > 0 && (
      <g fill="none" stroke="#FFB070" strokeLinecap="round" opacity={rim} style={{ filter: 'blur(1.5px)' }}>
        <path d="M 404 150 C 410 200 404 250 418 330" strokeWidth={6} />
        <path d="M 420 346 C 482 362 512 392 518 452 L 526 600" strokeWidth={7} />
        <path d="M 372 120 C 380 150 378 210 368 250" strokeWidth={4} />
      </g>
    )}
  </svg>
);

/** The Sector 17 uncle from the party: bald, big moustache, cream kurta, still wearing his party hat. */
export const Uncle: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={(w * 700) / 600} viewBox="0 0 600 700" style={{ overflow: 'visible', display: 'block' }}>
    <defs>
      <linearGradient id="uncle-skin" x1="0" x2="1">
        <stop offset="0" stopColor="#A66B45" />
        <stop offset="0.5" stopColor="#C98B62" />
        <stop offset="1" stopColor="#B47852" />
      </linearGradient>
    </defs>
    <path d="M 60 700 L 74 470 C 82 400 130 372 210 356 L 300 344 L 390 356 C 470 372 518 400 526 470 L 540 700 Z" fill="#EADBC4" />
    <path d="M 60 700 L 74 470 C 82 420 110 392 150 378 L 170 700 Z" fill="#D5C3A8" />
    <path d="M 262 344 L 262 372 Q 300 384 338 372 L 338 344" fill="#E2D0B5" stroke="#CDB998" strokeWidth={4} />
    <path d="M 300 380 L 300 560" stroke="#CDB998" strokeWidth={5} />
    {[420, 465, 510].map((y) => <circle key={y} cx={300} cy={y} r={7} fill="#B79A6E" />)}
    <path d="M 268 300 L 268 350 Q 300 366 332 350 L 332 300 Z" fill="#A8704A" />
    <ellipse cx={204} cy={238} rx={16} ry={26} fill="#B47852" />
    <ellipse cx={396} cy={238} rx={16} ry={26} fill="#B47852" />
    <ellipse cx={300} cy={226} rx={94} ry={104} fill="url(#uncle-skin)" />
    <ellipse cx={270} cy={156} rx={34} ry={18} fill="#fff" opacity={0.25} transform="rotate(-20 270 156)" />
    <path d="M 210 236 C 206 200 216 180 232 170 L 236 236 Z M 390 236 C 394 200 384 180 368 170 L 364 236 Z" fill="#9C9690" />
    {/* the moustache */}
    <path d="M 300 262 C 270 250 236 254 220 276 C 236 272 250 280 262 288 C 280 296 296 284 300 278 C 304 284 320 296 338 288 C 350 280 364 272 380 276 C 364 254 330 250 300 262 Z" fill="#1A1210" />
    {/* party hat */}
    <g transform="rotate(14 300 120)">
      <path d="M 252 136 L 348 136 L 300 26 Z" fill="#FF3B7A" />
      <path d="M 268 100 L 332 100 L 322 78 L 278 78 Z M 286 58 L 314 58 L 306 42 L 294 42 Z" fill="#FFD23F" />
      <circle cx={300} cy={24} r={13} fill="#5EE6A8" />
      <path d="M 252 136 L 348 136" stroke="#C81E58" strokeWidth={6} />
    </g>
  </svg>
);

/** The jealous mirror: a gilt oval with a cold reflection and a fresh crack. */
export const Mirror: React.FC<{ w: number; crack?: number }> = ({ w, crack = 1 }) => (
  <svg width={w} height={(w * 700) / 600} viewBox="0 0 600 700" style={{ overflow: 'visible', display: 'block' }}>
    <defs>
      <linearGradient id="mirror-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5D7398" />
        <stop offset="0.42" stopColor="#C9D8EE" />
        <stop offset="0.5" stopColor="#F2F7FF" />
        <stop offset="0.6" stopColor="#A9BCD8" />
        <stop offset="1" stopColor="#4A5E80" />
      </linearGradient>
      <linearGradient id="mirror-gold" x1="0" x2="1">
        <stop offset="0" stopColor="#8A6420" />
        <stop offset="0.5" stopColor="#F1CF6E" />
        <stop offset="1" stopColor="#9B7228" />
      </linearGradient>
    </defs>
    <ellipse cx={300} cy={360} rx={210} ry={290} fill="url(#mirror-glass)" stroke="url(#mirror-gold)" strokeWidth={36} />
    <ellipse cx={300} cy={360} rx={232} ry={312} fill="none" stroke="#6E4F18" strokeWidth={4} opacity={0.6} />
    <path d="M 170 250 L 260 160 M 190 330 L 330 190" stroke="#fff" strokeWidth={16} opacity={0.35} strokeLinecap="round" />
    {crack > 0 && (
      <g fill="none" stroke="#24324A" strokeWidth={4} strokeLinecap="round" opacity={0.85 * crack}>
        <path d="M 360 300 L 420 230 L 470 210 M 360 300 L 440 330 L 500 320 M 360 300 L 330 400 L 350 470 L 330 560 M 360 300 L 280 280 L 210 300 M 360 300 L 400 400 L 450 430" />
        <circle cx={360} cy={300} r={10} fill="#24324A" />
      </g>
    )}
    <path d="M 120 330 C 110 345 110 360 120 368 C 130 360 130 345 120 330 Z" fill="#BFE3FF" opacity={0.9} />
  </svg>
);

/** One of Albert's portraits (transparent PNG), sized by width and offset inside its box. */
export const Portrait: React.FC<{ src: string; w: number; x?: number; y?: number; style?: React.CSSProperties }> = ({ src, w, x = 0, y = 0, style }) => (
  <Img src={staticFile(`shorts/${src}.png`)} style={{ position: 'absolute', left: x, top: y, width: w, height: w, ...style }} />
);
