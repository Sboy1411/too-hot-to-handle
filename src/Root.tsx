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
import { FRAMES as REEL2_FRAMES } from './reel2/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TooHot" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="TooHot4K" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={3840} height={2160} />
    <Composition id="TooHotViral" component={Viral} durationInFrames={VIRAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="TooHotViralShort" component={ViralShort} durationInFrames={Math.round(SHORT_DUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="GarmiNews" component={GarmiNews} durationInFrames={GARMI_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Reel2GroupChat" component={Reel2} durationInFrames={REEL2_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="TooHotViralThumb" component={ViralThumb} durationInFrames={1} fps={FPS} width={1920} height={1080} />
  </>
);
