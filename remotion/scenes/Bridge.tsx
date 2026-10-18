import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, Scene, sec } from '../theme';

// Black with a progress line while the whispered line plays, then half a
// second of silence before the drop.
export const Bridge: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, scene.frames], [0, 1], { extrapolateRight: 'clamp' });
  const silent = scene.silence ? frame >= sec(scene.silence[0] - scene.start) : false;
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 760, height: 8, background: '#1E1E26', borderRadius: 4, overflow: 'hidden', opacity: silent ? 0.6 : 1 }}>
        <div style={{ width: `${p * 100}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.white}, ${COLORS.accent})` }} />
      </div>
    </AbsoluteFill>
  );
};
