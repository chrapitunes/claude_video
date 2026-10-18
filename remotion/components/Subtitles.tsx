import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SUBTITLE_BOX, SubtitlePage, sec } from '../theme';

// Word-by-word voice subtitles in the upper third: each word joins the
// centered line when it is spoken; the page clears before the next one.
export const Subtitles: React.FC<{ pages: SubtitlePage[] }> = ({ pages }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const page = pages.find(p => frame >= sec(p.start) && frame < sec(p.end));
  if (!page) return null;
  return (
    <AbsoluteFill style={{ top: SUBTITLE_BOX.top, height: SUBTITLE_BOX.height, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div
        style={{
          maxWidth: 940, textAlign: 'center', fontFamily: FONTS.display, fontWeight: 900, fontSize: 84,
          lineHeight: 1.08, letterSpacing: '-0.015em', color: COLORS.white, textWrap: 'balance',
          textShadow: '0 4px 28px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.5)',
        } as React.CSSProperties}
      >
        {page.words.filter(w => frame >= sec(w.at)).map((w, i) => {
          const p = spring({ frame: frame - sec(w.at), fps, config: { damping: 15, stiffness: 320, mass: 0.6 } });
          return (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span
                style={{
                  display: 'inline-block',
                  color: w.accent ? COLORS.accent : undefined,
                  opacity: interpolate(p, [0, 0.25], [0, 1], { extrapolateRight: 'clamp' }),
                  transform: `translateY(${interpolate(p, [0, 1], [0.3, 0])}em) scale(${interpolate(p, [0, 1], [0.7, 1])})`,
                }}
              >
                {w.text}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
