import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, sec } from '../theme';

type Props = {
  // Words wrapped in *asterisks* get the accent color.
  text: string;
  size?: number;
  // Seconds into the scene when the text lands.
  at?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
};

// Big white headline with a soft shadow; lands word by word on a spring.
export const BigText: React.FC<Props> = ({ text, size = 104, at = 0, maxWidth = 940, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Split into words of {text, accent} pieces; *...* may span several words.
  const words: { text: string; accent: boolean }[][] = [[]];
  let accent = false;
  for (const ch of text) {
    if (ch === '*') { accent = !accent; continue; }
    if (ch === ' ') { words.push([]); continue; }
    const w = words[words.length - 1];
    const last = w[w.length - 1];
    if (last && last.accent === accent) last.text += ch; else w.push({ text: ch, accent });
  }
  return (
    <div
      style={{
        fontFamily: FONTS.display,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: '-0.02em',
        color: COLORS.white,
        textAlign: 'center',
        maxWidth,
        textShadow: '0 6px 36px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.35)',
        textWrap: 'balance',
        ...style,
      } as React.CSSProperties}
    >
      {words.map((w, i) => {
        const p = spring({ frame: frame - sec(at) - i * sec(0.04), fps, config: { damping: 200, stiffness: 260 } });
        return (
          <React.Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span
              style={{
                display: 'inline-block',
                opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
                transform: `translateY(${interpolate(p, [0, 1], [0.45, 0])}em) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
              }}
            >
              {w.map((piece, k) => (
                <span key={k} style={piece.accent ? { color: COLORS.accent } : undefined}>{piece.text}</span>
              ))}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
