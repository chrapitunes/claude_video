import React from 'react';
import { Composition } from 'remotion';
import { Reel, ReelProps } from './Reel';
import { T, sec } from './theme';

const HOOKS: Record<'A' | 'B', ReelProps> = {
  A: { hook: 'Ningún programa de edición. Este video lo hizo *Claude*.' },
  B: { hook: 'Editores de motion graphics: tenemos que *hablar*.' },
};

export const Root: React.FC = () => (
  <>
    {(['A', 'B'] as const).map(v => (
      <Composition
        key={v}
        id={`ReelShowreel${v}`}
        component={Reel}
        durationInFrames={sec(T.total)}
        fps={T.fps}
        width={T.width}
        height={T.height}
        defaultProps={HOOKS[v]}
      />
    ))}
  </>
);
