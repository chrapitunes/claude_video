import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EngineCanvas, Engine } from './EngineCanvas';
import { FPS } from '../theme';

const drawAmbient = (e: Engine, t: number) => e.renderWith(t, (ctx, u) => e.ambient(ctx, u), { sub: 2 });

// Living background for the UI scenes: a breathing dot grid in the reel's palette.
export const AmbientCanvas: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  return <EngineCanvas t={start + frame / FPS} draw={drawAmbient} />;
};
