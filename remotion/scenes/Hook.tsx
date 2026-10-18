import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { EngineCanvas, Engine } from '../components/EngineCanvas';
import { Schedule, Scene } from '../theme';

// 0:00 — the showreel's particle sculpture, live and driven by the voice:
// it pulses on every word, punches the camera on the strong ones, becomes a
// cube on the 2nd punch and bursts into the torus on the 3rd.
export const Hook: React.FC<{ scene: Scene; cues: Schedule['cues'] }> = ({ scene, cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = scene.start + frame / fps;
  const punches = cues.hookPunches as [number, number][];
  const words = cues.hookWords;

  const draw = useCallback((e: Engine, tt: number) => {
    const pulse = (u: number) => words.reduce((m, w) => (u >= w ? Math.max(m, Math.exp(-(u - w) * 7)) : m), 0);
    e.renderWith(tt, (ctx, u) => e.sculpture(ctx, u, {
      burstAt: scene.start - 0.1,
      cubeAt: punches[1][0],
      torusAt: punches[2][0],
      flyAt: null,
      scale: 1 + 0.1 * pulse(u),
    }), { impacts: punches });
  }, [scene.start, punches, words]);

  // White flash on the full-strength punches.
  const flash = punches.reduce((m, [p, s]) => (s >= 1 && t >= p ? Math.max(m, 0.45 * Math.exp(-(t - p) * 14)) : m), 0);

  return (
    <AbsoluteFill>
      <EngineCanvas t={t} draw={draw} />
      <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flash})` }} />
    </AbsoluteFill>
  );
};
