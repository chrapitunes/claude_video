import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { COLORS, SCHEDULE, T, Version } from './theme';
import { Hook } from './scenes/Hook';
import { Chat } from './scenes/Chat';
import { Code } from './scenes/Code';
import { Bridge } from './scenes/Bridge';
import { ShowreelCanvas } from './components/ShowreelCanvas';
import { Tail } from './scenes/Tail';
import { Cta } from './scenes/Cta';
import { Subtitles } from './components/Subtitles';

export type ReelProps = { version: Version };

export const Reel: React.FC<ReelProps> = ({ version }) => {
  const S = SCHEDULE[version];
  const sc = S.scenes;
  const seq = (k: keyof typeof sc) => ({ from: sc[k].from, durationInFrames: sc[k].frames });
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Sequence {...seq('hook')} name="Hook"><Hook scene={sc.hook} cues={S.cues} /></Sequence>
      <Sequence {...seq('chat')} name="Chat"><Chat scene={sc.chat} cues={S.cues} /></Sequence>
      <Sequence {...seq('code')} name="Code"><Code scene={sc.code} cues={S.cues} /></Sequence>
      <Sequence {...seq('bridge')} name="Bridge"><Bridge scene={sc.bridge} /></Sequence>
      <Sequence {...seq('reel')} name="Showreel"><ShowreelCanvas from={T.reel.from} /></Sequence>
      <Sequence {...seq('tail')} name="Tail"><Tail /></Sequence>
      <Sequence {...seq('cta')} name="CTA"><Cta scene={sc.cta} cues={S.cues} /></Sequence>
      <Subtitles pages={S.subtitles} />
      <Audio src={staticFile(`reel_audio_${version}.wav`)} />
    </AbsoluteFill>
  );
};
