import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ShowreelCanvas } from '../components/ShowreelCanvas';
import { T, sec } from '../theme';

// The showreel's last frame, darkened, under the spoken payoff line.
export const Tail: React.FC = () => {
  const frame = useCurrentFrame();
  const dim = interpolate(frame, [0, sec(0.25)], [0, 0.6], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <ShowreelCanvas from={T.tailFreeze} freeze />
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
    </AbsoluteFill>
  );
};
