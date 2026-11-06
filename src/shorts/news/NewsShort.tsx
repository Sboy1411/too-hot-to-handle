import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import '../../fonts';
import { useFontsReady } from '../../viral/fonts';
import { C } from '../../theme';
import { FPS, clamp, easeOutCubic, lerp, rand } from '../../lib/time';
import { END, SG, ST, at, sceneAt, songOf } from './script';
import { Base, Captions, EndCard, L, RED, Strap, Ticker, TopBar } from './broadcast';
import { CCTV, Debate, Forecast, HeatMap, Him, Slam, Static, Studio, Thermometer, crtAt } from './scenes';

// Camera hits: the BREAKING slam, the verse landing on the map, the forecast stamp, the ™, the spotlight blaze.
const IMPULSES: [number, number][] = [[0, 22], [ST.static, 10], [at(SG.map), 20], [at(SG.stamp + 0.15), 14], [at(SG.tm), 12], [at(SG.blaze), 18]];
const shakeAt = (t: number) => {
  let x = 0, y = 0;
  for (const [a, amp] of IMPULSES) {
    const d = t - a;
    if (d < 0 || d > 0.6) continue;
    const e = amp * Math.exp(-d * 9);
    x += e * Math.sin(d * 61 + a);
    y += e * Math.cos(d * 47 + a * 2);
  }
  return { x, y };
};

// News-style red wipes on the cuts.
const CUTS = [ST.map, ST.cctv, ST.close, at(SG.forecast), at(SG.debate), at(SG.him)];
const Wipe: React.FC<{ t: number }> = ({ t }) => {
  const c = CUTS.find((c) => Math.abs(t - c) < 0.16);
  if (c === undefined) return null;
  const p = (t - c + 0.16) / 0.32;
  const x = lerp(-700, 1300, p);
  return <div style={{ position: 'absolute', left: x, top: -50, width: 520, height: L.picH + 100, background: `linear-gradient(90deg, ${RED}, #FF5A3A)`, transform: 'skewX(-18deg)', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }} />;
};

const Picture: React.FC<{ t: number }> = ({ t }) => {
  const s = songOf(t);
  const scene = sceneAt(t);
  switch (scene) {
    case 'slam':
    case 'studio':
      // camera 2 (tighter, sunset and moon on the wall) for the sun joke
      return t < ST.cam2
        ? <Studio t={t} zoom={1 + 0.04 * clamp((t - ST.studio) / 3.5)} origin="50% 45%" mode="news" />
        : <Studio t={t} zoom={1.16 + 0.04 * clamp((t - ST.cam2) / 3.8)} origin="50% 18%" mode="news" sky />;
    case 'map':
      return <HeatMap t={t} hot={false} />;
    case 'cctv':
      return <CCTV t={t} />;
    case 'close': {
      // lights flicker as he gets close, the anchor looks toward the door, then the studio goes dark
      const k = clamp((t - (ST.close + 1.3)) / (ST.dark - ST.close - 1.3));
      const flick = rand(Math.floor(t * 18) * 3.7) < 0.25 + 0.45 * k ? 0.35 + 0.4 * k : 0;
      const dark = t >= ST.dark ? 0.94 : flick;
      const door = clamp((t - (ST.wait - 0.4)) / 0.8);
      return (
        <AbsoluteFill>
          <Studio t={t} zoom={lerp(1.36, 1.46, clamp((t - ST.close) / (ST.wait - ST.close)))} origin="50% 8%" mode="news" dark={dark} turn={easeOutCubic(clamp((t - ST.wait) / 0.3))} rim={0.4 + 0.6 * door} />
          <AbsoluteFill style={{ background: `linear-gradient(270deg, rgba(255,120,30,${0.75 * door}), transparent 45%)`, mixBlendMode: 'screen' }} />
        </AbsoluteFill>
      );
    }
    case 'static':
      return <Static t={t} />;
    case 'hijack': {
      const boots = SG.boot.map((b) => clamp((s - b) / 0.15));
      const push = easeOutCubic(clamp((s - SG.push) / (SG.race[0] - SG.push)));
      const heat = clamp((s - SG.race[0]) / (SG.race[1] - SG.race[0]));
      return (
        <AbsoluteFill>
          <Studio t={t} zoom={lerp(1, 1.85, push) + 0.08 * heat} origin="50% 17%" mode="him" boots={boots} dark={lerp(0.55, 0.12, boots[5])} crack={clamp((s - SG.crack) / 0.35)} rim={0.9} heat={heat} />
          <Thermometer t={t} />
        </AbsoluteFill>
      );
    }
    case 'hotmap':
      return <HeatMap t={t} hot />;
    case 'forecast':
      return <Forecast t={t} />;
    case 'debate':
      return <Debate t={t} />;
    default:
      return <Him t={t} />;
  }
};

export const NewsShort: React.FC = () => {
  const frame = useCurrentFrame();
  const ready = useFontsReady();
  const t = frame / FPS;
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const s = songOf(t);
  const { x, y } = shakeAt(t);
  const crt = crtAt(t);
  const warm = s >= 0 ? clamp((s - SG.race[0]) / 3) : 0;
  const flash = (a: number, amt: number, decay: number) => (t >= a && t < a + 1 ? amt * Math.exp(-(t - a) * decay) : 0);
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: crt ? `scale(${crt.sx}, ${crt.sy})` : `translate(${x}px, ${y}px)`, filter: crt ? `brightness(${1 + 4 * crt.glow})` : undefined, opacity: crt?.gone ? 0 : 1 }}>
        <Base t={t} />
        <div style={{ position: 'absolute', left: 0, top: L.picY, width: 1080, height: L.picH, overflow: 'hidden', boxShadow: '0 0 0 2px rgba(255,255,255,0.06)' }}>
          <Picture t={t} />
          <Wipe t={t} />
        </div>
        <TopBar t={t} />
        <Strap t={t} />
        <Captions t={t} />
        <Ticker t={t} />
        {warm > 0 && <AbsoluteFill style={{ background: `rgba(255,96,24,${0.14 * warm})`, mixBlendMode: 'overlay', pointerEvents: 'none' }} />}
        <Slam t={t} />
      </AbsoluteFill>
      {crt && !crt.gone && <AbsoluteFill style={{ background: `radial-gradient(ellipse ${lerp(30, 6, crt.sx < 0.5 ? 1 : 0)}% 3% at 50% 50%, rgba(255,255,255,${crt.glow}), transparent 70%)` }} />}
      <EndCard t={t} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash(0.04, 0.35, 9) + flash(at(SG.map), 0.6, 6) + flash(at(SG.blaze), 0.5, 5), pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: C.fire, opacity: flash(ST.static, 0.25, 12), mixBlendMode: 'screen', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: clamp((t - (END - 0.35)) / 0.3), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
