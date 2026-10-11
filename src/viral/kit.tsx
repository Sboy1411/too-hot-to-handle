import React from 'react';
import { AbsoluteFill } from 'remotion';
import { cue, cueOut, clamp, easeInCubic, easeOutCubic } from '../lib/time';
import { cueWords, W } from './type';
import { Thermal, Blend } from './thermal';

export type VScene = {
  id: string;
  from: number;
  to: number;
  /** HUD opacity while this scene is on screen. */
  hud?: number | ((t: number) => number);
  /** Content inside the main thermal layer (greyscale heat). ti = image time (frozen in the stops). */
  heat?: (t: number, ti: number, s: VScene) => React.ReactNode;
  /** Extra full layers above the main thermal layer (e.g. a second palette). */
  layer?: (t: number, ti: number, s: VScene) => React.ReactNode;
  /** Colour overlay above the image (not heat-mapped). */
  over?: (t: number, ti: number, s: VScene) => React.ReactNode;
};

export const wt = (n: number, i: number) => cue(n).words[i].t;
export const ws = (n: number, a = 0, b?: number): W[] => cueWords(n).slice(a, b);
export const span = (n: number, pre = 0.12, post = 0) => ({ from: cue(n).start - pre, to: cueOut(n) + post });

export type Exit = 'cool' | 'cut' | 'up' | 'down' | 'zoom' | 'blur' | 'left' | 'right' | 'melt' | 'shrink' | 'none';
/** Enter/exit envelope for heat content. Fading to black in heat space reads as the subject cooling off. */
export const Sc: React.FC<{ t: number; from: number; to: number; exit?: Exit; exitDur?: number; enterDur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  t, from, to, exit = 'cool', exitDur = 0.2, enterDur = 0.08, children, style,
}) => {
  const e = easeInCubic(clamp((t - (to - exitDur)) / exitDur));
  const i = easeOutCubic(clamp((t - from) / enterDur));
  let op = i, tr = '', filt: string | undefined;
  switch (exit) {
    case 'cool': op *= 1 - e; break;
    case 'cut': op *= 1 - clamp((t - (to - 0.067)) / 0.067); break;
    case 'up': op *= 1 - e; tr = `translateY(${-e * 140}px)`; filt = e > 0.02 ? `blur(${e * 10}px)` : undefined; break;
    case 'down': op *= 1 - e; tr = `translateY(${e * 160}px)`; break;
    case 'left': op *= 1 - e; tr = `translateX(${-e * 300}px)`; filt = e > 0.02 ? `blur(${e * 12}px)` : undefined; break;
    case 'right': op *= 1 - e; tr = `translateX(${e * 300}px)`; filt = e > 0.02 ? `blur(${e * 12}px)` : undefined; break;
    case 'zoom': op *= 1 - e; tr = `scale(${1 + e * 0.6})`; filt = e > 0.02 ? `blur(${e * 16}px)` : undefined; break;
    case 'shrink': op *= 1 - e; tr = `scale(${1 - e * 0.25})`; break;
    case 'blur': op *= 1 - e; filt = e > 0.02 ? `blur(${e * 24}px)` : undefined; break;
    case 'melt': op *= 1 - e; tr = `translateY(${e * 90}px) scaleY(${1 + e * 0.5})`; filt = e > 0.02 ? `blur(${e * 10}px)` : undefined; break;
    case 'none': break;
  }
  if (op <= 0.001) return null;
  return <AbsoluteFill style={{ opacity: op, transform: tr || undefined, filter: filt, transformOrigin: '50% 50%', ...style }}>{children}</AbsoluteFill>;
};

/** A second thermal layer clipped to a region, e.g. the mirror half seen in another palette. */
export const Pane: React.FC<{ id: string; blend: Blend; clip: string; gain?: number; lift?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, blend, clip, gain, lift, children, style }) => (
  <AbsoluteFill style={{ clipPath: clip, ...style }}>
    <Thermal id={id} blend={blend} gain={gain} lift={lift}>{children}</Thermal>
  </AbsoluteFill>
);

export const Pos: React.FC<{ x?: number; y?: number; w?: number; h?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({ x = 0, y = 0, w, h, children, style }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}>{children}</div>
);

export const HUD_INK = 'rgba(246,242,234,0.92)';
