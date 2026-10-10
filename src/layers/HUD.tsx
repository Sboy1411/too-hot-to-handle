import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, F } from '../theme';
import { lookAt } from '../lib/sections';
import { clamp, beatAt } from '../lib/time';

const status = (v: number) => (v < 30 ? 'WARM' : v < 45 ? 'HEATING' : v < 70 ? 'HOT' : v < 100 ? 'CRITICAL' : 'TOO HOT');

export const HUD: React.FC<{ t: number }> = ({ t }) => {
  const show = clamp((t - 10.6) / 0.6) * (1 - clamp((t - 136.0) / 0.6));
  if (show <= 0) return null;
  const temp = lookAt(t, 3.5).temp + Math.sin(t * 3.1) * 0.3;
  const pct = clamp((temp - 20) / 120);
  const hot = temp >= 99;
  const blink = hot && beatAt(t).idx % 2 === 0;
  const col = temp < 45 ? C.gold : temp < 99 ? C.fire : C.red;
  return (
    <AbsoluteFill style={{ opacity: show, pointerEvents: 'none' }}>
      {/* top-left tag */}
      <div style={{ position: 'absolute', left: 72, top: 58, fontFamily: F.mono, fontSize: 17, letterSpacing: '0.32em', color: 'rgba(255,243,226,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: C.fire, boxShadow: `0 0 12px ${C.fire}`, opacity: 0.5 + 0.5 * beatAt(t).pulse }} />
          TOO HOT TO HANDLE
        </div>
      </div>
      {/* top-right heat gauge */}
      <div style={{ position: 'absolute', right: 72, top: 48, width: 300, fontFamily: F.mono, color: C.cream }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, letterSpacing: '0.3em', opacity: 0.65 }}>
          <span>ROOM TEMP</span>
          <span style={{ color: col, opacity: blink ? 1 : 0.9 }}>{status(temp)}</span>
        </div>
        <div style={{ fontFamily: F.display, fontSize: 54, lineHeight: 1.05, textAlign: 'right', color: hot ? col : C.cream, letterSpacing: '0.02em' }}>
          {temp.toFixed(1)}
          <span style={{ fontSize: 28, verticalAlign: 'top', marginLeft: 4 }}>°C</span>
        </div>
        <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.12)', marginTop: 4 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.fire}, ${C.red})`, boxShadow: `0 0 14px ${col}` }} />
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: `${(i / 12) * 100}%`, top: 8, width: 1, height: i % 3 === 0 ? 8 : 4, background: 'rgba(255,255,255,0.35)' }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
