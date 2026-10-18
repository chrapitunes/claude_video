import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender } from 'remotion';
import Reel from '../../src/reel-core.js';
import { T } from '../theme';

export type Engine = ReturnType<typeof Reel.createReel>;

type Props = {
  // Time (s) handed to draw; the caller derives it from the current frame.
  t: number;
  draw: (engine: Engine, t: number) => void;
};

// A 1080x1920 canvas driven by the showreel engine (src/reel-core.js),
// in its vertical layout with the account's name.
export const EngineCanvas: React.FC<Props> = ({ t, draw }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const [fontsHandle] = useState(() => delayRender('engine fonts'));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Reel.loadReelFonts().then(() => {
      setReady(true);
      continueRender(fontsHandle);
    });
  }, [fontsHandle]);

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
    draw(engine.current, t);
  }, [ready, t, draw]);

  return (
    <AbsoluteFill>
      <canvas ref={canvas} width={T.width} height={T.height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
