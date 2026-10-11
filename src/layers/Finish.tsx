import React, { useEffect, useRef } from 'react';
import { AbsoluteFill } from 'remotion';
import { HITS, SECTIONS, wildAt } from '../lib/sections';
import { beatAt, clamp, easeInOutCubic } from '../lib/time';

/** Film grain: per-frame seeded noise. */
export const Grain: React.FC<{ frame: number }> = ({ frame }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(cv.width, cv.height);
    let s = (frame * 2654435761) >>> 0 || 1;
    for (let i = 0; i < img.data.length; i += 4) {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      const v = s & 255;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [frame]);
  return (
    <AbsoluteFill style={{ mixBlendMode: 'overlay', opacity: 0.11, pointerEvents: 'none' }}>
      <canvas ref={ref} width={960} height={540} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.72) 100%)', pointerEvents: 'none' }} />
);

export const Flashes: React.FC<{ t: number }> = ({ t }) => {
  let op = 0, color = '#fff';
  for (const h of HITS) {
    const d = t - h.t;
    if (d >= -0.034 && d < 0.6) {
      const v = h.amt * Math.exp(-Math.max(0, d) * 9);
      if (v > op) { op = v; color = h.color; }
    }
  }
  const b = beatAt(t);
  const strobe = wildAt(t) * b.pulse * (b.idx % 4 === 0 ? 0.32 : 0.14);
  if (strobe > op) { op = strobe; color = b.idx % 4 === 0 ? '#ffffff' : '#ffb070'; }
  if (op < 0.01) return null;
  return <AbsoluteFill style={{ background: color, opacity: op * 0.85, mixBlendMode: 'screen' }} />;
};

/** Warm light leak sweeping across on each section change. */
export const LightLeaks: React.FC<{ t: number }> = ({ t }) => {
  const leaks = SECTIONS.slice(1).map((s) => s.t);
  const out: React.ReactNode[] = [];
  leaks.forEach((lt, i) => {
    const p = (t - lt + 0.2) / 1.6;
    if (p < 0 || p > 1) return;
    const x = -30 + easeInOutCubic(p) * 160;
    const a = Math.sin(p * Math.PI);
    out.push(
      <AbsoluteFill
        key={i}
        style={{
          background: `radial-gradient(ellipse 35% 80% at ${x}% ${40 + (i % 3) * 10}%, rgba(255,140,60,${0.55 * a}) 0%, rgba(255,60,90,${0.25 * a}) 40%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />,
    );
  });
  return <>{out}</>;
};

/** Cinematic letterbox, eased in/out over the given windows. */
export const Letterbox: React.FC<{ t: number }> = ({ t }) => {
  const windows: [number, number][] = [[-1, 10.2], [129.85, 200]];
  let amt = 0;
  for (const [a, b] of windows) amt = Math.max(amt, clamp((t - a + 0.01) / 0.6) * (1 - clamp((t - b) / 0.5)));
  if (amt <= 0) return null;
  const h = 132 * easeInOutCubic(amt);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: h, background: '#000' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: '#000' }} />
    </>
  );
};
