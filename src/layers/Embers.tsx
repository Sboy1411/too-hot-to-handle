import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { lookAt } from '../lib/sections';
import { rand, bandS } from '../lib/time';

const N = 160;
/** Rising sparks. Each particle's position is analytic in t, so frames render independently. */
export const Embers: React.FC<{ t: number; amount?: number }> = ({ t, amount }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { width, height } = useVideoConfig();
  const amt = amount ?? lookAt(t).embers;
  const hi = bandS('high', t, 2);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const s = cv.width / 1920;
    ctx.globalCompositeOperation = 'lighter';
    const count = Math.floor(N * Math.min(1.3, amt) / 1.3);
    for (let i = 0; i < count; i++) {
      const life = 3 + rand(i * 3.1) * 4;
      const phase = rand(i * 7.7) * life;
      const age = ((t + phase) % life) / life;
      const x0 = rand(i * 1.3) * 1920;
      const x = x0 + Math.sin(t * (0.6 + rand(i) * 1.2) + i) * 40 + age * (rand(i * 9) - 0.5) * 200;
      const y = 1120 - age * (1250 + rand(i * 5) * 300);
      const r = (1 + rand(i * 2.2) * 3.2) * (1 - age * 0.6) * (1 + hi * 0.5);
      const a = Math.sin(age * Math.PI) * (0.5 + rand(i * 4) * 0.5);
      const g = ctx.createRadialGradient(x * s, y * s, 0, x * s, y * s, r * 5 * s);
      g.addColorStop(0, `rgba(255,${190 + rand(i) * 60},${120 + rand(i * 2) * 80},${a})`);
      g.addColorStop(0.25, `rgba(255,110,30,${a * 0.5})`);
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x * s, y * s, r * 5 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [t, amt, hi]);
  if (amt <= 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <canvas ref={ref} width={width} height={height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
