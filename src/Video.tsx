import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import './fonts';
import { Background } from './layers/Background';
import { FireField } from './layers/FireField';
import { Embers } from './layers/Embers';
import { Grain, Vignette, Flashes, LightLeaks, Letterbox } from './layers/Finish';
import { HUD } from './layers/HUD';
import { SCENES } from './scenes';
import { HITS, wildAt } from './lib/sections';
import { FPS, bandS, beatAt, rand } from './lib/time';

const Camera: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => {
  const low = bandS('low', t, 1);
  const { pulse } = beatAt(t);
  let shake = 0;
  for (const h of HITS) {
    const d = t - h.t;
    if (d >= 0 && d < 0.8) shake = Math.max(shake, h.amt * Math.exp(-d * 6));
  }
  const wild = wildAt(t);
  shake = Math.max(shake, wild * 0.32 * pulse);
  const f = Math.floor(t * FPS);
  const sx = (rand(f * 1.7) - 0.5) * 34 * shake;
  const sy = (rand(f * 2.3) - 0.5) * 34 * shake;
  const scale = 1 + (0.014 + 0.03 * wild) * pulse * Math.min(1, low * 1.6) + 0.05 * shake;
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${scale})` }}>{children}</AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const t = frame / FPS;
  const active = SCENES.filter((s) => t >= s.from - 0.001 && t < s.to);
  // The whole stage is authored at 1920x1080; the 4K comp scales it.
  const k = width / 1920;
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <Background t={t} />
        <FireField t={t} />
        <Camera t={t}>
          {active.map((s) => (
            <React.Fragment key={s.id}>{s.el(t, s)}</React.Fragment>
          ))}
        </Camera>
        <Embers t={t} />
        <LightLeaks t={t} />
        <Flashes t={t} />
        <HUD t={t} />
        <Vignette />
        <Letterbox t={t} />
        <Grain frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
