import timeline from './timeline.json';

export const T = timeline;
export const FPS = T.fps;

// Every time in the reel is written in seconds and converted here, so
// nothing depends on the frame rate.
export const sec = (s: number) => Math.round(s * FPS);
export const span = ([a, b]: number[]) => ({ from: sec(a), durationInFrames: sec(b) - sec(a) });

export const COLORS = {
  bg: '#0B0B10',
  panel: '#14141B',
  line: '#26262F',
  ink: '#F4F0E8',
  white: '#FFFFFF',
  muted: '#8E8E9C',
  accent: '#DC143C',
  violet: '#7A5CFF',
  lime: '#D7FF3B',
  cyan: '#38E1FF',
  pink: '#FF4FA3',
};

export const FONTS = {
  display: '"Inter Display", "Inter", sans-serif',
  ui: '"Inter", "Inter Display", sans-serif',
  mono: '"DejaVu Sans Mono", monospace',
};

// Instagram covers the top 220 px and the bottom 250 px of a 1080x1920 reel.
export const SAFE = { top: 220, bottom: 250 };
