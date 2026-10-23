import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import { FPS, DURATION_FRAMES } from './lib/time';
import { Viral } from './viral/Viral';
import { VIRAL_FRAMES } from './viral/outro';
import { ViralShort, ViralThumb, SHORT_DUR } from './viral/Extras';
import { GarmiNews } from './garmi/GarmiNews';
import { FRAMES as GARMI_FRAMES } from './garmi/timeline';
import { Reel2 } from './reel2/Reel2';
import { Reel2Cover } from './reel2/Cover';
import { CUTS } from './reel2/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TooHot" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="TooHot4K" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={3840} height={2160} />
    <Composition id="TooHotViral" component={Viral} durationInFrames={VIRAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="TooHotViralShort" component={ViralShort} durationInFrames={Math.round(SHORT_DUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="GarmiNews" component={GarmiNews} durationInFrames={GARMI_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Reel2GroupChat" component={Reel2} defaultProps={{ cut: 'full' as const }} durationInFrames={CUTS.full.FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Reel2Cut30" component={Reel2} defaultProps={{ cut: 'cut30' as const }} durationInFrames={CUTS.cut30.FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Reel2Cut17" component={Reel2} defaultProps={{ cut: 'cut17' as const }} durationInFrames={CUTS.cut17.FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Reel2Cover" component={Reel2Cover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="TooHotViralThumb" component={ViralThumb} durationInFrames={1} fps={FPS} width={1920} height={1080} />
  </>
);
