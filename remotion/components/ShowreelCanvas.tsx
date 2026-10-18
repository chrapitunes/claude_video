import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from 'remotion';
import Reel from '../../src/reel-core.js';
import { FPS, T } from '../theme';

type Props = {
  // Showreel time (s) at the first frame of the enclosing Sequence.
  from: number;
  // Hold a single showreel moment instead of playing.
  freeze?: boolean;
};

// Draws the original showreel engine (src/reel-core.js) in vertical layout.
// Showreel time advances 1 s per second of reel, so its speed is untouched.
export const ShowreelCanvas: React.FC<Props> = ({ from, freeze = false }) => {
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof Reel.createReel> | null>(null);
  const [fontsHandle] = useState(() => delayRender('showreel fonts'));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Reel.loadReelFonts().then(() => {
      setReady(true);
      continueRender(fontsHandle);
    });
  }, [fontsHandle]);

  const t = freeze ? from : from + frame / FPS;

  useLayoutEffect(() => {
    if (!ready || !canvas.current) return;
    if (!engine.current) {
      engine.current = Reel.createReel(canvas.current, {
        name: 'martinketing.co',
        nameLines: ['martinketing', '.co'],
        role: 'MARKETING · IA',
        hudName: 'MARTINKETING.CO',
      });
    }
    engine.current.renderAt(t);
  }, [ready, t]);

  return (
    <AbsoluteFill>
      <canvas ref={canvas} width={T.width} height={T.height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
