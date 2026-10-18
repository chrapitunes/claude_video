import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ShowreelCanvas } from '../components/ShowreelCanvas';
import { BigText } from '../components/BigText';
import { T, sec } from '../theme';

// 0:24 — the showreel's last frame, darkened, with the payoff line.
export const Tail: React.FC = () => {
  const frame = useCurrentFrame();
  const dim = interpolate(frame, [0, sec(0.25)], [0, 0.6], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <ShowreelCanvas from={T.tailFreeze} freeze />
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
      <AbsoluteFill style={{ top: 1330, alignItems: 'center', gap: 6 }}>
        <BigText text="Sin *After Effects.*" size={96} at={0.05} maxWidth={1000} />
        <BigText text="Sin *Premiere.*" size={96} at={0.3} maxWidth={1000} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
