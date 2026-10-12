import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import { FPS, DURATION_FRAMES } from './lib/time';
import { Viral } from './viral/Viral';
import { ViralShort, ViralThumb, SHORT_DUR } from './viral/Extras';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TooHot" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="TooHot4K" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={3840} height={2160} />
    <Composition id="TooHotViral" component={Viral} durationInFrames={DURATION_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="TooHotViralShort" component={ViralShort} durationInFrames={Math.round(SHORT_DUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="TooHotViralThumb" component={ViralThumb} durationInFrames={1} fps={FPS} width={1920} height={1080} />
  </>
);
