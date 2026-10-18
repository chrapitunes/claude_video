import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { T, span, COLORS } from './theme';
import { Hook } from './scenes/Hook';
import { Chat } from './scenes/Chat';
import { Code } from './scenes/Code';
import { Bridge } from './scenes/Bridge';
import { ShowreelCanvas } from './components/ShowreelCanvas';
import { Tail } from './scenes/Tail';
import { Cta } from './scenes/Cta';

export type ReelProps = { hook: string };

export const Reel: React.FC<ReelProps> = ({ hook }) => {
  const S = T.scenes;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Sequence {...span(S.hook)} name="Hook"><Hook text={hook} /></Sequence>
      <Sequence {...span(S.chat)} name="Chat"><Chat /></Sequence>
      <Sequence {...span(S.code)} name="Code"><Code /></Sequence>
      <Sequence {...span(S.bridge)} name="Bridge"><Bridge /></Sequence>
      <Sequence {...span(S.reel)} name="Showreel">
        <ShowreelCanvas from={T.reel.from} />
      </Sequence>
      <Sequence {...span(S.tail)} name="Tail"><Tail /></Sequence>
      <Sequence {...span(S.cta)} name="CTA"><Cta /></Sequence>
      <Audio src={staticFile('reel_audio.wav')} />
    </AbsoluteFill>
  );
};
