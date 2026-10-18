import timeline from './timeline.json';
import schedule from './schedule.json';

export const T = timeline;
export const FPS = T.fps;

export type Version = 'A' | 'B';
// Per-version scene timing, voice placement, subtitles and cues, all in
// seconds (built by scripts/schedule.py from timeline.json + voice.json).
export const SCHEDULE = schedule as Record<Version, Schedule>;

export type Scene = { start: number; duration: number; from: number; frames: number; silence?: number[] };
export type SubtitlePage = { start: number; end: number; words: { text: string; accent: boolean; at: number }[] };
export type Schedule = {
  frames: number;
  duration: number;
  scenes: Record<'hook' | 'chat' | 'code' | 'bridge' | 'reel' | 'tail' | 'cta', Scene>;
  subtitles: SubtitlePage[];
  cues: Record<'chatTyping' | 'chatSend' | 'codeTyping' | 'ctaCards' | 'ctaBlip' | 'hookWords', number[]> & { hookPunches: number[][] };
};

export const sec = (s: number) => Math.round(s * FPS);

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
// Subtitles sit in the upper third, just under the top safe area.
export const SUBTITLE_BOX = { top: 240, height: 220 };
