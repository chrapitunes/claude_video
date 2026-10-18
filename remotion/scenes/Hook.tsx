import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ShowreelCanvas } from '../components/ShowreelCanvas';
import { BigText } from '../components/BigText';
import { T, SAFE, sec } from '../theme';

// 0:00 — frozen peak of the showreel, darkened, with the hook on top.
export const Hook: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, sec(2)], [1.1, 1.0]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <ShowreelCanvas from={T.hookFreeze} freeze />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55), rgba(0,0,0,0.8))' }} />
      <AbsoluteFill style={{ top: SAFE.top, bottom: SAFE.bottom, alignItems: 'center', justifyContent: 'center' }}>
        <BigText text={text} size={118} at={0.05} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
