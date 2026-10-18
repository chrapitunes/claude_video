import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmbientCanvas } from '../components/AmbientCanvas';
import { COLORS, FONTS, Schedule, Scene, T, sec } from '../theme';

// 0:02 — a plain dark chat. The real request from this project is typed
// letter by letter, then sent.
export const Chat: React.FC<{ scene: Scene; cues: Schedule['cues'] }> = ({ scene, cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = scene.start;
  const t = start + frame / fps;
  const [s, e] = cues.chatTyping;
  const prompt = T.prompt;
  const shown = Math.floor(prompt.length * Math.min(1, Math.max(0, (t - s) / (e - s))));
  const send = cues.chatSend[0];
  const sent = t >= send;
  const sendP = spring({ frame: frame - sec(send - start), fps, config: { damping: 200 } });
  const caretOn = Math.floor(frame / sec(0.5)) % 2 === 0 || (t > s && t < e);
  const enter = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <AmbientCanvas start={scene.start} />
      <div
        style={{
          position: 'absolute', left: 60, right: 60, top: 490, bottom: 300,
          background: COLORS.panel, border: `2px solid ${COLORS.line}`, borderRadius: 40,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ height: 80, borderBottom: `2px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 32px' }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: '#33333d' }} />)}
        </div>

        <div style={{ flex: 1, padding: '40px 36px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 28 }}>
          {sent && (
            <div
              style={{
                maxWidth: '86%', background: '#262631', color: COLORS.ink, borderRadius: '32px 32px 8px 32px',
                padding: '26px 32px', fontFamily: FONTS.ui, fontSize: 36, lineHeight: 1.36,
                opacity: sendP, transform: `translateY(${interpolate(sendP, [0, 1], [120, 0])}px) scale(${interpolate(sendP, [0, 1], [0.94, 1])})`,
                transformOrigin: 'bottom right',
              }}
            >
              {prompt}
            </div>
          )}
          {sent && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 12, padding: '8px 4px', opacity: interpolate(frame, [sec(send - start + 0.15), sec(send - start + 0.3)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 18, height: 18, borderRadius: 9, background: COLORS.muted, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame / fps) * 9 - i * 0.9)) }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ margin: 28, background: '#1B1B24', border: `2px solid ${COLORS.line}`, borderRadius: 30, padding: '24px 26px', display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ flex: 1, minHeight: 50, fontFamily: FONTS.ui, fontSize: 36, lineHeight: 1.36, color: COLORS.ink }}>
            {sent ? (
              <span style={{ color: COLORS.muted }}>Escribe un mensaje…</span>
            ) : (
              <>
                {prompt.slice(0, shown)}
                <span style={{ display: 'inline-block', width: 3, height: 42, marginLeft: 2, verticalAlign: 'text-bottom', background: COLORS.ink, opacity: caretOn ? 1 : 0 }} />
              </>
            )}
          </div>
          <div style={{ width: 64, height: 64, borderRadius: 32, flex: 'none', background: shown > 0 && !sent ? COLORS.accent : '#2c2c36', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 34, fontFamily: FONTS.ui, fontWeight: 700 }}>↑</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
