import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import { FPS, DURATION_FRAMES } from './lib/time';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TooHot" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="TooHot4K" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={3840} height={2160} />
  </>
);
