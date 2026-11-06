import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import '../../fonts';
import { useFontsReady } from '../../viral/fonts';
import { Cracks, Slices } from '../../viral/fx';
import { FPS, clamp, easeInCubic } from '../../lib/time';
import { KICKS, M, START, heatAt, kf } from './script';
import { BG, Banner, Caption, Feed, Header, InputBar, Keyboard, Modal, ProfileView, StatusBar, Wallpaper } from './ui';
import { DeadScreen, EyesFlood, Filters, Flash, HeartPop, HeatGrade, Lava, Sparks, TitleSlam } from './fx';

// Camera hits: him walking in, the song opening up, the alert's kicks, every word of the molten title, the reboot and the pop.
const IMPULSES: [number, number][] = [[M.turn, 7], [M.open, 6], ...KICKS.map((k) => [k, 12] as [number, number]), [80.9, 20], [81.3, 10], [81.4, 10], [81.8, 18], [82.1, 10], [82.4, 24], [M.reboot, 14], [86.72, 6], [89.2, 6], [M.pop, 26]];
const shakeAt = (t: number) => {
  let x = 0, y = 0;
  for (const [at, a] of IMPULSES) {
    const d = t - at;
    if (d < 0 || d > 0.6) continue;
    const e = a * Math.exp(-d * 9);
    x += e * Math.sin(d * 63 + at);
    y += e * Math.cos(d * 51 + at * 2);
  }
  return { x, y };
};
const zoomAt = (t: number) => {
  if (t >= M.reboot) return 1 + 0.03 * clamp((t - M.reboot) / (M.pop - M.reboot)) + 0.03 * Math.exp(-(t - M.reboot) * 5);
  return 1 + 0.06 * easeInCubic(clamp((t - 72) / (M.melt - 72))) + (t >= M.open ? 0.03 * Math.exp(-(t - M.open) * 4) : 0);
};

const Phone: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
    <Wallpaper />
    <Feed t={t} />
    <Caption t={t} />
    <InputBar t={t} />
    <Keyboard t={t} />
    <Header t={t} />
    <ProfileView t={t} />
    <StatusBar t={t} />
    <Banner t={t} />
    {t < M.reboot && <Modal t={t} />}
  </AbsoluteFill>
);

export const ChatShort: React.FC = () => {
  const frame = useCurrentFrame();
  const ready = useFontsReady();
  const t = START + frame / FPS;
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const h = heatAt(t);
  const melting = t >= M.melt && t < M.reboot;
  const mp = Math.pow(clamp((t - M.melt) / 0.6), 1.7);
  const phoneOn = t < M.melt + 0.75 || (t >= M.reboot && t < M.dead);
  // shimmer stays gentle while his lines are read, then boils under the alert
  const haze = t >= M.reboot ? 8 : kf(t, [[72, 0], [76, 5], [78.6, 12], [M.modal, 22], [M.melt, 38]]);
  const boot = t >= M.reboot ? Math.exp(-(t - M.reboot) * 7) : 0;
  const filter = melting
    ? `url(#melt) brightness(${1 + 0.5 * mp}) saturate(${1 + mp})`
    : haze > 0.5 ? `url(#haze)${boot > 0.02 ? ` brightness(${1 + 1.2 * boot})` : ''}` : undefined;
  const { x, y } = shakeAt(t);
  const glitch = clamp((t - (M.reboot - 0.2)) / 0.12);
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Filters t={t} haze={haze} melt={melting ? mp * 3400 : 0} />
      {t >= M.melt - 0.05 && t < M.reboot + 0.1 && (
        <AbsoluteFill style={{ transform: `translate(${x * 0.5}px, ${y * 0.5}px) scale(1.04)` }}>
          <Lava t={t} op={clamp((t - M.melt) / 0.2)} />
          <Sparks t={t} />
        </AbsoluteFill>
      )}
      {phoneOn && (
        <AbsoluteFill style={{ transform: `translate(${x}px, ${y + (melting ? mp * 500 : 0)}px) scale(${zoomAt(t)})`, transformOrigin: '50% 36%', filter }}>
          <Phone t={t} />
          <HeatGrade h={h} />
          {t >= M.reboot && <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}><Cracks x={860} y={330} p={1} v={0.9} seed={3} n={9} r={950} w={3} /></div>}
        </AbsoluteFill>
      )}
      {t >= M.melt && t < M.reboot && (
        <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px)` }}>
          <Slices t={t} amt={glitch} n={11} maxShift={180}><TitleSlam t={t} /></Slices>
        </AbsoluteFill>
      )}
      <EyesFlood t={t} />
      {t >= M.dead && <DeadScreen t={t} />}
      <HeartPop t={t} />
      {t >= M.pop && <div style={{ position: 'absolute', inset: 0, opacity: t < M.dead ? 0.8 : 0.26 }}><Cracks x={540} y={880} p={clamp((t - M.pop) / 0.12)} v={0.95} seed={8} n={13} r={1500} w={4} /></div>}
      <Flash t={t} at={M.melt} amt={0.45} decay={6} color="#FFD9A0" />
      <Flash t={t} at={M.reboot} amt={0.8} decay={10} />
      <Flash t={t} at={M.pop} amt={1} decay={16} />
    </AbsoluteFill>
  );
};
