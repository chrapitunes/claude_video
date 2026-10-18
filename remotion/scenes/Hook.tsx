import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ShowreelCanvas } from '../components/ShowreelCanvas';
import { Scene, T } from '../theme';

// 0:00 — frozen peak of the showreel, darkened; the hook is spoken and
// shown as subtitles.
export const Hook: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, scene.frames], [1.1, 1.0]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <ShowreelCanvas from={T.hookFreeze} freeze />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.45), rgba(0,0,0,0.78))' }} />
    </AbsoluteFill>
  );
};
