import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BigText } from '../components/BigText';
import { COLORS, T, sec } from '../theme';

// 0:09 — black, a progress line, then half a second of silence before the drop.
export const Bridge: React.FC = () => {
  const frame = useCurrentFrame();
  const len = T.scenes.bridge[1] - T.scenes.bridge[0];
  const p = interpolate(frame, [0, sec(len)], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 70 }}>
      <BigText text="y el código se vuelve *video*…" size={92} at={0.02} maxWidth={900} />
      <div style={{ width: 760, height: 8, background: '#1E1E26', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${p * 100}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.white}, ${COLORS.accent})` }} />
      </div>
    </AbsoluteFill>
  );
};
