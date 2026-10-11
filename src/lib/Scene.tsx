import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeInCubic, easeOutCubic } from './time';

export type Exit = 'fade' | 'up' | 'zoom' | 'down' | 'left' | 'cut' | 'blur' | 'shrink';
export const Scene: React.FC<{ t: number; from: number; to: number; exit?: Exit; enter?: 'fade' | 'cut' | 'zoom'; exitDur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  t, from, to, exit = 'fade', enter = 'fade', exitDur = 0.22, children, style,
}) => {
  const e = easeInCubic(clamp((t - (to - exitDur)) / exitDur));
  const i = easeOutCubic(clamp((t - from) / 0.16));
  let op = 1, tr = '', filt: string | undefined;
  if (enter === 'fade') op *= i;
  if (enter === 'cut') op *= t >= from ? 1 : 0;
  if (enter === 'zoom') { op *= i; tr += `scale(${0.9 + 0.1 * i}) `; }
  switch (exit) {
    case 'fade': op *= 1 - e; break;
    case 'up': op *= 1 - e; tr += `translateY(${-e * 120}px) `; break;
    case 'down': op *= 1 - e; tr += `translateY(${e * 120}px) `; break;
    case 'left': op *= 1 - e; tr += `translateX(${-e * 260}px) `; break;
    case 'zoom': op *= 1 - e; tr += `scale(${1 + e * 0.35}) `; break;
    case 'shrink': op *= 1 - e; tr += `scale(${1 - e * 0.2}) `; break;
    case 'blur': op *= 1 - e; filt = `blur(${e * 20}px)`; break;
    case 'cut': op *= 1 - clamp((t - (to - 0.1)) / 0.1); break; // quick dip, never a hard pop
  }
  return <AbsoluteFill style={{ opacity: op, transform: tr || undefined, filter: filt, ...style }}>{children}</AbsoluteFill>;
};

export const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', ...style }}>{children}</AbsoluteFill>
);
