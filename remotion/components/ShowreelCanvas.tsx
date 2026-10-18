import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EngineCanvas, Engine } from './EngineCanvas';
import { FPS } from '../theme';

type Props = {
  // Showreel time (s) at the first frame of the enclosing Sequence.
  from: number;
  // Hold a single showreel moment instead of playing.
  freeze?: boolean;
};

const drawShowreel = (e: Engine, t: number) => e.renderAt(t);

// The showreel itself, at its original speed (1 s of showreel per second).
export const ShowreelCanvas: React.FC<Props> = ({ from, freeze = false }) => {
  const frame = useCurrentFrame();
  return <EngineCanvas t={freeze ? from : from + frame / FPS} draw={drawShowreel} />;
};
