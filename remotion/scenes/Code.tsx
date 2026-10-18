import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BigText } from '../components/BigText';
import { COLORS, FONTS, T } from '../theme';
import code from '../code.json';

const LINE_H = 37;
const ROWS = 27;

// Tiny JS highlighter: comments, strings, keywords, numbers, calls.
const TOKEN = /(\/\/.*$)|('(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|\b(const|let|function|return|if|for|of|new|while|typeof)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\()/g;
const TOKEN_COLORS = [COLORS.muted, COLORS.lime, COLORS.violet, COLORS.cyan, COLORS.pink];

function highlight(text: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const g = m.slice(1).findIndex(Boolean);
    out.push(<span key={i} style={{ color: TOKEN_COLORS[g] }}>{m[0]}</span>);
    last = i + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

// 0:05 — a dark editor typing real excerpts of src/reel-core.js, sped up.
export const Code: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T.scenes.code[0] + frame / fps;
  const [s, e] = T.codeTyping;
  const x = Math.min(1, Math.max(0, (t - s) / (e - s)));
  const total = code.lines.reduce((n, l) => n + l.text.length + 1, 0);
  let budget = Math.floor(total * x * x);

  const visible: { n: number | null; text: string }[] = [];
  for (const l of code.lines) {
    if (budget <= 0) break;
    visible.push({ n: l.n, text: l.text.slice(0, budget) });
    budget -= l.text.length + 1;
  }
  if (!visible.length) visible.push({ n: code.lines[0].n, text: '' });
  const scroll = Math.max(0, visible.length - (ROWS - 3)) * LINE_H;
  const enter = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, #15151d, ${COLORS.bg} 70%)` }}>
      <AbsoluteFill style={{ top: 250, height: 210, alignItems: 'center' }}>
        <BigText text="Claude escribe el *código*" size={86} maxWidth={760} />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute', left: 40, right: 40, top: 500, bottom: 300,
          background: '#0F0F15', border: `2px solid ${COLORS.line}`, borderRadius: 28, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
        }}
      >
        <div style={{ height: 70, display: 'flex', alignItems: 'flex-end', padding: '0 24px', background: '#14141B', borderBottom: `2px solid ${COLORS.line}` }}>
          <div style={{ padding: '14px 26px', background: '#0F0F15', borderRadius: '14px 14px 0 0', fontFamily: FONTS.mono, fontSize: 22, color: COLORS.ink, borderTop: `3px solid ${COLORS.accent}` }}>
            {code.file}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 20, transform: `translateY(${-scroll}px)` }}>
            {visible.map((l, i) => {
              const isLast = i === visible.length - 1;
              return (
                <div key={i} style={{ display: 'flex', height: LINE_H, fontFamily: FONTS.mono, fontSize: 23, lineHeight: `${LINE_H}px`, whiteSpace: 'pre' }}>
                  <span style={{ width: 70, flex: 'none', textAlign: 'right', paddingRight: 22, color: '#4A4A58' }}>{l.n ?? '⋯'}</span>
                  <span style={{ color: '#E4E4EA', overflow: 'hidden' }}>
                    {highlight(l.text)}
                    {isLast && x < 1 ? <span style={{ display: 'inline-block', width: 12, height: 28, verticalAlign: 'middle', background: COLORS.accent }} /> : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
