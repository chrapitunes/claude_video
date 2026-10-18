import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, T, sec } from '../theme';

const Asterisk: React.FC<{ size: number; rotate: number }> = ({ size, rotate }) => (
  <div style={{ width: size * 2, height: size * 2, position: 'relative', transform: `rotate(${rotate}rad)` }}>
    {[0, 1, 2].map(k => (
      <div key={k} style={{ position: 'absolute', left: 0, top: size - size * 0.17, width: size * 2, height: size * 0.34, borderRadius: size, background: COLORS.lime, transform: `rotate(${(k + 1) * 60}deg)` }} />
    ))}
  </div>
);

const Step: React.FC<{ n: number; at: number; children: React.ReactNode }> = ({ n, at, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - sec(at), fps, config: { damping: 14, stiffness: 180, mass: 0.8 } });
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 34, width: 920, padding: '34px 40px',
        background: '#16161E', border: `2px solid ${COLORS.line}`, borderRadius: 36,
        opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
        transform: `translateX(${interpolate(p, [0, 1], [-140, 0])}px)`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ width: 104, height: 104, borderRadius: 52, flex: 'none', background: COLORS.white, color: COLORS.bg, display: 'grid', placeItems: 'center', fontFamily: FONTS.display, fontWeight: 900, fontSize: 60 }}>{n}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
};

// 0:26 — closing card: follow + comment PROMPT.
export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = T.scenes.cta[0];
  const [c1, c2] = T.ctaCards.map(c => c - start);
  const blip = spring({ frame: frame - sec(T.ctaBlip - start), fps, config: { damping: 10, stiffness: 220 } });
  const pulse = 1 + 0.12 * Math.sin(Math.PI * Math.min(1, blip));
  const big = { fontFamily: FONTS.display, fontWeight: 900, fontSize: 68, lineHeight: 1, color: COLORS.white, letterSpacing: '-0.02em' };
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1a1a24, ${COLORS.bg} 70%)`, alignItems: 'center', justifyContent: 'center', gap: 36 }}>
      <div style={{ marginBottom: 30 }}>
        <Asterisk size={62} rotate={(frame / fps) * 1.4} />
      </div>
      <Step n={1} at={c1}>
        <div style={big}>Sígueme</div>
        <div style={{ fontFamily: FONTS.ui, fontSize: 38, color: COLORS.muted }}>@martinketing.co</div>
      </Step>
      <Step n={2} at={c2}>
        <div style={{ ...big, display: 'flex', alignItems: 'center', gap: 22 }}>
          Comenta
          <span style={{ display: 'inline-block', background: COLORS.accent, color: COLORS.white, padding: '8px 18px 12px', borderRadius: 16, transform: `scale(${pulse})` }}>PROMPT</span>
        </div>
        <div style={{ fontFamily: FONTS.ui, fontSize: 38, color: COLORS.muted }}>y te mando el prompt exacto</div>
      </Step>
    </AbsoluteFill>
  );
};
