import React from 'react';
import { AbsoluteFill } from 'remotion';
import { fitOne, useGarmiFonts } from '../garmi/fonts';
import { FONT, rand } from '../garmi/timeline';
import { DoorPhoto } from './chat';

const FIRE = 'linear-gradient(180deg, #FFF4D6 0%, #FFE2A0 22%, #FFB547 45%, #FF4D1A 72%, #D7141E 100%)';

/** Reel cover (1080×1920). Everything that matters sits inside the 1:1 crop (y 420–1500) the profile grid can show. */
export const Reel2Cover: React.FC = () => {
  const ready = useGarmiFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const s1 = fitOne('TOO HOT', FONT.anton, 400, 820, 215);
  const s2 = fitOne('TO HANDLE', FONT.anton, 400, 820, 215);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #160b2a 0%, #1a0a14 45%, #0a0306 100%)', overflow: 'hidden' }}>
      {Array.from({ length: 12 }, (_, k) => {
        const cols = ['#ff4fa3', '#4fb4ff', '#9b6bff', '#ff9a3d'];
        const s = 140 + rand(k * 1.3) * 240;
        return <div key={k} style={{ position: 'absolute', left: rand(k * 3.1) * 1080 - s / 2, top: rand(k * 5.7) * 1920 - s / 2, width: s, height: s, borderRadius: '50%', background: cols[k % 4], opacity: 0.18, filter: 'blur(34px)' }} />;
      })}
      <div style={{ position: 'absolute', left: 540 - 276, top: 820 - 320, width: 552, height: 640, transform: 'scale(1.62)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 120px rgba(255,140,40,0.55)' }}>
        <DoorPhoto t={99} at={0} noTime />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {['POV: the party', 'was DEAD 💀'].map((ln) => (
          <div key={ln} style={{ background: '#fff', color: '#0a0a0a', borderRadius: 18, padding: '6px 26px 10px', fontFamily: FONT.archivo, fontWeight: 900, fontSize: 70, lineHeight: 1.08, boxShadow: '0 10px 30px rgba(0,0,0,0.55)' }}>{ln}</div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 975, display: 'flex', flexDirection: 'column', alignItems: 'center', filter: 'drop-shadow(0 0 34px rgba(255,90,30,0.7)) drop-shadow(0 10px 20px rgba(0,0,0,0.8))' }}>
        {[['TOO HOT', s1], ['TO HANDLE', s2]].map(([txt, s]) => (
          <div key={txt as string} style={{ fontFamily: FONT.anton, fontSize: s as number, lineHeight: 0.98, background: FIRE, WebkitBackgroundClip: 'text', color: 'transparent', whiteSpace: 'nowrap' }}>{txt}</div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1404, display: 'flex', justifyContent: 'center' }}>
        <div style={{ padding: '2px 34px 0', borderRadius: 18, background: 'linear-gradient(90deg, #FFB547, #FF4D1A 55%, #D7141E)', fontFamily: FONT.anton, fontSize: 64, lineHeight: '80px', color: '#fff', letterSpacing: '0.05em' }}>OUT NOW</div>
      </div>
    </AbsoluteFill>
  );
};
