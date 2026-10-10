import React from 'react';
import { AbsoluteFill } from 'remotion';
import { lookAt } from '../lib/sections';
import { bandS } from '../lib/time';

export const Background: React.FC<{ t: number }> = ({ t }) => {
  const L = lookAt(t);
  const low = bandS('low', t, 3);
  const bloom = L.glowAmt * (0.55 + 0.55 * low);
  const ox = 50 + Math.sin(t * 0.21) * 22;
  const oy = 30 + Math.cos(t * 0.17) * 12;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${L.top} 0%, ${L.bot} 100%)` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 108%, ${L.glow} 0%, transparent 70%)`,
          opacity: Math.min(1, bloom * 0.75),
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 520px at ${ox}% ${oy}%, ${L.glow2} 0%, transparent 70%)`,
          opacity: Math.min(0.35, L.glowAmt * 0.22),
          mixBlendMode: 'screen',
        }}
      />
      {/* slow diagonal light streaks */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(115deg, transparent 0px, transparent 180px, rgba(255,255,255,0.025) 260px, transparent 340px)`,
          backgroundPosition: `${(t * 40) % 1000}px 0px`,
          opacity: 0.6 + 0.4 * L.glowAmt,
        }}
      />
    </AbsoluteFill>
  );
};
