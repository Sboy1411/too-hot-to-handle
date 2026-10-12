import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useFontsReady } from './fonts';
import { Thermal } from './thermal';
import { HeatField, HeatGrain, HeatVignette, Shimmer } from './world';
import { HUD } from './hud';
import { ambientAt, freezeAt, grid, hitAt, imageTime, paletteAt, wild, HITS } from './story';
import { FPS, clamp, rand } from '../lib/time';
import { VSCENES, VScene } from './scenes';

/** Sensor exposure: the overload hits blow the image out toward white-hot, then the auto-gain recovers. */
const exposure = (t: number) => {
  let gain = 1, lift = 0;
  const bump = (at: number, g: number, l: number, dur: number) => {
    const d = t - at;
    if (d >= 0 && d < dur) { const k = Math.exp(-d * (5 / dur)); gain = Math.max(gain, 1 + g * k); lift = Math.max(lift, l * k); }
  };
  bump(80.667, 2.2, 0.28, 1.4);
  bump(89.97, 1.2, 0.12, 0.5);
  bump(115.4, 1.2, 0.12, 0.5);
  bump(118.07, 2.4, 0.3, 1.6);
  bump(121.17, 2.0, 0.24, 1.2);
  bump(141.43, 3.0, 0.5, 1.9);
  // Building to the big hit: the image runs hotter and hotter.
  if (t > 77.4 && t < 80.667) { const p = (t - 77.4) / 3.27; gain = Math.max(gain, 1 + 0.35 * p * p); lift = Math.max(lift, 0.06 * p); }
  return { gain, lift };
};

const Camera: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => {
  // In the two stops the picture is a held frame: no beat punch, no shake.
  if (freezeAt(t)) return <AbsoluteFill style={{ transform: `scale(${1 + 0.004 * Math.sin(imageTime(t) * 0.37)})` }}>{children}</AbsoluteFill>;
  const g = grid(t);
  const h = hitAt(t, 6);
  const w = wild(t);
  const f = Math.floor(t * FPS);
  const shake = Math.max(h * 0.9, w * 0.35 * g.pulse);
  const sx = (rand(f * 1.7) - 0.5) * 40 * shake;
  const sy = (rand(f * 2.3) - 0.5) * 40 * shake;
  const rot = (rand(f * 3.1) - 0.5) * 1.2 * shake;
  const punch = (0.012 + 0.03 * w) * g.pulse + 0.06 * h;
  const drift = 1 + 0.004 * Math.sin(t * 0.37);
  return <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${drift + punch})` }}>{children}</AbsoluteFill>;
};

const active = (t: number) => VSCENES.filter((s) => t >= s.from - 0.001 && t < s.to);

export const Viral: React.FC = () => {
  const ready = useFontsReady();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const ti = imageTime(t);
  const { blend, name } = paletteAt(t);
  const { gain, lift } = exposure(t);
  const scenes = active(t);
  const amb = ambientAt(ti);
  const flash = HITS.reduce((m, h) => { const d = t - h.t; return d >= -0.02 && d < 0.5 ? Math.max(m, h.amt * Math.exp(-Math.max(0, d) * 10)) : m; }, 0);
  const strobe = wild(t) * grid(t).pulse * 0.2;
  const shimmer = clamp((amb - 0.1) * 3);
  const hudShow = scenes.reduce((m, s) => Math.min(m, typeof s.hud === 'function' ? s.hud(t) : s.hud ?? 1), 1);
  // The camera boots at the top and reboots after the drop burns it out.
  const boot = t >= 129.95 && t < 131.6 ? clamp((t - 130.05) / 1.1) : clamp(t / 1.2);
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Camera t={t}>
        <Thermal id="th-main" blend={blend} gain={gain} lift={lift}>
          <HeatField t={ti} amb={amb} />
          <Shimmer t={ti} amt={shimmer} />
          {scenes.map((s) => s.heat && <React.Fragment key={s.id}>{s.heat(t, ti, s)}</React.Fragment>)}
          {(flash > 0.01 || strobe > 0.01) && <AbsoluteFill style={{ background: '#fff', opacity: Math.min(0.92, Math.max(flash * 0.85, strobe)) }} />}
          <HeatVignette />
          <HeatGrain frame={frame} />
        </Thermal>
        {scenes.map((s) => s.layer && <React.Fragment key={s.id}>{s.layer(t, ti, s)}</React.Fragment>)}
        {scenes.map((s) => s.over && <React.Fragment key={s.id}>{s.over(t, ti, s)}</React.Fragment>)}
      </Camera>
      <HUD t={t} blend={blend} name={name} show={hudShow} boot={boot} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 62%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
export type { VScene };
